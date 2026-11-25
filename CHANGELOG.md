# Changelog

## Unreleased (2.0)

Upgrading from 1.x: see [MIGRATION.md](./MIGRATION.md).

### captions.js
- **Breaking:** Konva is a peer dependency (`npm install captions.js konva`).
- **Breaking:** `renderString` is removed.
- **Breaking:** built-in presets have no `id` or `layoutSettings`; both are
  optional on `StylePreset`. Preset covers point to captionsjs.dev posters
  instead of cdn.shorty.plus.
- **Changed:** `renderFrame({ settings, captions, time, size, layer, scale,
  debug })`, with `scale` defaulting to `height / 480`. The positional form
  still works and is deprecated. `RenderFrameOptions` is exported.
- **Changed:** the browser overlay renders on `requestVideoFrameCallback` at
  the presented frame's `mediaTime` where available, at most once per video
  frame; `requestAnimationFrame` still applies edits while paused.
- `sideEffects: false`; `renderStylePreset` is documented as browser-only.
- **Added:** `CaptionTrack`, the normalized track every input becomes: words
  with optional confidence, speaker, language and emphasis; sentences,
  paragraphs, speakers and audio events. `toTrack(input)` detects the format,
  `trackToCaptions(track)` gives the renderer's `Caption[]`, and
  `validate(track)` reports non-finite or reversed times, empty words,
  overlaps and unknown speakers.
- **Added:** input adapters in core: OpenAI Whisper `verbose_json` (also
  faster-whisper and WhisperX), whisper.cpp JSON, SRT, WebVTT, AssemblyAI,
  ElevenLabs Scribe, loose `{ word | text, start, end }` arrays and a
  `CaptionTrack` object, next to Deepgram. `toCaptions()` now accepts all of
  them, so the browser and the CLI take the same files (Whisper JSON and
  `{ word, start, end }` used to throw in the browser). Each adapter is also
  exported on its own (`fromWhisper`, `fromSrt`, ...), plus `detectFormat()`.
- **Added:** `*word*` and `*several words*` in any text input mark manual
  emphasis; the asterisks are removed from the text.
- SRT and VTT have no word times: each cue's time is spread over its words by
  length and those words are marked `approximated`. VTT inline timestamps
  (`<00:00:01.200>word`) and `<v Speaker>` are used when present. Cues that are
  only `[Music]` or `(laughs)` become events instead of words.
- Deepgram output of `toCaptions()` is unchanged (checked against 1.10.0). A
  Deepgram response with paragraphs but no word list now yields interpolated
  words instead of one "word" per sentence.
- **Changed:** a screen now ends where a sentence ends (`.`, `!`, `?`, `…`;
  not after abbreviations like `Dr.` or `e.g.`), where the speaker changes,
  and at a pause of 0.6 s or more, even when the transcript has no sentence
  times. Screens used to run across sentences ("YEAH. AND THAT / WAY. I MEAN").
  During a silence the finished screen stays up for up to 1 s instead of
  blinking off.
- **Fixed:** Focus Box (`box-word`) glued a short word to the next one,
  most visibly at 1080×1920 ("ВБАЗОВОМ"). The highlight box now scales with
  the font and the gap between words leaves room for it. Focus Box goldens
  changed; no other preset did.
- **Changed:** line breaks are decided from text widths in font units instead
  of an average letter count, so the browser preview and the server export
  break lines identically, at any output size. Before, Chromium and Skia could
  disagree near a rounding edge (From at 1080×1920 showed "BROWSER" in the
  browser and "IN YOUR BROWSER" on the server), and a small preview could wrap
  differently from the full-size export. Lines now hold about as many
  characters as before on average, but where they break changes for most
  presets; Russian lines are a little shorter, because Cyrillic is measured
  rather than estimated. Text a preset font has no glyphs for (Cyrillic in
  Kanit, Lato, Poppins, Permanent Marker) still falls back to each engine's
  own font and can wrap differently.

- **Added:** emphasis on screen. `Caption.emphasis` (0–1) and a preset's
  `expressiveness` (0–1, default 0) draw emphasized words up to 1.4× larger
  (`EMPHASIS_MAX_SCALE`), on a shared baseline, with layout making room.
  `style.emphasisColor` optionally colors strongly emphasized words. At
  `expressiveness: 0` nothing changes: every golden frame is the same.
  `*word*` markup and `emphasis` in the data now reach the renderer (they
  were dropped by `trackToCaptions` before).
- **Added:** annotations: emphasis chosen outside the library, e.g. by an LLM.
  `annotationPrompt(track)` writes the request with numbered words,
  `parseAnnotations()` reads the reply (raw, in prose or a code fence),
  `applyAnnotations(track, reply)` applies it and reports issues (shifted or
  missing words, values out of range, duplicates); manual emphasis wins.
  `ANNOTATIONS_SCHEMA` is the JSON Schema of the file. captions.js never calls
  a model.
- **Added:** a line too wide for the frame (a single long word, more likely
  with emphasis) shrinks to fit instead of running off the edge.

