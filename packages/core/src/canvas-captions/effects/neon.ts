import { mix } from "./color";
import { DECORATION, attack, numberOption, type Effect, type EffectWord } from "./types";

/** Brightness while a word lights up: a short fixed flicker, then on. */
const FLICKER = [0.9, 0.35, 1, 0.6, 1];
const FLICKER_STEP = 0.035;

/** How lit a word is, 0–1. Deterministic: depends only on the word's time. */
const litOf = (word: EffectWord, isActive: boolean, rest: number) => {
  if (word.elapsed < 0) return 0;
  if (!isActive) return rest;
  const step = Math.floor(word.elapsed / FLICKER_STEP);
  const flicker = step < FLICKER.length ? FLICKER[step] : 1;
  return (rest + (1 - rest) * attack(word, 0.12)) * flicker;
};

/**
 * Neon Bloom: each word is a neon tube. Stacked blurred copies in the word's
 * color make the glow; a pale core sits on top. Words not spoken yet are
 * unlit tubes, the spoken word flickers on to full brightness, and spoken
 * words stay softly lit. Glow radii follow the word's font size.
 *
 * The glow color is the word's color: `highlightColor` for the spoken word,
 * `fontColor` for the rest.
 *
 * Options: `neonRest` (brightness of spoken words, 0–1, 0.6),
 * `neonCore` (how far the core is mixed towards white, 0–1, 0.75),
 * `neonSpread` (glow radius multiplier, 1).
 */
export const neon: Effect = {
  apply({ words, active, options }) {
    const rest = numberOption(options, "neonRest", 0.6);
    const coreMix = numberOption(options, "neonCore", 0.75);
    const spread = numberOption(options, "neonSpread", 1);
    const layers = [
      { blur: 1.1, alpha: 0.6 },
      { blur: 0.45, alpha: 0.85 },
      { blur: 0.14, alpha: 1 },
    ];

    for (const word of words) {
      const { text } = word;
      const size = text.fontSize();
      const glow = String(text.fill());
      const lit = litOf(word, word.index === active?.index, rest);
      text.strokeWidth(0);
      text.shadowOpacity(0);

      if (lit <= 0) {
        // unlit tube: the glass without light
        text.fill(mix(glow, "#000000", 0.35));
        text.opacity(0.45);
        continue;
      }

      text.fill(mix(glow, "#ffffff", coreMix * (0.4 + 0.6 * lit)));
      for (const { blur, alpha } of layers) {
        const copy = text.clone({
          name: DECORATION,
          fill: glow,
          shadowColor: glow,
          shadowBlur: size * blur * spread,
          shadowOpacity: Math.min(1, alpha * lit),
          shadowOffset: { x: 0, y: 0 },
          opacity: Math.min(1, 0.35 + 0.65 * lit),
        });
        text.parent?.add(copy);
        copy.moveToBottom();
      }
    }
  },
};
