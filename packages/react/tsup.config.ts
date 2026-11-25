import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  // Next.js App Router: the component and hook run on the client only.
  banner: { js: '"use client";' },
  external: ["react", "captions.js", "konva"],
});
