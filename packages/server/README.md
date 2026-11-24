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

# HTTP service on :4000 (GET /health, POST /burnCaptions)
docker run -p 4000:4000 maskin25/captions.js-render
```

The HTTP endpoint currently takes the Pub/Sub push envelope used by Shorty.plus
(`{ message: { data: base64({ preset, video_uri, captions_uri, output_uri }) } }`).
A simpler upload-and-download API is planned.

MIT © maskin25
