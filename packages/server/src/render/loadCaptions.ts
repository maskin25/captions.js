import fs from "node:fs";
import {
  applyAnnotations,
  parseAnnotations,
  toCaptions,
  toTrack,
  trackToCaptions,
  type AnnotationIssue,
  type Caption,
  type CaptionAnnotations,
} from "captions.js";
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

/** Reads a file path or http(s) URL as text. */
const readSource = async (source: string) => {
  const file = /^https?:\/\//i.test(source) ? await download(source) : source;
  if (!fs.existsSync(file)) {
    throw new Error(`File not found: ${file}`);
  }
  return fs.readFileSync(file, "utf-8");
};

/**
 * Loads an annotations file (see `applyAnnotations` in captions.js) from an
 * object, from JSON text (an LLM reply with prose or a code fence around it
 * is fine), from a file path or from an http(s) URL.
 */
export const loadAnnotations = async (
  source: string | CaptionAnnotations | Record<string, unknown>,
): Promise<CaptionAnnotations> => {
  if (typeof source !== "string") return parseAnnotations(source);
  const looksInline = /^\s*\{/.test(source) || source.includes("```");
  return parseAnnotations(looksInline ? source : await readSource(source.trim()));
};

/** Applies annotations to captions; manual emphasis in the captions wins. */
export const annotateCaptions = (
  captions: Caption[],
  annotations: CaptionAnnotations,
): { captions: Caption[]; applied: number; issues: AnnotationIssue[] } => {
  const { track, applied, issues } = applyAnnotations(toTrack(captions), annotations);
  return { captions: trackToCaptions(track), applied, issues };
};
