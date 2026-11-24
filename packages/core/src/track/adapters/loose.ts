import type { Caption } from "../../entities/captions/captions.types";
import { finalizeTrack, isObject, num, speakerId } from "../track.helpers";
import type { CaptionTrack, TrackSegment, TrackWord } from "../track.types";

/**
 * Word timings in the shapes people usually have: `{ word | text, start |
 * startTime, end | endTime }`, as an array or under `words`. A full
 * `CaptionTrack` object is accepted as well and keeps its other fields.
 *
 * @public
 */
export const fromWords = (input: unknown): CaptionTrack => {
  const list: unknown[] = Array.isArray(input) ? input : isObject(input) && Array.isArray(input.words) ? input.words : [];
  const words: TrackWord[] = [];
  for (const raw of list) {
    if (!isObject(raw)) continue;
    const text = String(raw.text ?? raw.word ?? raw.punctuated_word ?? "");
    const start = num(raw.start) ?? num(raw.startTime);
    const end = num(raw.end) ?? num(raw.endTime);
    if (start === undefined || end === undefined || end < start) continue;
    const word: TrackWord = { text, start, end };
    for (const key of ["confidence", "emphasis"] as const) {
      const value = num(raw[key]);
      if (value !== undefined) word[key] = value;
    }
    if (word.emphasis !== undefined) {
      word.emphasisSource = raw.emphasisSource ?? "manual";
    }
    const speaker = speakerId(raw.speaker);
    if (speaker !== undefined) word.speaker = speaker;
    if (typeof raw.lang === "string") word.lang = raw.lang;
    if (typeof raw.highlightColor === "string") word.highlightColor = raw.highlightColor;
    if (raw.approximated === true) word.approximated = true;
    words.push(word);
  }
  const isTrack = isObject(input) && Array.isArray(input.words);
  const track = isTrack ? (input as Partial<CaptionTrack>) : {};
  return finalizeTrack({
    words,
    sentences: track.sentences,
    paragraphs: track.paragraphs,
    speakers: track.speakers,
    events: track.events,
    meta: { source: isTrack ? "track" : "words", ...track.meta },
  });
};

/**
 * The library's own `Caption[]`. Sentence and paragraph bounds and speakers
 * are kept, so `trackToCaptions(fromCaptions(c))` gives `c` back.
 *
 * @public
 */
export const fromCaptions = (captions: Caption[]): CaptionTrack => {
  const sentences = new Map<string, TrackSegment>();
  const paragraphs = new Map<string, TrackSegment>();
  const words: TrackWord[] = captions.map((c) => {
    const word: TrackWord = { text: c.word, start: c.startTime, end: c.endTime };
    const speaker = speakerId(c.speaker);
    if (speaker !== undefined) word.speaker = speaker;
    if (c.highlightColor) word.highlightColor = c.highlightColor;
    if (c.sentenceStartTime !== undefined && c.sentenceEndTime !== undefined) {
      sentences.set(`${c.sentenceStartTime}|${c.sentenceEndTime}`, { start: c.sentenceStartTime, end: c.sentenceEndTime });
    }
    if (c.paragraphStartTime !== undefined && c.paragraphEndTime !== undefined) {
      paragraphs.set(`${c.paragraphStartTime}|${c.paragraphEndTime}`, { start: c.paragraphStartTime, end: c.paragraphEndTime });
    }
    return word;
  });
  return finalizeTrack({
    words,
    sentences: [...sentences.values()],
    paragraphs: [...paragraphs.values()],
    meta: { source: "captions" },
  });
};

const isCaptionEntry = (value: unknown): value is Caption =>
  isObject(value) &&
  typeof value.word === "string" &&
  typeof value.startTime === "number" &&
  Number.isFinite(value.startTime) &&
  typeof value.endTime === "number" &&
  Number.isFinite(value.endTime);

export const isCaptions = (value: unknown): value is Caption[] =>
  Array.isArray(value) && value.every(isCaptionEntry);

const isLooseWord = (value: unknown) =>
  isObject(value) &&
  ("word" in value || "text" in value) &&
  (num(value.start) !== undefined || num(value.startTime) !== undefined);

export const isWords = (value: unknown) =>
  (Array.isArray(value) && value.length > 0 && value.some(isLooseWord)) ||
  (isObject(value) && Array.isArray(value.words) && value.words.some(isLooseWord));
