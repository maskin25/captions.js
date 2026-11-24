import type {
  DeepgramResponse,
  DeepgramResultPayload,
} from "../../captions-adapters/deepgram";
import { finalizeTrack, interpolateWords, isObject, num, speakerId } from "../track.helpers";
import type { CaptionTrack, TrackSegment, TrackWord } from "../track.types";

const payloadOf = (input: DeepgramResponse): DeepgramResultPayload | null => {
  if ("result" in input) return input.error ? null : input.result;
  return input;
};

/**
 * Deepgram pre-recorded response (with or without the `{ result, error }`
 * envelope of the JS SDK). Uses the first alternative of every channel;
 * sentences and paragraphs come from `paragraphs`, speakers from diarization.
 *
 * @public
 */
export const fromDeepgram = (input: DeepgramResponse): CaptionTrack => {
  const payload = payloadOf(input);
  const words: TrackWord[] = [];
  const sentences: TrackSegment[] = [];
  const paragraphs: TrackSegment[] = [];
  let language: string | undefined;

  for (const channel of payload?.results.channels ?? []) {
    language ??= channel.detected_language;
    const alternative = channel.alternatives?.[0];
    if (!alternative) continue;
    language ??= alternative.languages?.[0];

    for (const paragraph of alternative.paragraphs?.paragraphs ?? []) {
      const speaker = speakerId(paragraph.speaker);
      const pStart = num(paragraph.start);
      const pEnd = num(paragraph.end);
      if (pStart !== undefined && pEnd !== undefined) {
        paragraphs.push({ start: pStart, end: pEnd, speaker });
      }
      for (const sentence of paragraph.sentences ?? []) {
        const start = num(sentence.start);
        const end = num(sentence.end);
        if (start === undefined || end === undefined) continue;
        sentences.push({ start, end, speaker });
        if (!alternative.words?.length) {
          // no word list: spread the sentence over its words
          words.push(...interpolateWords(sentence.text, start, end, speaker ? { speaker } : {}));
        }
      }
    }

    for (const word of alternative.words ?? []) {
      const start = num(word.start);
      const end = num(word.end);
      if (start === undefined || end === undefined || end < start) continue;
      const item: TrackWord = { text: word.punctuated_word ?? word.word, start, end };
      if (word.confidence !== undefined) item.confidence = word.confidence;
      const speaker = speakerId(word.speaker);
      if (speaker !== undefined) item.speaker = speaker;
      words.push(item);
    }
  }

  return finalizeTrack({
    words,
    sentences,
    paragraphs,
    meta: { source: "deepgram", ...(language ? { language } : {}) },
  });
};

const hasChannels = (value: Record<string, any>) =>
  isObject(value.results) &&
  Array.isArray(value.results.channels) &&
  value.results.channels.every(
    (c: unknown) =>
      isObject(c) &&
      Array.isArray(c.alternatives) &&
      c.alternatives.every((a: unknown) => isObject(a) && Array.isArray(a.words)),
  );

export const isDeepgram = (value: unknown): value is DeepgramResponse =>
  isObject(value) && (hasChannels(value) || (isObject(value.result) && hasChannels(value.result)));
