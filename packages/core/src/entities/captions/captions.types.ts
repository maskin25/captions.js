import type { SafeAreaInsets, SafeAreaName } from "../../canvas-captions/safe-area";
/**
 * Size of a fully emphasized word at `expressiveness: 1`, relative to the
 * preset's font size.
 *
 * @public
 */
export const EMPHASIS_MAX_SCALE = 1.4;

/**
 * Full styling + animation configuration for a single captions track.
 *
 * @public
 */
export interface CaptionsSettings {
  style: {
    name: string;
    font: {
      fontFamily: string;
      fontSize: number;
      fontWeight: "thin" | "light" | "regular" | "medium" | "bold" | "black";
      fontColor: string;
      fontCapitalize: boolean;
      italic: boolean;
      underline: boolean;
      fontStrokeColor: string;
      fontStrokeWidth: number;
      shadow?: {
        fontShadowColor: string;
        fontShadowBlur: number;
        fontShadowOffsetX: number;
        fontShadowOffsetY: number;
      };
    };
    verticalCoverImg?: string;
    /**
     * Color of the active (spoken) word. A per-word `Caption.highlightColor`
     * overrides it.
     */
    highlightColor?: string;
    /**
     * @deprecated Misspelled original name of {@link CaptionsSettings.style.highlightColor}.
     * Still read when `highlightColor` is not set; will be removed in 2.0.
     */
    aplifiedWordColor?: string;
    /**
     * Color of strongly emphasized words (emphasis × expressiveness ≥ 0.5)
     * while they are not the active word. Unset: emphasis changes size only.
     */
    emphasisColor?: string;
    backgroundColor: string;
  };
  /**
   * How strongly the style reacts to word emphasis, 0–1. 0 (the default) is
   * the look without emphasis; at 1 a fully emphasized word is drawn
   * {@link EMPHASIS_MAX_SCALE} times larger. Words without `emphasis` never
   * change.
   */
  expressiveness?: number;
  linesPerPage: number;
  lineSpacing?: number | null;
  position: "auto" | "top" | "middle" | "bottom";
  positionTopOffset?: number;
  /**
   * Keeps captions clear of a platform's interface: `"tiktok"`, `"reels"`,
   * `"shorts"`, `"none"`, or insets as fractions of the frame, e.g.
   * `{ top: 0.1, bottom: 0.3, left: 0.05, right: 0.15 }`. `position` then
   * places captions inside that area and lines wrap to its width. Unset, the
   * renderer keeps its fixed margin above the bottom of portrait video. See
   * {@link SAFE_AREAS} for the values and their sources.
   */
  safeArea?: SafeAreaName | SafeAreaInsets;
  /**
   * Effect name: a built-in one, or one added with `registerEffect`.
   */
  animation: BuiltInAnimation | (string & {});
  /**
   * Look per speaker, by `Caption.speaker` (0 is the first speaker). Each
   * speaker's `color` replaces the highlight color for their words in every
   * preset; Speaker Tags also shows their `label`. A word's own
   * `highlightColor` still wins.
   */
  speakers?: SpeakerStyle[];
  /**
   * Parameters for the effect, e.g. `{ bounceScale: 0.2 }` or
   * `{ underlineWidth: 6 }`. Each effect documents its keys and defaults;
   * unknown keys are ignored.
   */
  animationOptions?: Record<string, unknown>;
}

/**
 * How one speaker looks: see {@link CaptionsSettings.speakers}.
 *
 * @public
 */
export interface SpeakerStyle {
  /** Highlight color for this speaker's words. */
  color?: string;
  /** Name shown by Speaker Tags, e.g. "Scott". */
  label?: string;
}

/**
 * The effects built into captions.js.
 *
 * @public
 */
export type BuiltInAnimation =
  | "none"
  | "bounce"
  | "underline"
  | "box"
  | "pop"
  | "scale"
  | "slide-left"
  | "slide-up"
  | "slide-down"
  | "box-word"
  | "spring"
  | "highlight-sweep"
  | "neon"
  | "extrude"
  | "karaoke-fill"
  | "gradient-wave"
  | "pill"
  | "chroma-glitch"
  | "typewriter"
  | "sticker-tape"
  | "slam"
  | "speaker-tags";

/**
 * Single timed word/segment that will be highlighted as audio plays.
 *
 * @public
 */
export interface Caption {
  word: string;
  startTime: number;
  endTime: number;
  highlightColor?: string;
  sentenceStartTime?: number;
  sentenceEndTime?: number;
  paragraphStartTime?: number;
  paragraphEndTime?: number;
  speaker?: number;
  /**
   * How strongly to stress the word, 0–1. Drawn larger as the preset's
   * `expressiveness` allows. Set it in the data, with `*word*` markup, or
   * from an annotations file (`applyAnnotations`).
   */
  emphasis?: number;
}
