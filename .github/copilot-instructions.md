<!--
This file guides AI coding agents working on the captions.js monorepo.
Keep it short, actionable, and specific to this repository's layout and conventions.
-->

# captions.js — Copilot instructions

- Repository layout: monorepo using pnpm workspaces. Top-level packages live in `packages/`.

  - Key packages:
    - `packages/core` — the library (entry: `src/index.ts`, build: `tsup`, output: `dist`).
    - `packages/demo` — small Vite demo app (`src/main.ts`, `index.html`, `vite.config.js`).
    - `packages/storybook` — Storybook for components and docs.

- Big picture / architecture:

  - `packages/core` exports runtime caption rendering utilities usable in browser and Node (see `src/index.ts`).
  - Demo and Storybook import the workspace package via workspace protocol (`captions.js` in `packages/demo/package.json`).
  - Fonts and static assets are stored under `packages/core/fonts/` and `packages/demo/public/`.

- Build & dev workflows (do this first):

  - Install deps: `pnpm install` at repo root.
  - Build the library: `pnpm --filter captions.js run build` (uses `tsup`, produces `dist/`).
  - Run demo locally: `pnpm --filter demo run dev` (Vite default port 5173). See `packages/demo/package.json`.
  - Run storybook: `pnpm --filter storybook run storybook` (if changes to docs/components are needed).
  - Use `pnpm --filter <pkg> run <script>` to ensure correct local binaries.

- Patterns & conventions to follow

  - Prefer editing TypeScript sources under `packages/*/src` and run package build before testing other packages.
  - `packages/core` exposes both ESM and CJS builds and TypeScript declarations; preserve API shape when changing exports (`package.json` `exports` field).
  - Static assets used by demos should live in `packages/demo/public/` and referenced from `index.html` or demo code.
  - Fonts are committed in `packages/core/fonts/`; if adding fonts, update `src/fonts/*` helper files.

- Testing / verification (quick checks):

  - After changes to `packages/core`: run `pnpm --filter captions.js run build` then `pnpm --filter demo run dev` and open `http://localhost:5173` to verify visuals.
  - For a fast unit test smoke: ensure TypeScript compiles (`pnpm --filter captions.js run build`) — there are currently no Jest/Vitest tests in the repo root.

- Files to inspect for context or examples

  - `packages/core/src/index.ts` — simplest rendering function and canonical API.
  - `packages/demo/src/main.ts` and `packages/demo/index.html` — how the library is consumed in browser.
  - `DEVELOPMENT.md` — monorepo script cheat sheet with pnpm usage examples.
  - `packages/core/package.json` — build scripts and `prepublishOnly` steps.

- Integration points & external dependencies

  - `packages/core` depends on `konva` (canvas rendering helper) — be mindful of runtime bundle size; watch for imports that might pull heavy optional deps.
  - Demo and Storybook rely on Vite; Storybook configuration lives under `packages/storybook/.storybook`.

- Small examples to reference in PRs / suggestions

  - To add a feature in core: update `packages/core/src/*.ts`, run `pnpm --filter captions.js run build`, then verify demo.
  - To change demo behavior: edit `packages/demo/src/main.ts` and assets in `packages/demo/public/`.

- When opening PRs / changes to API

  - Keep the public API stable (exports in `packages/core/package.json`). If changing the public API, update README and bump version in `package.json`.

- Anything you cannot infer from files
  - External CI/deploy steps (Storybook deploy) may be configured in GitHub Actions not present in repo — ask a human if you need exact CI behavior.

Please open a follow-up note if any section above is unclear or if you want more examples from specific files.
