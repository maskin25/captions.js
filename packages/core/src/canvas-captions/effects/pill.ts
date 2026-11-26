import Konva from "konva";
import { getHighlightColor } from "../utils";
import { mix } from "./color";
import { inkWidth } from "./measure";
import { DECORATION, attack, numberOption, type Effect } from "./types";

/**
 * Pill: each line sits on a light, fully rounded plate. Words start grey and
 * turn dark as they are spoken (a 0.1 s change), and stay dark. Plate
 * padding, corners and shadow follow the font size.
 *
 * Colors: plate `backgroundColor`, words not spoken yet `fontColor`, spoken
 * words `highlightColor`.
 *
 * Options: `pillPaddingX` (em, 0.42), `pillPaddingY` (em, 0.16),
 * `pillShadow` (plate shadow strength 0–1, 0.35), `pillFade` (s, 0.1).
 */
export const pill: Effect = {
  apply({ words, active, options, settings }) {
    const padXEm = numberOption(options, "pillPaddingX", 0.42);
    const padYEm = numberOption(options, "pillPaddingY", 0.16);
    const shadow = numberOption(options, "pillShadow", 0.35);
    const fade = numberOption(options, "pillFade", 0.1);
    const grey = settings.style.font.fontColor;
    const dark = getHighlightColor(settings);

    // word colors
    for (const word of words) {
      const { text, caption } = word;
      text.shadowOpacity(0);
      const spoken = caption.highlightColor || dark;
      if (word.state === "past") text.fill(spoken);
      else if (word.index === active?.index) text.fill(mix(grey, spoken, attack(word, fade)));
    }

    // one plate per line, around the words' ink
    const lines = new Map<Konva.Container, { left: number; right: number; top: number; bottom: number; size: number }>();
    for (const { text } of words) {
      const parent = text.parent;
      if (!parent) continue;
      const box = lines.get(parent);
      const left = text.x();
      const right = text.x() + inkWidth(text);
      const top = text.y();
      const bottom = text.y() + text.height();
      const size = text.fontSize();
      if (!box) lines.set(parent, { left, right, top, bottom, size });
      else {
        box.left = Math.min(box.left, left);
        box.right = Math.max(box.right, right);
        box.top = Math.min(box.top, top);
        box.bottom = Math.max(box.bottom, bottom);
        box.size = Math.max(box.size, size);
      }
    }
    for (const [parent, { left, right, top, bottom, size }] of lines) {
      const padX = size * padXEm;
      const padY = size * padYEm;
      const height = bottom - top + padY * 2;
      const plate = new Konva.Rect({
        name: DECORATION,
        x: left - padX,
        y: top - padY,
        width: right - left + padX * 2,
        height,
        fill: settings.style.backgroundColor,
        cornerRadius: height / 2,
        shadowColor: "#000000",
        shadowOpacity: Math.min(1, Math.max(0, shadow)),
        shadowBlur: size * 0.3,
        shadowOffset: { x: 0, y: size * 0.06 },
      });
      parent.add(plate);
      plate.moveToBottom();
    }
  },
};
