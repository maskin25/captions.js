import { bounce } from "./bounce";
import { box, boxWord } from "./box";
import { pop, scaleIn, slideDown, slideLeft, slideUp } from "./screen";
import type { Effect } from "./types";
import { underline } from "./underline";
import { spring } from "./spring";
import { sweep } from "./sweep";
import { neon } from "./neon";
import { extrude } from "./extrude";

export type { Effect, EffectContext, EffectWord, WordState } from "./types";
export { attack, numberOption, DECORATION } from "./types";
export { boxWordMetrics } from "./box";
export { springAt } from "./spring";

const none: Effect = { apply() {} };

const registry = new Map<string, Effect>([
  ["none", none],
  ["bounce", bounce],
  ["underline", underline],
  ["box", box],
  ["box-word", boxWord],
  ["pop", pop],
  ["scale", scaleIn],
  ["slide-down", slideDown],
  ["slide-up", slideUp],
  ["slide-left", slideLeft],
  ["spring", spring],
  ["highlight-sweep", sweep],
  ["neon", neon],
  ["extrude", extrude],
]);

/**
 * Adds an effect under a name that `animation` can then use, or replaces
 * one. Built-in names: none, bounce, underline, box, box-word, pop, scale,
 * slide-down, slide-up, slide-left, spring, highlight-sweep, neon, extrude.
 *
 * @public
 */
export const registerEffect = (name: string, effect: Effect) => {
  if (!name || typeof effect?.apply !== "function") {
    throw new Error("captions.js: registerEffect needs a name and an object with apply()");
  }
  registry.set(name, effect);
};

/** The effect for an `animation` name; unknown names draw no animation. @public */
export const getEffect = (name: string): Effect => registry.get(name) ?? none;
