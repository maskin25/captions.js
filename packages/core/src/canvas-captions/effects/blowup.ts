import { getHighlightColor } from "../utils";
import { emphasisStrength } from "../layout";
import { inkWidth, seeded } from "./measure";
import { springAt } from "./spring";
import { numberOption, type Effect } from "./types";

/**
 * Keyword Blowup: key words (emphasis × expressiveness ≥ 0.5) are set large
 * and blow up when spoken: they spring in from larger than their size, tilt
 * a little and take the accent color, which they keep. Other words stay
 * plain. With the preset's `autoEmphasis`, numbers, amounts and trigger
 * words become key words on their own; emphasis from the data or
 * annotations works the same way.
 *
 * Colors: words are `fontColor`, key words turn `highlightColor` (or the
 * word's own or its speaker's color) once spoken.
 *
 * Options: `blowupFrom` (scale a key word starts at when spoken, 1.3),
 * `blowupTilt` (largest tilt of a key word in degrees, 4),
 * `blowupShadow` (shadow strength 0–1, 0.7).
 */
export const blowup: Effect = {
  apply({ words, active, options, settings }) {
    const from = numberOption(options, "blowupFrom", 1.3);
    const tilt = numberOption(options, "blowupTilt", 4);
    const shadow = numberOption(options, "blowupShadow", 0.7);
    const ink = settings.style.font.fontColor;

    // extra half-width of each key word while it is larger than its size,
    // so neighbours on its line make room (as in bounce)
    const extra = new Map<number, number>();
    for (const word of words) {
      const { text, caption } = word;
      const size = text.fontSize();
      if (shadow > 0) {
        text.shadowColor("#000000");
        text.shadowOpacity(Math.min(1, shadow));
        text.shadowBlur(size * 0.18);
        text.shadowOffset({ x: 0, y: size * 0.06 });
      }
      text.fill(ink);
      if (emphasisStrength(caption, settings) < 0.5 || word.elapsed < 0) continue;

      text.fill(caption.highlightColor || getHighlightColor(settings));
      const s = springAt(word.elapsed, 3.4, 0.42);
      const scale = from + (1 - from) * s;
      // blow up around the bottom centre of the visible word
      const width = inkWidth(text);
      const height = text.height();
      text.offsetX(width / 2);
      text.offsetY(height);
      text.x(text.x() + width / 2);
      text.y(text.y() + height);
      text.scale({ x: scale, y: scale });
      text.rotation(seeded(word.index, 3) * tilt * Math.min(1, s));
      if (scale > 1) extra.set(word.index, ((scale - 1) * width) / 2);
      // the spoken key word draws over its neighbours
      if (word.index === active?.index) text.moveToTop();
    }
    for (const word of words) {
      let shift = 0;
      for (const other of words) {
        const grow = extra.get(other.index);
        if (!grow || other.line !== word.line || other.index === word.index) continue;
        shift += other.index < word.index ? grow : -grow;
      }
      if (shift) word.text.x(word.text.x() + shift);
    }
  },
};
