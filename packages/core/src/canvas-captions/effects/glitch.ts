import { seeded } from "./measure";
import { DECORATION, numberOption, type Effect } from "./types";

/** Offset of the color passes while a word glitches in, by 0.04 s step. */
const BURST = [1, 0.3, 0.8, -0.6, 0.5, 0.15];
const BURST_STEP = 0.04;


/**
 * Chroma Glitch: every word has two color passes, red and cyan, offset to
 * either side of it. When a word is spoken the passes jump apart and the word
 * jitters for a quarter of a second, then settle back. Offsets follow the
 * font size; the jitter is seeded from the word's index, so every frame is
 * reproducible.
 *
 * Options: `glitchColors` (two colors, default `["#FF2D55", "#00E5FF"]`),
 * `glitchOffset` (resting offset in em, 0.035), `glitchBurst` (extra offset
 * while glitching in em, 0.09), `glitchShadow` (text shadow strength 0–1, 0.5).
 */
export const glitch: Effect = {
  apply({ words, active, options }) {
    const colors = Array.isArray(options.glitchColors) ? options.glitchColors : [];
    const left = typeof colors[0] === "string" ? colors[0] : "#FF2D55";
    const right = typeof colors[1] === "string" ? colors[1] : "#00E5FF";
    const restEm = numberOption(options, "glitchOffset", 0.035);
    const burstEm = numberOption(options, "glitchBurst", 0.09);
    const shadow = numberOption(options, "glitchShadow", 0.5);

    for (const word of words) {
      const { text } = word;
      const size = text.fontSize();
      let offset = restEm * size;
      let jitterX = 0;
      let jitterY = 0;
      if (word.index === active?.index && word.elapsed >= 0) {
        const step = Math.floor(word.elapsed / BURST_STEP);
        if (step < BURST.length) {
          offset += BURST[step] * burstEm * size;
          jitterX = seeded(word.index, step) * size * 0.03;
          jitterY = seeded(word.index, step + 17) * size * 0.02;
        }
      }
      text.x(text.x() + jitterX);
      text.y(text.y() + jitterY);
      if (shadow > 0) {
        text.shadowColor("#000000");
        text.shadowOpacity(Math.min(1, shadow));
        text.shadowBlur(size * 0.15);
        text.shadowOffset({ x: 0, y: size * 0.03 });
      }
      if (offset === 0) continue;
      const slant = offset * 0.25;
      for (const [color, dx, dy] of [
        [left, -offset, -slant],
        [right, offset, slant],
      ] as const) {
        const copy = text.clone({
          name: DECORATION,
          x: text.x() + dx,
          y: text.y() + dy,
          fill: color,
          stroke: color,
          strokeWidth: text.strokeWidth(),
          shadowOpacity: 0,
          opacity: 0.85,
        });
        text.parent?.add(copy);
        copy.moveToBottom();
      }
    }
  },
};
