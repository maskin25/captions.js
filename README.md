📖 captions.js Monorepo Scripts Cheat Sheet

This cheat sheet summarizes all the key scripts for working with the captions.js monorepo. Use pnpm to run scripts in individual packages.

⸻

🌟 General pnpm Commands

Command	Description
pnpm install	Installs all dependencies for all packages in the monorepo
pnpm --filter <package> run <script>	Runs a script <script> for a specific package <package>
pnpm build	Builds all packages with build scripts
pnpm clean	Cleans build artifacts if a clean script is defined

<package> refers to the package name in packages/, e.g., @captions/core, captions-demo, captions-storybook.

⸻

📦 1. Library: @captions/core

Script	Command	Description
build	pnpm --filter @captions/core run build	Builds the library using tsup (CJS + ESM + TypeScript declarations)
clean	pnpm --filter @captions/core run clean	Deletes the build folder (dist)

Example:

pnpm --filter @captions/core run build


⸻

🎨 2. Demo App: captions-demo

Script	Command	Description
dev	pnpm --filter captions-demo run dev	Runs the demo locally with Vite (default: http://localhost:5173)
build	pnpm --filter captions-demo run build	Builds the demo for production (dist)
preview	pnpm --filter captions-demo run preview	Serves the built demo locally for preview

Example:

pnpm --filter captions-demo run dev


⸻

📚 3. Storybook: captions-storybook

Script	Command	Description
storybook	pnpm --filter captions-storybook run storybook	Runs Storybook 9 with Vite (http://localhost:6006)
build-storybook	pnpm --filter captions-storybook run build-storybook	Builds a static Storybook site (storybook-static)
deploy	pnpm --filter captions-storybook run deploy	Builds Storybook and deploys it to GitHub Pages

Example:

pnpm --filter captions-storybook run storybook

Example deploy:

pnpm --filter captions-storybook run deploy


⸻

⚡ Tips & Recommendations
	1.	Always run scripts using pnpm filter to ensure the local binaries are used:

pnpm --filter <package> run <script>

	2.	If things break after adding/updating packages:

rm -rf node_modules packages/*/node_modules
rm pnpm-lock.yaml
pnpm store prune
pnpm install

	3.	Optional: Add a global build script in the root package.json:

"scripts": {
  "build": "pnpm --filter @captions/core run build && pnpm --filter captions-demo run build && pnpm --filter captions-storybook run build-storybook"
}

This allows building the entire monorepo with a single command:

pnpm run build


⸻

✅ With this setup, you can easily develop, build, and deploy your captions.js library, demo, and Storybook.