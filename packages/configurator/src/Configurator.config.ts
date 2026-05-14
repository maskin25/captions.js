import { googleFontsList } from "captions.js";

export const POSITION_OPTIONS = ["auto", "top", "middle", "bottom"] as const;
export const FONT_WEIGHT_OPTIONS = [
  "thin",
  "light",
  "regular",
  "medium",
  "bold",
  "black",
] as const;
export const ANIMATION_OPTIONS = [
  "none",
  "bounce",
  "underline",
  "box",
  "box-word",
  "pop",
  "scale",
  "slide-left",
  "slide-up",
  "slide-down",
] as const;

export type BaseStyleField = {
  path: (string | number)[];
  label: string;
};

export type TextStyleField = BaseStyleField & {
  type: "text" | "color";
};

export type NumberStyleField = BaseStyleField & {
  type: "number";
  min?: number;
  max?: number;
  step?: number;
};

export type SelectStyleField = BaseStyleField & {
  type: "select";
  options: readonly string[];
};

export type SwitchStyleField = BaseStyleField & {
  type: "switch";
};

export type ShadowStyleField = BaseStyleField & {
  type: "shadow";
};

export type StrokeStyleField = BaseStyleField & {
  type: "stroke";
};

export type StyleField =
  | TextStyleField
  | NumberStyleField
  | SelectStyleField
  | SwitchStyleField
  | ShadowStyleField
  | StrokeStyleField;

export const STYLE_FIELDS: StyleField[] = [
  /* { path: ["style", "name"], label: "Preset Name", type: "text" }, */
  {
    path: ["animation"],
    label: "Animation",
    type: "select",
    options: ANIMATION_OPTIONS,
  },
  {
    path: ["style", "font", "fontFamily"],
    label: "Font Family",
    type: "select",
    options: googleFontsList,
  },
  {
    path: ["style", "font", "fontSize"],
    label: "Font Size",
    type: "number",
    min: 10,
    max: 120,
    step: 1,
  },
  {
    path: ["style", "font", "fontWeight"],
    label: "Font Weight",
    type: "select",
    options: FONT_WEIGHT_OPTIONS,
  },
  {
    path: ["style", "font", "fontColor"],
    label: "Font Color",
    type: "color",
  },
  {
    path: ["style", "aplifiedWordColor"],
    label: "Highlighted Word Color",
    type: "color",
  },
  {
    path: ["style", "backgroundColor"],
    label: "Background Color",
    type: "color",
  },
  {
    path: ["style", "font", "fontCapitalize"],
    label: "Capitalize",
    type: "switch",
  },
  { path: ["style", "font", "italic"], label: "Italic", type: "switch" },
  { path: ["style", "font", "underline"], label: "Underline", type: "switch" },
  {
    path: ["style", "font"],
    label: "Stroke",
    type: "stroke",
  },
  {
    path: ["style", "font", "shadow"],
    label: "Shadow",
    type: "shadow",
  },
  {
    path: ["position"],
    label: "Position",
    type: "select",
    options: POSITION_OPTIONS,
  },
  {
    path: ["positionTopOffset"],
    label: "Top Offset",
    type: "number",
    min: -240,
    max: 240,
    step: 1,
  },
  {
    path: ["linesPerPage"],
    label: "Lines Per Page",
    type: "number",
    min: 1,
    max: 4,
  },
  {
    path: ["lineSpacing"],
    label: "Line Spacing",
    type: "number",
    min: 0,
    max: 80,
    step: 1,
  },
];
