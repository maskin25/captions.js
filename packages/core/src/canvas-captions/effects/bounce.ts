import { Ease, mapEaseToFn } from "../easing";
import { attack, numberOption, type Effect } from "./types";

/**
 * The active word pops up with a small overshoot, then holds; neighbours on
 * its line move aside. Driven by time since the word started, so short and
 * long words feel the same.
 *
 * Options: `bounceScale` (extra size at rest, 0.3), `bounceAttack` (s, 0.15).
 */
export const bounce: Effect = {
  apply({ active, options }) {
    if (!active) return;
    const grow = numberOption(options, "bounceScale", 0.3);
    const e = mapEaseToFn[Ease.outBack](attack(active, numberOption(options, "bounceAttack", 0.15)));
    const { text } = active;
    text.offsetX(text.width() / 2);
    text.offsetY(text.height() / 2);
    text.x(text.x() + text.width() / 2);
    text.y(text.y() + text.height() / 2);
    text.scale({ x: 1 + grow * e, y: 1 + grow * e });

    // The word grows around its centre; push neighbours on the same line aside
    // by half of that growth so they never overlap.
    const offsetModule = (text.width() * grow) / 2;
    const index = text.parent?.children.indexOf(text) || 0;
    text.parent?.children.forEach((child, i) => {
      if (i !== index) {
        child.x(child.x() + (i < index ? -offsetModule : offsetModule) * e);
      }
    });
  },
};
