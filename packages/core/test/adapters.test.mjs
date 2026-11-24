// Input adapters: every fixture in test/fixtures is converted to a
// CaptionTrack and compared with a checked-in snapshot, plus targeted checks.
//
//   node test/adapters.test.mjs            compare
//   node test/adapters.test.mjs --update   rewrite the snapshots
//
// Run after building core (pnpm build).
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  detectFormat,
  toCaptions,
  toTrack,
  trackToCaptions,
  fromCaptions,
  validate,
} from "../dist/index.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const fixtures = path.join(here, "fixtures");
const snapshots = path.join(here, "snapshots");
const update = process.argv.includes("--update");

const read = (name) => fs.readFileSync(path.join(fixtures, name), "utf-8");
const readJson = (name) => JSON.parse(read(name));

let failed = 0;
const test = (name, fn) => {
  try {
    fn();
    console.log(`ok   ${name}`);
  } catch (error) {
    failed++;
    console.log(`FAIL ${name}\n     ${String(error.message).split("\n").join("\n     ")}`);
  }
};

// --- snapshots: one per fixture ------------------------------------------
const cases = [
  ["deepgram.json", "deepgram"],
  ["whisper-openai.json", "whisper"],
  ["whisperx.json", "whisper"],
  ["whisper-cpp.json", "whisper.cpp"],
  ["whisper-cpp-ml1.json", "whisper.cpp"],
  ["assemblyai.json", "assemblyai"],
  ["elevenlabs.json", "elevenlabs"],
  ["sample.srt", "srt"],
  ["sample.vtt", "vtt"],
  ["loose.json", "words"],
];

for (const [file, format] of cases) {
  test(`${file} → ${format}`, () => {
    const raw = read(file);
    const input = file.endsWith(".json") ? JSON.parse(raw) : raw;
    assert.equal(detectFormat(input), format);
    // the same text works as a string, as browser and CLI both receive it
    assert.deepEqual(toTrack(raw), toTrack(input));

    const track = toTrack(input);
    const result = validate(track);
    assert.ok(result.ok, `validate: ${JSON.stringify(result.issues)}`);
    const snapshot = { track, captions: trackToCaptions(track) };
    const snapFile = path.join(snapshots, `${file}.snap.json`);
    const text = JSON.stringify(snapshot, null, 1) + "\n";
    if (update) {
      fs.mkdirSync(snapshots, { recursive: true });
      fs.writeFileSync(snapFile, text);
      return;
    }
    assert.ok(fs.existsSync(snapFile), `missing snapshot ${path.relative(here, snapFile)}`);
    assert.deepEqual(JSON.parse(text), JSON.parse(fs.readFileSync(snapFile, "utf-8")));
  });
}

// --- behaviour ----------------------------------------------------------
test("Deepgram toCaptions() is unchanged from 1.10", () => {
  const dg = readJson("deepgram.json");
  const strip = (list) => JSON.parse(JSON.stringify(list));
  assert.deepEqual(strip(toCaptions(dg)), readJson("deepgram.captions-1.10.json"));
  assert.deepEqual(strip(toCaptions({ result: dg, error: null })), readJson("deepgram-envelope.captions-1.10.json"));
});

test("Caption[] passes through toCaptions() untouched", () => {
  const captions = [{ word: "Hi", startTime: 0, endTime: 1, highlightColor: "#f00" }];
  assert.equal(toCaptions(captions), captions);
});

test("Caption[] round-trips through a track", () => {
  const captions = readJson("deepgram.captions-1.10.json");
  assert.deepEqual(trackToCaptions(fromCaptions(captions)), captions);
});

test("Whisper JSON and loose words give the same captions in core as in the CLI", () => {
  // these threw in core 1.10 and only worked through @captionsjs/server
  assert.equal(toCaptions(readJson("whisper-openai.json")).length, 6);
  assert.equal(toCaptions([{ word: "a", start: 0, end: 1 }]).length, 1);
});

