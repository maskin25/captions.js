# Captions.js

### The same caption renderer in your live preview and in your FFmpeg pipeline. Same layout, same motion, visually identical — no headless browser.

One `renderFrame` function draws word-level animated captions onto a canvas.
In the browser it runs every frame as an overlay on top of a `<video>` element.
In Node it runs on the same Konva scene graph through skia-canvas and pipes frames
straight into FFmpeg. What your user styles in the editor is exactly what comes out
of the render — same code, same pixels, no browser in production.

[**Website**](https://captionsjs.dev) · [**Try it on your video**](https://captionsjs.dev/try) · [**Docs**](https://captionsjs.dev/docs) · [**API Reference**](https://captionsjs.dev/docs/api) · [**Changelog**](https://captionsjs.dev/changelog)

```bash
npx captions.js burn talk.mp4 words.json --preset Karaoke
```

One command: a video and a transcript (Whisper, Deepgram, AssemblyAI, ElevenLabs,
SRT/VTT or a plain JSON array) in,
an mp4 with animated captions out. The same preset runs live over a `<video>` in the
browser, with the same layout and motion.

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

Captions.js is the narrow tool: kinetic word-level captions that look the same in both places,
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

// any supported transcript: Deepgram, Whisper, SRT text, a plain word array…
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
  captions: "words.json", // any format from "Captions input" below, or .srt / .vtt
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
preview. Browser and server draw text with different engines (Chromium vs Skia), so
edges can differ by a pixel; every preset is measured against the browser in
[`docs/v2/parity.md`](./docs/v2/parity.md). Driving `renderFrame` yourself (custom pipelines, other encoders) — see
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

`toCaptions(input)` auto-detects the format, so you can feed speech-to-text output
straight in, as an object or as raw text. `getParagraphs(input)` returns paragraph
structure when the provider supplies it.

| Input | Word times | Also carries |
| --- | --- | --- |
| Deepgram (response or `{ result }` envelope) | exact | speakers, sentences, paragraphs |
| OpenAI Whisper `verbose_json`, WhisperX | exact | WhisperX speakers |
| whisper.cpp JSON (`-oj`) | exact with `-ojf` or `--max-len 1`, else estimated | |
| AssemblyAI transcript | exact | speakers (utterances) |
| ElevenLabs speech-to-text | exact | speakers, audio events |
| WebVTT | inline `<00:00:01.000>` tags if present, else estimated | `<v Speaker>` voices |
| SRT | estimated | `[Music]`-style events |
| `[{ word \| text, start, end }]` or `Caption[]` | exact | |

Estimated times spread each cue over its words by word length; those words are
flagged `approximated`. Wrap words in asterisks (`*really*`) to mark emphasis.

Under the hood every input becomes a `CaptionTrack` (words, sentences, paragraphs,
speakers, events), which you can also build yourself:

```ts
import { toTrack, validate, trackToCaptions } from "captions.js";

const track = toTrack(srtText);
const { ok, issues } = validate(track); // reversed or non-finite times, overlaps, empty words…
const captions = trackToCaptions(track);
```

> The formats beyond Deepgram, Whisper and plain arrays, `CaptionTrack` and
> `validate()` arrive in 2.0; `npm` 1.10 does not have them yet.

## What's in the box

- **26 style presets** — Karaoke, Focus Box, Banger, Neon Pulse, Cinema, Old Money and more,
  each a plain object you can clone and edit. `getPreset("Karaoke")` fetches one by name.
  **[See them all animated →](https://captionsjs.dev/styles)**
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
