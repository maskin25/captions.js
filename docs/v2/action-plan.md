# captions.js — action plan for the executing model

> This file is intended for an agent (Claude Opus) working in the captions.js repository.
> Based on the audit from 2026-08-25, the business plan, and the STT research from 2026-08-26.
> Execute phases strictly in order. Within a phase — tasks in order. Do not start the next phase until the previous one is closed.

## Context

captions.js is an MIT library for animated captions. pnpm monorepo: `core` / `server` (currently private) / `demo` / `configurator` / `docs` / `storybook`. Core dependencies: konva, object-hash.

**The USP we protect with every decision:** the same `renderFrame` produces pixel-for-pixel identical output in the browser preview and in the server-side FFmpeg burn-in, with no headless Chrome. Competitors can't do this: `@remotion/captions` doesn't render at all, full Remotion requires headless Chrome, ASS/libass can't do kinetic typography.

**Strategic frame:** the library is MIT forever — a channel, not a product. Monetization comes later and separately (hosted API). Therefore the goal of the code is maximum adoption and impeccable DX, not protection against copying.

## Working agreements for the agent

- Package manager is pnpm. After every task: `pnpm -r tsc --noEmit` (or targeted to affected packages) and lint on changed files — clean.
- Never break the public API without a deprecated alias and a CHANGELOG entry.
- Every task = a separate commit (or PR) with a "what/why" description.
- Do not publish anything to npm on your own — prepare for publishing and stop; Maksim triggers the release.
- Do not touch Shorty.plus code. It is a separate product.
- If the actual state of the code diverges from this plan (a bug is already fixed, a file was renamed) — verify against reality, mark the item as done, and move on, rather than "fixing" what's already fixed.

---

## Phase 0 — foundation (critical bugs and publishability)

Phase goal: the library honestly works and its promises are backed by installable packages.

### 0.1 Fix animations in `animate.ts` (critical bug)

The `bounce` and `underline` branches call `easeFn(1)` instead of `easeFn(current.progress)` — the animations are static. The line `opacity: easeFn(current.progress)` is commented out.

