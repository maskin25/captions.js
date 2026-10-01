# Changelog

## Unreleased

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
