import Konva from "konva";
import { getHighlightColor } from "../utils";
import { inkWidth } from "./measure";
import { DECORATION, numberOption, type Effect } from "./types";

/**
 * Karaoke Fill: the highlight color fills each word from left to right while
 * it is spoken, like a karaoke screen, and spoken words stay filled. The fill
 * is a copy of the word in the highlight color, clipped to the word's
 * progress. Words have an outline drawn under the fill, sized from the font.
 *
 * Options: `karaokeStroke` (outline width in em, 0.14; half of it shows
 * outside the letters; its color is the preset's `fontStrokeColor`),
 * `karaokeMin` (s, 0.15: shorter words still fill over this long).
 */
export const karaokeFill: Effect = {
  apply({ words, active, options, settings }) {
    const strokeEm = numberOption(options, "karaokeStroke", 0.14);
    const minimum = numberOption(options, "karaokeMin", 0.15);
    const highlight = getHighlightColor(settings);
    const base = settings.style.font.fontColor;
    const outline = settings.style.font.fontStrokeColor;

    for (const word of words) {
      const { text, caption } = word;
      const size = text.fontSize();
      const stroke = strokeEm > 0 && outline ? size * strokeEm : 0;
      text.stroke(outline);
      text.strokeWidth(stroke);
      text.fillAfterStrokeEnabled(true);
      text.shadowOpacity(0);

      if (word.state === "past") {
        text.fill(caption.highlightColor || highlight);
        continue;
      }
      if (word.index !== active?.index) continue;

      const duration = Math.max(minimum, caption.endTime - caption.startTime);
      const reach = Math.min(1, Math.max(0, word.elapsed / duration));
      text.fill(base);
      if (reach <= 0) continue;

      // the filled copy, clipped from the left edge (outline included) to
      // the word's progress
      const pad = stroke / 2 + 1;
      const clip = new Konva.Group({
        name: DECORATION,
        clipX: text.x() - pad,
        clipY: text.y() - pad,
        clipWidth: (inkWidth(text) + pad * 2) * reach,
        clipHeight: text.height() + pad * 2,
      });
      clip.add(text.clone({ name: DECORATION, fill: caption.highlightColor || highlight }));
      text.parent?.add(clip);
    }
  },
};
