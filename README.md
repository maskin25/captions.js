# Captions.js

### The same caption renderer in your live preview and in your FFmpeg pipeline. Pixel-identical output, no headless browser.

One `renderFrame` function draws word-level animated captions onto a canvas.
In the browser it runs every frame as an overlay on top of a `<video>` element.
In Node it runs on the same Konva scene graph through skia-canvas and pipes frames
straight into FFmpeg. What your user styles in the editor is exactly what comes out
of the render — same code, same pixels, no browser in production.

[**Live Demo**](https://maskin25.github.io/captions.js/) · [**Docs & API Reference**](https://maskin25.github.io/captions.js/docs/) · [**GitHub**](https://github.com/maskin25/captions.js)

```bash
npx captions.js burn talk.mp4 words.json --preset Karaoke
```

One command: a video and word timings (Whisper, Deepgram or a plain JSON array) in,
an mp4 with animated captions out. The same preset, frame for frame, runs live over
a `<video>` in the browser.

If Captions.js is useful for you, a quick ⭐ on [GitHub](https://github.com/maskin25/captions.js) helps a lot.

## Why another captions library

Editing captions is easy. Making the preview match the export is the hard part —
and every existing option makes you choose one side.

|                                   | **captions.js** | `@remotion/captions` | Remotion (full render) | ASS / libass | FFmpeg `drawtext` |
| --------------------------------- | --------------- | -------------------- | ---------------------- | ------------ | ----------------- |
| Live preview over `<video>`       | ✅              | — (no renderer)      | ✅ React player        | player-dependent | ❌            |
| Server-side burn-in               | ✅ Node + FFmpeg | —                   | ✅                     | ✅           | ✅                |
| Headless Chrome in production     | not needed      | n/a                  | **required**           | not needed   | not needed        |
| Word-level highlighting           | ✅              | timing data only     | build it yourself      | karaoke tags only | ❌           |
| Modern kinetic typography         | ✅ 26 presets   | —                    | build it yourself      | ❌           | ❌                |
| Preview and export share one code path | ✅         | n/a                  | ✅ (via Chrome)        | n/a          | n/a               |

`@remotion/captions` converts transcription formats — it does not render anything.
Full Remotion rendering does share code between preview and export, but the price is a
headless Chrome in your production pipeline. ASS/libass burns in reliably but can't do
per-word scale, bounce or box animations. `drawtext` is a string-escaping nightmare.

Captions.js is the narrow tool: kinetic word-level captions, identical in both places,
running on plain canvas.

## Installation

```bash
npm install captions.js
# or
pnpm add captions.js
```

## Browser: overlay on a `<video>`

```ts
import captionsjs, { getPreset, toCaptions } from "captions.js";

const video = document.querySelector("video")!;

// Deepgram response or a plain [{ word, startTime, endTime }] array
const captions = toCaptions(transcript);

const preset = getPreset("Karaoke");

const instance = captionsjs({ video, preset, captions });

// live updates, no remount
instance.preset(nextPreset);
instance.captions(editedCaptions);

instance.destroy();
```

The overlay is a positioned Konva stage above the video, scaled to the element's
display size and driven by `requestAnimationFrame` off `video.currentTime`.
Fonts are pulled from Google Fonts on demand.

## Node: burn into video with FFmpeg

The exact same `renderFrame`, drawn with skia-canvas and piped into FFmpeg — no browser.
It lives in a separate package so browser installs stay free of native modules:

```bash
npm install @captionsjs/server   # needs ffmpeg on PATH
```

```ts
import { burnCaptions } from "@captionsjs/server";

await burnCaptions({
  video: "talk.mp4",
  captions: "words.json", // Whisper verbose_json, Deepgram, or [{ word, start, end }]
  preset: "Karaoke",
  output: "talk.captions.mp4",
});
```

Or from the shell, without installing anything:

```bash
npx captions.js burn talk.mp4 words.json --preset "Focus Box" -o out.mp4
npx captions.js presets   # list preset names
```

Preset fonts are fetched from Google Fonts on first use and cached. Font size follows
the same rule as the browser overlay (`videoHeight / 480`), so the export matches the
preview. Driving `renderFrame` yourself (custom pipelines, other encoders) — see
[`packages/server/src/render/burnCaptions.ts`](./packages/server/src/render/burnCaptions.ts).

## Captions input

A caption is one timed word:

```ts
type Caption = {
  word: string;
  startTime: number; // seconds
  endTime: number;
  highlightColor?: string;
  sentenceStartTime?: number;
  sentenceEndTime?: number;
  speaker?: number;
};
```

`toCaptions(input)` auto-detects the format — a raw Deepgram response or an array of
captions — so you can feed the STT output straight in. `getParagraphs(input)` returns
paragraph structure when the provider supplies it.

## What's in the box

- **26 style presets** — Karaoke, Focus Box, Banger, Neon Pulse, Cinema, Old Money and more,
  each a plain object you can clone and edit. `getPreset("Karaoke")` fetches one by name.
- **10 animations** — `bounce`, `pop`, `scale`, `box`, `box-word`, `underline`,
  `slide-left`, `slide-up`, `slide-down`, `none`.
- **Full typography control** — family, weight, size, stroke, shadow, capitalization,
  italic, underline, active/past word colors.
- **Sentence-aware chunking** — lines break on sentence structure instead of raw word count,
  with `linesPerPage`, `lineSpacing` and `position` (`auto` / `top` / `middle` / `bottom`).
- **Google Fonts loading** via `preloadGoogleFont`, with the resolved metrics cached
  so layout is stable frame to frame.

## Status

Captions.js is under active development and the API may still move before 2.0.
Issues and PRs are welcome — see [DEVELOPMENT.md](./DEVELOPMENT.md).

## License

[MIT](./LICENSE) © [maskin25](https://github.com/maskin25). Free for commercial use, and it stays MIT.
