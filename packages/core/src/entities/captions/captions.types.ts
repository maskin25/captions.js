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
      shadow: {
        fontShadowColor: string;
        fontShadowBlur: number;
        fontShadowOffsetX: number;
        fontShadowOffsetY: number;
      };
    };
    aplifiedWordColor: string;
    backgroundColor: string;
  };
  linesPerPage: number;
  lineSpacing?: number | null;
  position: "auto" | "top" | "middle" | "bottom";
  positionTopOffset: number;
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

export interface Caption {
  word: string;
  startTime: number;
  endTime: number;
  highlightColor?: string;
}
