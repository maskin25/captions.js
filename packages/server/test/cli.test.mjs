// End-to-end: generate a 2s clip with FFmpeg, burn captions through the CLI,
// and check the output differs from the input where the captions are.
// Run after `pnpm build`: node test/cli.test.mjs  (needs ffmpeg + network or cached fonts)
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const cli = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../dist/cli.js");
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "captionsjs-cli-"));
const input = path.join(dir, "in.mp4");
const words = path.join(dir, "words.json");

execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-f", "lavfi", "-i", "color=c=gray:s=360x640:d=2:r=25",
  "-c:v", "libx264", "-pix_fmt", "yuv420p", input]);
fs.writeFileSync(words, JSON.stringify([
  { word: "Hello", start: 0.1, end: 0.9 },
  { word: "world", start: 0.9, end: 1.8 },
]));

const stdout = execFileSync(process.execPath, [cli, "burn", input, words, "-p", "karaoke", "-q"]).toString();
const output = path.join(dir, "in.captions.mp4");
assert.ok(stdout.includes(output), `unexpected stdout: ${stdout}`);
assert.ok(fs.statSync(output).size > 0);

const frameAt = (file, t) =>
  execFileSync("ffmpeg", ["-loglevel", "error", "-ss", String(t), "-i", file, "-frames:v", "1",
    "-f", "rawvideo", "-pix_fmt", "gray", "-"]);
const a = frameAt(input, 0.5);
const b = frameAt(output, 0.5);
let changed = 0;
for (let i = 0; i < a.length; i++) if (Math.abs(a[i] - b[i]) > 40) changed++;
assert.ok(changed > 500, `captions not visible in output (changed px: ${changed})`);
console.log(`ok   CLI burn (${changed} px changed at t=0.5s)`);

assert.throws(() => execFileSync(process.execPath, [cli, "burn", input, words, "-p", "nope"], { stdio: "pipe" }));
console.log("ok   unknown preset fails");
fs.rmSync(dir, { recursive: true, force: true });
