import Konva from "konva";
import { Caption, CaptionsSettings } from "../entities/captions/captions.types";
import { Ease, mapEaseToFn } from "./easing";
import { getBoxWordBackgroundColor, getHighlightColor } from "./utils";

const BOUNCE_ATTACK_SEC = 0.15;

/** Padding and corner radius of the `box-word` highlight for a font size in px. */
export const boxWordMetrics = (fontSize: number) => ({
  paddingX: (fontSize * 6) / 56,
  paddingY: fontSize / 56,
  cornerRadius: (fontSize * 4) / 56,
});
const UNDERLINE_DRAW_SEC = 0.25;

const clamp01 = (value: number) =>
  Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 1;

/**
 * Normalised 0..1 progress of a word's entry animation. Falls back to the
 * word-relative progress when `elapsed` is not provided.
 */
const wordAttack = (
  current: { progress: number; elapsed?: number },
  durationSec: number,
) =>
  typeof current.elapsed === "number"
    ? clamp01(current.elapsed / durationSec)
    : clamp01(current.progress);

export const animate = (
  captionsSettings: CaptionsSettings,
  progress: number,
  chunk: {
    group: Konva.Group;
    width: number;
    height: number;
  },
  current?: {
    caption: Caption;
    text: Konva.Text;
    progress: number;
    /** Seconds since the active word started. */
    elapsed?: number;
    textTrim?: Konva.Text | null;
  },
) => {
  const slideOffset = 7;
  switch (captionsSettings.animation) {
    case "bounce":
      if (current) {
        // Quick pop-in with a small overshoot when the word becomes active,
        // then hold. Driven by time since word start, not by word duration,
        // so short and long words feel the same.
        const t = wordAttack(current, BOUNCE_ATTACK_SEC);
        const e = mapEaseToFn[Ease.outBack](t);
        current.text.offsetX(current.text.width() / 2);
        current.text.offsetY(current.text.height() / 2);
        current.text.x(current.text.x() + current.text.width() / 2);
        current.text.y(current.text.y() + current.text.height() / 2);
        current.text.scale({
          x: 1 + 0.3 * e,
          y: 1 + 0.3 * e,
        });

        // The word grows by 30% around its centre; push neighbours on the
        // same line aside by half of that growth so they never overlap.
        const offsetModule = (current.text.width() * 0.3) / 2;
        const curreentChildIndex =
          current.text.parent?.children.indexOf(current.text) || 0;
        current.text.parent?.children.forEach((child, index) => {
          if (index !== curreentChildIndex) {
            const offset =
              index < curreentChildIndex ? -offsetModule : offsetModule;
            child.x(child.x() + offset * e);
          }
        });
      }
      break;
    case "underline":
      if (current) {
        const t = wordAttack(current, UNDERLINE_DRAW_SEC);
        const e = mapEaseToFn[Ease.outCubic](t);
        const underline = new Konva.Line({
          points: [
            current.text.x(),
            current.text.height(),
            current.text.x() + current.text.width() * e,
            current.text.height(),
          ],
          lineCap: "round",
          stroke: current.caption.highlightColor
            ? current.caption.highlightColor
            : getHighlightColor(captionsSettings),
          strokeWidth: 8,
          opacity: Math.min(1, t * 2),
        });
        current.text.parent?.add(underline);
      }
      break;
    case "box":
      const xOffset = 12;
      const yOffset = 5;
      const cornerRadius = 6;
      const box = new Konva.Rect({
        x: -xOffset,
        y: -yOffset - 2,
        width: chunk.width + 2 * xOffset,
        height: chunk.height + 2 * yOffset + 2,
        fill: captionsSettings.style.backgroundColor,
        cornerRadius,
      });
      chunk.group.add(box);
      box.moveToBottom();
      break;
    case "box-word":
      if (current) {
        // Proportional to the font, so the box keeps its shape at every
        // frame size (6 / 1 / 4 px at Focus Box's 56 px on a 540x960 frame).
        const { paddingX: boxPaddingX, paddingY: boxPaddingY, cornerRadius } =
          boxWordMetrics(current.text.fontSize());
        const box = new Konva.Rect({
          id: "box-word",
          x: current.text.x() - boxPaddingX,
          y: -boxPaddingY,
          width: current.textTrim!.width() + boxPaddingX * 2,
          height: current.textTrim!.height() + boxPaddingY * 2,
          fill: getBoxWordBackgroundColor(current.caption, captionsSettings),
          cornerRadius,
        });
        current.text.parent?.add(box);
        box.moveToBottom();
      }
      break;
    case "pop":
      const scaleFactor = 0.5 + 0.5 * mapEaseToFn[Ease.outBack](progress);
      chunk.group.scale({
        x: scaleFactor,
        y: scaleFactor,
      });
      break;
    case "scale":
      const scaleFactor2 = 0.4 + 0.6 * mapEaseToFn[Ease.linear](progress);
      chunk.group.scale({
        x: scaleFactor2,
        y: scaleFactor2,
      });
      break;

    case "slide-down":
      chunk.group.y(
        chunk.group.y() -
          slideOffset +
          slideOffset * mapEaseToFn[Ease.linear](progress),
      );
      break;

    case "slide-up":
      chunk.group.y(
        chunk.group.y() +
          slideOffset -
          slideOffset * mapEaseToFn[Ease.linear](progress),
      );
      break;
    case "slide-left":
      chunk.group.x(
        chunk.group.x() +
          slideOffset -
          slideOffset * mapEaseToFn[Ease.linear](progress),
      );
      break;

    default:
      break;
  }
};
