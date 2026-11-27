# @captionsjs/server

Burn [captions.js](https://github.com/maskin25/captions.js) animated word-level captions
into a video file. It runs the **same `renderFrame`** as the browser overlay, drawn with
skia-canvas and piped into FFmpeg. No headless browser.

## CLI

```bash
npx captions.js burn talk.mp4 words.json --preset Karaoke
# → talk.captions.mp4
```

The transcript can be any of:

```jsonc
[{ "word": "Hello", "start": 0.12, "end": 0.48 }, ...]   // plain word timings
{ "words": [...], "speakers": [...] }                     // a captions.js CaptionTrack
{ "segments": [...], "words": [...] }                     // OpenAI Whisper verbose_json, faster-whisper, WhisperX
{ "transcription": [{ "offsets": {...}, ... }] }          // whisper.cpp --output-json
{ "results": { "channels": [...] } }                      // Deepgram
{ "status": "completed", "words": [...] }                 // AssemblyAI
{ "language_probability": 0.98, "words": [...] }          // ElevenLabs Scribe
```

or an `.srt` / `.vtt` file. SRT and VTT carry no word times, so each cue's time
is spread over its words by length (VTT inline `<00:00:01.200>` timestamps are
used when present). The browser library's `toCaptions()` accepts exactly the
same inputs.

| Option | |
| --- | --- |
| `-p, --preset <name>` | Style preset, case-insensitive (default `Karaoke`). `npx captions.js presets` lists them. |
| `-o, --output <file>` | Output path (default `<video>.captions.mp4`). |
| `--fps <n>` | Overlay frame rate (default: source fps, max 60). |
| `--fonts-dir <dir>` | Folder with TTFs in Google Fonts layout (`Family_Name/FamilyName-Bold.ttf`). |
| `--crf <n>` | x264 quality (default 20). |

Requires `ffmpeg` and `ffprobe` on `PATH` (or `FFMPEG_PATH` / `FFPROBE_PATH`).
Preset fonts are downloaded from Google Fonts on first use and cached in
`~/.cache/captionsjs/fonts` (override with `CAPTIONSJS_CACHE_DIR`).

## Node API

```ts
import { burnCaptions } from "@captionsjs/server";

const { output } = await burnCaptions({
  video: "talk.mp4",
  captions: "words.json", // path, URL, JSON string or parsed array
  preset: "Focus Box",
  onProgress: ({ frame, totalFrames }) => console.log(frame / totalFrames),
});
```

Font size follows the browser overlay rule (`videoHeight / 480`), so what you tune in
the preview is what you get in the file. Pass `scale` to override.

## Docker

Multi-arch image (`linux/amd64`, `linux/arm64`) with FFmpeg and all preset fonts baked in —
works offline.

```bash
# CLI: mount a folder, burn, done
docker run --rm -v "$PWD:/data" maskin25/captions.js-render \
  burn /data/talk.mp4 /data/words.json --preset Karaoke -o /data/out.mp4

# HTTP service on :4000
docker run -p 4000:4000 maskin25/captions.js-render
```

### HTTP service

`POST /render` takes JSON and answers with the captioned MP4. The render runs while
the request is open, so set a client timeout that fits your video length.

```bash
curl -X POST http://localhost:4000/render \
  -H "Content-Type: application/json" \
  -d '{
    "video": "https://example.com/talk.mp4",
    "captions": [{ "word": "Hello", "start": 0.1, "end": 0.6 }, { "word": "world", "start": 0.6, "end": 1.2 }],
    "preset": "Karaoke",
    "customize": { "accent": "#FF5A1F" },
    "safeArea": "tiktok"
  }' \
  -o talk.captions.mp4
```

| Field | Required | Value |
| --- | --- | --- |
| `video` | yes | An http(s) URL the service can fetch. Redirects are followed. |
| `captions` | yes | Word timings in any format the CLI reads (word array, Whisper, Deepgram, AssemblyAI, ElevenLabs JSON, …) inline, or an http(s) URL to them. |
| `preset` | no | A preset name (default `Karaoke`) or a full preset object. |
| `customize` | no | `{ accent, font, textColor }`, applied with `customizePreset`. |
| `safeArea` | no | `"tiktok"`, `"reels"`, `"shorts"`, `"none"` or `{ top, bottom, left, right }` as fractions. |
| `speakers` | no | `[{ color, label }]` per speaker 0, 1, … |
| `expressiveness`, `annotations` | no | Word emphasis, as in the CLI's `-e` and `-a`. `annotations` inline or as a URL. |
| `fps`, `crf` | no | Overlay frame rate and x264 quality. |

On success the answer is `200` with `Content-Type: video/mp4` and the headers
`X-Captions-Size` (`1080x1920`) and `X-Captions-Frames`. Errors are JSON, `{ "error": "…" }`:

| Status | Meaning |
| --- | --- |
| `400` | The request is wrong: a missing or unknown field, an unknown preset, a bad safe area. `issues` lists each problem. |
| `422` | The input could not be used: the video could not be downloaded or read, or the transcript has no words. |
| `503` | Already rendering `MAX_CONCURRENT_RENDERS` videos (default 2). Retry after the `Retry-After` seconds. |
| `500` | The render failed. `error` says why. |

Strings in `video`, `captions` and `annotations` must be http(s) URLs; the service never
reads a path on its own disk. It does fetch any URL it is given, so do not expose it
to untrusted callers on a network that can reach internal services.

`GET /health` answers `{ "status": "ok" }`. `POST /burnCaptions` is the older
Google Pub/Sub push endpoint used by Shorty.plus (`{ message: { data:
base64({ preset, video_uri, captions_uri, output_uri }) } }`). It acknowledges the
message before rendering and only logs errors, so prefer `POST /render`.

### GPU

Frames are drawn on the CPU, which gives the same pixels on every machine and is fast
enough for caption overlays. skia-canvas would otherwise pick a GPU when it finds one,
and on some machines that crashed the process as it exited. Set `CAPTIONSJS_GPU=1` to
let it use the GPU anyway.

MIT © maskin25
