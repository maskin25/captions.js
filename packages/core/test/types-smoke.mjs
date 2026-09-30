// Smoke test for package.json "exports" + "types": compiles a consumer
// importing `captions.js` under every moduleResolution mode people use.
// Run after `pnpm build`: node test/types-smoke.mjs
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const pkgDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tsc = path.join(pkgDir, "node_modules", "typescript", "bin", "tsc");

const consumer = `
import captionsjs, { Captions, getPreset, renderFrame, toCaptions, type Caption } from "captions.js";
const words: Caption[] = toCaptions([{ word: "hi", startTime: 0, endTime: 1 }]);
const preset = getPreset("Karaoke");
void captionsjs; void Captions; void renderFrame; void words; void preset;
`;

const cases = [
  { name: "bundler", module: "ESNext", moduleResolution: "Bundler", type: "module", file: "index.ts" },
  { name: "node16-esm", module: "Node16", moduleResolution: "Node16", type: "module", file: "index.ts" },
  // konva@10 is ESM-only, so a CJS consumer under Node16 can't typecheck its
  // .d.ts; skipLibCheck (the default in most setups) is required there.
  { name: "node16-cjs", module: "Node16", moduleResolution: "Node16", type: "commonjs", file: "index.cts", skipLibCheck: true },
  { name: "nodenext", module: "NodeNext", moduleResolution: "NodeNext", type: "module", file: "index.ts" },
  { name: "node10", module: "CommonJS", moduleResolution: "Node10", type: "commonjs", file: "index.ts" },
];

let failed = 0;
for (const c of cases) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `captionsjs-types-${c.name}-`));
  fs.mkdirSync(path.join(dir, "node_modules"));
  fs.symlinkSync(pkgDir, path.join(dir, "node_modules", "captions.js"), "dir");
  fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify({ type: c.type }));
  fs.writeFileSync(
    path.join(dir, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: {
        module: c.module, moduleResolution: c.moduleResolution, target: "ES2022",
        lib: ["ES2022", "DOM"], strict: true, noEmit: true, esModuleInterop: true,
        skipLibCheck: Boolean(c.skipLibCheck), types: [],
      },
      files: [c.file],
    }),
  );
  fs.writeFileSync(path.join(dir, c.file), consumer);
  try {
    execFileSync(process.execPath, [tsc, "-p", dir], { stdio: "pipe" });
    console.log(`ok   ${c.name}`);
  } catch (err) {
    failed++;
    console.log(`FAIL ${c.name}\n${err.stdout}${err.stderr}`);
  }
  fs.rmSync(dir, { recursive: true, force: true });
}
process.exit(failed ? 1 : 0);
