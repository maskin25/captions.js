// Browser overlay: captionsjs() over a playing <video> in headless Chromium.
// Checks that captions follow playback through requestVideoFrameCallback (at
// the video's frame times), that edits while paused still redraw, and that
// disable() stops all work. Needs Chromium, like parity.test.mjs:
//   node test/overlay.test.mjs
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { chromium } from "playwright";

const ORIGIN = "http://overlay.test";
const coreDist = path.dirname(createRequire(import.meta.url).resolve("captions.js"));
const konvaEntry = createRequire(path.join(coreDist, "index.mjs")).resolve("konva");
const konvaDir = konvaEntry.slice(0, konvaEntry.lastIndexOf(`${path.sep}konva${path.sep}`) + 7);

// 3 s of 25 fps VP9: Playwright's Chromium has no H.264
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "captionsjs-overlay-"));
const video = path.join(dir, "clip.webm");
execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-f", "lavfi", "-i", "color=c=gray:s=360x640:d=3:r=25",
  "-c:v", "libvpx-vp9", "-deadline", "realtime", "-b:v", "200k", video]);

const html = `<!doctype html><html><head>
<script type="importmap">{ "imports": {
  "konva": "${ORIGIN}/konva/lib/index.js",
  "captions.js": "${ORIGIN}/core/index.mjs"
} }</script></head><body style="margin:0">
<div style="position:relative;width:360px;height:640px">
  <video id="v" src="${ORIGIN}/clip.webm" muted playsinline style="width:360px;height:640px"></video>
</div>
<script type="module">
  import captionsjs, { getPreset } from "captions.js";
  const video = document.getElementById("v");
  const words = ["one", "two", "three", "four", "five", "six"].map((word, i) => ({ word, startTime: i * 0.5, endTime: i * 0.5 + 0.45 }));
  const times = [];
  const real = video.requestVideoFrameCallback.bind(video);
  // record the media times the overlay renders at
  window.vfcCalls = 0;
  video.requestVideoFrameCallback = (cb) => real((now, meta) => { window.vfcCalls++; cb(now, meta); });
  await new Promise((r) => video.readyState >= 1 ? r() : video.addEventListener("loadedmetadata", r, { once: true }));
  window.instance = captionsjs({ video, preset: getPreset("Karaoke"), captions: words });
  window.video = video;
  window.getPreset = getPreset;
  window.ready = true;
</script></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage();
page.on("pageerror", (e) => console.error("page error:", e.message));
await page.route(`${ORIGIN}/**`, (route) => {
  const { pathname } = new URL(route.request().url());
  const serve = (file, contentType) => route.fulfill({ body: fs.readFileSync(file), contentType });
  if (pathname === "/") return route.fulfill({ body: html, contentType: "text/html" });
  if (pathname === "/clip.webm") return serve(video, "video/webm");
  if (pathname.startsWith("/core/")) return serve(path.join(coreDist, pathname.slice(6)), "text/javascript");
  if (pathname.startsWith("/konva/")) return serve(path.join(konvaDir, pathname.slice(7)), "text/javascript");
  return route.fulfill({ status: 404 });
});
await page.goto(`${ORIGIN}/`);
await page.waitForFunction(() => window.ready === true, null, { timeout: 15000 });

// paused at 0: renders once (again when fonts arrive), then stays flat
const counts = [];
for (let i = 0; i < 12; i++) {
  counts.push(await page.evaluate(() => window.instance.getRenderCount()));
  await page.waitForTimeout(100);
}
// fonts load asynchronously and trigger one more render; wait until it settles
assert.equal(counts.at(-1), counts.at(-4), `still rendering while paused: ${counts.join(" ")}`);
const pausedCount = await page.evaluate(() => window.instance.getRenderCount());
await page.waitForTimeout(300);
assert.equal(await page.evaluate(() => window.instance.getRenderCount()), pausedCount, "renders while paused and unchanged");

// playing: video frames drive the overlay
await page.evaluate(() => window.video.play());
await page.waitForTimeout(1500);
const playing = await page.evaluate(() => ({ renders: window.instance.getRenderCount(), vfc: window.vfcCalls, t: window.video.currentTime }));
assert.ok(playing.vfc > 10, `requestVideoFrameCallback not used (${playing.vfc} calls)`);
// at most one render per video frame (25 fps), not one per display frame
assert.ok(playing.renders - pausedCount <= Math.ceil(playing.t * 25) + 3, `too many renders: ${playing.renders} for ${playing.t.toFixed(2)} s`);
assert.ok(playing.renders - pausedCount >= 10, `too few renders while playing: ${playing.renders}`);
console.log(`ok   playback: ${playing.vfc} video frames, ${playing.renders - pausedCount} renders in ${playing.t.toFixed(2)} s`);

// paused: an edit still redraws
await page.evaluate(() => window.video.pause());
await page.waitForTimeout(200);
const before = await page.evaluate(() => window.instance.getRenderCount());
await page.evaluate(() => window.instance.preset(window.getPreset("Focus Box")));
await page.waitForTimeout(200);
assert.ok((await page.evaluate(() => window.instance.getRenderCount())) > before, "a preset change while paused did not redraw");
console.log("ok   paused: an edit redraws");

// disable(): no more renders
await page.evaluate(() => { window.instance.disable(); window.video.play(); });
const stopped = await page.evaluate(() => window.instance.getRenderCount());
await page.waitForTimeout(400);
assert.equal(await page.evaluate(() => window.instance.getRenderCount()), stopped, "renders after disable()");
console.log("ok   disable() stops rendering");

await browser.close();
fs.rmSync(dir, { recursive: true, force: true });