- Replace `easeFn(1)` → `easeFn(current.progress)` in both branches.
- Uncomment/restore the opacity animation if it matches the intent of the presets (verify visually on the Karaoke preset — it's first in the list and the main showcase).
- Acceptance: a frame-by-frame snapshot test — for one preset, render frames at progress 0 / 0.5 / 1 and confirm they differ.

### 0.2 Fix types in `package.json` `exports` (critical bug)

`exports` lacks the `types` field → TS with `moduleResolution: bundler/node16` can't find the types.

- In every `exports` entry, add `types` as the first field.
- Acceptance: a test fixture project with `moduleResolution: "bundler"` and with `"node16"` where `import { Captions } from 'captions.js'` compiles without errors. Set up as a smoke test in CI.

### 0.3 Prepare `@captionsjs/server` for publishing (critical bug)

The README promises "Node.js + FFmpeg", but the package is `private: true` — the promise is backed by nothing.

- Remove `private: true`, bring package.json to a publishable state (files, exports+types, engines, license MIT, repository).
- Add a CLI: `npx @captionsjs/server burn --input in.mp4 --track track.json --preset Karaoke --output out.mp4` (align flag names with the actual API).
- Package README: a minimal end-to-end example from a JSON with timings to a finished mp4.
- Acceptance: `pnpm pack` produces a valid tarball; installing the tarball locally into a clean project + running the CLI on a short test video yields an mp4 with burned-in captions.

### 0.4 Clean up the public API

- Remove `renderCaptions(ctx, text)` — the demo stub with a hardcoded red 48px — from the API and from the docs.
- `renderString`: remove references to `document.createElement` and `requestAnimationFrame` (it's declared server/worker-friendly), remove the leftover `console.log`. If a DOM path is needed for the browser — split into two implementations with environment auto-detection.
- Remove `renderFrame(settings, undefined as any, ...)` — fix the signature or pass an honest value.
- Typo in a public type: `aplifiedWordColor` → `highlightColor`, keep the old name as a deprecated alias with JSDoc `@deprecated`.

### 0.5 Render loop performance

`Captions.updateFrame()` does `layer.destroyChildren()` + a full scene rebuild every rAF frame, including while paused.

- Early exit if `currentTime` hasn't changed since the last call.
- Switch from `requestAnimationFrame` to `video.requestVideoFrameCallback` with an rAF fallback.
- Acceptance: with the video paused — zero scene rebuilds (verify with a counter in a test or a dev log).

### 0.6 Package hygiene

- Remove `postinstall.cjs` with the star request (breaks `--ignore-scripts`, gets flagged by security audits).
- Move `konva` from `dependencies` to `peerDependencies` (+ `peerDependenciesMeta` if needed); in the README — an install line including konva.
- Remove the 58 MB of TTFs from the repo: fonts either in a separate optional package, or loaded from a CDN, or via git-lfs. Fonts must not end up in the npm tarball — check `files`.
- Add `engines`, `sideEffects: false` (verify there are no real side effects), basic CI: tsc + lint + tests.
- `getPreset('Karaoke')` instead of `stylePresets.find(p => p.captionsSettings.style.name === ...)`; with a clear error on an unknown name and the list of names exported as a union type.

### 0.7 Preset previews

All `verticalCoverImg` values point to `cdn.shorty.plus`, and some previews are mixed up (Focus Box→popline, Crazy/Desert shared, Acid/Lovly/Marvel/Old Money shared).

- A preview-generation script driven by the engine itself (headless canvas / node-canvas in the server package): for every preset — a png and a looping webm of a reference phrase.
- Run on CI whenever presets change; store artifacts in the repo or push to the CDN automatically. Manually mismatched previews are gone for good.
- README: update and credit Shorty.plus as the author (a trust asset).

**Phase 0 gate:** all tasks closed, CI green, Maksim has published core+server. Only then — phase 1.

---

## Phase 1 — data architecture and DX

Phase goal: the path "transcription → animated captions" in one line, regardless of the STT vendor.

### 1.1 `CaptionTrack` — the normalized core (the key architectural decision)

A single internal track format. Presets and the renderer read only it, never a vendor's raw response.

Minimal composition (check against existing types, extend additively):
- `words[]`: `start`, `end`, `text`, `confidence?`, `speaker?`, `lang?`, `emphasis?`
- `utterances[]` / phrase segments with references to words
- `speakers[]`: `id`, `name?`, `role?`
- `events[]`: audio events (`laughter`, `music`, ...) with timings
- `entities[]` / key phrases linked to words

The `speaker` field already exists in the types and is unused — put it to work.

### 1.2 Input adapters

An `adapters` package or subfolder; each adapter is a pure function `X → CaptionTrack`:
1. Deepgram (utterances + words) — priority #1, it's the current STT of Shorty.plus
2. Whisper `verbose_json` (+ whisper.cpp)
3. SRT and VTT (no per-word timings — honestly apply uniform interpolation with an `approximated` flag)
4. AssemblyAI
5. ElevenLabs Scribe
6. Groq, Gladia — lowest priority

Acceptance: fixtures of real vendor responses + a snapshot test of the normalization.

### 1.3 Frame-aware segmenter

Splitting the track into screens by meaning, not "3 words at a time": use utterances, pauses, CPS limits.
- Platform policies: `platform: 'tiktok' | 'reels' | 'shorts'` → safe area, max lines, CPS.
- Configurable, but with sensible defaults.

### 1.4 Forced-alignment hook

No STT engine provides word boundaries precise enough for karaoke fill (270–340 ms discrepancy per external data). We need a pluggable align hook: `track = await align(track, audio, alignerFn)`, where alignerFn is an external function (WhisperX locally, ElevenLabs Forced Alignment API — user's choice). The library does not align by itself — it provides the slot.

### 1.5 Signals → render features

One increment at a time, in order:
1. `speaker` → per-speaker styling + the Speaker Tags preset
2. `emphasis` from the RMS envelope (a computation utility + reading it in presets)
3. `entities` → automatic Keyword Blowup
4. `events` → a sticker layer \[laughter\]/\[music\]
5. `lang` per word → font fallback and line breaking

### 1.6 Integrations

- `@captionsjs/react`: a `<Captions track={...} preset="Karaoke" />` component on top of a video ref.
- `@captionsjs/remotion`: an adapter for rendering inside a Remotion composition. We join their ecosystem, we don't compete with it.
- `preset.with({ accent, font })` — one-line preset customization without manual deep merging.

**Phase 1 gate (checked by Maksim, not the agent):** 1000+ downloads/week and 300+ stars. Until these numbers, we do not build the API product.

---

## Phase 2 — styles

Principle: **what sells is the mechanic, not the color.** We close three missing animation classes: intra-word, accent, and compositional. Before merging, every style must get a correct preview (see 0.7) and a gallery entry.

Implementation queue (first wave, one at a time, each with a demo):
1. **Karaoke Fill** — fill inside the word driven by progress (requires the align hook from 1.4)
2. **Spring Pop** — intra-word springy entrance animation
3. **Keyword Blowup** — accent class: the key word rendered larger and animated (later wired to entities from 1.5)
4. **Speaker Tags** — compositional, named speaker plates
5. **Typewriter**, **Blur Focus**, **Hard Extrude**, **Neon Bloom**

Second wave (after the first + feedback): Sticker Tape, Gradient Wave, Chroma Glitch, Emoji Beat, Impact Shake, Arc Baseline, Auto Contrast, Marker Draw.

Idea backlog (do not implement without explicit approval; keep in issues): Sound Wave Underline (audio-reactive via RMS), Comic Burst, Lyric Mode, Chat Bubbles (built on speaker), Editorial Minimal, VHS Caption, Depth Parallax, Censor Reveal, Countdown Pop.

---

## Phase 3 — showcase (agent writes the code, Maksim launches)

1. Playground (`packages/configurator`) on the docs homepage + a "Copy React snippet" button.
2. Style gallery: a dedicated URL per preset, a looping webm, meta tags for sharing.
3. SEO pages for live queries: "Hormozi style captions in React", "whisper json to animated captions", and similar.
4. PRs into third-party lists: Remotion resources, awesome-ffmpeg, awesome-video (agent prepares the PR texts, Maksim submits).
5. Show HN / Product Hunt — only after the server is published and 30+ styles exist. The agent prepares materials, does not launch.

---

## What NOT to do

- Do not change the license, do not add "open core" restrictions — MIT forever, the decision is made.
- Do not build billing, a hosted API, or dashboards — that comes after the external gate, as a separate project.
- Do not add a dependency on Shorty.plus into the library code; the only link is the authorship credit.
- Do not embed STT vendor calls into the core — only data-format adapters and hooks.
- Do not optimize prematurely — first correctness (phase 0), then architecture (phase 1), then polish.

## Definition of done for any task

1. `tsc --noEmit` clean, lint clean, tests green.
2. Public behavior documented (README/docs); breaking changes only via a deprecated alias.
3. The task has a verifiable acceptance criterion, and it has been verified.
4. CHANGELOG updated.
