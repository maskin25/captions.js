# 📖 captions.js Monorepo Scripts Cheat Sheet

This cheat sheet summarizes all the key scripts for working with the `captions.js` monorepo. Use `pnpm` to run scripts in individual packages.

---

## 🌟 General `pnpm` Commands

| Command                                | Description                                                  |
| -------------------------------------- | ------------------------------------------------------------ |
| `pnpm install`                         | Installs all dependencies for all packages in the monorepo.  |
| `pnpm --filter <package> run <script>` | Runs a script `<script>` for a specific package `<package>`. |
| `pnpm build`                           | Builds all packages that have a `build` script.              |
| `pnpm clean`                           | Cleans build artifacts if a `clean` script is defined.       |

> **Note:** `<package>` refers to the package name in `packages/`, e.g., `captions.js`, `captions-demo`, or `captions-storybook`.

---

## 📦 Package: `captions.js`

| Script  | Command                               | Description                                                              |
| ------- | ------------------------------------- | ------------------------------------------------------------------------ |
| `build` | `pnpm --filter captions.js run build` | Builds the library using `tsup` (CJS, ESM, and TypeScript declarations). |
| `clean` | `pnpm --filter captions.js run clean` | Deletes the build folder (`dist`).                                       |

**Example:**

```bash
pnpm --filter captions.js run build
```

---

## 🎨 Demo App: `captions-demo`

| Script    | Command                                   | Description                                                         |
| --------- | ----------------------------------------- | ------------------------------------------------------------------- |
| `dev`     | `pnpm --filter captions-demo run dev`     | Runs the demo locally with Vite (default: `http://localhost:5173`). |
| `build`   | `pnpm --filter captions-demo run build`   | Builds the demo for production into the `dist` folder.              |
| `preview` | `pnpm --filter captions-demo run preview` | Serves the built demo locally for preview.                          |

**Example:**

```bash
pnpm --filter captions-demo run dev
```

---

## 📚 Storybook: `captions-storybook`

| Script            | Command                                                | Description                                                 |
| ----------------- | ------------------------------------------------------ | ----------------------------------------------------------- |
| `storybook`       | `pnpm --filter captions-storybook run storybook`       | Runs Storybook locally with Vite (`http://localhost:6006`). |
| `build-storybook` | `pnpm --filter captions-storybook run build-storybook` | Builds a static Storybook site into `storybook-static`.     |
| `deploy`          | `pnpm --filter captions-storybook run deploy`          | Builds and deploys Storybook to GitHub Pages.               |

**Example:**

```bash
pnpm --filter captions-storybook run storybook
```

---

## 🖼️ Golden frames

`packages/server/test/golden/` holds 260 PNGs: every preset at five moments of a
reference phrase, at 540×960 and 1080×1920, rendered through the server path
(Konva + skia-canvas) with the fonts in `packages/server/assets/fonts`.
`pnpm --filter @captionsjs/server test` compares fresh renders against them, and
CI runs it on every PR.

Frames are compared as 8×8 px block averages (16×16 at 1080 wide), not pixel by
pixel: Skia rasterizes shadow and glow blur a little differently on each CPU, so
exact pixels differ between your machine and the CI runner. A block fails when
its average moves by more than 32 in any channel, which catches layout, timing
and animation changes but not small color shifts.

```bash
pnpm --filter captions.js build && pnpm --filter @captionsjs/server build
cd packages/server
node test/golden.test.mjs                    # compare
node test/golden.test.mjs --only "Karaoke"   # one preset
node test/golden.test.mjs --update           # accept the new look
```

On a mismatch the actual frame and a diff (changed pixels in red) are written to
`packages/server/test/golden-out/`; in CI they are uploaded as an artifact.
Regenerate baselines only for a change you have looked at and approved, and
commit them together with that change.

---

## ⚡ Tips & Recommendations

1.  **Targeted Scripts:** Always run scripts using `pnpm --filter` to ensure you're using the correct local binaries for that package.

    ```bash
    pnpm --filter <package> run <script>
    ```

2.  **Troubleshooting:** If you encounter issues after updating packages, run this sequence to perform a clean reinstall:

    ```bash
    # Clean up all node_modules and lockfile
    rm -rf node_modules packages/*/node_modules
    rm pnpm-lock.yaml

    # Prune the pnpm store and reinstall
    pnpm store prune
    pnpm install
    ```

3.  **Global Build Script (Optional):** For convenience, you can add a global `build` script to the root `package.json` to build the entire monorepo with one command.

    ```json
    "scripts": {
      "build": "pnpm --filter captions.js run build && pnpm --filter captions-demo run build && pnpm --filter captions-storybook run build-storybook"
    }
    ```

    Then, you can simply run:

    ```bash
    pnpm run build
    ```

# DockerHub Deployment

The server package can be containerized using Docker. Below are the steps to build and run the Docker container for the server.

## Build the Docker Image

To build the Docker image for the server, navigate to the `packages/server` directory and run the following command:

```bash
docker build -t maskin25/captions.js-render:latest -f packages/server/Dockerfile .
```

This command builds the Docker image and tags it as `maskin25/captions.js-render:latest`.

## Run the Docker Container

To run the Docker container from the built image, use the following command:

```bash
docker run --rm -p 4000:4000 maskin25/captions.js-render:latest
```

This command runs the container, mapping port 4000 of the container to port 4000 on your host machine. The `--rm` flag ensures that the container is removed after it stops

## Pushing to DockerHub

To push the Docker image to DockerHub, first log in to your DockerHub account:

```bash
docker login
```

Then, tag the image with your DockerHub username and push it:

```bash
docker push maskin25/captions.js-render:latest
```
