# 📖 captions.js Monorepo Scripts Cheat Sheet

This cheat sheet summarizes all the key scripts for working with the `captions.js` monorepo. Use `pnpm` to run scripts in individual packages.

---

## 🌟 General `pnpm` Commands

| Command                                     | Description                                                  |
| ------------------------------------------- | ------------------------------------------------------------ |
| `pnpm install`                              | Installs all dependencies for all packages in the monorepo.  |
| `pnpm --filter <package> run <script>`      | Runs a script `<script>` for a specific package `<package>`. |
| `pnpm build`                                | Builds all packages that have a `build` script.              |
| `pnpm clean`                                | Cleans build artifacts if a `clean` script is defined.       |

> **Note:** `<package>` refers to the package name in `packages/`, e.g., `@captions/core`, `captions-demo`, or `captions-storybook`.

---

## 📦 Package: `@captions/core`

| Script  | Command                                   | Description                                                              |
| ------- | ----------------------------------------- | ------------------------------------------------------------------------ |
| `build` | `pnpm --filter @captions/core run build`  | Builds the library using `tsup` (CJS, ESM, and TypeScript declarations). |
| `clean` | `pnpm --filter @captions/core run clean`  | Deletes the build folder (`dist`).                                       |

**Example:**
```bash
pnpm --filter @captions/core run build
```

---

## 🎨 Demo App: `captions-demo`

| Script    | Command                                 | Description                                                        |
| --------- | --------------------------------------- | ------------------------------------------------------------------ |
| `dev`     | `pnpm --filter captions-demo run dev`     | Runs the demo locally with Vite (default: `http://localhost:5173`). |
| `build`   | `pnpm --filter captions-demo run build`   | Builds the demo for production into the `dist` folder.             |
| `preview` | `pnpm --filter captions-demo run preview` | Serves the built demo locally for preview.                         |

**Example:**
```bash
pnpm --filter captions-demo run dev
```

---

## 📚 Storybook: `captions-storybook`

| Script            | Command                                           | Description                                                |
| ----------------- | ------------------------------------------------- | ---------------------------------------------------------- |
| `storybook`       | `pnpm --filter captions-storybook run storybook`  | Runs Storybook locally with Vite (`http://localhost:6006`). |
| `build-storybook` | `pnpm --filter captions-storybook run build-storybook` | Builds a static Storybook site into `storybook-static`.    |
| `deploy`          | `pnpm --filter captions-storybook run deploy`     | Builds and deploys Storybook to GitHub Pages.              |

**Example:**
```bash
pnpm --filter captions-storybook run storybook
```

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
      "build": "pnpm --filter @captions/core run build && pnpm --filter captions-demo run build && pnpm --filter captions-storybook run build-storybook"
    }
    ```
    Then, you can simply run:
    ```bash
    pnpm run build
    ```