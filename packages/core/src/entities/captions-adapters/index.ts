import type { Caption } from "../captions/captions.types";
import {
  DeepgramParagraph,
  toCaptions as toDeepgramCaptions,
  type DeepgramResponse,
  getParagraphs as getDeepgramParagraphs,
} from "./deepgram";
import { toCaptions as toPlainCaptions, type PlainCaptions } from "./plain";

export type CaptionsInput = DeepgramResponse | PlainCaptions;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isCaptionEntry = (value: unknown): value is Caption => {
  if (!isObject(value)) return false;
  return (
    typeof value.word === "string" &&
    isFiniteNumber(value.startTime) &&
    isFiniteNumber(value.endTime)
  );
};

const isPlainCaptions = (value: unknown): value is PlainCaptions =>
  Array.isArray(value) && value.every((entry) => isCaptionEntry(entry));

const isDeepgramResponse = (value: unknown): value is DeepgramResponse => {
  if (!isObject(value)) return false;

  const result = value.result;
  if (!isObject(result)) return false;

  const results = result.results;
  if (!isObject(results) || !Array.isArray(results.channels)) return false;

  return results.channels.every(
    (channel) =>
      isObject(channel) &&
      Array.isArray(channel.alternatives) &&
      channel.alternatives.every(
        (alternative) =>
          isObject(alternative) && Array.isArray(alternative.words),
      ),
  );
};

export const toCaptions = (input: unknown): Caption[] => {
  if (isPlainCaptions(input)) {
    return toPlainCaptions(input);
  }

  if (isDeepgramResponse(input)) {
    return toDeepgramCaptions(input);
  }

  throw new Error("Unsupported captions format: unable to detect adapter.");
};

export const getParagraphs = (input: unknown): DeepgramParagraph[] | null => {
  if (isDeepgramResponse(input)) {
    return getDeepgramParagraphs(input);
  }

  return null;
};
