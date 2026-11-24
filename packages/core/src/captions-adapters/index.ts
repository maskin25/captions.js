import type { Caption } from "../entities/captions/captions.types";
import {
  DeepgramParagraph,
  type DeepgramResponse,
  getParagraphs as getDeepgramParagraphs,
} from "./deepgram";
import { toTrack } from "../track/adapters";
import { isCaptions } from "../track/adapters/loose";
import { isDeepgram } from "../track/adapters/deepgram";
import { trackToCaptions } from "../track/track.helpers";
import type { CaptionTrack } from "../track/track.types";

/**
 * Anything {@link toCaptions} accepts: `Caption[]`, a {@link CaptionTrack},
 * a speech-to-text response, or SRT / WebVTT / JSON text. See `toTrack` for
 * the full list of formats.
 */
export type CaptionsInput = DeepgramResponse | Caption[] | CaptionTrack | string | Record<string, unknown> | unknown[];

/**
 * Converts any supported transcript into the `Caption[]` the renderer reads.
 * Same as `trackToCaptions(toTrack(input))`, except that a `Caption[]` is
 * returned as it is.
 *
 * @throws When the format is not recognized.
 */
export const toCaptions = (input: unknown): Caption[] => {
  if (isCaptions(input)) return input;
  return trackToCaptions(toTrack(input));
};

export const getParagraphs = (input: unknown): DeepgramParagraph[] | null => {
  if (isDeepgram(input)) {
    return getDeepgramParagraphs(input);
  }

  return null;
};
