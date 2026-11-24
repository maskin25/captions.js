import { finalizeTrack, interpolateWords, isObject, num } from "../track.helpers";
import type { CaptionTrack, TrackSegment, TrackWord } from "../track.types";

interface WhisperCppOffsets {
  from: number;
  to: number;
}

interface WhisperCppToken {
  text: string;
  offsets: WhisperCppOffsets;
  p?: number;
}

interface WhisperCppSegment {
  offsets: WhisperCppOffsets;
  text: string;
  tokens?: WhisperCppToken[];
}

/**
 * whisper.cpp `--output-json` (`-oj`), optionally with tokens (`-ojf`).
 * Offsets are in milliseconds. With `--max-len 1` every segment is one word,
 * which gives exact word times even without tokens.
 *
 * @public
 */
export interface WhisperCppJson {
  result?: { language?: string };
  transcription: WhisperCppSegment[];
}

const SPECIAL = /^\s*(\[_[A-Z]+_?\d*\]|<\|[^|]*\|>)\s*$/;

/** Tokens are sub-words; a token starting with a space begins a new word. */
const wordsFromTokens = (tokens: WhisperCppToken[]): TrackWord[] => {
  const words: TrackWord[] = [];
  for (const token of tokens) {
    if (!token.text || SPECIAL.test(token.text)) continue;
    const start = num(token.offsets?.from);
    const end = num(token.offsets?.to);
    if (start === undefined || end === undefined) continue;
    const current = words[words.length - 1];
    if (current && !/^\s/.test(token.text) && !/^\s*$/.test(token.text)) {
      current.text += token.text;
      current.end = end / 1000;
      if (token.p !== undefined) current.confidence = Math.min(current.confidence ?? 1, token.p);
    } else if (token.text.trim()) {
      words.push({
        text: token.text.trim(),
        start: start / 1000,
        end: end / 1000,
        ...(token.p !== undefined ? { confidence: token.p } : {}),
      });
    }
  }
  return words;
};

/** @public */
export const fromWhisperCpp = (input: WhisperCppJson): CaptionTrack => {
  const words: TrackWord[] = [];
  const sentences: TrackSegment[] = [];
  for (const segment of input.transcription) {
    const from = num(segment.offsets?.from);
    const to = num(segment.offsets?.to);
    if (from === undefined || to === undefined) continue;
    const start = from / 1000;
    const end = to / 1000;
    sentences.push({ start, end });
    const fromTokens = segment.tokens?.length ? wordsFromTokens(segment.tokens) : [];
    words.push(...(fromTokens.length ? fromTokens : interpolateWords(segment.text, start, end)));
  }
  // with --max-len 1 each segment is a word, not a sentence
  const oneWordSegments = input.transcription.every((s) => s.text.trim().split(/\s+/).length <= 1);
  const language = input.result?.language;
  return finalizeTrack({
    words,
    sentences: oneWordSegments ? [] : sentences,
    meta: { source: "whisper.cpp", ...(language ? { language } : {}) },
  });
};

export const isWhisperCpp = (value: unknown): value is WhisperCppJson =>
  isObject(value) &&
  Array.isArray(value.transcription) &&
  value.transcription.every((s: unknown) => isObject(s) && isObject(s.offsets) && typeof s.text === "string");
