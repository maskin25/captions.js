import { Ease, mapEaseToFn } from "../easing";
import { numberOption, type Effect } from "./types";

/** The screen grows in from half size with an overshoot. */
export const pop: Effect = {
  apply({ group, screenProgress }) {
    const s = 0.5 + 0.5 * mapEaseToFn[Ease.outBack](screenProgress);
    group.scale({ x: s, y: s });
  },
};

/** The screen grows in from 40% size. */
export const scaleIn: Effect = {
  apply({ group, screenProgress }) {
    const s = 0.4 + 0.6 * mapEaseToFn[Ease.linear](screenProgress);
    group.scale({ x: s, y: s });
  },
};

/**
 * The screen slides in from `dx`, `dy` (in units of `slideOffset`, px, 7).
 */
const slide = (dx: number, dy: number): Effect => ({
  apply({ group, screenProgress, options }) {
    const offset = numberOption(options, "slideOffset", 7);
    const rest = offset - offset * mapEaseToFn[Ease.linear](screenProgress);
    if (dx) group.x(group.x() + dx * rest);
    if (dy) group.y(group.y() + dy * rest);
  },
});

export const slideDown = slide(0, -1);
export const slideUp = slide(0, 1);
export const slideLeft = slide(1, 0);
