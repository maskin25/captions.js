// Layout: every preset must break the same words into the same screens and
// lines at any output size (the browser preview runs at the player's size, the
// export at full size), and no line may run off the frame.
// The browser side of the same check is in parity.test.mjs (needs Chromium).
// Run after building core: node test/layout.test.mjs
import assert from "node:assert/strict";
import Konva from "konva";
import "konva/skia-backend";
import { FontLibrary } from "skia-canvas";
import { getPreset, presetNames, renderFrame } from "captions.js";
import { resolveFontFile } from "../dist/render/fonts.js";
import { LAYOUT_SAMPLE, layoutScreens } from "./frames.mjs";

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

  const [reference, ...others] = SIZES.map((size) =>
    layoutScreens({ Konva, renderFrame, captionsSettings, captions: LAYOUT_SAMPLE, size }),
  );
  others.forEach((screens, i) =>
    assert.deepEqual(screens, reference, `${name}: ${SIZES[i + 1].join("x")} breaks lines differently from ${SIZES[0].join("x")}`),
  );

  // widest line, as drawn, stays inside the frame
  const [width, height] = [1080, 1920];
  const stage = new Konva.Stage({ width, height });
  let widest = 0;
  for (const caption of LAYOUT_SAMPLE) {
    const layer = new Konva.Layer();
    stage.add(layer);
    renderFrame(captionsSettings, undefined, LAYOUT_SAMPLE, caption.startTime + 0.01, [width, height], layer, height / 480);
    const group = layer.getChildren()[0];
    for (const line of group?.getChildren((node) => node.getClassName() === "Group") ?? []) {
      const texts = line.getChildren((node) => node.getClassName() === "Text");
      if (texts.length < 2) continue; // a single word longer than the frame cannot be helped
      const right = Math.max(...texts.map((t) => t.x() + t.width()));
      widest = Math.max(widest, right);
    }
    layer.destroy();
  }
  stage.destroy();
  assert.ok(widest <= width, `${name}: a line is ${widest.toFixed(0)} px wide in a ${width} px frame`);
  console.log(`ok   ${name.padEnd(16)} ${reference.length} screens, same at ${SIZES.map((s) => s.join("x")).join(", ")}; widest line ${(widest / width * 100).toFixed(0)}% of the frame`);
}
