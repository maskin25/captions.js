// Emphasis on screen: `expressiveness` 0 keeps today's look, higher values draw
// emphasized words larger on a shared baseline, and layout makes room.
// Run after building core: node test/emphasis.test.mjs
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import Konva from "konva";
import "konva/skia-backend";
import { FontLibrary } from "skia-canvas";
import { EMPHASIS_MAX_SCALE, getPreset, renderFrame } from "captions.js";
import { resolveFontFile } from "../dist/render/fonts.js";

const size = [540, 960];
const stage = new Konva.Stage({ width: size[0], height: size[1] });
const layer = new Konva.Layer();
stage.add(layer);

const words = (emphasis) =>
  [["We", 0, 0.3], ["raised", 0.3, 0.6], ["forty", 0.6, 0.9], ["million", 0.9, 1.3], ["dollars", 1.3, 1.7]].map(
    ([word, startTime, endTime], i) => ({ word, startTime, endTime, ...(i === 3 && emphasis ? { emphasis } : {}) }),
  );

const render = (settings, captions, time) => {
  layer.destroyChildren();
  renderFrame(settings, undefined, captions, time, size, layer, size[1] / 480);
  layer.draw();
};
const hash = async () => createHash("sha1").update(await layer.getNativeCanvasElement().toBuffer("raw")).digest("hex");
const node = (word) => layer.find("Text").find((t) => t.text().trim().toLowerCase() === word);
const linesOf = () =>
  layer.getChildren()[0].getChildren((n) => n.getClassName() === "Group")
    .map((line) => line.getChildren((n) => n.getClassName() === "Text").map((t) => t.text().trim()).join(" "));

for (const name of ["Classic", "Karaoke", "Marker", "Old Money"]) {
  const preset = getPreset(name).captionsSettings;
  const { fontFamily, fontWeight, italic } = preset.style.font;
  FontLibrary.use(fontFamily, [await resolveFontFile({ fontFamily, fontWeight, italic }, { download: false })]);
  const at = (expressiveness, extra = {}) => ({ ...preset, expressiveness, style: { ...preset.style, ...extra } });
  // a moment when "million" (0.9–1.3 s) is on screen but not being spoken
  const quietMoment = (settings, captions) => {
    const time = [...Array(34).keys()].map((i) => i * 0.05 + 0.02).find((at) => {
      if (at >= 0.9 && at <= 1.3) return false;
      render(settings, captions, at);
      return Boolean(node("million"));
    });
    assert.ok(time !== undefined, `${name}: "million" is only on screen while it is spoken`);
    render(settings, captions, time);
    return time;
  };
  const t = quietMoment(at(1), words(1));

  // expressiveness 0 (and no setting at all) looks exactly like no emphasis
  render(preset, words(), t);
  const plain = await hash();
  render(preset, words(1), t);
  assert.equal(await hash(), plain, `${name}: emphasis without expressiveness changed the frame`);
  render(at(0), words(1), t);
  assert.equal(await hash(), plain, `${name}: expressiveness 0 changed the frame`);

  // at 1 the emphasized word is EMPHASIS_MAX_SCALE larger (checked while it is
  // spoken, when it is always on screen), others keep their size
  const base = preset.style.font.fontSize * (size[1] / 480);
  const sizeAt = (expressiveness, emphasis) => {
    render(at(expressiveness), words(emphasis), 1.1);
    return node("million").fontSize();
  };
  assert.ok(Math.abs(sizeAt(1, 1) - base * EMPHASIS_MAX_SCALE) < 1e-6, `${name}: emphasized size`);
  assert.ok(Math.abs(sizeAt(0, 1) - base) < 1e-6, `${name}: plain size`);
  // strength is emphasis × expressiveness
  assert.ok(Math.abs(sizeAt(0.5, 1) - sizeAt(1, 0.5)) < 1e-6, `${name}: strength is emphasis × expressiveness`);

  // a shared baseline: smaller words on the emphasized word's line move down
  render(at(1), words(1), t);
  const big = node("million");
  const sameLine = big.parent.getChildren((n) => n.getClassName() === "Text").filter((t) => t !== big);
  assert.equal(big.y(), 0, `${name}: the largest word sits at the top of its line`);
  for (const t of sameLine) assert.ok(t.y() > 0, `${name}: "${t.text()}" is not lowered to the baseline`);

  // emphasisColor colors strongly emphasized words while they are not active
  render(at(1, { emphasisColor: "#ff00aa" }), words(1), t);
  assert.equal(node("million").fill(), "#ff00aa", `${name}: emphasisColor`);
  quietMoment(at(0.4, { emphasisColor: "#ff00aa" }), words(1));
  assert.notEqual(node("million").fill(), "#ff00aa", `${name}: emphasisColor below 0.5`);

  console.log(`ok   ${name.padEnd(10)} plain at 0, ${EMPHASIS_MAX_SCALE}x at 1 on one baseline; lines ${JSON.stringify(linesOf())}`);
}

// Focus Box: the box around an emphasized active word grows with it
{
  const preset = getPreset("Focus Box").captionsSettings;
  const { fontFamily, fontWeight, italic } = preset.style.font;
  FontLibrary.use(fontFamily, [await resolveFontFile({ fontFamily, fontWeight, italic }, { download: false })]);
  const boxHeight = (expressiveness) => {
    render({ ...preset, expressiveness }, words(1), 1.1);
    return layer.findOne("#box-word").height();
  };
  const plain = boxHeight(0);
  const loud = boxHeight(1);
  assert.ok(Math.abs(loud / plain - EMPHASIS_MAX_SCALE) < 0.05, `Focus Box: box ${plain} → ${loud}`);
  console.log(`ok   Focus Box box grows with the word (${plain.toFixed(0)} → ${loud.toFixed(0)} px)`);
}

// layout makes room: a wider emphasized word can push words to the next line
{
  const preset = getPreset("Old Money").captionsSettings;
  const long = "one two three four five six seven eight nine ten".split(" ").map((word, i) => ({
    word, startTime: i * 0.2, endTime: i * 0.2 + 0.2, ...(i < 3 ? { emphasis: 1 } : {}),
  }));
  render(preset, long, 0.1);
  const plainLines = linesOf();
  render({ ...preset, expressiveness: 1 }, long, 0.1);
  const loud = linesOf();
  assert.ok(loud[0].split(" ").length < plainLines[0].split(" ").length, `layout did not make room: ${loud} vs ${plainLines}`);
  console.log(`ok   layout makes room: ${JSON.stringify(plainLines)} → ${JSON.stringify(loud)}`);
}
