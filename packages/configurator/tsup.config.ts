import { defineConfig } from "tsup";

export default defineConfig(({ watch }) => ({
  entry: ["src/index.ts", "src/caption-edits.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  watch: watch
    ? ["src/**/*.{ts,tsx}", "node_modules/captions.js/**/*.ts"]
    : false,
}));
