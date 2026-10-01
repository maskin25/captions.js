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

/** Renders a captions string to an offscreen canvas (Node/FFmpeg helper). */
export { renderString } from "./render/renderString";

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

export { renderFrame, renderStylePreset } from "./canvas-captions";
export { getHighlightColor } from "./canvas-captions/utils";

export {
  toCaptions,
  getParagraphs,
  type CaptionsInput,
} from "./captions-adapters";

export type { CaptionsSettings } from "./entities/captions/captions.types";

/** Default export is the `captionsjs()` factory for ergonomic imports. */
export default captionsjs;
