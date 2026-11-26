import Konva from "konva";
import { getHighlightColor } from "../utils";
import { inkWidth, latestStarted } from "./measure";
import { DECORATION, numberOption, type Effect } from "./types";

/**
 * Typewriter: words are typed letter by letter as they are spoken, with a
 * caret after the last typed letter. The caret is solid while typing and
 * blinks while waiting for the next word. Words not spoken yet are hidden.
 * Caret size follows the font size.
 *
 * Colors: words are `fontColor`, the caret is `highlightColor`.
 *
 * Options: `typeCharTime` (s per letter at most, 0.06; long words type no
 * slower than this), `typeShadow` (text shadow strength 0–1, 0.6),
 * `typeCaret` (caret width in em, 0.09; 0 hides it).
 */
export const typewriter: Effect = {
  apply({ words, active, options, settings, time }) {
    const charTime = numberOption(options, "typeCharTime", 0.06);
    const shadow = numberOption(options, "typeShadow", 0.6);
    const caretEm = numberOption(options, "typeCaret", 0.09);
    const current = latestStarted(words, active);

    for (const word of words) {
      const { text, caption } = word;
      const size = text.fontSize();
      if (shadow > 0) {
        text.shadowColor("#000000");
        text.shadowOpacity(Math.min(1, shadow));
        text.shadowBlur(size * 0.15);
        text.shadowOffset({ x: 0, y: size * 0.04 });
      }
      if (word.elapsed < 0) {
        text.opacity(0);
        continue;
      }
      if (word.index === active?.index) text.fill(settings.style.font.fontColor);
      if (word.index !== current?.index) continue;

      const label = text.text().trimEnd();
      const letters = [...label];
      const duration = Math.max(
        0.05,
        Math.min((caption.endTime - caption.startTime) * 0.8, letters.length * charTime),
      );
      const shown = Math.min(letters.length, Math.ceil((word.elapsed / duration) * letters.length));
      const typing = shown < letters.length;
      text.text(letters.slice(0, Math.max(1, shown)).join(""));

      // solid while typing, then blinks (on for the first half of each second)
      const caretOn = typing || word.index === active?.index || (time - caption.endTime) % 1 < 0.5;
      if (caretEm <= 0 || !caretOn) continue;
      const caret = new Konva.Rect({
        name: DECORATION,
        x: text.x() + inkWidth(text) + size * 0.06,
        y: text.y() + size * 0.12,
        width: size * caretEm,
        height: size * 0.92,
        fill: getHighlightColor(settings),
        shadowColor: "#000000",
        shadowOpacity: Math.min(1, shadow),
        shadowBlur: size * 0.1,
      });
      text.parent?.add(caret);
    }
  },
};
