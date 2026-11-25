// The built example under `next start`: the page prerenders on the server,
// hydrates without errors, and draws one caption overlay. Run with `pnpm test`.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const dir = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3000 + Math.floor(Math.random() * 1000) + 4000;
const server = spawn(process.execPath, [path.join(dir, "node_modules/next/dist/bin/next"), "start", "-p", String(PORT)], { cwd: dir, stdio: "pipe" });
const url = `http://127.0.0.1:${PORT}/`;

try {
  let html = "";
  for (let i = 0; i < 100 && !html; i++) {
    html = await fetch(url).then((r) => r.text(), () => "");
    if (!html) await new Promise((r) => setTimeout(r, 200));
  }
  assert.match(html, /<video[^>]+sample\.webm/, "the server-rendered page has the video");
  assert.doesNotMatch(html, /konvajs-content/, "the overlay is not rendered on the server");
  console.log("ok   server render");

  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto(url);
  await page.waitForSelector(".konvajs-content", { timeout: 15000 });
  await page.evaluate(async () => {
    const video = document.querySelector("video");
    await video.play();
    await new Promise((r) => setTimeout(r, 1200));
    video.pause();
  });
  await page.waitForTimeout(300);
  assert.equal(await page.locator(".konvajs-content").count(), 1, "expected exactly one overlay");
  const ink = await page.evaluate(() => {
    const canvas = document.querySelector(".konvajs-content canvas");
    const { data } = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height);
    let n = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] > 0) n++;
    return n;
  });
  assert.ok(ink > 500, "no captions drawn");
  assert.deepEqual(errors.filter((e) => !/fonts\.(googleapis|gstatic)/.test(e)), [], "errors in the page (hydration?)");
  console.log("ok   hydrates, one overlay, captions drawn");
  await browser.close();
} finally {
  server.kill();
}
