/** Collection of Google Fonts that captions.js knows how to load on demand. */
export { googleFontsList } from "./fonts/googleFonts.config";
export {
  preloadGoogleFont,
  type LoadGoogleFontOptions,
} from "./fonts/googleFonts.helpers";

/** Predefined caption appearance presets and their strong typings. */
export {
  type StylePreset,
  stylePresets,
  type StylePresetName,
  getPreset,
  presetNames,
} from "./stylePresets/stylePresets.config";


/** Strong typing for caption entries (word timing, styling etc). */
export type { Caption } from "./entities/captions/captions.types";

import { captionsjs } from "./captions/Captions";

/** Public captions engine along with the convenience factory + typings. */
export {
  Captions,
  captionsjs,
  type CaptionsOptions,
  type CaptionsInstance,
} from "./captions/Captions";

export {
  renderFrame,
  renderStylePreset,
  type RenderFrameOptions,
} from "./canvas-captions";

/** Effects: one module per animation; add your own with registerEffect. */
export {
  attack,
  DECORATION,
  getEffect,
  numberOption,
  registerEffect,
  type Effect,
  type EffectContext,
  type EffectWord,
  type WordState,
} from "./canvas-captions/effects";
export { getHighlightColor } from "./canvas-captions/utils";

export {
  toCaptions,
  getParagraphs,
  type CaptionsInput,
} from "./captions-adapters";

export type {
  BuiltInAnimation,
  CaptionsSettings,
} from "./entities/captions/captions.types";

/** Normalized caption track, its input adapters and validation. */
export type {
  CaptionTrack,
  TrackWord,
  TrackSegment,
  TrackSpeaker,
  TrackEvent,
  TrackMeta,
  TrackSource,
  EmphasisSource,
} from "./track/track.types";
export {
  toTrack,
  detectFormat,
  fromAssemblyAI,
  fromCaptions,
  fromDeepgram,
  fromElevenLabs,
  fromSrt,
  fromVtt,
  fromWhisper,
  fromWhisperCpp,
  fromWords,
  type AssemblyAITranscript,
  type ElevenLabsTranscript,
  type WhisperVerboseJson,
  type WhisperCppJson,
} from "./track/adapters";
export {
  trackToCaptions,
  validate,
  type TrackIssue,
  type TrackValidation,
} from "./track/track.helpers";
/** Emphasis annotations (e.g. written by an LLM): prompt, parse, apply. */
export {
  ANNOTATIONS_SCHEMA,
  annotationPrompt,
  applyAnnotations,
  parseAnnotations,
  type AnnotationIssue,
  type AnnotationResult,
  type CaptionAnnotations,
  type EmphasisAnnotation,
} from "./track/annotations";
export { EMPHASIS_MAX_SCALE } from "./entities/captions/captions.types";
export type { DeepgramResponse } from "./captions-adapters/deepgram";

/** Default export is the `captionsjs()` factory for ergonomic imports. */
export default captionsjs;
