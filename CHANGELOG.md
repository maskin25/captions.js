# Changelog

## Unreleased

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

### @captionsjs/server 0.1.0 (first public release)

- Publishable package: `burnCaptions()` Node API + `captionsjs` CLI.
- Accepts plain word timings, Whisper `verbose_json` and Deepgram responses.
- Fonts come from Google Fonts on demand (cached in `~/.cache/captionsjs/fonts`),
  so the 57 MB of TTFs stay out of the npm tarball. `--fonts-dir` for offline use.
- Font scale now follows the browser rule (`videoHeight / 480`), so the burned-in
  file matches the preview. The legacy Pub/Sub `/burnCaptions` job keeps `scale: 1`.
- Raw RGBA frames into FFmpeg instead of PNG per frame; output fps follows the source.
- Dropped the `canvas` (node-canvas) dependency — skia-canvas does all the drawing.
