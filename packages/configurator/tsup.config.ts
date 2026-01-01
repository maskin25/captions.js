import { defineConfig } from "tsup";

export default defineConfig(({ watch }) => ({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  watch: watch
    ? ["src/**/*.{ts,tsx}", "node_modules/captions.js/**/*.ts"]
    : false,
}));
