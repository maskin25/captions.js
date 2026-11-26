import { attack, numberOption, type Effect } from "./types";

const DEFAULT_COLORS = ["#FF4D8D", "#FFA62B", "#8C6BFF"];

/**
 * Gradient Wave: one gradient runs across the whole caption and its colors
 * drift slowly sideways, so every word is a slice of the same moving band.
 * Words not spoken yet are dimmed; the spoken word rises a little.
 *
 * Options: `gradientColors` (array of colors the band cycles through,
 * default pink, orange and violet), `gradientSpeed` (band widths per second,
 * 0.25), `gradientDim` (opacity of words not spoken yet, 0.6),
 * `gradientLift` (rise of the spoken word in em, 0.06), `gradientOutline`
 * (dark outline width in em, 0.1; half of it shows outside the letters),
 * `gradientShadow` (text shadow strength 0–1, 0.6).
 */
export const gradientWave: Effect = {
  apply({ words, active, options, width, time }) {
    const colors = Array.isArray(options.gradientColors)
      ? options.gradientColors.filter((c): c is string => typeof c === "string" && c !== "")
      : [];
    const cycle = colors.length >= 2 ? colors : DEFAULT_COLORS;
    const speed = numberOption(options, "gradientSpeed", 0.25);
    const dim = numberOption(options, "gradientDim", 0.6);
    const liftEm = numberOption(options, "gradientLift", 0.06);
    const outline = numberOption(options, "gradientOutline", 0.1);
    const shadow = numberOption(options, "gradientShadow", 0.6);

    // the band repeats every `period` px; it spans three periods, starting
    // between two and one periods left of the caption, so every word on
    // screen falls inside it at any phase
    const period = Math.max(1, width);
    const phase = (((time * speed) % 1) + 1) % 1;
    const start = (phase - 2) * period;
    const stops: (number | string)[] = [];
    const count = cycle.length * 3;
    for (let i = 0; i <= count; i++) stops.push(i / count, cycle[i % cycle.length]);

    for (const word of words) {
      const { text } = word;
      const size = text.fontSize();
      const left = (text.parent?.x() ?? 0) + text.x();
      text.fillPriority("linear-gradient");
      text.fillLinearGradientStartPoint({ x: start - left, y: 0 });
      text.fillLinearGradientEndPoint({ x: start + period * 3 - left, y: 0 });
      text.fillLinearGradientColorStops(stops);
      // a soft dark outline under the fill keeps light colors readable on
      // light backgrounds
      text.stroke("rgba(0, 0, 0, 0.55)");
      text.strokeWidth(Math.max(0, outline) * size);
      text.fillAfterStrokeEnabled(true);
      if (shadow > 0) {
        text.shadowColor("#000000");
        text.shadowOpacity(Math.min(1, shadow));
        text.shadowBlur(size * 0.16);
        text.shadowOffset({ x: 0, y: size * 0.04 });
      }
      if (word.state === "future") text.opacity(dim);
      if (word.index === active?.index && liftEm > 0) {
        const rise = attack(word, 0.12) * liftEm * size;
        text.y(text.y() - rise);
      }
    }
  },
};
