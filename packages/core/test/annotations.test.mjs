// Annotations: prompt, parse and apply emphasis from an outside source (LLM).
// Run after building: node test/annotations.test.mjs
import assert from "node:assert/strict";
import {
  ANNOTATIONS_SCHEMA,
  annotationPrompt,
  applyAnnotations,
  parseAnnotations,
  toTrack,
  trackToCaptions,
} from "../dist/index.mjs";

const track = toTrack([
  ["We", 0, 0.2], ["raised", 0.2, 0.5], ["*forty*", 0.5, 0.8], ["million", 0.8, 1.2],
  ["dollars", 1.2, 1.6], ["in", 1.6, 1.7], ["one", 1.7, 1.9], ["week.", 1.9, 2.3],
].map(([word, start, end]) => ({ word, start, end })));

const ok = (name, fn) => {
  fn();
  console.log(`ok   ${name}`);
};

ok("prompt numbers the words and asks for JSON", () => {
  const prompt = annotationPrompt(track, { share: 0.2 });
  assert.match(prompt, /0:We 1:raised 2:forty 3:million/);
  assert.match(prompt, /about 20%/);
  assert.match(prompt, /"version":1/);
  assert.equal(ANNOTATIONS_SCHEMA.properties.version.const, 1);
});

ok("LLM replies are parsed with prose and code fences around them", () => {
  const reply = 'Sure! Here you go:\n```json\n{"version":1,"emphasis":[{"index":3,"text":"million"}]}\n```\nAnything else?';
  assert.deepEqual(parseAnnotations(reply).emphasis, [{ index: 3, text: "million" }]);
  assert.throws(() => parseAnnotations("no json here"), /no JSON object/);
  assert.throws(() => parseAnnotations('{"version":2,"emphasis":[]}'), /unsupported annotations version 2/);
  assert.throws(() => parseAnnotations('{"version":1}'), /emphasis/);
});

ok("annotations set emphasis; manual marks win", () => {
  const { track: annotated, applied, issues } = applyAnnotations(track, {
    version: 1,
    emphasis: [
      { index: 3, text: "million", value: 0.8, reason: "the number" },
      { index: 2, text: "forty", value: 0.3 }, // manual *forty* wins
      { index: 5, text: "week", value: 1.5 }, // shifted by 2, value clamped
      { index: 0, text: "billion" }, // not there
      { index: 99, text: "dollars" }, // no word 99, and "dollars" is not within 5 of it
      { index: "1", text: "raised" }, // invalid
      { index: 3, text: "million", value: 0.9 }, // duplicate
    ],
  });
  const by = Object.fromEntries(annotated.words.map((w) => [w.text, w]));
  assert.equal(by.million.emphasis, 0.9);
  assert.equal(by.million.emphasisSource, "annotation");
  assert.equal(by.forty.emphasis, 1);
  assert.equal(by.forty.emphasisSource, "manual");
  assert.equal(by["week."].emphasis, 1);
  assert.equal(by.We.emphasis, undefined);
  assert.equal(applied, 2);
  assert.deepEqual(
    issues.map((i) => `${i.entry}:${i.kind}`),
    ["1:manual-wins", "2:out-of-range", "2:shifted", "3:not-found", "4:not-found", "5:invalid", "6:duplicate"],
  );
  // the input track is not changed
  assert.equal(track.words[3].emphasis, undefined);
});

ok("words that are only a symbol can be annotated", () => {
  const percent = toTrack([["3", 0, 0.2], ["%", 0.2, 0.3], ["of", 0.3, 0.4]].map(([word, start, end]) => ({ word, start, end })));
  const { track: annotated, issues } = applyAnnotations(percent, { version: 1, emphasis: [{ index: 1, text: "%" }, { index: 0, text: " " }] });
  assert.equal(annotated.words[1].emphasis, 1);
  assert.deepEqual(issues.map((i) => i.kind), ["invalid"]);
});

ok("emphasis reaches the renderer's captions", () => {
  const { track: annotated } = applyAnnotations(track, { version: 1, emphasis: [{ index: 3, text: "million" }] });
  const captions = trackToCaptions(annotated);
  assert.equal(captions[2].emphasis, 1); // *forty*
  assert.equal(captions[3].emphasis, 1);
  assert.equal(captions[0].emphasis, undefined);
  // Caption[] with emphasis round-trips as manual emphasis
  const again = toTrack(captions);
  assert.equal(again.words[3].emphasisSource, "manual");
});
