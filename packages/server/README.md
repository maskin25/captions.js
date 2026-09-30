# @captionsjs/server

Burn [captions.js](https://github.com/maskin25/captions.js) animated word-level captions
into a video file. It runs the **same `renderFrame`** as the browser overlay, drawn with
skia-canvas and piped into FFmpeg. No headless browser.

## CLI

```bash
npx captions.js burn talk.mp4 words.json --preset Karaoke
# → talk.captions.mp4
```

`words.json` is any of:

```jsonc
[{ "word": "Hello", "start": 0.12, "end": 0.48 }, ...]   // plain word timings
{ "segments": [{ "words": [...] }] }                     // OpenAI Whisper verbose_json
{ "results": { "channels": [...] } }                     // Deepgram response
```

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

## HTTP service / Docker

`node dist/index.js` with no arguments starts the Express service used in production
(`POST /burnCaptions`, Pub/Sub push envelope). See the Dockerfile in this folder.

MIT © maskin25
