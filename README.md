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
| Modern kinetic typography         | ✅ 34 presets   | —                    | build it yourself      | ❌           | ❌                |
| Preview and export share one code path | ✅         | n/a                  | ✅ (via Chrome)        | n/a          | n/a               |

`@remotion/captions` converts transcription formats — it does not render anything.
Full Remotion rendering does share code between preview and export, but the price is a
headless Chrome in your production pipeline. ASS/libass burns in reliably but can't do
per-word scale, bounce or box animations. `drawtext` is a string-escaping nightmare.

Captions.js is the narrow tool: kinetic word-level captions that look the same in both places,
running on plain canvas.

## Installation

```bash
npm install captions.js konva
# or
pnpm add captions.js konva
```

Konva is a peer dependency, so your app keeps a single copy.

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
display size. It redraws on each presented video frame (`requestVideoFrameCallback`,
falling back to `requestAnimationFrame`). Fonts are pulled from Google Fonts on demand.

## React

```bash
npm install @captionsjs/react captions.js konva
```

```tsx
import { useRef } from "react";
import { Captions } from "@captionsjs/react";

export function Player({ words }) {
  const video = useRef<HTMLVideoElement>(null);
  return (
    <div>
      <video ref={video} src="/clip.mp4" controls />
      <Captions video={video} captions={words} preset="Karaoke" />
    </div>
  );
}
```

`useCaptions(video, { preset, captions })` does the same as a hook and returns the
controller. Both work under StrictMode and in the Next.js App Router. See
[packages/react](./packages/react) and the [Vite](./examples/react-vite) and
[Next.js](./examples/react-next) examples.

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
preview. Line breaks are measured in font units, so the preview and the export
break lines in the same places at any size. Browser and server draw text with
different engines (Chromium vs Skia), so glyph edges can differ by a pixel; every
preset is measured against the browser in [`docs/v2/parity.md`](./docs/v2/parity.md). Driving `renderFrame` yourself (custom pipelines, other encoders) — see
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

## Emphasis

Any word can carry `emphasis` from 0 to 1, and a preset's `expressiveness`
(0 to 1, default 0) decides how much it shows: at 1, a fully emphasized word is
drawn 1.4× larger, on the same baseline as its neighbours, and layout makes room
for it. With `style.emphasisColor` set, strongly emphasized words also take that
color. At 0 a preset looks exactly as it does without emphasis.

There are three ways to mark words:

- set `emphasis` on a caption or track word;
- write `*word*` or `*several words*` in any text input (SRT, VTT, word lists);
- let an LLM choose. captions.js never calls a model: `annotationPrompt(track)`
  gives you the text to send, with the words numbered, and
  `applyAnnotations(track, reply)` validates the answer and applies it. A
  manual mark always wins over an annotation.

```ts
import captionsjs, { annotationPrompt, applyAnnotations, getPreset, toTrack, trackToCaptions } from "captions.js";

const track = toTrack(transcript);
const reply = await yourLlm(annotationPrompt(track)); // any model, your API key
const { track: annotated, issues } = applyAnnotations(track, reply);
const captions = trackToCaptions(annotated);

const karaoke = getPreset("Karaoke");
const preset = { ...karaoke, captionsSettings: { ...karaoke.captionsSettings, expressiveness: 0.7 } };
captionsjs({ video, preset, captions });
```

The reply may be raw JSON, or JSON in prose or a code fence. An entry whose word
is not where the model said is looked for up to 5 words away, and reported in
`issues` either way; `ANNOTATIONS_SCHEMA` is the JSON Schema for structured
output. From the shell:

```bash
npx captions.js prompt words.json > prompt.txt          # send it to your LLM
npx captions.js burn talk.mp4 words.json -a reply.json -e 0.7
```

> Emphasis, annotations and `expressiveness` arrive in 2.0.

## Custom effects

An effect is one function that runs every frame on freshly built Konva nodes.
It sees the whole screen, not just the active word:

```ts
import { registerEffect } from "captions.js";

registerEffect("fade-ahead", {
  apply({ words }) {
    for (const word of words) {
      if (word.state === "future") word.text.opacity(0.35);
    }
  },
});

preset.captionsSettings.animation = "fade-ahead";
```

Each word carries its `caption`, Konva `text` node, `line`, `state`, `progress`
through the word and `elapsed` seconds; the context also has the screen
`group`, its size, `screenProgress` for entrances, `time`, `scale` and the
preset's `animationOptions`. Register the same effect in the browser and on the
server and the export keeps matching the preview.

An effect may add nodes for looks, such as glow or depth copies of a word. Name
extra `Text` nodes `DECORATION` (`name: DECORATION`, exported) so tools that read
the words back from a layer can skip them. Size everything from the word's own
`text.fontSize()`, so the effect looks the same at every frame size.

> `registerEffect` and `animationOptions` arrive in 2.0.

## What's in the box

- **34 style presets** — Karaoke, Focus Box, Banger, Neon Pulse, Cinema, Old Money and more,
  plus Spring Pop, Highlight Sweep, Neon Bloom, Hard Extrude, Karaoke Fill,
  Gradient Wave, Pill and Chroma Glitch, new in 2.0;
  each a plain object you can clone and edit. `getPreset("Karaoke")` fetches one by name.
  **[See them all animated →](https://captionsjs.dev/styles)**
- **18 animations** — `bounce`, `pop`, `scale`, `box`, `box-word`, `underline`,
  `slide-left`, `slide-up`, `slide-down`, `none`, and in 2.0 `spring`, `highlight-sweep`,
  `neon`, `extrude`, `karaoke-fill`, `gradient-wave`, `pill`, `chroma-glitch`,
  tunable with `animationOptions`
  (e.g. `{ bounceScale: 0.2 }`). Add your own with `registerEffect` (2.0): an effect
  sees every word on screen with its state (past, active, future), line and timing.
- **Full typography control** — family, weight, size, stroke, shadow, capitalization,
  italic, underline, active/past word colors.
- **Sentence-aware chunking** — screens end at sentences, speaker changes and pauses; lines
  break on measured text width, identically in the browser and on the server,
  with `linesPerPage`, `lineSpacing` and `position` (`auto` / `top` / `middle` / `bottom`).
- **Google Fonts loading** via `preloadGoogleFont`, with the resolved metrics cached
  so layout is stable frame to frame.

## Status

Captions.js is under active development and the API may still move before 2.0.
Issues and PRs are welcome — see [DEVELOPMENT.md](./DEVELOPMENT.md).

## License

[MIT](./LICENSE) © [maskin25](https://github.com/maskin25). Free for commercial use, and it stays MIT.
