// Effects: what an effect sees, custom effects, and per-effect options.
// Run after building core: node test/effects.test.mjs
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import Konva from "konva";
import "../dist/render/skia.js"; // Konva on skia-canvas, CPU only (as in the CLI)
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

// renderFrame: the options object and the deprecated positional form draw the
// same frame; the options form defaults scale to height / 480
{
  const karaoke = getPreset("Karaoke").captionsSettings;
  render(karaoke, 1.45);
  const positional = await hash();
  layer.destroyChildren();
  renderFrame({ settings: karaoke, captions, time: 1.45, size, layer });
  layer.draw();
  assert.equal(await hash(), positional);
  console.log("ok   renderFrame options object matches the positional form");
}

// 2.0 styles: behaviour that a golden frame would not explain
{
  const words = () => layer.find("Text").filter((t) => !t.hasName("decoration"));
  const decorations = () => layer.find("Text").filter((t) => t.hasName("decoration"));
  const byWord = (w) => words().find((t) => t.text().trim().toLowerCase() === w);

  // Spring Pop: unspoken words are hidden; the spring overshoots, then settles
  const springPop = getPreset("Spring Pop").captionsSettings;
  render(springPop, 1.1);
  assert.equal(byWord("three").opacity(), 0, "a future word is visible");
  assert.equal(byWord("one").scaleX(), 1, "a settled word is not at scale 1");
  const scales = [1.05, 1.15, 1.25, 1.4, 2.5].map((t) => (render(springPop, t), byWord("two").scaleX()));
  assert.ok(Math.max(...scales) > 1.04, `no overshoot: ${scales}`);
  assert.ok(Math.abs(scales.at(-1) - 1) < 0.01, `does not settle: ${scales}`);

  // Highlight Sweep: the plate behind the spoken word grows with the word
  const sweepPreset = getPreset("Highlight Sweep").captionsSettings;
  const plate = (t) => (render(sweepPreset, t), layer.find("Rect")[0]?.width() ?? 0);
  const [early, late] = [plate(1.05), plate(1.6)];
  assert.ok(early > 0 && late > early, `plate does not grow: ${early} → ${late}`);
  assert.equal(plate(0.95), 0, "a plate between words");

  // Neon Bloom: unlit words have no glow; lit words get three named copies
  const neonPreset = getPreset("Neon Bloom").captionsSettings;
  render(neonPreset, 1.45);
  assert.equal(decorations().length, 2 * 3, "glow copies for the two lit words");
  assert.equal(words().length, 4, "decorations counted as words");
  render(neonPreset, 1.45);
  const neon = await hash();
  render(neonPreset, 1.45);
  assert.equal(await hash(), neon, "neon frames are not reproducible");

  // Hard Extrude: every word has a side; the spoken word's face rises
  const extrudePreset = getPreset("Hard Extrude").captionsSettings;
  render({ ...extrudePreset, animationOptions: { extrudeLift: 0 } }, 1.45);
  const flatY = byWord("two").y();
  assert.ok(decorations().length >= 4 * 3, "too few side copies");
  render(extrudePreset, 1.45);
  assert.ok(byWord("two").y() < flatY, "the spoken word does not rise");
  console.log("ok   Spring Pop, Highlight Sweep, Neon Bloom and Hard Extrude behave as described");
  // Karaoke Fill: the spoken word fills from the left; spoken words stay filled
  const karaoke = getPreset("Karaoke Fill").captionsSettings;
  const fill = (t) => (render(karaoke, t), layer.find("Group").find((g) => g.hasName("decoration"))?.clipWidth() ?? 0);
  const [quarter, half] = [fill(1.225), fill(1.45)];
  assert.ok(quarter > 0 && Math.abs(half / quarter - 2) < 0.15, `fill does not follow progress: ${quarter} → ${half}`);
  assert.equal(byWord("one").fill(), karaoke.style.highlightColor, "a spoken word is not filled");
  assert.equal(byWord("two").fill(), karaoke.style.font.fontColor, "the spoken word's base is filled");
  assert.equal(byWord("three").fill(), karaoke.style.font.fontColor, "a future word is filled");
  assert.equal(fill(0.95), 0, "a fill between words");

  // Gradient Wave: one band across all words, moving with time
  const wave = getPreset("Gradient Wave").captionsSettings;
  const bandStart = (t, w) => {
    render(wave, t);
    const text = byWord(w);
    return text.fillLinearGradientStartPoint().x + text.x() + text.parent.x();
  };
  assert.ok(Math.abs(bandStart(1.45, "one") - bandStart(1.45, "four")) < 1e-6, "the band is not continuous");
  assert.notEqual(bandStart(1.45, "one"), bandStart(1.6, "one"), "the band does not move");
  render(wave, 1.45);
  assert.equal(byWord("one").fillPriority(), "linear-gradient");
  assert.equal(byWord("four").opacity(), 0.6, "a future word is not dimmed");

  // Pill: one fully rounded plate per line; words turn dark as spoken
  const pillPreset = getPreset("Pill").captionsSettings;
  render(pillPreset, 2.45);
  const plates = layer.find("Rect").filter((r) => r.hasName("decoration"));
  const lineCount = new Set(words().map((t) => t.parent)).size;
  assert.equal(plates.length, lineCount, "not one plate per line");
  for (const r of plates) assert.equal(r.cornerRadius(), r.height() / 2, "a plate is not a pill");
  assert.equal(byWord("one").fill(), pillPreset.style.highlightColor, "a spoken word is not dark");
  assert.equal(byWord("four").fill(), pillPreset.style.font.fontColor, "a future word is not grey");

  // Chroma Glitch: two passes per word that jump apart, then settle
  const chroma = getPreset("Chroma Glitch").captionsSettings;
  const spread = (t) => {
    render(chroma, t);
    const two = byWord("two");
    const passes = decorations().filter((d) => d.text() === two.text());
    return Math.max(...passes.map((d) => Math.abs(d.x() - two.x())));
  };
  render(chroma, 1.45);
  assert.equal(decorations().length, 4 * 2, "two passes per word");
  const [burst, rest] = [spread(1.01), spread(1.45)];
  assert.ok(burst > rest * 1.5, `no glitch burst: ${burst} vs ${rest}`);
  render(chroma, 1.02);
  const glitched = await hash();
  render(chroma, 1.02);
  assert.equal(await hash(), glitched, "glitch frames are not reproducible");
  console.log("ok   Karaoke Fill, Gradient Wave, Pill and Chroma Glitch behave as described");
  // Typewriter: letters appear as the word is spoken, with a caret after them
  const typing = getPreset("Typewriter").captionsSettings;
  const typed = (t) => (render(typing, t), words()[2].text().trim());
  assert.equal((render(typing, 1.45), byWord("three").opacity()), 0, "a future word is visible");
  const firstLetters = typed(2.02);
  assert.ok(firstLetters.length > 0 && firstLetters.length < 5, `not typing: "${firstLetters}"`);
  assert.equal(typed(2.6), "three", "the word is not fully typed");
  render(typing, 2.1);
  const caret = layer.find("Rect").filter((r) => r.hasName("decoration"));
  assert.equal(caret.length, 1, "no caret while typing");
  const three = words()[2];
  assert.ok(caret[0].x() > three.x() + three.width() - 1, "the caret is not after the letters");

  // Sticker Tape: one tilted strip per word; the spoken strip is highlighted
  const stickerPreset = getPreset("Sticker Tape").captionsSettings;
  render(stickerPreset, 1.45);
  const strips = layer.find("Rect").filter((r) => r.hasName("decoration"));
  assert.equal(strips.length, 4, "not one strip per word");
  assert.ok(strips.some((r) => r.rotation() !== 0), "no tilt");
  assert.equal(strips.filter((r) => r.fill() === stickerPreset.style.highlightColor).length, 1, "not one highlighted strip");
  const angles = strips.map((r) => r.rotation()).sort();
  render(stickerPreset, 2.45);
  assert.deepEqual(layer.find("Rect").filter((r) => r.hasName("decoration")).map((r) => r.rotation()).sort(), angles, "tilts change between frames");

  // ...and the strips of neighbouring words do not touch
  render({ ...stickerPreset, animationOptions: { stickerTilt: 0, stickerPop: 0 } }, 1.45);
  const flat = layer.find("Rect").filter((r) => r.hasName("decoration")).map((r) => ({ line: r.parent, box: r.getClientRect({ skipShadow: true }) }));
  for (const a of flat) for (const b of flat) {
    if (a === b || a.line !== b.line || a.box.x > b.box.x) continue;
    assert.ok(a.box.x + a.box.width < b.box.x, "neighbouring strips overlap");
  }

  // Slam: one word at a time, fitted to the frame, staying between words
  const slamPreset = getPreset("Slam").captionsSettings;
  const visible = (t) => (render(slamPreset, t), words().filter((w) => w.opacity() > 0).map((w) => w.text().trim().toLowerCase()));
  assert.deepEqual(visible(1.45), ["two"]);
  assert.deepEqual(visible(1.95), ["two"], "the last word does not stay between words");
  render(slamPreset, 1.8);
  const two = byWord("two");
  assert.ok(two.scaleX() > 1.5, `the word is not enlarged: ${two.scaleX()}`);
  assert.ok(two.getClientRect().width <= size[0], "the word does not fit the frame");
  console.log("ok   Typewriter, Sticker Tape and Slam behave as described");
  // speakers: a speaker's color is the highlight in any preset; a word's own
  // color still wins
  const talk = [
    { word: "hello", startTime: 0, endTime: 0.9, speaker: 0 },
    { word: "there", startTime: 1, endTime: 1.9, speaker: 0, highlightColor: "#00FF00" },
  ];
  const renderTalk = (settings, time) => {
    layer.destroyChildren();
    renderFrame({ settings, captions: talk, time, size, layer, scale: size[1] / 480 });
    layer.draw();
  };
  const withSpeakers = { ...classic, speakers: [{ color: "#FF0000", label: "Ann" }] };
  renderTalk(withSpeakers, 0.5);
  assert.equal(byWord("hello").fill(), "#FF0000", "the speaker color is not the highlight");
  renderTalk(withSpeakers, 1.5);
  assert.equal(byWord("there").fill(), "#00FF00", "the speaker color beats the word's own");

  // Speaker Tags: a tag with the speaker's label and color above the screen
  const tags = getPreset("Speaker Tags").captionsSettings;
  const tagText = () => layer.find("Text").filter((t) => t.hasName("decoration")).map((t) => t.text());
  const tagFill = () => layer.find("Rect").filter((r) => r.hasName("decoration")).map((r) => r.fill());
  renderTalk({ ...tags, speakers: [{ color: "#FF0000", label: "Ann" }] }, 0.5);
  assert.deepEqual(tagText(), ["Ann"]);
  assert.deepEqual(tagFill(), ["#FF0000"]);
  assert.equal(byWord("hello").fill(), "#FF0000", "the spoken word is not in the speaker's color");
  const tag = layer.find("Group").find((g) => g.hasName("decoration"));
  const [tagBox, wordBox] = [tag, byWord("hello")].map((n) => n.getClientRect({ skipShadow: true }));
  assert.ok(tagBox.y + tagBox.height <= wordBox.y, `the tag is not above the words: ${JSON.stringify([tagBox, wordBox])}`);
  renderTalk(tags, 0.5);
  assert.deepEqual(tagText(), ["Speaker 1"], "no fallback label");
  renderTalk({ ...tags, animationOptions: { tagUnnamed: false } }, 0.5);
  assert.deepEqual(tagText(), [], "a tag without a label");
  render(tags, 1.45);
  assert.deepEqual(tagText(), [], "a tag for words without a speaker");
  console.log("ok   speakers color any preset; Speaker Tags shows the speaker");
}
