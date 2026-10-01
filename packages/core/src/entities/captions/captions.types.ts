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
    backgroundColor: string;
  };
  linesPerPage: number;
  lineSpacing?: number | null;
  position: "auto" | "top" | "middle" | "bottom";
  positionTopOffset?: number;
  animation:
    | "none"
    | "bounce"
    | "underline"
    | "box"
    | "pop"
    | "scale"
    | "slide-left"
    | "slide-up"
    | "slide-down"
    | "box-word";
}

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
}
