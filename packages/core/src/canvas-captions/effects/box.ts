import Konva from "konva";
import { getBoxWordBackgroundColor } from "../utils";
import { textOn } from "./color";
import { numberOption, type Effect } from "./types";

/**
 * A rounded plate behind the whole screen.
 *
 * Options, in px on a `REFERENCE_HEIGHT` frame: `boxPaddingX` (12), `boxPaddingY`
 * (5), `boxRadius` (6).
 */
export const box: Effect = {
  apply({ group, width, height, options, settings, scale }) {
    const paddingX = numberOption(options, "boxPaddingX", 12) * scale;
    const paddingY = numberOption(options, "boxPaddingY", 5) * scale;
    const plate = new Konva.Rect({
      x: -paddingX,
      y: -paddingY - 2 * scale,
      width: width + 2 * paddingX,
      height: height + 2 * paddingY + 2 * scale,
      fill: settings.style.backgroundColor,
      cornerRadius: numberOption(options, "boxRadius", 6) * scale,
    });
    group.add(plate);
    plate.moveToBottom();
  },
};

/** Padding and corner radius of the `box-word` highlight for a font size in px. */
export const boxWordMetrics = (fontSize: number) => ({
  paddingX: (fontSize * 6) / 56,
  paddingY: fontSize / 56,
  cornerRadius: (fontSize * 4) / 56,
});

/**
 * A rounded box behind the active word, proportional to its font size, so it
 * keeps its shape at every frame size (6 / 1 / 4 px at Focus Box's 56 px on a
 * 540x960 frame).
 */
export const boxWord: Effect = {
  // the accent is the box; the word on it turns black or white to stay readable
  accent: (settings, color) => ({
    ...settings,
    style: { ...settings.style, backgroundColor: color, highlightColor: textOn(color) },
  }),
  apply({ active, settings }) {
    if (!active) return;
    const { text } = active;
    const measured = active.trimmed ?? text;
    const { paddingX, paddingY, cornerRadius } = boxWordMetrics(text.fontSize());
    const plate = new Konva.Rect({
      id: "box-word",
      x: text.x() - paddingX,
      y: text.y() - paddingY,
      width: measured.width() + paddingX * 2,
      height: measured.height() + paddingY * 2,
      fill: getBoxWordBackgroundColor(active.caption, settings),
      cornerRadius,
    });
    text.parent?.add(plate);
    plate.moveToBottom();
  },
};
