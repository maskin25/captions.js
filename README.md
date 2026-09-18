# Captions.js

### The same caption renderer in your live preview and in your FFmpeg pipeline. Pixel-identical output, no headless browser.

One `renderFrame` function draws word-level animated captions onto a canvas.
In the browser it runs every frame as an overlay on top of a `<video>` element.
In Node it runs on the same Konva scene graph through skia-canvas and pipes frames
straight into FFmpeg. What your user styles in the editor is exactly what comes out
of the render — same code, same pixels, no browser in production.

[**Live Demo**](https://maskin25.github.io/captions.js/) · [**Docs & API Reference**](https://maskin25.github.io/captions.js/docs/) · [**GitHub**](https://github.com/maskin25/captions.js)

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
import captionsjs, { stylePresets, toCaptions } from "captions.js";

const video = document.querySelector("video")!;

// Deepgram response or a plain [{ word, startTime, endTime }] array
const captions = toCaptions(transcript);

const preset = stylePresets.find(
  (p) => p.captionsSettings.style.name === "Karaoke",
)!;

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

The exact same `renderFrame`, drawn to a Node canvas and piped to FFmpeg as frames:

```ts
import { renderFrame, stylePresets, type Caption } from "captions.js";
import Konva from "konva";
import "konva/skia-backend";
import { createCanvas, registerFont } from "canvas";
import { FontLibrary } from "skia-canvas";
import { PassThrough } from "node:stream";
import ffmpeg from "fluent-ffmpeg";

const size: [number, number] = [1080, 1920];
const fps = 30;
const { captionsSettings } = stylePresets[0];

// register the same font family you use in the browser
registerFont(fontPath, { family: captionsSettings.style.font.fontFamily });
FontLibrary.use(captionsSettings.style.font.fontFamily, [fontPath]);

const canvas = createCanvas(...size);
const stage = new Konva.Stage({ container: canvas as any, width: size[0], height: size[1] });
const layer = new Konva.Layer();
stage.add(layer);

const frames = new PassThrough();

ffmpeg()
  .input("input.mp4")
  .input(frames)
  .inputFormat("image2pipe")
  .inputOptions([`-framerate ${fps}`])
  .complexFilter(
    [{ filter: "overlay", options: { x: 0, y: 0 }, inputs: ["0:v", "1"], outputs: "out" }],
    "out",
  )
  .outputOptions(["-c:v libx264", "-pix_fmt yuv420p", "-map 0:a?", "-c:a copy"])
  .output("output.mp4")
  .run();

for (let time = 0; time <= duration; time += 1 / fps) {
  layer.removeChildren();
  renderFrame(captionsSettings, undefined as any, captions, time, size, layer, 1);
  frames.write(await layer.getNativeCanvasElement().toBuffer("image/png"));
}
frames.end();
```

`konva`, `skia-canvas`, `canvas` and `fluent-ffmpeg` stay your dependencies —
captions.js only brings the renderer.

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
  each a plain object you can clone and edit.
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

MIT © [maskin25](https://github.com/maskin25)
