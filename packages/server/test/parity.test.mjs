// Browser vs server parity: renders every golden frame in headless Chromium
// (the browser overlay path: Konva on an HTML canvas) and compares it with the
// server render in test/golden/ (Konva on skia-canvas).
//
//   node test/parity.test.mjs                 report only
//   node test/parity.test.mjs --strict        also fail when a frame is over the limit
//   node test/parity.test.mjs --only Karaoke
//
// Both sides use the same font files (packages/server/assets/fonts), so the
// check measures the renderers, not font availability. Fonts are loaded per
// preset with a weight range, so Chromium never synthesizes bold or italic.
//
// Writes test/parity-out/report.md, report.json and, for every frame over the
// limit, the browser frame and a diff image.
//
// Needs Chromium: pnpm exec playwright install chromium (on Ubuntu releases
// newer than Playwright knows, set PLAYWRIGHT_HOST_PLATFORM_OVERRIDE=ubuntu24.04-x64).
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { createRequire } from "node:module";
import { chromium } from "playwright";
import { getPreset, presetNames } from "captions.js";
import { resolveFontFile } from "../dist/render/fonts.js";
import { BLOCK_TOLERANCE, compare } from "./compare.mjs";
import { PHRASE, SIZES, TIMES, slugify } from "./frames.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const baselineDir = path.join(here, "golden");
const outDir = path.join(here, "parity-out");

const { values } = parseArgs({
  options: { only: { type: "string" }, strict: { type: "boolean", default: false } },
});
const only = values.only?.split(",").map((s) => s.trim().toLowerCase());
const names = presetNames.filter((n) => !only || only.includes(n.toLowerCase()));
assert.ok(names.length > 0, "no presets selected");

// Files the page may load, served from disk through request interception.
const coreDist = path.dirname(createRequire(import.meta.url).resolve("captions.js"));
// konva's exports hide package.json: resolve its entry and walk up to the package root
const konvaEntry = createRequire(path.join(coreDist, "index.mjs")).resolve("konva");
const konvaDir = konvaEntry.slice(0, konvaEntry.lastIndexOf(`${path.sep}konva${path.sep}`) + 7);
const fontFiles = [];
const ORIGIN = "http://parity.test";

const page_html = `<!doctype html><html><head>
<script type="importmap">{ "imports": {
  "konva": "${ORIGIN}/konva/lib/index.js",
  "captions.js": "${ORIGIN}/core/index.mjs"
} }</script>
<style>html,body{margin:0;background:transparent}</style>
</head><body><div id="stage"></div>
<script type="module">
  import Konva from "konva";
  import { getPreset, renderFrame } from "captions.js";
  Konva.pixelRatio = 1;
  window.setFont = async ({ family, url, italic }) => {
    document.fonts.clear();
    const face = new FontFace(family, "url(" + url + ")", {
      weight: "1 1000",
      style: italic ? "italic" : "normal",
    });
    await face.load();
    document.fonts.add(face);
  };
  window.render = async ({ name, size, time, phrase }) => {
    const { captionsSettings } = getPreset(name);
    const [width, height] = size;
    const stage = new Konva.Stage({ container: "stage", width, height });
    const layer = new Konva.Layer({ listening: false });
    stage.add(layer);
    renderFrame(captionsSettings, undefined, phrase, time, size, layer, height / 480);
    layer.draw();
    const url = layer.getNativeCanvasElement().toDataURL("image/png");
    stage.destroy();
    return url.slice(url.indexOf(",") + 1);
  };
  window.ready = true;
</script></body></html>`;

const browser = await chromium.launch();
const context = await browser.newContext({ deviceScaleFactor: 1 });
const page = await context.newPage();
page.on("pageerror", (error) => console.error("page error:", error.message));
await page.route(`${ORIGIN}/**`, (route) => {
  const { pathname } = new URL(route.request().url());
  const serve = (file, contentType) =>
    route.fulfill({ body: fs.readFileSync(file), contentType, headers: { "access-control-allow-origin": "*" } });
  if (pathname === "/") return route.fulfill({ body: page_html, contentType: "text/html" });
  if (pathname.startsWith("/core/")) return serve(path.join(coreDist, pathname.slice(6)), "text/javascript");
  if (pathname.startsWith("/konva/")) return serve(path.join(konvaDir, pathname.slice(7)), "text/javascript");
  if (pathname.startsWith("/fonts/")) return serve(fontFiles[Number(pathname.slice(7))], "font/ttf");
  return route.fulfill({ status: 404 });
});
await page.goto(`${ORIGIN}/`);
await page.waitForFunction(() => window.ready === true);

