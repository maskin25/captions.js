import { Ease, mapEaseToFn } from "../easing";
import { inkWidth, latestStarted } from "./measure";
import { numberOption, type Effect } from "./types";

/**
 * Slam: one word at a time, as big as fits the frame. Each word enters its
 * own way, chosen by its index: it drops in, slides from the left, grows
 * from small, or slides from the right. Between words the last one stays.
 *
 * Options: `slamWidth` (share of the frame width, or of the safe area's
 * width, a word may fill, 0.86),
 * `slamMax` (largest scale over the preset's size, 2.4), `slamShadow`
 * (text shadow strength 0–1, 0.6).
 */
export const slam: Effect = {
  apply({ words, active, options, width, height, frameWidth, areaWidth }) {
    const share = numberOption(options, "slamWidth", 0.86);
    const maxScale = numberOption(options, "slamMax", 2.4);
    const shadow = numberOption(options, "slamShadow", 0.6);
    const shown = latestStarted(words, active);

    for (const word of words) if (word.index !== shown?.index) word.text.opacity(0);
    if (!shown) return;

    const { text } = shown;
    const size = text.fontSize();
    const ink = inkWidth(text);
    const fit = Math.min(maxScale, (areaWidth * share) / Math.max(1, ink));
    const lineX = text.parent?.x() ?? 0;
    const lineY = text.parent?.y() ?? 0;
    // the centre of the screen, in the word's line coordinates
    const cx = width / 2 - lineX;
    const cy = height / 2 - lineY;
    text.offsetX(ink / 2);
    text.offsetY(text.height() / 2);
    if (shadow > 0) {
      text.shadowColor("#000000");
      text.shadowOpacity(Math.min(1, shadow));
      text.shadowBlur(size * 0.2);
      text.shadowOffset({ x: 0, y: size * 0.05 });
    }

    const t = shown.elapsed;
    let x = cx;
    let y = cy;
    let scale = fit;
    let opacity = 1;
    switch (shown.index % 4) {
      case 0: {
        // drop in from above, overshooting a little
        const k = Math.min(1, t / 0.22);
        y = cy - (1 - mapEaseToFn[Ease.outBack](k)) * size * fit * 0.9;
        opacity = Math.min(1, k * 4);
        break;
      }
      case 1:
      case 3: {
        // slide in from the left (1) or the right (3)
        const k = Math.min(1, t / 0.2);
        const from = (shown.index % 4 === 1 ? -1 : 1) * frameWidth * 0.4;
        x = cx + from * (1 - mapEaseToFn[Ease.outExpo](k));
        opacity = Math.min(1, k * 3);
        break;
      }
      default: {
        // grow from 40%
        const k = Math.min(1, t / 0.24);
        scale = fit * (0.4 + 0.6 * mapEaseToFn[Ease.outBack](k));
        opacity = Math.min(1, k * 4);
      }
    }
    text.x(x);
    text.y(y);
    text.scale({ x: scale, y: scale });
    text.opacity(opacity);
  },
};
