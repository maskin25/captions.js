import Konva from "konva";
import { Ease, mapEaseToFn } from "../easing";
import { getHighlightColor } from "../utils";
import { attack, numberOption, type Effect } from "./types";

/**
 * A line draws itself under the active word.
 *
 * Options: `underlineWidth` (px on a `REFERENCE_HEIGHT` frame, 8), `underlineDraw`
 * (s, 0.25).
 */
export const underline: Effect = {
  apply({ active, options, settings, scale }) {
    if (!active) return;
    const t = attack(active, numberOption(options, "underlineDraw", 0.25));
    const e = mapEaseToFn[Ease.outCubic](t);
    const { text } = active;
    const line = new Konva.Line({
      points: [
        text.x(),
        text.y() + text.height(),
        text.x() + text.width() * e,
        text.y() + text.height(),
      ],
      lineCap: "round",
      stroke: active.caption.highlightColor
        ? active.caption.highlightColor
        : getHighlightColor(settings),
      strokeWidth: numberOption(options, "underlineWidth", 8) * scale,
      opacity: Math.min(1, t * 2),
    });
    text.parent?.add(line);
  },
};
