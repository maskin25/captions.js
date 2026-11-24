import { finalizeTrack, interpolateWords, isObject, num, speakerId } from "../track.helpers";
import type { CaptionTrack, TrackSegment, TrackWord } from "../track.types";

/** A word as Whisper-family tools write it. */
export interface WhisperWord {
  word?: string;
  text?: string;
  start?: number;
  end?: number;
  /** faster-whisper */
  probability?: number;
  /** WhisperX */
  score?: number;
  /** WhisperX with diarization */
  speaker?: string;
}

export interface WhisperSegment {
  start: number;
  end: number;
  text: string;
  words?: WhisperWord[];
  speaker?: string;
}

/**
 * OpenAI Whisper `verbose_json` (with `timestamp_granularities: ["word"]`
 * for word times), and the same shape from faster-whisper and WhisperX.
 *
 * @public
 */
export interface WhisperVerboseJson {
  text?: string;
  language?: string;
  duration?: number;
  segments?: WhisperSegment[];
  words?: WhisperWord[];
}

const toWord = (w: WhisperWord): Omit<TrackWord, "start" | "end"> & { start?: number; end?: number } => {
  const item: Omit<TrackWord, "start" | "end"> & { start?: number; end?: number } = {
    text: String(w.word ?? w.text ?? ""),
    start: num(w.start),
    end: num(w.end),
  };
  const confidence = num(w.probability) ?? num(w.score);
  if (confidence !== undefined) item.confidence = confidence;
  const speaker = speakerId(w.speaker);
  if (speaker !== undefined) item.speaker = speaker;
  return item;
};

/**
 * WhisperX leaves numbers and some symbols without times. Give them the gap
 * between their neighbours (or the segment bounds).
 */
const fillMissingTimes = (
  words: ReturnType<typeof toWord>[],
  segStart: number,
  segEnd: number,
): TrackWord[] => {
  const out: TrackWord[] = [];
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (w.start !== undefined && w.end !== undefined) {
      out.push(w as TrackWord);
      continue;
    }
    // run of untimed words [i, j)
    let j = i;
    while (j < words.length && (words[j].start === undefined || words[j].end === undefined)) j++;
    const from = out.length ? out[out.length - 1].end : segStart;
    const to = j < words.length ? (words[j].start as number) : segEnd;
    const step = Math.max(0, to - from) / (j - i);
    for (let k = i; k < j; k++) {
      out.push({
        ...words[k],
        start: from + step * (k - i),
        end: from + step * (k - i + 1),
        approximated: true,
      } as TrackWord);
    }
    i = j - 1;
  }
  return out;
};

/** @public */
export const fromWhisper = (input: WhisperVerboseJson): CaptionTrack => {
  const segments = input.segments ?? [];
  const sentences: TrackSegment[] = [];
  const words: TrackWord[] = [];
  const segmentsHaveWords = segments.some((s) => s.words?.length);

  for (const segment of segments) {
    const start = num(segment.start);
    const end = num(segment.end);
    if (start === undefined || end === undefined) continue;
    const speaker = speakerId(segment.speaker);
    sentences.push({ start, end, ...(speaker ? { speaker } : {}) });
    if (segmentsHaveWords) {
      const segmentWords = fillMissingTimes((segment.words ?? []).map(toWord), start, end);
      words.push(...segmentWords.map((w) => (speaker && !w.speaker ? { ...w, speaker } : w)));
    } else if (!input.words?.length) {
      words.push(...interpolateWords(segment.text, start, end, speaker ? { speaker } : {}));
    }
  }
  if (!segmentsHaveWords && input.words?.length) {
    const first = num(input.words[0]?.start) ?? 0;
    const last = num(input.words[input.words.length - 1]?.end) ?? first;
    words.push(...fillMissingTimes(input.words.map(toWord), first, last));
  }

  return finalizeTrack({
    words,
    sentences,
    meta: { source: "whisper", ...(input.language ? { language: input.language } : {}) },
  });
};

export const isWhisper = (value: unknown): value is WhisperVerboseJson => {
  if (!isObject(value)) return false;
  if (Array.isArray(value.segments) && value.segments.length > 0) {
    const s = value.segments[0];
    return isObject(s) && num(s.start) !== undefined && num(s.end) !== undefined && typeof s.text === "string";
  }
  return (
    Array.isArray(value.words) &&
    ("text" in value || "language" in value || "duration" in value || "task" in value) &&
    value.words.every((w: unknown) => isObject(w) && "word" in w)
  );
};
