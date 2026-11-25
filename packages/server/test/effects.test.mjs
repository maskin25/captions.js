// Effects: what an effect sees, custom effects, and per-effect options.
// Run after building core: node test/effects.test.mjs
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import Konva from "konva";
import "konva/skia-backend";
import { getPreset, registerEffect, renderFrame } from "captions.js";

const size = [540, 960];
const stage = new Konva.Stage({ width: size[0], height: size[1] });
const layer = new Konva.Layer();
stage.add(layer);
const captions = ["one", "two", "three", "four"].map((word, i) => ({ word, startTime: i, endTime: i + 0.9 }));
const render = (settings, time) => {
  layer.destroyChildren();
  renderFrame(settings, undefined, captions, time, size, layer, size[1] / 480);
  layer.draw();
};
const hash = async () => createHash("sha1").update(await layer.getNativeCanvasElement().toBuffer("raw")).digest("hex");
const classic = getPreset("Classic").captionsSettings;

// the context: every word with its state, line, progress and elapsed time
{
  let seen;
  registerEffect("spy", { apply: (context) => (seen = context) });
  render({ ...classic, animation: "spy" }, 1.45);
  assert.deepEqual(seen.words.map((w) => w.state), ["past", "active", "future", "future"]);
  assert.deepEqual(seen.words.map((w) => w.index), [0, 1, 2, 3]);
  assert.equal(seen.active.caption.word, "two");
  assert.ok(Math.abs(seen.active.elapsed - 0.45) < 1e-9);
  assert.ok(Math.abs(seen.words[1].progress - 0.5) < 1e-9);
  assert.equal(seen.words[0].progress, 1);
  assert.equal(seen.words[3].progress, 0);
  assert.ok(seen.words[3].elapsed < 0);
  assert.equal(seen.lines.length, Math.max(...seen.words.map((w) => w.line)) + 1);
  assert.ok(seen.words.every((w) => w.text.getClassName() === "Text"));
  assert.ok(seen.width > 0 && seen.height > 0 && seen.scale === 2);
  assert.deepEqual(seen.options, {});
  console.log("ok   effects see every word with state, line, progress and time");
}

// a custom effect that uses all words: future words fade
{
  registerEffect("fade-future", {
    apply: ({ words }) => words.forEach((w) => w.state === "future" && w.text.opacity(0.3)),
  });
  render(classic, 1.45);
  const plain = await hash();
  render({ ...classic, animation: "fade-future" }, 1.45);
  assert.notEqual(await hash(), plain);
  assert.ok(layer.find("Text").filter((t) => t.opacity() === 0.3).length === 2);
  console.log("ok   registerEffect adds an effect that animation can name");
}

// options: defaults equal today's look; a changed option changes the frame
{
  const karaoke = getPreset("Karaoke").captionsSettings; // bounce
  render(karaoke, 1.45);
  const plain = await hash();
  render({ ...karaoke, animationOptions: { bounceScale: 0.3, bounceAttack: 0.15 } }, 1.45);
  assert.equal(await hash(), plain, "explicit defaults changed the frame");
  render({ ...karaoke, animationOptions: { bounceScale: 0.6 } }, 1.45);
  assert.notEqual(await hash(), plain, "bounceScale had no effect");
  render({ ...karaoke, animationOptions: { bounceScale: "big" } }, 1.45);
  assert.equal(await hash(), plain, "a non-number option is not ignored");
  console.log("ok   animationOptions: defaults keep the look, values change it");
}

// unknown effect names draw the words without animation
{
  render({ ...classic, animation: "no-such-effect" }, 1.45);
  const unknown = await hash();
  render({ ...classic, animation: "none" }, 1.45);
  assert.equal(unknown, await hash());
  assert.throws(() => registerEffect("", { apply() {} }), /needs a name/);
  console.log("ok   unknown animation names fall back to none");
}
