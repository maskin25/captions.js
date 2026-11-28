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
// speakers: names from WebVTT voices reach Speaker Tags; --speakers wins
const { loadTranscript } = await import("../dist/render/loadCaptions.js");
const vtt = "WEBVTT\n\n00:00.100 --> 00:00.900\n<v Ann>Hello\n\n00:00.900 --> 00:01.800\n<v Bob>world\n";
const transcript = await loadTranscript(vtt);
assert.deepEqual(transcript.speakers, [{ label: "Ann" }, { label: "Bob" }]);
assert.deepEqual(transcript.captions.map((c) => c.speaker), [0, 1]);
assert.deepEqual((await loadTranscript(words)).speakers, [], "speakers without names");
const vttFile = path.join(dir, "talk.vtt");
fs.writeFileSync(vttFile, vtt);
const tagged = (args) => {
  const out = path.join(dir, `tags-${args.length}.mp4`);
  const res = spawnSync(process.execPath, [cli, "burn", input, vttFile, "-q", "-p", "speaker tags", "-o", out, ...args], { encoding: "utf8" });
  assert.equal(res.status, 0, res.stderr);
  return frameAt(out, 0.5);
};
const fromVoices = tagged([]);
const renamed = tagged(["-s", "Annabelle Smith:#FF0000"]);
let retagged = 0;
for (let i = 0; i < fromVoices.length; i++) if (Math.abs(fromVoices[i] - renamed[i]) > 40) retagged++;
assert.ok(retagged > 200, `--speakers did not change the tag (changed px: ${retagged})`);
assert.throws(() => execFileSync(process.execPath, [cli, "burn", input, words, "-s", "Ann:red"], { stdio: "pipe" }));
console.log(`ok   speakers from WebVTT voices and --speakers (${retagged} px differ)`);

// --safe-area: Shorts covers the bottom 35%, so captions sit higher
const lowestCaptionRow = (args) => {
  const out = path.join(dir, `safe-${args.join("_").replace(/[^a-z0-9]/gi, "")}.mp4`);
  const res = spawnSync(process.execPath, [cli, "burn", input, words, "-q", "-p", "classic", "-o", out, ...args], { encoding: "utf8" });
  assert.equal(res.status, 0, res.stderr);
  const frame = frameAt(out, 0.5);
  let lowest = -1;
  for (let i = 0; i < frame.length; i++) if (Math.abs(frame[i] - a[i]) > 40) lowest = Math.floor(i / 360);
  return lowest;
};
const plain = lowestCaptionRow([]);
const shorts = lowestCaptionRow(["--safe-area", "shorts"]);
const custom = lowestCaptionRow(["--safe-area", "0,0.5,0,0"]);
assert.ok(shorts < 640 * (1 - 0.35), `--safe-area shorts: captions reach row ${shorts} of 640`);
assert.ok(shorts < plain, `--safe-area shorts did not move captions up (${shorts} vs ${plain})`);
assert.ok(custom < 320, `--safe-area 0,0.5,0,0: captions reach row ${custom}`);
for (const bad of ["snapchat", "0.5,0.6,0,0", "1,2,3"]) {
  const res = spawnSync(process.execPath, [cli, "burn", input, words, "--safe-area", bad], { encoding: "utf8" });
  assert.equal(res.status, 1, `--safe-area ${bad} should fail`);
  assert.match(res.stderr, /--safe-area/);
}
console.log(`ok   --safe-area moves captions above the platform's interface (lowest row ${plain} → ${shorts})`);
// the Docker entrypoint is the CLI: no arguments prints help, no server starts
const entry = path.resolve(path.dirname(cli), "index.js");
const bare = spawnSync(process.execPath, [entry], { encoding: "utf8", timeout: 20000 });
assert.equal(bare.status, 0, bare.stderr);
assert.match(bare.stdout, /Usage[\s\S]*serve/);
assert.match(spawnSync(process.execPath, [entry, "presets"], { encoding: "utf8" }).stdout, /Karaoke/);
console.log("ok   the image entrypoint runs the CLI (no arguments: help)");

// `serve` starts the HTTP service on --port
{
  const port = 40000 + Math.floor(Math.random() * 20000);
  const { spawn } = await import("node:child_process");
  const server = spawn(process.execPath, [cli, "serve", "--port", String(port)], { stdio: "ignore" });
  try {
    let health;
    for (let i = 0; i < 50 && !health; i++) {
      await new Promise((r) => setTimeout(r, 100));
      health = await fetch(`http://127.0.0.1:${port}/health`).then((r) => r.json()).catch(() => undefined);
    }
    assert.equal(health?.status, "ok", "serve did not answer /health");
    const bad = await fetch(`http://127.0.0.1:${port}/render`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    assert.equal(bad.status, 400);
  } finally {
    server.kill();
  }
  console.log("ok   serve starts the HTTP service");
}
fs.rmSync(dir, { recursive: true, force: true });
