---
title: Docker Render Service
outline: deep
---

# captions.js render image

`maskin25/captions.js-render` is a ready-to-run container that burns captions onto a video using the **captions.js** renderer plus ffmpeg. This page shows how to pull the image, feed it your assets, and customize the render through CLI flags.

## 1. Pull the image

```bash
docker pull maskin25/captions.js-render:latest
```

Tags follow the npm package version (`0.1.0`, `0.2.0`, …). Use a fixed tag in production.

## 2. Provide inputs

The container expects:

| Flag                              | Description                                                                                                          | Example                           |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| `--preset <name>`                 | Name of the captions style preset (e.g. `Lovly`, `From`). See the [stylePresets](/api/type-aliases/StylePresetName). | `--preset Lovly`                  |
| `--video <path or URL>`           | Source video file. Supports `@/path` for mounted files or full HTTP(S) URLs.                                         | `--video @/data/margo.mp4`        |
| `--captions <path, JSON, or URL>` | Captions payload. Accepts JSON string, mounted file, or remote URL.                                                  | `--captions @/data/margo-dg.json` |
| `--output <path>`                 | Where to save the rendered video inside the container. Defaults to `/app/output.mp4`.                                | `--output @/data/output.mp4`      |
| `--rootDir <path>`                | Convenience flag: if set, any argument starting with `@/` will be resolved relative to this directory.               | `--rootDir /data`                 |

All paths that start with `@/` are interpreted relative to the bind mount supplied via `-v`. This lets you keep videos/captions on the host.

## 3. Typical local run

```bash
docker run --rm \
  -v /absolute/path/to/assets:/data \
  maskin25/captions.js-render:latest \
  burnCaptions \
    --preset Lovly \
    -- rootDir /data \
    --video @/video.mp4 \
    --captions @/captions.json \
    --output @/output.mp4
```

- `/absolute/path/to/assets` must contain both `video.mp4` and `captions.json`.
- The resulting `output.mp4` is written back into the same host folder.

## 4. Remote assets

The CLI can download files directly:

```bash
docker run --rm maskin25/captions.js-render \
  burnCaptions \
    --preset From \
    -- rootDir /data \
    --video https://<path-to-video> \
    --captions https://<path-to-captions> \
    --output /app/output.mp4
```

After the run, copy the result out with `docker cp <container>:/app/output.mp4 ./output.mp4` or mount a host directory via `-v` so the file lands on disk automatically.

<!-- ## 5. Environment variables

| Variable   | Default      | Purpose                                                                               |
| ---------- | ------------ | ------------------------------------------------------------------------------------- |
| `PORT`     | `4000`       | When running the server mode (no CLI args), exposes the health endpoint and HTTP API. |
| `NODE_ENV` | `production` | Standard runtime mode toggle.                                                         |

To use the HTTP API instead of the CLI, run `docker run --rm -p 4000:4000 maskin25/captions.js-render` and POST jobs to `/burn`.

## 6. Troubleshooting

- **Fonts look wrong**: ensure you pulled the latest image; it already bundles the presets under `/app/assets/fonts`. If you need different typefaces, rebuild the image with your fonts in `packages/server/assets/fonts`.
- **Slow renders**: the container encodes video on CPU. Use smaller input resolutions or tune `--preset` to reduce effects.
- **Permission errors**: the container runs as root. If you mount a directory that requires different permissions, add `--user $(id -u):$(id -g)` to the `docker run` command.

Need more presets or automation? Fork `maskin25/captions.js-render` and customize `packages/server`. The Dockerfile lives at `packages/server/Dockerfile` inside this repo.\*\*\*
 -->
