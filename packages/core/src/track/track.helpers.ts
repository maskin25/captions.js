import type { Caption } from "../entities/captions/captions.types";
import type {
  CaptionTrack,
  TrackEvent,
  TrackMeta,
  TrackSegment,
  TrackWord,
} from "./track.types";

export const isObject = (value: unknown): value is Record<string, any> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Finite number from a number or numeric string, else undefined. */
export const num = (value: unknown): number | undefined => {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim() !== ""
        ? Number(value)
        : Number.NaN;
  return Number.isFinite(parsed) ? parsed : undefined;
};

/** Speaker id as a string, or undefined. */
export const speakerId = (value: unknown): string | undefined =>
  value === undefined || value === null || value === "" ? undefined : String(value);

/**
 * Spreads a segment's time over its words in proportion to their length
 * (characters + 1), for inputs without word times (SRT, VTT, plain segments).
 */
export const interpolateWords = (
  text: string,
  start: number,
  end: number,
  extra: Partial<TrackWord> = {},
): TrackWord[] => {
  const tokens = text.split(/\s+/).filter(Boolean);
  if (!tokens.length) return [];
  if (tokens.length === 1) return [{ text: tokens[0], start, end, ...extra }];
  const weights = tokens.map((t) => t.length + 1);
  const total = weights.reduce((a, b) => a + b, 0);
  const span = Math.max(0, end - start);
  let cursor = start;
  return tokens.map((token, i) => {
    const wordStart = cursor;
    const wordEnd = i === tokens.length - 1 ? end : cursor + (span * weights[i]) / total;
    cursor = wordEnd;
    return {
      text: token,
      start: round(wordStart),
      end: round(wordEnd),
      approximated: true,
      ...extra,
    };
  });
};

const round = (value: number) => Math.round(value * 1000) / 1000;

const EVENT_PATTERN = /^\s*[\[(]\s*([^\])]+?)\s*[\])]\s*$/;

/** `[Music]`, `(laughs)` → `music`, `laughs`; anything else → undefined. */
export const parseEventLabel = (text: string): string | undefined => {
  const match = text.match(EVENT_PATTERN);
  return match ? match[1].toLowerCase() : undefined;
};

