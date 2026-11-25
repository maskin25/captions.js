// The built example in headless Chromium, under React StrictMode:
// one overlay, captions drawn while playing, a style change redraws,
// hiding the component removes the overlay. Run with `pnpm test`.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), "dist");
const ORIGIN = "http://example.test";
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".webm": "video/webm", ".svg": "image/svg+xml" };

const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
await page.route(`${ORIGIN}/**`, (route) => {
  const { pathname } = new URL(route.request().url());
  const file = path.join(dist, pathname === "/" ? "index.html" : pathname);
  if (!file.startsWith(dist) || !fs.existsSync(file)) return route.fulfill({ status: 404 });
  return route.fulfill({ body: fs.readFileSync(file), contentType: types[path.extname(file)] ?? "application/octet-stream" });
});
// Google Fonts load from the network when reachable; the test does not depend on them.

await page.goto(`${ORIGIN}/`);
await page.waitForSelector(".konvajs-content", { timeout: 15000 });
await page.waitForTimeout(500);
assert.equal(await page.locator(".konvajs-content").count(), 1, "StrictMode left more than one overlay");
console.log("ok   one overlay under StrictMode");

// ink = number of non-transparent pixels on the overlay canvas
const ink = () => page.evaluate(() => {
  const canvas = document.querySelector(".konvajs-content canvas");
  const { data } = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height);
  let n = 0;
  for (let i = 3; i < data.length; i += 4) if (data[i] > 0) n++;
  return n;
});
const frame = () => page.evaluate(() => document.querySelector(".konvajs-content canvas").toDataURL());

await page.evaluate(async () => {
  const video = document.querySelector("video");
  await video.play();
  await new Promise((r) => setTimeout(r, 1200));
  video.pause();
});
await page.waitForTimeout(300);
assert.ok((await ink()) > 500, "no captions drawn while playing");
console.log("ok   captions drawn during playback");

const before = await frame();
await page.selectOption("select", "Focus Box");
await page.waitForTimeout(800);
assert.notEqual(await frame(), before, "changing the style did not redraw");
console.log("ok   changing the style redraws while paused");

await page.click("button");
await page.waitForTimeout(200);
assert.equal(await page.locator(".konvajs-content").count(), 0, "hiding left the overlay");
await page.click("button");
await page.waitForSelector(".konvajs-content");
await page.waitForTimeout(200);
assert.equal(await page.locator(".konvajs-content").count(), 1, "showing again did not add exactly one overlay");
console.log("ok   unmount removes the overlay, mount adds one");

assert.deepEqual(errors.filter((e) => !/fonts\.(googleapis|gstatic)/.test(e)), [], "errors in the page");
await browser.close();
