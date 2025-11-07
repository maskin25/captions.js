export function renderCaptions(ctx: CanvasRenderingContext2D, text: string) {
  ctx.font = "48px sans-serif";
  ctx.fillStyle = "red";
  ctx.fillText(text, 150, 50);
  return true;
}

export { googleFontsList } from "./fonts/googleFonts.config";

export {
  type StylePreset,
  stylePresets,
} from "./stylePresets/stylePresets.config";

export { renderString } from "./render/renderString";

export { Caption } from "./entities/captions/captions.types";

import { captionsjs } from "./captions/Captions";

export {
  Captions,
  captionsjs,
  type CaptionsOptions,
  type CaptionsInstance,
} from "./captions/Captions";

export default captionsjs;
