// End-to-end: generate a 2s clip with FFmpeg, burn captions through the CLI,
// and check the output differs from the input where the captions are.
// Run after `pnpm build`: node test/cli.test.mjs  (needs ffmpeg + network or cached fonts)
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
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

// SRT goes through the same core adapters as the browser
const srt = path.join(dir, "talk.srt");
fs.writeFileSync(srt, "1\n00:00:00,100 --> 00:00:01,800\nHello world\n");
execFileSync(process.execPath, [cli, "burn", input, srt, "-o", path.join(dir, "srt.mp4"), "-q"]);
const fromSrt = frameAt(path.join(dir, "srt.mp4"), 0.5);
let srtChanged = 0;
for (let i = 0; i < a.length; i++) if (Math.abs(a[i] - fromSrt[i]) > 40) srtChanged++;
assert.ok(srtChanged > 500, `SRT captions not visible (changed px: ${srtChanged})`);
console.log(`ok   CLI burn from .srt (${srtChanged} px changed at t=0.5s)`);

// LLM annotations: prompt lists the numbered words; the reply makes a word larger
const prompt = execFileSync(process.execPath, [cli, "prompt", words]).toString();
assert.match(prompt, /0:Hello 1:world/);
console.log("ok   prompt lists numbered words");
const reply = path.join(dir, "reply.txt");
fs.writeFileSync(reply, 'Here:\n```json\n{"version":1,"emphasis":[{"index":1,"text":"world"},{"index":0,"text":"nope"}]}\n```');
const annotatedOut = path.join(dir, "annotated.mp4");
const run = (args) => {
  const res = spawnSync(process.execPath, [cli, "burn", input, words, "-q", ...args], { encoding: "utf8" });
  assert.equal(res.status, 0, res.stderr);
  return res.stderr;
};
const stderr = run(["-a", reply, "-e", "1", "-o", annotatedOut]);
assert.match(stderr, /1 word\(s\) emphasized/);
assert.match(stderr, /entry 1: "nope" is not at word 0/);
const plainOut = path.join(dir, "plain.mp4");
assert.match(run(["-a", reply, "-o", plainOut]), /expressiveness is 0/);
// "world" is on screen from 0.9 s; at expressiveness 1 it is larger
const loud = frameAt(annotatedOut, 1.2);
const quietFrame = frameAt(plainOut, 1.2);
let grown = 0;
for (let i = 0; i < loud.length; i++) if (Math.abs(loud[i] - quietFrame[i]) > 40) grown++;
assert.ok(grown > 500, `annotated word looks the same (changed px: ${grown})`);
console.log(`ok   CLI burn with annotations (${grown} px differ from expressiveness 0)`);
assert.throws(() => execFileSync(process.execPath, [cli, "burn", input, words, "-e", "2"], { stdio: "pipe" }));

assert.throws(() => execFileSync(process.execPath, [cli, "burn", input, words, "-p", "nope"], { stdio: "pipe" }));
console.log("ok   unknown preset fails");
fs.rmSync(dir, { recursive: true, force: true });
