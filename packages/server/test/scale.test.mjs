// Presets look the same at every frame size: font size, strokes, shadows,
// line spacing, word gaps and effect sizes all grow with frameScale(height),
// so the browser preview (player size) matches the export (full size).
// Run after building core: node test/scale.test.mjs
import assert from "node:assert/strict";
import Konva from "konva";
import "../dist/render/skia.js"; // Konva on skia-canvas, CPU only (as in the CLI)
import { REFERENCE_HEIGHT, frameScale, getPreset, presetNames, renderFrame } from "captions.js";
import { PHRASE } from "./frames.mjs";

assert.equal(REFERENCE_HEIGHT, 480);
assert.equal(frameScale(1920), 4);
assert.equal(frameScale(0), 1);

/** Every drawn node's size-like properties, divided by the frame scale. */
const shapeAt = (settings, [width, height], time) => {
  const stage = new Konva.Stage({ width, height });
  const layer = new Konva.Layer();
  stage.add(layer);
  renderFrame({ settings, captions: PHRASE, time, size: [width, height], layer });
  const s = frameScale(height);
  const r = (v) => Math.round((v / s) * 100) / 100;
  const group = layer.getChildren()[0];
  // decoration copies may be more numerous on a bigger frame (Hard Extrude
  // steps its side by pixels); the words and plates must match
  const nodes = (group?.find((n) => n.getClassName() !== "Group" && !(n.getClassName() === "Text" && n.hasName("decoration"))) ?? []).map((n) => ({
    type: n.getClassName(),
    // Konva reports a default width on shapes without a stroke
    stroke: n.stroke?.() && n.strokeEnabled?.() !== false ? r(n.strokeWidth()) : 0,
    blur: r(n.shadowBlur?.() ?? 0),
    shadowY: r(n.shadowOffsetY?.() ?? 0),
    font: r(n.fontSize?.() ?? 0),
    radius: r(n.cornerRadius?.() ?? 0),
    ...(n.getClassName() === "Rect" ? { w: r(n.width()), h: r(n.height()) } : {}),
  }));
  const groupBox = group ? group.getClientRect({ skipShadow: true, skipStroke: true }) : { width: 0, height: 0 };
  stage.destroy();
  // the whole screen's size too: catches gaps and line spacing
  return { nodes, width: Math.round(groupBox.width / s), height: Math.round(groupBox.height / s) };
};

for (const name of presetNames) {
  const { captionsSettings } = getPreset(name);
  for (const time of [0.62, 1.55, 2.4]) {
    const small = shapeAt(captionsSettings, [540, 960], time);
    const big = shapeAt(captionsSettings, [1080, 1920], time);
    assert.equal(big.nodes.length, small.nodes.length, `${name} at ${time}s: different nodes`);
    big.nodes.forEach((node, i) => {
      for (const [key, value] of Object.entries(node)) {
        const other = small.nodes[i][key];
        const same = typeof value === "number" ? Math.abs(value - other) <= 0.1 : value === other;
        assert.ok(same, `${name} at ${time}s: ${node.type} ${key} is ${other} at 960 but ${value} at 1920 (in 480 units); it does not scale with the frame`);
      }
    });
    assert.ok(Math.abs(big.width - small.width) <= 2 && Math.abs(big.height - small.height) <= 2,
      `${name} at ${time}s: screen is ${small.width}x${small.height} at 960 but ${big.width}x${big.height} at 1920 (in 480 units)`);
  }
  console.log(`ok   ${name.padEnd(16)} same shape at 960 and 1920 tall`);
}
