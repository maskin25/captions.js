import fs from "node:fs";
import {
  applyAnnotations,
  parseAnnotations,
  toCaptions,
  speakersFromTrack,
  toTrack,
  trackToCaptions,
  type SpeakerStyle,
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

/** The transcript itself: parsed input, inline text, or a file's text. */
const transcriptInput = async (source: string | unknown[] | Record<string, unknown>) => {
  if (typeof source !== "string") return source;
  const trimmed = source.trim();
  if (trimmed.startsWith("[") || trimmed.startsWith("{") || /-->/.test(trimmed)) return trimmed;
  const file = /^https?:\/\//i.test(trimmed) ? await download(trimmed) : trimmed;
  if (!fs.existsSync(file)) {
    throw new Error(`Captions file not found: ${file}`);
  }
  return fs.readFileSync(file, "utf-8");
};

/**
 * Loads captions from an array or object, from JSON / SRT / WebVTT text, from
 * a file path or from an http(s) URL.
 */
export const loadCaptions = async (
  source: string | unknown[] | Record<string, unknown>,
): Promise<Caption[]> => normalizeCaptions(await transcriptInput(source));

/**
 * Like {@link loadCaptions}, plus speaker names the transcript carries
 * (WebVTT voices, named speakers in a caption track), as
 * `CaptionsSettings.speakers`.
 */
export const loadTranscript = async (
  source: string | unknown[] | Record<string, unknown>,
): Promise<{ captions: Caption[]; speakers: SpeakerStyle[] }> => {
  const input = await transcriptInput(source);
  const captions = normalizeCaptions(input);
  const speakers = speakersFromTrack(toTrack(input));
  // numbered speakers without names add nothing
  return { captions, speakers: speakers.some((s) => s.label) ? speakers : [] };
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
