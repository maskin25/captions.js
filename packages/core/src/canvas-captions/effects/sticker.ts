import Konva from "konva";
import { getHighlightColor } from "../utils";
import { inkWidth, seeded } from "./measure";
import { springAt } from "./spring";
import { DECORATION, numberOption, type Effect } from "./types";

/**
 * Sticker Tape: every word is printed on its own strip of tape, tilted a
 * little. The spoken word's strip changes color and pops in on a spring.
 * Tilt is seeded from the word's index, so a word keeps its angle on every
 * frame; padding, shadow and pop follow the font size.
 *
 * Colors: strips are `backgroundColor`, the spoken word's strip is
 * `highlightColor`, text is `fontColor`.
 *
 * Options: `stickerTilt` (largest tilt in degrees, 5), `stickerPaddingX`
 * (em, 0.16), `stickerPaddingY` (em, 0.04), `stickerPop` (how far the
 * spoken strip starts below full size, 0–1, 0.2), `stickerShadow` (strip
 * shadow strength 0–1, 0.4).
 */
export const sticker: Effect = {
  apply({ words, active, options, settings }) {
    const tilt = numberOption(options, "stickerTilt", 5);
    const padXEm = numberOption(options, "stickerPaddingX", 0.16);
    const padYEm = numberOption(options, "stickerPaddingY", 0.04);
    const pop = numberOption(options, "stickerPop", 0.2);
    const shadow = numberOption(options, "stickerShadow", 0.4);
    const ink = settings.style.font.fontColor;
    const highlight = getHighlightColor(settings);

    let activeStrip: Konva.Rect | undefined;
    for (const word of words) {
      const { text, caption } = word;
      const size = text.fontSize();
      const isActive = word.index === active?.index;
      const width = inkWidth(text);
      const height = text.height();
      const angle = seeded(word.index, 1) * tilt;
      const scale = isActive ? 1 - pop + pop * springAt(word.elapsed, 4, 0.45) : 1;
      if (isActive) text.fill(ink);
      text.shadowOpacity(0);

      // rotate and scale the word around its centre
      const cx = text.x() + width / 2;
      const cy = text.y() + height / 2;
      text.offsetX(width / 2);
      text.offsetY(height / 2);
      text.x(cx);
      text.y(cy);
      text.rotation(angle);
      text.scale({ x: scale, y: scale });

      const padX = size * padXEm;
      const padY = size * padYEm;
      const strip = new Konva.Rect({
        name: DECORATION,
        x: cx,
        y: cy,
        width: width + padX * 2,
        height: height + padY * 2,
        offsetX: width / 2 + padX,
        offsetY: height / 2 + padY,
        rotation: angle,
        scaleX: scale,
        scaleY: scale,
        fill: isActive ? caption.highlightColor || highlight : settings.style.backgroundColor,
        cornerRadius: size * 0.03,
        shadowColor: "#000000",
        shadowOpacity: Math.min(1, Math.max(0, shadow)),
        shadowBlur: size * 0.18,
        shadowOffset: { x: 0, y: size * 0.05 },
      });
      text.parent?.add(strip);
      strip.moveToBottom();
      if (isActive) activeStrip = strip;
    }
    // the spoken word's strip sits above its neighbours
    if (active) {
      active.text.parent?.moveToTop();
      activeStrip?.moveToTop();
      active.text.moveToTop();
    }
  },
};