const rows = [];
let over = 0;
fs.rmSync(outDir, { recursive: true, force: true });

for (const name of names) {
  const { captionsSettings } = getPreset(name);
  const { fontFamily, fontWeight, italic } = captionsSettings.style.font;
  const file = await resolveFontFile({ fontFamily, fontWeight, italic }, { download: false });
  fontFiles.push(file);
  await page.evaluate((font) => window.setFont(font), {
    family: fontFamily,
    url: `${ORIGIN}/fonts/${fontFiles.length - 1}`,
    italic: Boolean(italic),
  });

  const slug = slugify(name);
  const frames = [];
  for (const size of SIZES) {
    for (const time of TIMES) {
      const rel = `${size[0]}x${size[1]}/${slug}@${time.toFixed(2)}.png`;
      const b64 = await page.evaluate((args) => window.render(args), { name, size, time, phrase: PHRASE });
      const browserPng = Buffer.from(b64, "base64");
      const result = await compare(fs.readFileSync(path.join(baselineDir, rel)), browserPng);
      frames.push({ file: rel, ...result });
      if (result.failed) {
        const base = path.join(outDir, rel.replace(/\.png$/, ""));
        fs.mkdirSync(path.dirname(base), { recursive: true });
        fs.writeFileSync(`${base}.browser.png`, browserPng);
        if (result.diffPng) fs.writeFileSync(`${base}.diff.png`, result.diffPng);
      }
    }
  }
  const worst = Math.max(...frames.map((f) => f.worst));
  const failed = frames.filter((f) => f.failed);
  const changed = Math.max(...frames.map((f) => f.changedRatio));
  if (failed.length) over++;
  rows.push({
    preset: name,
    worstBlockDelta: Number(worst.toFixed(1)),
    maxChangedPixels: Number((changed * 100).toFixed(3)),
    framesOverLimit: failed.length,
    frames: frames.map(({ file, worst: w, badBlocks, changedRatio, failed: f }) => ({
      file,
      worstBlockDelta: Number(w.toFixed(1)),
      badBlocks,
      changedPixels: Number((changedRatio * 100).toFixed(3)),
      failed: f,
    })),
  });
  console.log(
    `${failed.length ? "FAIL" : "ok  "} ${name.padEnd(16)} worst block Δ ${worst.toFixed(1).padStart(5)}` +
      `   pixels off ≤ ${(changed * 100).toFixed(2)}%` +
      (failed.length ? `   ${failed.length} frame(s) over ${BLOCK_TOLERANCE}` : ""),
  );
}
await browser.close();

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "report.json"), JSON.stringify(rows, null, 1) + "\n");
const md = [
  `# Browser (Chromium) vs server (skia-canvas) parity`,
  ``,
  `Same preset, phrase, time, size and font files. Block = 8 px at 540 wide, 16 px at 1080.`,
  `A frame is over the limit when a block's average differs by more than ${BLOCK_TOLERANCE} (of 255).`,
  ``,
  `| Preset | Worst block Δ | Max pixels off (>2) | Frames over limit |`,
  `| --- | ---: | ---: | ---: |`,
  ...rows.map((r) => `| ${r.preset} | ${r.worstBlockDelta} | ${r.maxChangedPixels}% | ${r.framesOverLimit} / ${r.frames.length} |`),
  ``,
].join("\n");
fs.writeFileSync(path.join(outDir, "report.md"), md);
console.log(`\nreport: ${path.relative(process.cwd(), path.join(outDir, "report.md"))}`);
if (over) {
  console.log(`${over} preset(s) differ between browser and server beyond the limit`);
  if (values.strict) process.exit(1);
}
