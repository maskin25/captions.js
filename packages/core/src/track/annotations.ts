import type { CaptionTrack, TrackWord } from "./track.types";

/**
 * An annotations file: word emphasis chosen outside the library, typically by
 * an LLM that was given {@link annotationPrompt}. captions.js never calls a
 * model; it validates the file and applies it with {@link applyAnnotations}.
 *
 * ```json
 * { "version": 1,
 *   "emphasis": [{ "index": 14, "text": "billion", "value": 1 }] }
 * ```
 *
 * @public
 */
export interface CaptionAnnotations {
  version: 1;
  emphasis: EmphasisAnnotation[];
}

/** @public */
export interface EmphasisAnnotation {
  /** Position of the word in `track.words`, from 0, as numbered in the prompt. */
  index: number;
  /** The word as it appears at `index`; guards against a shifted index. */
  text: string;
  /** How strongly to stress the word, 0–1. Default 1. */
  value?: number;
  /** Why the word matters, for people reviewing the file. Ignored when rendering. */
  reason?: string;
}

/**
 * - `invalid`: the entry is not usable (no index, no text, not an object).
 * - `out-of-range`: `value` outside 0–1, clamped.
 * - `shifted`: `text` was found near `index`, not at it; applied there.
 * - `not-found`: `text` is not at or near `index`; skipped.
 * - `manual-wins`: the word already has manual emphasis, which is kept.
 * - `duplicate`: a later entry for the same word replaced an earlier one.
 *
 * @public
 */
export interface AnnotationIssue {
  kind: "invalid" | "out-of-range" | "shifted" | "not-found" | "manual-wins" | "duplicate";
  /** Position of the entry in `annotations.emphasis`. */
  entry: number;
  message: string;
}

/** @public */
export interface AnnotationResult {
  track: CaptionTrack;
  /** Number of words whose emphasis now comes from the annotations. */
  applied: number;
  issues: AnnotationIssue[];
}

/** How far from `index` a matching word is still accepted. */
const SEARCH_RADIUS = 5;

/** JSON Schema of {@link CaptionAnnotations}, for LLM structured output. @public */
export const ANNOTATIONS_SCHEMA = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "captions.js annotations",
  type: "object",
  required: ["version", "emphasis"],
  additionalProperties: false,
  properties: {
    version: { const: 1 },
    emphasis: {
      type: "array",
      items: {
        type: "object",
        required: ["index", "text"],
        additionalProperties: false,
        properties: {
          index: { type: "integer", minimum: 0, description: "Word number from the list" },
          text: { type: "string", description: "The word exactly as listed" },
          value: { type: "number", minimum: 0, maximum: 1, description: "Strength, 1 = strongest" },
          reason: { type: "string", description: "Short reason, for review" },
        },
      },
    },
  },
} as const;

/**
 * Text to send to an LLM, with the numbered words of `track`. Its answer goes
 * to {@link parseAnnotations} and {@link applyAnnotations}.
 *
 * @public
 */
export const annotationPrompt = (
  track: CaptionTrack,
  options: { share?: number; language?: string } = {},
): string => {
  const share = Math.round((options.share ?? 0.1) * 100);
  const words = track.words.map((w, i) => `${i}:${w.text}`).join(" ");
  return [
    "You choose which words of a video transcript to emphasize in animated captions.",
    `Pick the words a speaker would stress: numbers, names, key nouns, contrasts, punchlines, strong emotion. Mark about ${share}% of the words, at most one or two per sentence, and never filler words.`,
    "Give each a value from 0 to 1: 1 for the few words that carry the whole sentence, 0.5–0.8 for supporting ones.",
    'Answer with JSON only, in this shape: {"version":1,"emphasis":[{"index":14,"text":"billion","value":1,"reason":"the number"}]}',
    '"index" is the number before the colon; "text" is the word exactly as listed.',
    options.language ? `The transcript is in ${options.language}.` : "",
    "",
    "Words:",
    words,
  ]
    .filter((line, i, all) => line !== "" || all[i - 1] !== "")
    .join("\n");
};

/**
 * Reads an annotations file from JSON text or an object. LLM replies are
 * accepted with surrounding prose or a ```json code fence. Throws when no
 * annotations object can be found; entry-level problems are left to
 * {@link applyAnnotations}, which reports them.
 *
 * @public
 */
