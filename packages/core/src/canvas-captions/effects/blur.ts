import Konva from "konva";
import { inkWidth } from "./measure";
import { attack, numberOption, type Effect } from "./types";

/**
 * Blur Focus: each word arrives out of focus as it is spoken and sharpens,
 * settling from slightly larger than its size. Words not spoken yet are
 * hidden; spoken words stay sharp. Blur radius follows the font size.
 *
 * The blur is Konva's Blur filter on a cached copy of the word, so the
 * browser and the server blur the same way; a sharp word is drawn as text.
 *
 * Colors: the spoken word is `highlightColor`, the rest `fontColor`.
 *
 * Options: `blurTime` (s until a word is sharp, 0.45), `blurRadius`
 * (starting blur in em, 0.3), `blurFrom` (starting scale, 1.08),
 * `blurShadow` (shadow strength 0–1, 0.5), `blurGap` (extra space between
 * words in em, 0.12; the blur of a word arriving needs room).
 */
export const blurFocus: Effect = {
  wordGap: (options) => numberOption(options, "blurGap", 0.12),
  apply({ words, options }) {
    const duration = numberOption(options, "blurTime", 0.45);
    const radiusEm = numberOption(options, "blurRadius", 0.3);
    const from = numberOption(options, "blurFrom", 1.08);
    const shadow = numberOption(options, "blurShadow", 0.5);

    for (const word of words) {
      const { text } = word;
      const size = text.fontSize();
      if (shadow > 0) {
        text.shadowColor("#000000");
        text.shadowOpacity(Math.min(1, shadow));
        text.shadowBlur(size * 0.25);
        text.shadowOffset({ x: 0, y: size * 0.04 });
      }
      if (word.elapsed < 0) {
        text.opacity(0);
        continue;
      }
      const focus = 1 - (1 - attack(word, duration)) ** 3;
      if (focus >= 1) continue;

      text.opacity(Math.min(1, 0.15 + focus * 1.7));
      const scale = from + (1 - from) * focus;
      if (scale !== 1) {
        // settle around the centre of the visible word
        const width = inkWidth(text);
        const height = text.height();
        text.offsetX(width / 2);
        text.offsetY(height / 2);
        text.x(text.x() + width / 2);
        text.y(text.y() + height / 2);
        text.scale({ x: scale, y: scale });
      }
      const radius = Math.round(size * radiusEm * (1 - focus));
      if (radius < 1) continue;
      text.cache({ offset: radius * 2 + Math.ceil(size * 0.3), pixelRatio: 1 });
      text.filters([Konva.Filters.Blur]);
      text.blurRadius(radius);
    }
  },
};
