// Layout: every preset must break the same words into the same screens and
// lines at any output size (the browser preview runs at the player's size, the
// export at full size), and no line may run off the frame: a word wider than
// the line shrinks to fit.
// The browser side of the same check is in parity.test.mjs (needs Chromium).
// Run after building core: node test/layout.test.mjs
import assert from "node:assert/strict";
import Konva from "konva";
import "../dist/render/skia.js"; // Konva on skia-canvas, CPU only (as in the CLI)
import { FontLibrary } from "skia-canvas";
import { getEffect, getPreset, presetNames, registerEffect, renderFrame } from "captions.js";
import { resolveFontFile } from "../dist/render/fonts.js";
import { EMPHASIS_SAMPLE, LAYOUT_SAMPLE, layoutScreens } from "./frames.mjs";

const SIZES = [[360, 640], [540, 960], [1080, 1920]];
const registered = new Set();

for (const name of presetNames) {
  const { captionsSettings } = getPreset(name);
  const { fontFamily, fontWeight, italic } = captionsSettings.style.font;
  const file = await resolveFontFile({ fontFamily, fontWeight, italic }, { download: false });
  if (!registered.has(file)) {
    FontLibrary.use(fontFamily, [file]);
    registered.add(file);
  }

  const layoutAt = (settings, captions) => {
    const [reference, ...others] = SIZES.map((size) =>
      layoutScreens({ Konva, renderFrame, getEffect, registerEffect, captionsSettings: settings, captions, size }),
    );
    others.forEach((screens, i) =>
      assert.deepEqual(screens, reference, `${name}: ${SIZES[i + 1].join("x")} breaks lines differently from ${SIZES[0].join("x")}`),
    );
    return reference;
  };
  const reference = layoutAt(captionsSettings, LAYOUT_SAMPLE);
  // emphasized words are wider at expressiveness 1; still the same everywhere
  const loud = { ...captionsSettings, expressiveness: 1 };
  layoutAt(loud, EMPHASIS_SAMPLE);

  // widest line, as drawn, stays inside the frame once each word's entrance
  // has played (Slam slides words in from off-frame on purpose)
  const [width, height] = [1080, 1920];
  const stage = new Konva.Stage({ width, height });
  let widest = -Infinity;
  for (const [settings, captions] of [[captionsSettings, LAYOUT_SAMPLE], [loud, EMPHASIS_SAMPLE]]) for (const caption of captions) {
    const layer = new Konva.Layer();
    stage.add(layer);
    renderFrame(settings, undefined, captions, Math.max(caption.startTime + 0.01, caption.endTime - 0.01), [width, height], layer, height / 480);
    const group = layer.getChildren()[0];
    for (const text of (group?.find("Text") ?? []).filter((t) => !t.hasName("decoration") && t.opacity() > 0)) {
      // where the word is drawn on the frame, including animation scale
      const rect = text.getClientRect({ skipShadow: true, skipStroke: true });
      widest = Math.max(widest, rect.x + rect.width - width, -rect.x);
    }
    layer.destroy();
  }
  stage.destroy();
  assert.ok(widest <= 0, `${name}: a word reaches ${widest.toFixed(0)} px past the edge of a ${width} px frame`);
  console.log(`ok   ${name.padEnd(16)} ${reference.length} screens, same at ${SIZES.map((s) => s.join("x")).join(", ")}, also emphasized; closest to the edge: ${(-widest).toFixed(0)} px`);
}
