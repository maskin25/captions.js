import type Konva from "konva";
import type { Caption, CaptionsSettings } from "../../entities/captions/captions.types";

/** Where a word is relative to the current time. @public */
export type WordState = "past" | "active" | "future";

/** One word on the current screen, as an effect sees it. @public */
export interface EffectWord {
  caption: Caption;
  /** The drawn text node. Effects may move, scale or recolor it. */
  text: Konva.Text;
  /** The same word without surrounding spaces, for measuring (box-word). */
  trimmed?: Konva.Text | null;
  /** Position on the screen, from 0. */
  index: number;
  /** Line on the screen, from 0. */
  line: number;
  state: WordState;
  /** 0–1 through the word's own time: 0 before it starts, 1 after it ends. */
  progress: number;
  /** Seconds since the word started; negative before it starts. */
  elapsed: number;
}

/** Everything an effect can see when it runs for one frame. @public */
export interface EffectContext {
  settings: CaptionsSettings;
  /** `settings.animationOptions`, or `{}`. Each effect documents its keys. */
  options: Record<string, unknown>;
  /** The screen: a group holding one group per line. */
  group: Konva.Group;
  /** Screen size before effects, in px. */
  width: number;
  height: number;
  /** Line groups, top to bottom. */
  lines: Konva.Group[];
  /** Every word on the screen, in reading order. */
  words: EffectWord[];
  /** The word being spoken, if any (for box-word, the latest that started). */
  active?: EffectWord;
  /** 0–1 over the first 0.2 s of the screen, for screen entrances. */
  screenProgress: number;
  /** Current time in seconds. */
  time: number;
  /** Frame scale: font size in px divided by the preset's font size. */
  scale: number;
}

/**
 * An animation. `apply` runs once per frame after layout, on freshly built
 * nodes, so it never has to undo the previous frame.
 *
 * @public
 */
export interface Effect {
  apply(context: EffectContext): void;
}

/** Reads a number from `options`, or `fallback`. */
export const numberOption = (
  options: Record<string, unknown>,
  key: string,
  fallback: number,
) => {
  const value = options[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
};

const clamp01 = (value: number) =>
  Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 1;

/** 0–1 progress of a word's entry animation that lasts `durationSec`. */
export const attack = (word: EffectWord, durationSec: number) =>
  durationSec > 0 ? clamp01(word.elapsed / durationSec) : 1;
