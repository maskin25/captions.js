import fs from "node:fs";
import { toCaptions, type Caption } from "captions.js";
import { download } from "../utils/download.js";

/**
 * Converts any transcript `captions.js` understands into `Caption[]`.
 * Kept for compatibility: it is `toCaptions()` from core, so the CLI and the
 * browser accept exactly the same inputs.
 */
export const normalizeCaptions = (input: unknown): Caption[] => {
  const captions = toCaptions(input);
  if (!captions.length) {
    throw new Error("The captions input contains no timed words.");
  }
  return captions;
};

/**
 * Loads captions from an array or object, from JSON / SRT / WebVTT text, from
 * a file path or from an http(s) URL.
 */
export const loadCaptions = async (
  source: string | unknown[] | Record<string, unknown>,
): Promise<Caption[]> => {
  if (typeof source !== "string") return normalizeCaptions(source);

  const trimmed = source.trim();
  if (trimmed.startsWith("[") || trimmed.startsWith("{") || /-->/.test(trimmed)) {
    return normalizeCaptions(trimmed);
  }

  const file = /^https?:\/\//i.test(trimmed) ? await download(trimmed) : trimmed;
  if (!fs.existsSync(file)) {
    throw new Error(`Captions file not found: ${file}`);
  }
  return normalizeCaptions(fs.readFileSync(file, "utf-8"));
};
