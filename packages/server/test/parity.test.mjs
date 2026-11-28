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
// Also checks layout exactly: LAYOUT_SAMPLE (English and Russian) must break
// into the same screens and lines in Chromium at 360x640, 540x960 and
// 1080x1920 as on the server at 540x960 and 1080x1920. A layout mismatch always
// fails the run. The check runs twice: plain, and with every fifth word
// emphasized at expressiveness 1. Words the preset font has no glyphs for (Cyrillic in Kanit,
// Lato, Poppins, Permanent Marker) are left out: each engine draws them in its
// own fallback font, so neither widths nor glyphs can match.
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
import Konva from "konva";
import "../dist/render/skia.js"; // Konva on skia-canvas, CPU only (as in the CLI)
import { FontLibrary } from "skia-canvas";
import { getEffect, getPreset, presetNames, registerEffect, renderFrame } from "captions.js";
import { resolveFontFile } from "../dist/render/fonts.js";
import { fontCovers } from "./cmap.mjs";
import { BLOCK_TOLERANCE, compare } from "./compare.mjs";
import { EMPHASIS_SAMPLE, LAYOUT_SAMPLE, PHRASE, SIZES, TIMES, layoutScreens, slugify } from "./frames.mjs";

// Layout is checked against the server at 1080x1920.
const LAYOUT_BROWSER_SIZES = [[360, 640], [540, 960], [1080, 1920]];
const LAYOUT_SERVER_SIZES = [[540, 960]];

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
  import { getEffect, getPreset, registerEffect, renderFrame } from "captions.js";
  import { layoutScreens } from "${ORIGIN}/frames.mjs";
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
    renderFrame({ settings: captionsSettings, captions: phrase, time, size, layer });
    layer.draw();
    const url = layer.getNativeCanvasElement().toDataURL("image/png");
    stage.destroy();
    return url.slice(url.indexOf(",") + 1);
  };
  window.layout = ({ name, size, captions, expressiveness }) =>
    layoutScreens({ Konva, renderFrame, getEffect, registerEffect, captionsSettings: { ...getPreset(name).captionsSettings, expressiveness }, captions, size });
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
  if (pathname === "/frames.mjs") return serve(path.join(here, "frames.mjs"), "text/javascript");
  if (pathname.startsWith("/core/")) return serve(path.join(coreDist, pathname.slice(6)), "text/javascript");
  if (pathname.startsWith("/konva/")) return serve(path.join(konvaDir, pathname.slice(7)), "text/javascript");
  if (pathname.startsWith("/fonts/")) return serve(fontFiles[Number(pathname.slice(7))], "font/ttf");
  return route.fulfill({ status: 404 });
});
await page.goto(`${ORIGIN}/`);
await page.waitForFunction(() => window.ready === true);

const rows = [];
let over = 0;
const layoutMismatches = [];
const registered = new Set();
fs.rmSync(outDir, { recursive: true, force: true });

for (const name of names) {
  const { captionsSettings } = getPreset(name);
  const { fontFamily, fontWeight, italic } = captionsSettings.style.font;
  const file = await resolveFontFile({ fontFamily, fontWeight, italic }, { download: false });
  fontFiles.push(file);
  if (!registered.has(file)) {
    FontLibrary.use(fontFamily, [file]);
    registered.add(file);
  }
  await page.evaluate((font) => window.setFont(font), {
    family: fontFamily,
    url: `${ORIGIN}/fonts/${fontFiles.length - 1}`,
    italic: Boolean(italic),
  });

  // exact layout: same screens and lines everywhere
  let layoutOk = true;
  let reference = [];
  const covered = (list) => list.filter(({ word }) => fontCovers(file, word));
  const sample = covered(LAYOUT_SAMPLE);
  for (const [captions, expressiveness, label] of [
    [sample, 0, ""],
    [covered(EMPHASIS_SAMPLE), 1, ", emphasized"],
  ]) {
    const settings = { ...captionsSettings, expressiveness };
    const layoutAt = (size) => layoutScreens({ Konva, renderFrame, getEffect, registerEffect, captionsSettings: settings, captions, size });
    const serverReference = layoutAt([1080, 1920]);
    if (!label) reference = serverReference;
    const candidates = [
      ...LAYOUT_SERVER_SIZES.map((size) => [`server ${size.join("x")}${label}`, layoutAt(size)]),
      ...(await Promise.all(
        LAYOUT_BROWSER_SIZES.map(async (size) => [
          `browser ${size.join("x")}${label}`,
          await page.evaluate((args) => window.layout(args), { name, size, captions, expressiveness }),
        ]),
      )),
    ];
    for (const [where, screens] of candidates) {
      const at = screens.findIndex((screen, i) => screen !== serverReference[i]);
      if (at !== -1 || screens.length !== serverReference.length) {
        layoutOk = false;
        const i = at === -1 ? Math.min(screens.length, serverReference.length) : at;
        layoutMismatches.push(`${name}, ${where}: "${screens[i]}" vs server 1080x1920 "${serverReference[i]}"`);
      }
    }
  }

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
    layoutScreens: reference.length,
    layoutWords: sample.length,
    layoutMatches: layoutOk,
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
      (failed.length ? `   ${failed.length} frame(s) over ${BLOCK_TOLERANCE}` : "") +
      (layoutOk ? "" : "   LAYOUT DIFFERS"),
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
  `Layout: the ${LAYOUT_SAMPLE.length}-word sample must give the same screens and lines in Chromium at`,
  `${LAYOUT_BROWSER_SIZES.map((s) => s.join("x")).join(", ")} and on the server at ${[...LAYOUT_SERVER_SIZES, [1080, 1920]].map((s) => s.join("x")).join(", ")}.`,
  ``,
  `| Preset | Layout (screens) | Worst block Δ | Max pixels off (>2) | Frames over limit |`,
  `| --- | --- | ---: | ---: | ---: |`,
  ...rows.map((r) => `| ${r.preset} | ${r.layoutMatches ? "same" : "**differs**"} (${r.layoutScreens} screens${r.layoutWords < LAYOUT_SAMPLE.length ? ", no Cyrillic in font" : ""}) | ${r.worstBlockDelta} | ${r.maxChangedPixels}% | ${r.framesOverLimit} / ${r.frames.length} |`),
  ``,
].join("\n");
fs.writeFileSync(path.join(outDir, "report.md"), md);
console.log(`\nreport: ${path.relative(process.cwd(), path.join(outDir, "report.md"))}`);
if (layoutMismatches.length) {
  console.log(`\nLayout differs in ${layoutMismatches.length} case(s):`);
  for (const line of layoutMismatches) console.log(`  ${line}`);
  process.exitCode = 1;
}
if (over) {
  console.log(`${over} preset(s) differ between browser and server beyond the limit`);
  if (values.strict) process.exit(1);
}
