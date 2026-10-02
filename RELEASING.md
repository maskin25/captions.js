# Releasing

Two npm packages and one Docker image are released from this repo:

| What | Where | Version lives in |
| --- | --- | --- |
| `captions.js` (core + `npx captions.js` launcher) | npm | `packages/core/package.json` |
| `@captionsjs/server` (Node API + `captionsjs` CLI) | npm | `packages/server/package.json` |
| `maskin25/captions.js-render` | Docker Hub | built from `packages/server/Dockerfile` |

## 0. Before you start

- `main` is green in CI and everything you want to ship is merged.
- `git checkout main && git pull && pnpm install`
- Logged in: `npm whoami` (and `docker login -u maskin25` if building the image by hand).

## 1. Bump versions

Edit by hand:

- `packages/core/package.json` → `"version"`
- `packages/server/package.json` → `"version"` (only if the server changed)

Semver, from the user's side:

- **patch** — bug fixes, no API change
- **minor** — new exports/options; deprecations with a working alias
- **major** — removed or renamed exports, behaviour changes users must react to

Pre-releases (`2.0.0-beta.1`) are published with `--tag next` (step 3), otherwise
npm makes them `latest` — that is how `1.9.0-ish` ended up as the default install.

## 2. CHANGELOG

In `CHANGELOG.md`, rename `## Unreleased` to
`## captions.js X.Y.Z · @captionsjs/server A.B.C — YYYY-MM-DD`
and add a fresh empty `## Unreleased` on top. Then:

```bash
git commit -am "Release captions.js X.Y.Z, @captionsjs/server A.B.C"
git push
```

## 3. Publish to npm — core first, then server

```bash
cd packages/core   && pnpm publish            # add --tag next for pre-releases
cd ../server       && pnpm publish --access public
```

- **Order matters.** `@captionsjs/server` depends on `captions.js` via
  `workspace:^`; on publish pnpm rewrites it to `^<core version>`, which must
  already exist on npm.
- **Use `pnpm publish`, not `npm publish`** — npm would ship the literal
  `workspace:^` and break installs.
- npm only ships files from inside the package folder. `LICENSE` is committed in each
  package (`packages/*/LICENSE`, a copy of the root one — update all three if it ever
  changes). The core README is the repo's root `README.md`: `prepublishOnly` copies it
  in and `postpublish` removes it (it's gitignored). If a publish fails halfway, just
  delete `packages/core/README.md`.

## 4. Docker image

Pushing a `server-v*` tag runs `.github/workflows/docker.yml` (amd64 + arm64,
tags `latest` and the server version, syncs the Docker Hub description):

```bash
git tag server-vA.B.C && git push origin server-vA.B.C
```

Repo secrets needed: `DOCKERHUB_USERNAME` = `maskin25`, `DOCKERHUB_TOKEN` = a Docker Hub
personal access token with **Read, Write, Delete** (Read & Write is enough to push,
but updating the description needs Delete).

Manual fallback, from the repo root on any machine:

```bash
docker buildx create --name multi --use   # once
docker buildx build --platform linux/amd64,linux/arm64 \
  -f packages/server/Dockerfile \
  -t maskin25/captions.js-render:latest -t maskin25/captions.js-render:A.B.C \
  --push .
```

## 5. Check it landed

```bash
npm view captions.js dist-tags            # latest → X.Y.Z
npm view @captionsjs/server dist-tags     # latest → A.B.C
cd "$(mktemp -d)" && npx --yes captions.js --version   # prints the server version
docker buildx imagetools inspect maskin25/captions.js-render:latest   # amd64 + arm64
```

The preset gallery (`maskin25.github.io/captions.js/presets/`) is rebuilt by the
GitHub Pages workflow on every push to `main` — nothing to do per release.

## Gotchas

- **Server major bump** (`0.x` → `1.0`, or `1.x` → `2.0`): update `SERVER_RANGE` in
  `packages/core/bin/captions.cjs` and release core too, otherwise
  `npx captions.js` keeps fetching the old server line.
- **Wrong `latest`:** `npm dist-tag add captions.js@X.Y.Z latest`.
  Deprecate a bad version instead of unpublishing:
  `npm deprecate captions.js@X.Y.Z "use X.Y.(Z+1)"`.
- **`fixes #N` in a commit message** closes issue #N as soon as it reaches `main`.
  Leave a comment in the issue so the reporter knows what changed.
