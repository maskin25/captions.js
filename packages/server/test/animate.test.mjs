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

// screens break at sentence ends, speaker changes and pauses, even when the
// transcript has no sentence times (Whisper, SRT, plain word lists)
{
  const { captionsSettings } = getPreset("Classic");
  const words = (list) => list.map(([word, startTime, endTime, speaker]) => ({ word, startTime, endTime, speaker }));
  const onScreen = (list, time) => {
    layer.destroyChildren();
    renderFrame(captionsSettings, undefined, list, time, size, layer, 0.5);
    return layer.find("Text").map((t) => t.text().trim().toLowerCase());
  };
  const sentence = words([["Yeah.", 0, 0.3], ["And", 0.3, 0.5], ["that", 0.5, 0.7], ["way.", 0.7, 1], ["I", 1, 1.1], ["mean", 1.1, 1.3]]);
  assert.deepEqual(onScreen(sentence, 0.6), ["and", "that", "way."]);
  assert.deepEqual(onScreen(sentence, 1.2), ["i", "mean"]);

  const abbreviations = words([["Talk", 0, 0.3], ["to", 0.3, 0.4], ["Dr.", 0.4, 0.6], ["Smith", 0.6, 1]]);
  assert.deepEqual(onScreen(abbreviations, 0.8), ["talk", "to", "dr.", "smith"]);

  const pause = words([["before", 0, 0.5], ["the", 0.5, 0.6], ["pause", 0.6, 1], ["after", 1.7, 2]]);
  assert.deepEqual(onScreen(pause, 1.8), ["after"]);
  // the finished screen stays up through a short silence, then clears
  assert.deepEqual(onScreen(pause, 1.3), ["before", "the", "pause"]);
  const longPause = words([["gone", 0, 0.5], ["later", 3, 3.5]]);
  assert.deepEqual(onScreen(longPause, 2), []);
  const shortGap = words([["no", 0, 0.5], ["real", 0.8, 1], ["pause", 1.1, 1.5]]);
  assert.deepEqual(onScreen(shortGap, 1.2), ["no", "real", "pause"]);

  const speakers = words([["hi", 0, 0.3, 0], ["there", 0.3, 0.6, 0], ["hello", 0.6, 1, 1]]);
  assert.deepEqual(onScreen(speakers, 0.8), ["hello"]);
  console.log("ok   screens break at sentence ends, pauses and speaker changes");
}
