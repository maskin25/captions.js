import { numberOption, type Effect } from "./types";

/**
 * Position of a damped spring released at 0 towards 1, `t` seconds later.
 * Underdamped (`damping` < 1), so it overshoots and settles.
 */
export const springAt = (t: number, frequency: number, damping: number) => {
  if (t <= 0) return 0;
  const omega = 2 * Math.PI * frequency;
  const zeta = Math.min(0.99, Math.max(0.05, damping));
  const omegaD = omega * Math.sqrt(1 - zeta * zeta);
  const decay = Math.exp(-zeta * omega * t);
  // settled: snap to rest so finished words do not shimmer by sub-pixels
  if (decay < 1e-3) return 1;
  return 1 - decay * (Math.cos(omegaD * t) + ((zeta * omega) / omegaD) * Math.sin(omegaD * t));
};

/**
 * Spring Pop: words appear as they are spoken. Each one springs up from its
 * baseline with an overshoot and settles; words not spoken yet are hidden.
 * Sizes follow each word's font size, so the motion looks the same at every
 * frame size and for emphasized words.
 *
 * Options: `springFrequency` (Hz, 3.2), `springDamping` (0–1, 0.5),
 * `springFrom` (starting scale, 0.3), `springShadow` (shadow strength 0–1, 0.6).
 */
export const spring: Effect = {
  apply({ words, options }) {
    const frequency = numberOption(options, "springFrequency", 3.2);
    const damping = numberOption(options, "springDamping", 0.5);
    const from = numberOption(options, "springFrom", 0.3);
    const shadow = numberOption(options, "springShadow", 0.6);

    // extra half-width of each word while it overshoots, so neighbours on
    // its line can make room (as in bounce)
    const extra = new Map<number, number>();
    for (const word of words) {
      const { text } = word;
      const size = text.fontSize();
      if (shadow > 0) {
        text.shadowColor("#000000");
        text.shadowOpacity(Math.min(1, shadow));
        text.shadowBlur(size * 0.2);
        text.shadowOffset({ x: 0, y: size * 0.05 });
      }
      if (word.elapsed < 0) {
        text.opacity(0);
        continue;
      }
      const s = springAt(word.elapsed, frequency, damping);
      const scale = from + (1 - from) * s;
      // grow from the bottom centre of the visible word (without its trailing
      // space), rising slightly into place
      const label = text.text().trimEnd();
      const visible = label === text.text() ? text.width() : text.clone({ text: label }).width();
      const height = text.height();
      text.offsetX(visible / 2);
      text.offsetY(height);
      text.x(text.x() + visible / 2);
      text.y(text.y() + height + (1 - s) * size * 0.25);
      text.scale({ x: scale, y: scale });
      text.opacity(Math.min(1, Math.max(0, s * 3)));
      if (scale > 1) extra.set(word.index, ((scale - 1) * visible) / 2);
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
