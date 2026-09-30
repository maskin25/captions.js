/**
 * @captionsjs/server — burn captions.js captions into video files with FFmpeg.
 *
 * Uses the exact same `renderFrame` as the browser overlay, drawn through
 * skia-canvas. No headless browser.
 */
export {
  burnCaptions,
  probeVideo,
  type BurnCaptionsParams,
  type BurnCaptionsResult,
} from "./render/burnCaptions.js";
export { loadCaptions, normalizeCaptions } from "./render/loadCaptions.js";
export {
  resolveFontFile,
  defaultFontCacheDir,
  type ResolveFontOptions,
} from "./render/fonts.js";
