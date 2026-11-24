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
import { FontLibrary } from "skia-canvas";
import { getPreset, presetNames, renderFrame } from "captions.js";
import { resolveFontFile } from "../dist/render/fonts.js";
import { compare } from "./compare.mjs";
import { PHRASE, SIZES, TIMES, slugify } from "./frames.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const baselineDir = path.join(here, "golden");
const outDir = path.join(here, "golden-out");

const { values } = parseArgs({
  options: {
    update: { type: "boolean", default: false },
    only: { type: "string" },
  },
});

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
