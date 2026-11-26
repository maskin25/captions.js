import Konva from "konva";
import { speakerStyle } from "../utils";
import { textOn } from "./color";
import { DECORATION, numberOption, type Effect } from "./types";

const PALETTE = ["#FFD43B", "#4DD2FF", "#FF6B9A", "#7CFF6B"];

/**
 * Speaker Tags: a small name tag in the speaker's color sits above each
 * screen, and the spoken word takes the same color, so a conversation reads
 * like a script. Screens already break when the speaker changes, so each
 * screen has one speaker. Words without a speaker get no tag.
 *
 * Colors and names come from `speakers` in the settings; a speaker without a
 * color takes the next one from `tagColors`, and one without a label is
 * shown as "Speaker 1", "Speaker 2", …
 *
 * Options: `tagColors` (palette for speakers without a color), `tagSize`
 * (tag font size as a share of the word's, 0.5), `tagUnnamed` (show
 * "Speaker N" for speakers without a label, true), `tagShadow` (text shadow
 * strength 0–1, 0.6).
 */
export const speakerTags: Effect = {
  apply({ words, active, options, settings, width, screenProgress }) {
    const palette = Array.isArray(options.tagColors)
      ? options.tagColors.filter((c): c is string => typeof c === "string" && c !== "")
      : [];
    const colors = palette.length ? palette : PALETTE;
    const sizeShare = numberOption(options, "tagSize", 0.5);
    const unnamed = options.tagUnnamed !== false;
    const shadow = numberOption(options, "tagShadow", 0.6);

    for (const { text } of words) {
      if (shadow <= 0) break;
      const size = text.fontSize();
      text.shadowColor("#000000");
      text.shadowOpacity(Math.min(1, shadow));
      text.shadowBlur(size * 0.15);
      text.shadowOffset({ x: 0, y: size * 0.04 });
    }

    const first = words[0];
    const speaker = first?.caption.speaker;
    if (!first || speaker === undefined) return;
    const style = speakerStyle(first.caption, settings);
    const color = style?.color ?? colors[speaker % colors.length];
    if (active && !active.caption.highlightColor) active.text.fill(color);

    const label = style?.label ?? (unnamed ? `Speaker ${speaker + 1}` : "");
    const line = first.text.parent;
    const screen = line?.parent;
    if (!label || !line || !screen) return;

    // the tag: centred above the first line, sliding up as the screen starts
    const size = Math.max(...words.filter((w) => w.line === first.line).map((w) => w.text.fontSize())) * sizeShare;
    const name = new Konva.Text({
      name: DECORATION,
      text: label,
      fontSize: size,
      fontFamily: first.text.fontFamily(),
      fontStyle: first.text.fontStyle(),
      fill: textOn(color),
    });
    const padX = size * 0.5;
    const padY = size * 0.22;
    const tagWidth = name.width() + padX * 2;
    const tagHeight = name.height() + padY * 2;
    const rise = (1 - screenProgress) * size * 0.6;
    const x = width / 2 - tagWidth / 2;
    const y = line.y() - tagHeight - size * 0.35 + rise;
    const tag = new Konva.Group({ name: DECORATION, x, y, opacity: screenProgress });
    tag.add(
      new Konva.Rect({
        name: DECORATION,
        width: tagWidth,
        height: tagHeight,
        fill: color,
        cornerRadius: tagHeight / 2,
        shadowColor: "#000000",
        shadowOpacity: Math.min(1, shadow) * 0.6,
        shadowBlur: size * 0.3,
        shadowOffset: { x: 0, y: size * 0.08 },
      }),
    );
    name.position({ x: padX, y: padY });
    tag.add(name);
    screen.add(tag);
  },
};
