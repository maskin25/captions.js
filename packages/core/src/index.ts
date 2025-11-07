/**
 * Simple canvas demo renderer used only for the docs playground.
 * Keeps a reference implementation of drawing raw text to a canvas.
 *
 * @param {CanvasRenderingContext2D} ctx - Target 2D context to draw on.
 * @param {string} text - Arbitrary string that should be painted on the canvas.
 * @returns {boolean} Always returns true to match the historical API surface.
 */
export function renderCaptions(
  ctx: CanvasRenderingContext2D,
  text: string
) {
  ctx.font = "48px sans-serif";
  ctx.fillStyle = "red";
  ctx.fillText(text, 150, 50);
  return true;
}

/** Collection of Google Fonts that captions.js knows how to load on demand. */
export { googleFontsList } from "./fonts/googleFonts.config";

/** Predefined caption appearance presets and their strong typings. */
export {
  type StylePreset,
  stylePresets,
} from "./stylePresets/stylePresets.config";

/**
 * Renders a captions string to an offscreen canvas.
 * Used by Node/FFmpeg integrations.
 */
export { renderString } from "./render/renderString";

/** Strong typing for caption entries (word timing, styling etc). */
export { Caption } from "./entities/captions/captions.types";

import { captionsjs } from "./captions/Captions";

/** Public captions engine along with the convenience factory + typings. */
export {
  Captions,
  captionsjs,
  type CaptionsOptions,
  type CaptionsInstance,
} from "./captions/Captions";

/** Default export is the `captionsjs()` factory for ergonomic imports. */
export default captionsjs;