export const parseAnnotations = (input: unknown): CaptionAnnotations => {
  let value = input;
  if (typeof input === "string") {
    const fenced = input.match(/```(?:json)?\s*([\s\S]*?)```/);
    const text = fenced ? fenced[1] : input;
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end <= start) {
      throw new Error("captions.js: no JSON object found in the annotations text");
    }
    try {
      value = JSON.parse(text.slice(start, end + 1));
    } catch (error) {
      throw new Error(`captions.js: annotations are not valid JSON (${(error as Error).message})`);
    }
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("captions.js: annotations must be an object with an `emphasis` array");
  }
  const object = value as Record<string, unknown>;
  if (object.version !== undefined && object.version !== 1) {
    throw new Error(`captions.js: unsupported annotations version ${String(object.version)} (expected 1)`);
  }
  if (!Array.isArray(object.emphasis)) {
    throw new Error("captions.js: annotations need an `emphasis` array");
  }
  return { version: 1, emphasis: object.emphasis as EmphasisAnnotation[] };
};

// Compare words without case, punctuation or *markup*; a word that is only
// symbols ("%", "&") is compared as it is.
const normalize = (text: string) => {
  const folded = text.toLowerCase().normalize("NFKC");
  return folded.replace(/[^\p{L}\p{N}]+/gu, "") || folded.trim();
};

/**
 * Applies emphasis annotations to a track and returns a new track. A word's
 * emphasis from `*markup*` or set in the data (`emphasisSource: "manual"`)
 * always wins; annotations replace emphasis from any other source.
 *
 * @public
 */
export const applyAnnotations = (
  track: CaptionTrack,
  annotations: CaptionAnnotations | unknown,
): AnnotationResult => {
  const { emphasis } = parseAnnotations(annotations);
  const words: TrackWord[] = track.words.map((w) => ({ ...w }));
  const normalized = words.map((w) => normalize(w.text));
  const issues: AnnotationIssue[] = [];
  const setBy = new Map<number, number>();

  emphasis.forEach((raw, entry) => {
    const item = raw as Partial<EmphasisAnnotation> | null;
    if (
      !item ||
      typeof item !== "object" ||
      typeof item.index !== "number" ||
      !Number.isInteger(item.index) ||
      typeof item.text !== "string" ||
      normalize(item.text) === ""
    ) {
      issues.push({ kind: "invalid", entry, message: "needs an integer `index` and a non-empty `text`" });
      return;
    }

    let value = item.value ?? 1;
    if (typeof value !== "number" || !Number.isFinite(value)) {
      issues.push({ kind: "invalid", entry, message: "`value` must be a number from 0 to 1" });
      return;
    }
    if (value < 0 || value > 1) {
      issues.push({ kind: "out-of-range", entry, message: `value ${value} clamped to 0–1` });
      value = Math.min(1, Math.max(0, value));
    }

    const wanted = normalize(item.text);
    let at = -1;
    for (let d = 0; d <= SEARCH_RADIUS && at === -1; d++) {
      for (const candidate of d === 0 ? [item.index] : [item.index - d, item.index + d]) {
        if (normalized[candidate] === wanted) {
          at = candidate;
          break;
        }
      }
    }
    if (at === -1) {
      const actual = words[item.index]?.text;
      issues.push({
        kind: "not-found",
        entry,
        message: `"${item.text}" is not at word ${item.index}${actual === undefined ? " (no such word)" : ` ("${actual}")`} or within ${SEARCH_RADIUS} words of it`,
      });
      return;
    }
    if (at !== item.index) {
      issues.push({ kind: "shifted", entry, message: `"${item.text}" found at word ${at}, not ${item.index}` });
    }

    const word = words[at];
    if (word.emphasisSource === "manual") {
      issues.push({ kind: "manual-wins", entry, message: `word ${at} ("${word.text}") keeps its manual emphasis` });
      return;
    }
    if (setBy.has(at)) {
      issues.push({ kind: "duplicate", entry, message: `word ${at} was already annotated by entry ${setBy.get(at)}` });
    }
    setBy.set(at, entry);
    word.emphasis = value;
    word.emphasisSource = "annotation";
  });

  return { track: { ...track, words }, applied: setBy.size, issues };
};
