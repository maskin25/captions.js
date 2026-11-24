// Golden frames: every built-in preset, rendered by the server path
// (Konva + skia-canvas), compared with checked-in PNGs.
// This is the safety net for the 2.0 engine work: any change to how a preset
// looks shows up here and has to be approved by regenerating the baselines.
//
//   node test/golden.test.mjs            compare against test/golden/
//   node test/golden.test.mjs --update   rewrite the baselines
//   node test/golden.test.mjs --only "Karaoke,Marker"
//
// Fonts come only from packages/server/assets/fonts (no download), so the
// result does not depend on the network or on ~/.cache.
// On a mismatch the actual frame and a diff image are written to
// test/golden-out/ for review.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import Konva from "konva";
import "konva/skia-backend";
import { Canvas, FontLibrary, loadImage } from "skia-canvas";
import { getPreset, presetNames, renderFrame } from "captions.js";
import { resolveFontFile } from "../dist/render/fonts.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const baselineDir = path.join(here, "golden");
const outDir = path.join(here, "golden-out");

const { values } = parseArgs({
  options: {
    update: { type: "boolean", default: false },
    only: { type: "string" },
  },
});

// Same reference phrase as the gallery previews (scripts/render-previews.mjs).
const PHRASE = [
  ["Same", 0.15, 0.4], ["captions", 0.4, 0.85], ["in", 0.85, 0.95], ["your", 0.95, 1.15],
  ["browser", 1.15, 1.6], ["preview", 1.6, 2.1], ["and", 2.35, 2.5], ["in", 2.5, 2.6],
  ["your", 2.6, 2.8], ["final", 2.8, 3.15], ["export", 3.15, 3.7], ["pixel", 3.85, 4.2],
  ["for", 4.2, 4.35], ["pixel", 4.35, 4.85],
].map(([word, startTime, endTime]) => ({ word, startTime, endTime }));

// Moments chosen to hit different states, not just settled frames:
// 0.20 entry animation of the first word, 0.62 mid-word, 1.55 late in a word
// (the poster moment), 2.40 just after a pause, 4.40 entry on the last screen.
const TIMES = [0.2, 0.62, 1.55, 2.4, 4.4];
const SIZES = [
  [540, 960],
  [1080, 1920],
];

// Skia rasterizes blur (shadows, glows) slightly differently per CPU, so the
// same commit gives frames that differ by up to ~40 per channel at glyph edges
// on another machine. Frames are therefore compared as averages over square
// blocks (8 px at 540 wide, scaled with the frame): a frame fails when any
// block's average differs by more than BLOCK_TOLERANCE in any channel.
// Measured on GitHub runners vs a local i5-14600K: cross-machine noise peaks
// at 19, while a real change (a highlight moving one word) starts at ~90.
// Changes smaller than this, such as a slight color shift, are not caught.
const BLOCK_SIZE_AT_540 = 8;
const BLOCK_TOLERANCE = 32;
// For the diff image only: a pixel is drawn red when a channel differs more.
const CHANNEL_TOLERANCE = 2;

