import Konva from "konva";
import { Ease, mapEaseToFn } from "../easing";
import { colorOption, textOn } from "./color";
import { numberOption, type Effect } from "./types";

/**
 * Highlight Sweep: a rounded plate grows behind the spoken word from left to
 * right as the word is said, like a marker following the voice. The plate's
 * padding and corners follow the word's font size.
 *
 * Options: `sweepColor` (plate color, default the preset's `backgroundColor`),
 * `sweepMin` (s, 0.12: words shorter than this still sweep over this long),
 * `sweepShadow` (text shadow strength 0–1, 0.5).
 */
export const sweep: Effect = {
  // the accent is the plate; the word on it turns black or white to stay readable
  accent: (settings, color) => {
    const { sweepColor: _, ...options } = settings.animationOptions ?? {};
    return {
      ...settings,
      style: { ...settings.style, backgroundColor: color, highlightColor: textOn(color) },
      animationOptions: options,
    };
  },
  apply({ words, active, options, settings }) {
    const shadow = numberOption(options, "sweepShadow", 0.5);
    if (shadow > 0) {
      for (const { text } of words) {
        const size = text.fontSize();
        text.shadowColor("#000000");
        text.shadowOpacity(Math.min(1, shadow));
        text.shadowBlur(size * 0.18);
        text.shadowOffset({ x: 0, y: size * 0.04 });
      }
    }
    if (!active) return;

    const { text, caption } = active;
    const minimum = numberOption(options, "sweepMin", 0.12);
    const duration = Math.max(minimum, caption.endTime - caption.startTime);
    const t = Math.min(1, Math.max(0, active.elapsed / duration));
    const reach = mapEaseToFn[Ease.outCubic](t);
    if (reach <= 0) return;

    const size = text.fontSize();
    const label = text.text().trim();
    const measured = label === text.text() ? text.width() : text.clone({ text: label }).width();
    const paddingX = size * 0.14;
    const paddingY = size * 0.04;
    const full = measured + paddingX * 2;
    const plate = new Konva.Rect({
      x: text.x() - paddingX,
      y: text.y() - paddingY,
      width: full * reach,
      height: text.height() + paddingY * 2,
      fill: colorOption(options, "sweepColor", settings.style.backgroundColor),
      cornerRadius: Math.min(size * 0.18, (full * reach) / 2),
    });
    // the plate sits behind the word; the word itself has no shadow on it
    text.shadowOpacity(0);
    text.parent?.add(plate);
    plate.moveToBottom();
  },
};
