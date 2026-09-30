// Frame-level check that word animations actually animate: renders the same
// preset at several moments inside one word and asserts the pixels differ,
// then settle once the entry animation is over.
// Run after building core: node test/animate.test.mjs
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import Konva from "konva";
import "konva/skia-backend";
import { getPreset, renderFrame } from "captions.js";

const size = [540, 960];
const captions = [
  { word: "Hello", startTime: 0, endTime: 1 },
  { word: "animated", startTime: 1, endTime: 2 },
  { word: "world", startTime: 2, endTime: 3 },
];

const stage = new Konva.Stage({ width: size[0], height: size[1] });
const layer = new Konva.Layer();
stage.add(layer);

const frameHash = async (settings, time) => {
  layer.destroyChildren();
  renderFrame(settings, undefined, captions, time, size, layer, 0.5);
  layer.draw();
  const buf = await layer.getNativeCanvasElement().toBuffer("raw");
  return createHash("sha1").update(buf).digest("hex");
};

for (const [presetName, animation] of [
  ["Karaoke", "bounce"],
  ["Marker", "underline"],
]) {
  const { captionsSettings } = getPreset(presetName);
  assert.equal(captionsSettings.animation, animation);
  // word "animated" starts at t=1
  const start = await frameHash(captionsSettings, 1.0);
  const mid = await frameHash(captionsSettings, 1.05);
  const settledA = await frameHash(captionsSettings, 1.5);
  const settledB = await frameHash(captionsSettings, 1.9);
  assert.notEqual(start, mid, `${presetName}: frame at word start == 50ms later`);
  assert.notEqual(mid, settledA, `${presetName}: animation never reaches its end state`);
  assert.equal(settledA, settledB, `${presetName}: should hold still after the entry animation`);
  console.log(`ok   ${presetName} (${animation}) animates`);
}

// zero-length words must not produce NaN transforms
{
  const { captionsSettings } = getPreset("Karaoke");
  layer.destroyChildren();
  renderFrame(captionsSettings, undefined, [{ word: "x", startTime: 1, endTime: 1 }], 1, size, layer, 0.5);
  const texts = layer.find("Text");
  assert.ok(texts.length > 0);
  for (const t of texts) assert.ok(Number.isFinite(t.scaleX()), "scale is NaN");
  console.log("ok   zero-length word renders");
}