const slugify = (name) =>
  name.toLowerCase().replace(/&/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const only = values.only?.split(",").map((s) => s.trim().toLowerCase());
const names = presetNames.filter((n) => !only || only.includes(n.toLowerCase()));
assert.ok(names.length > 0, "no presets selected");

const registered = new Set();
const registerFont = async ({ fontFamily, fontWeight, italic }) => {
  const file = await resolveFontFile({ fontFamily, fontWeight, italic }, { download: false });
  if (registered.has(file)) return;
  FontLibrary.use(fontFamily, [file]);
  registered.add(file);
};

const renderPng = async (captionsSettings, size, time) => {
  const [width, height] = size;
  const stage = new Konva.Stage({ width, height });
  const layer = new Konva.Layer({ listening: false });
  stage.add(layer);
  // Same scale rule as burnCaptions() and the browser overlay.
  renderFrame(captionsSettings, undefined, PHRASE, time, size, layer, height / 480);
  layer.draw();
  const png = await layer.getNativeCanvasElement().toBuffer("png");
  stage.destroy();
  return png;
};

const pixels = async (png) => {
  const img = await loadImage(png);
  const canvas = new Canvas(img.width, img.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  return { width: img.width, height: img.height, data: ctx.getImageData(0, 0, img.width, img.height).data };
};

const compare = async (expectedPng, actualPng) => {
  const a = await pixels(expectedPng);
  const b = await pixels(actualPng);
  if (a.width !== b.width || a.height !== b.height) {
    return { failed: true, diffPng: null, reason: `size ${a.width}x${a.height} vs ${b.width}x${b.height}` };
  }
  const { width, height } = a;

  // pass/fail: block averages
  const bs = Math.max(1, Math.round((BLOCK_SIZE_AT_540 * width) / 540));
  let worst = 0;
  let badBlocks = 0;
  for (let by = 0; by < height; by += bs) {
    for (let bx = 0; bx < width; bx += bs) {
      const sum = [0, 0, 0, 0];
      let n = 0;
      for (let y = by; y < Math.min(height, by + bs); y++) {
        for (let x = bx; x < Math.min(width, bx + bs); x++) {
          const i = (y * width + x) * 4;
          for (let c = 0; c < 4; c++) sum[c] += a.data[i + c] - b.data[i + c];
          n++;
        }
      }
      const delta = Math.max(...sum.map((v) => Math.abs(v) / n));
      if (delta > worst) worst = delta;
      if (delta > BLOCK_TOLERANCE) badBlocks++;
    }
  }

  // diff image for review: changed pixels in red over a faint expected frame
  const diff = new Canvas(width, height);
  const dctx = diff.getContext("2d");
  const out = dctx.createImageData(width, height);
  for (let i = 0; i < a.data.length; i += 4) {
    const delta = Math.max(
      Math.abs(a.data[i] - b.data[i]),
      Math.abs(a.data[i + 1] - b.data[i + 1]),
      Math.abs(a.data[i + 2] - b.data[i + 2]),
      Math.abs(a.data[i + 3] - b.data[i + 3]),
    );
    if (delta > CHANNEL_TOLERANCE) out.data.set([255, 0, 0, 255], i);
    else out.data.set([a.data[i] / 4, a.data[i + 1] / 4, a.data[i + 2] / 4, a.data[i + 3] / 4], i);
  }
  dctx.putImageData(out, 0, 0);
  const failed = badBlocks > 0;
  return {
    failed,
    diffPng: failed ? await diff.toBuffer("png") : null,
    reason: `${badBlocks} block(s) of ${bs}px differ (worst average delta ${worst.toFixed(1)}, limit ${BLOCK_TOLERANCE})`,
  };
};

let failures = 0;
let written = 0;
for (const name of names) {
  const { captionsSettings } = getPreset(name);
  await registerFont(captionsSettings.style.font);
  const slug = slugify(name);
  const results = [];

  for (const size of SIZES) {
    for (const time of TIMES) {
      const file = `${size[0]}x${size[1]}/${slug}@${time.toFixed(2)}.png`;
      const baseline = path.join(baselineDir, file);
      const actual = await renderPng(captionsSettings, size, time);

      if (values.update) {
        fs.mkdirSync(path.dirname(baseline), { recursive: true });
        fs.writeFileSync(baseline, actual);
        written++;
        continue;
      }
      if (!fs.existsSync(baseline)) {
        failures++;
        results.push(`missing ${file}`);
        continue;
      }
      const { failed, diffPng, reason } = await compare(fs.readFileSync(baseline), actual);
      if (failed) {
        failures++;
        results.push(`${file}: ${reason}`);
        const base = path.join(outDir, file.replace(/\.png$/, ""));
        fs.mkdirSync(path.dirname(base), { recursive: true });
        fs.writeFileSync(`${base}.actual.png`, actual);
        if (diffPng) fs.writeFileSync(`${base}.diff.png`, diffPng);
      }
    }
  }

  if (values.update) continue;
  if (results.length) {
    console.log(`FAIL ${name}`);
    for (const line of results) console.log(`     ${line}`);
  } else {
    console.log(`ok   ${name} (${SIZES.length * TIMES.length} frames)`);
  }
}

if (values.update) {
  console.log(`wrote ${written} baselines to ${path.relative(process.cwd(), baselineDir)}`);
} else if (failures) {
  console.log(`\n${failures} frame(s) differ. Actual and diff images: ${path.relative(process.cwd(), outDir)}`);
  console.log("If the change is intended, run: node test/golden.test.mjs --update");
  process.exit(1);
}
