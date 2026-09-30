import fs from "node:fs";
import { toCaptions, type Caption } from "captions.js";
import { download } from "../utils/download.js";

const isObject = (value: unknown): value is Record<string, any> =>
  typeof value === "object" && value !== null;

const num = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

/**
 * Accepts the loose word-timing shapes people usually have lying around:
 * `{ word|text, start|startTime, end|endTime }` arrays, OpenAI Whisper
 * `verbose_json` (top-level `words` or `segments[].words`), and anything the
 * core `toCaptions` understands (plain captions, Deepgram responses).
 */
export const normalizeCaptions = (input: unknown): Caption[] => {
  try {
    return toCaptions(input);
  } catch {
    // fall through to the loose shapes below
  }

  let words: unknown[] | undefined;
  if (Array.isArray(input)) {
    words = input;
  } else if (isObject(input) && Array.isArray(input.words)) {
    words = input.words;
  } else if (isObject(input) && Array.isArray(input.segments)) {
    words = input.segments.flatMap((segment: unknown) =>
      isObject(segment) && Array.isArray(segment.words) ? segment.words : [],
    );
  }

  const captions: Caption[] = [];
  for (const item of words ?? []) {
    if (!isObject(item)) continue;
    const word = String(item.word ?? item.text ?? item.punctuated_word ?? "").trim();
    const startTime = num(item.startTime) ?? num(item.start);
    const endTime = num(item.endTime) ?? num(item.end);
    if (!word || startTime === undefined || endTime === undefined) continue;
    captions.push({ word, startTime, endTime });
  }

  if (!captions.length) {
    throw new Error(
      "Unsupported captions format. Expected word timings: " +
        '[{ "word": "Hello", "start": 0.1, "end": 0.4 }], Whisper verbose_json, or a Deepgram response.',
    );
  }
  return captions;
};

/** Loads captions from an array, a JSON string, a file path or an http(s) URL. */
export const loadCaptions = async (
  source: string | unknown[] | Record<string, unknown>,
): Promise<Caption[]> => {
  if (typeof source !== "string") return normalizeCaptions(source);

  const trimmed = source.trim();
  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    return normalizeCaptions(JSON.parse(trimmed));
  }

  const file = /^https?:\/\//i.test(trimmed) ? await download(trimmed) : trimmed;
  if (!fs.existsSync(file)) {
    throw new Error(`Captions file not found: ${file}`);
  }
  return normalizeCaptions(JSON.parse(fs.readFileSync(file, "utf-8")));
};