test("SRT words are interpolated and flagged", () => {
  const track = toTrack(read("sample.srt"));
  assert.equal(track.meta.approximated, true);
  assert.ok(track.words.every((w) => w.approximated));
  assert.equal(track.words[0].start, 1);
  assert.equal(track.words.find((w) => w.text === "nice.").end, 2.5);
  assert.deepEqual(track.events, [{ type: "music", start: 3, end: 4, label: "[Music]" }]);
  assert.equal(track.words.find((w) => w.text === "&"), track.words[track.words.length - 2]);
});

test("VTT inline timestamps give exact word times", () => {
  const words = toTrack(read("sample.vtt")).words.filter((w) => w.speaker === "Ben");
  assert.deepEqual(
    words.map((w) => [w.text, w.start, w.end, w.approximated ?? false]),
    [["Exact", 2, 2.4, false], ["word", 2.4, 2.9, false], ["times", 2.9, 3.2, false]],
  );
});

test("*markup* sets manual emphasis and is removed from the text", () => {
  const words = toTrack(readJson("loose.json")).words;
  assert.deepEqual(
    words.map((w) => [w.text, w.emphasis ?? 0]),
    [["We", 0], ["really", 1], ["mean", 1], ["it!", 1]],
  );
  assert.equal(words[1].emphasisSource, "manual");
  // a lone opening asterisk is left alone
  const lone = toTrack([{ text: "*oops", start: 0, end: 1 }, { text: "x", start: 1, end: 2 }]).words;
  assert.equal(lone[0].text, "*oops");
  assert.equal(lone[0].emphasis, undefined);
});

test("speaker ids map to Caption.speaker numbers", () => {
  const captions = toCaptions(readJson("assemblyai.json"));
  assert.deepEqual([...new Set(captions.map((c) => c.speaker))], [0, 1]);
  assert.deepEqual([...new Set(toCaptions(readJson("deepgram.json")).map((c) => c.speaker))], [0, 1]);
});

test("WhisperX words without times get the gap between neighbours", () => {
  const w = toTrack(readJson("whisperx.json")).words.find((x) => x.text === "25");
  assert.deepEqual([w.start, w.end, w.approximated], [0.61, 1.4, true]);
});

test("whisper.cpp tokens merge into words; special tokens are dropped", () => {
  const words = toTrack(readJson("whisper-cpp.json")).words;
  assert.deepEqual(words.slice(0, 2).map((w) => [w.text, w.start, w.end]), [
    ["Captions", 0, 0.7],
    ["everywhere.", 0.7, 1.5],
  ]);
});

test("validate() reports broken tracks", () => {
  const result = validate({
    words: [
      { text: "a", start: 0, end: 1 },
      { text: "b", start: 0.5, end: 2 },
      { text: "", start: 3, end: 2 },
      { text: "d", start: Number.NaN, end: 4, emphasis: 2 },
      { text: "e", start: 4, end: 5, speaker: "x" },
    ],
    speakers: [{ id: "y" }],
  });
  assert.equal(result.ok, false);
  assert.deepEqual(
    result.issues.map((i) => `${i.kind} ${i.path}`),
    [
      "overlap words[1]",
      "empty-text words[2]",
      "reversed words[2]",
      "non-finite words[3]",
      "out-of-range words[3]",
      "unknown-speaker words[4]",
    ],
  );
  assert.equal(validate({ words: [{ text: "a", start: 0, end: 1 }, { text: "b", start: 0.9, end: 2 }] }).ok, true);
});

test("unknown input throws a helpful error", () => {
  assert.throws(() => toTrack({ foo: 1 }), /Unsupported captions format/);
  assert.throws(() => toTrack("just text"), /expected JSON, SRT or WebVTT/);
});

if (update) console.log(`snapshots written to ${path.relative(process.cwd(), snapshots)}`);
if (failed) process.exit(1);