- **Added:** effects as modules (`canvas-captions/effects/`). Each animation
  is an `Effect` with `apply(context)`, where the context holds every word on
  screen with its state (past, active, future), line, progress and elapsed
  time, plus the screen group, `screenProgress`, `time` and `scale`.
  `registerEffect(name, effect)` adds one that `animation` can name; unknown
  names draw no animation. The ten built-in animations are ported unchanged:
  all 260 golden frames are byte-identical.
- **Added:** `animationOptions` on settings, per-effect parameters with
  today's values as defaults: `bounceScale`, `bounceAttack`, `underlineWidth`,
  `underlineDraw`, `boxPaddingX`, `boxPaddingY`, `boxRadius`, `slideOffset`.
- `CaptionsSettings.animation` is typed `BuiltInAnimation | string`.

### @captionsjs/server
- **Added:** `burnCaptions({ expressiveness, annotations })`, CLI
  `--expressiveness/-e` and `--annotations/-a`, and `npx captions.js prompt
  <transcript>`, which prints the LLM request. The CLI reports annotation
  issues and says so when words have emphasis but expressiveness is 0.
- The CLI and `loadCaptions()` use the core adapters, so `npx captions.js burn
  talk.mp4 talk.srt` works, as do `.vtt` files and every JSON format above.
  Whisper input now carries segment bounds, so screens break at segment ends.

### Repo
- Removed `packages/docs` (the docs live on captionsjs.dev) and
  `packages/core/Dockerfile`.
- `test:overlay`: the browser overlay over a playing video in headless
  Chromium (video frames drive it, edits while paused redraw, `disable()`
  stops it).
- Golden frames: 260 PNGs (26 presets × 5 moments × 2 sizes) compared on
  every PR; see DEVELOPMENT.md. 140 of them changed with the new line breaks.
- Layout test: every preset must give the same screens and lines at three
  sizes (CI), and in Chromium (`test:parity`, with the layout check failing the
  run).

## captions.js 1.10.0 · @captionsjs/server 0.1.1 — 2026-10-01

### captions.js
- **Fixed:** the browser overlay no longer rebuilds the scene every frame
  while the video is paused (0 rebuilds when nothing changes; rebuilds on
  seek, resize, preset/captions change, font load). `getRenderCount()` for diagnostics.
- **Renamed:** `style.aplifiedWordColor` → `style.highlightColor`. The old name
  is deprecated but still read when `highlightColor` is absent, so saved
  settings keep working. New helper `getHighlightColor(settings)`.

### @captionsjs/server
- Dropped `fluent-ffmpeg` (deprecated, printed an npm warning on every
  `npx captions.js burn`); ffmpeg/ffprobe are spawned directly.
- Rotation of phone videos is read from the display matrix, as modern ffprobe reports it.
- `pnpm previews` renders every preset with the engine (mp4, webm, poster,
  manifest.json, gallery page). Published to GitHub Pages at `/presets/`.

### Repo
- Removed `packages/docs` (the docs live on captionsjs.dev) and
  `packages/core/Dockerfile`.
- `test:overlay`: the browser overlay over a playing video in headless
  Chromium (video frames drive it, edits while paused redraw, `disable()`
  stops it).
- CI: build + tests on Node 20 and 22 for every PR.

## captions.js 1.9.0 · @captionsjs/server 0.1.0 — 2026-09-30

### captions.js

- **Fixed:** `bounce` and `underline` animations were frozen in their end state
  (`easeFn(1)`). Bounce now pops in over 150 ms with a slight overshoot and pushes
  neighbouring words aside by exactly the growth of the active word (no overlap at any
  scale); underline draws in over 250 ms. Zero-length words no longer produce `NaN`.
- **Fixed:** `exports` now carries `types` for both `import` and `require`, verified
  under `bundler`, `node16` (ESM + CJS), `nodenext` and `node10` resolution.
- **Added:** `getPreset(name)` (case-insensitive, throws with the list of names) and
  `presetNames`.
- **Added:** `npx captions.js burn <video> <words.json>` — launcher for `@captionsjs/server`.
- **Removed:** `renderCaptions(ctx, text)` — a docs demo stub (red 48px text), never a
  real renderer. Use `renderFrame` / `renderStylePreset`.
- **Removed:** `postinstall` script (broke `--ignore-scripts`, flagged by audits).
- Removed stray `console.log` calls from library code.
- License file added; the project is MIT.

### @captionsjs/server (first public release)

- Publishable package: `burnCaptions()` Node API + `captionsjs` CLI.
- Accepts plain word timings, Whisper `verbose_json` and Deepgram responses.
- Fonts come from Google Fonts on demand (cached in `~/.cache/captionsjs/fonts`),
  so the 57 MB of TTFs stay out of the npm tarball. `--fonts-dir` for offline use.
- Font scale now follows the browser rule (`videoHeight / 480`), so the burned-in
  file matches the preview. The legacy Pub/Sub `/burnCaptions` job keeps `scale: 1`.
- Raw RGBA frames into FFmpeg instead of PNG per frame; output fps follows the source.
- Dropped the `canvas` (node-canvas) dependency — skia-canvas does all the drawing.