const OPEN = /^([("'«“]*)\*(?=\S)/;
const CLOSE = /(?<=\S)\*([)"'»”.,!?…:;]*)$/;

/**
 * `*word*` and `*several words*` mark manual emphasis. The asterisks are
 * removed from the text; punctuation outside them is kept. An opening `*`
 * without a closing one is left as it is.
 */
export const applyEmphasisMarkup = (words: TrackWord[]): TrackWord[] => {
  const result = [...words];
  for (let i = 0; i < result.length; i++) {
    if (!OPEN.test(result[i].text)) continue;
    const first = result[i].text.replace(OPEN, "$1");
    // find the word that closes the span (may be the same word)
    let j = i;
    let closing = first;
    while (j < result.length && !CLOSE.test(closing)) {
      j++;
      closing = result[j]?.text ?? "";
    }
    if (j >= result.length) continue;
    for (let k = i; k <= j; k++) {
      let text = k === i ? first : result[k].text;
      if (k === j) text = text.replace(CLOSE, "$1");
      result[k] = markEmphasis(result[k], text);
    }
    i = j;
  }
  return result;
};

const markEmphasis = (word: TrackWord, text: string): TrackWord => ({
  ...word,
  text,
  emphasis: 1,
  emphasisSource: "manual",
});

/**
 * Shared last step of every adapter: drops empty words, applies `*word*`
 * markup, sorts by time, fills `speakers` from the ids in use, and sets
 * `meta.approximated`.
 */
export const finalizeTrack = (track: {
  words: TrackWord[];
  sentences?: TrackSegment[];
  paragraphs?: TrackSegment[];
  events?: TrackEvent[];
  speakers?: CaptionTrack["speakers"];
  meta?: TrackMeta;
}): CaptionTrack => {
  const words = applyEmphasisMarkup(
    track.words.filter((w) => w.text.trim() !== "").map((w) => ({ ...w, text: w.text.trim() })),
  ).sort((a, b) => a.start - b.start || a.end - b.end);

  const byStart = (a: { start: number }, b: { start: number }) => a.start - b.start;
  const result: CaptionTrack = { words };
  if (track.sentences?.length) result.sentences = [...track.sentences].sort(byStart);
  if (track.paragraphs?.length) result.paragraphs = [...track.paragraphs].sort(byStart);
  if (track.events?.length) result.events = [...track.events].sort(byStart);

  const ids = new Set<string>();
  for (const item of [...words, ...(result.sentences ?? []), ...(result.paragraphs ?? [])]) {
    if (item.speaker !== undefined) ids.add(item.speaker);
  }
  const speakers = [...(track.speakers ?? [])];
  for (const id of ids) {
    if (!speakers.some((s) => s.id === id)) speakers.push({ id });
  }
  if (speakers.length) result.speakers = speakers;

  const meta: TrackMeta = { ...track.meta };
  if (words.some((w) => w.approximated)) meta.approximated = true;
  if (Object.keys(meta).length) result.meta = meta;
  return result;
};

/** @public */
export interface TrackIssue {
  kind:
    | "non-finite"
    | "reversed"
    | "overlap"
    | "unsorted"
    | "empty-text"
    | "out-of-range"
    | "unknown-speaker";
  /** Where the problem is, e.g. `words[3]` or `events[0]`. */
  path: string;
  message: string;
}

/** @public */
export interface TrackValidation {
  /** False when any issue would break rendering (non-finite or reversed times, empty text). */
  ok: boolean;
  issues: TrackIssue[];
}

const FATAL: TrackIssue["kind"][] = ["non-finite", "reversed", "empty-text"];

/**
 * Checks a track for problems that break or degrade rendering. Overlapping
 * and unsorted words are reported but do not make the track invalid:
 * speech-to-text engines produce small overlaps routinely.
 *
 * @public
 */
export const validate = (track: CaptionTrack): TrackValidation => {
  const issues: TrackIssue[] = [];
  const add = (kind: TrackIssue["kind"], path: string, message: string) =>
    issues.push({ kind, path, message });

  const checkTimes = (path: string, item: { start: unknown; end: unknown }) => {
    const { start, end } = item;
    if (typeof start !== "number" || !Number.isFinite(start) || typeof end !== "number" || !Number.isFinite(end)) {
      add("non-finite", path, `start and end must be finite numbers (got ${String(start)}, ${String(end)})`);
      return false;
    }
    if (end < start) {
      add("reversed", path, `ends before it starts (${start} → ${end})`);
      return false;
    }
    if (start < 0) add("out-of-range", path, `starts before 0 (${start})`);
    return true;
  };

  const speakerIds = track.speakers ? new Set(track.speakers.map((s) => s.id)) : undefined;
  const checkSpeaker = (path: string, speaker: string | undefined) => {
    if (speaker !== undefined && speakerIds && !speakerIds.has(speaker)) {
      add("unknown-speaker", path, `speaker "${speaker}" is not in speakers`);
    }
  };

  let previous: TrackWord | undefined;
  (track.words ?? []).forEach((word, i) => {
    const path = `words[${i}]`;
    if (typeof word.text !== "string" || word.text.trim() === "") {
      add("empty-text", path, "text is empty");
    }
    const timesOk = checkTimes(path, word);
    if (
      word.emphasis !== undefined &&
      (typeof word.emphasis !== "number" || !(word.emphasis >= 0 && word.emphasis <= 1))
    ) {
      add("out-of-range", path, `emphasis must be within 0–1 (got ${String(word.emphasis)})`);
    }
    if (word.confidence !== undefined && !(word.confidence >= 0 && word.confidence <= 1)) {
      add("out-of-range", path, `confidence must be within 0–1 (got ${String(word.confidence)})`);
    }
    checkSpeaker(path, word.speaker);
    if (timesOk && previous) {
      if (word.start < previous.start) {
        add("unsorted", path, `starts at ${word.start}, before the previous word (${previous.start})`);
      } else if (word.start < previous.end) {
        add("overlap", path, `starts at ${word.start}, before the previous word ends (${previous.end})`);
      }
    }
    if (timesOk) previous = word;
  });

  for (const key of ["sentences", "paragraphs", "events"] as const) {
    (track[key] ?? []).forEach((item, i) => {
      checkTimes(`${key}[${i}]`, item);
      if ("speaker" in item) checkSpeaker(`${key}[${i}]`, item.speaker);
    });
  }

  return { ok: !issues.some((issue) => FATAL.includes(issue.kind)), issues };
};

const containing = (segments: TrackSegment[] | undefined, time: number) => {
  if (!segments?.length) return undefined;
  // segments are sorted by start: binary-search the last one starting at or before `time`
  let lo = 0;
  let hi = segments.length - 1;
  let found = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (segments[mid].start <= time) {
      found = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  // tolerate a small overlap with the segment before it
  for (let i = found; i >= 0 && i >= found - 1; i--) {
    if (segments[i].end >= time) return segments[i];
  }
  return undefined;
};

/**
 * Converts a track into the `Caption[]` the renderer reads. Words carry the
 * bounds of the sentence and paragraph they start in, so screens break at
 * sentence ends. Numeric speaker ids stay numbers; other ids become their
 * index in `track.speakers`.
 *
 * @public
 */
export const trackToCaptions = (track: CaptionTrack): Caption[] => {
  const speakerIndex = new Map<string, number>();
  (track.speakers ?? []).forEach((s, i) => speakerIndex.set(s.id, i));
  const toSpeaker = (id: string | undefined) => {
    if (id === undefined) return undefined;
    if (/^\d+$/.test(id)) return Number(id);
    return speakerIndex.get(id);
  };

  return track.words.map((word) => {
    const caption: Caption = { word: word.text, startTime: word.start, endTime: word.end };
    if (word.highlightColor) caption.highlightColor = word.highlightColor;
    const sentence = containing(track.sentences, word.start);
    const paragraph = containing(track.paragraphs, word.start);
    if (sentence) {
      caption.sentenceStartTime = sentence.start;
      caption.sentenceEndTime = sentence.end;
    }
    if (paragraph) {
      caption.paragraphStartTime = paragraph.start;
      caption.paragraphEndTime = paragraph.end;
    }
    const speaker = toSpeaker(word.speaker ?? paragraph?.speaker ?? sentence?.speaker);
    if (speaker !== undefined) caption.speaker = speaker;
    return caption;
  });
};
