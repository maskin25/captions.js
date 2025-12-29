import { googleFontsList } from "captions.js";

export const POSITION_OPTIONS = ["auto", "top", "middle", "bottom"] as const;

type BaseStyleField = {
  path: (string | number)[];
  label: string;
};

type TextStyleField = BaseStyleField & {
  type: "text" | "color";
};

type NumberStyleField = BaseStyleField & {
  type: "number";
  min?: number;
  max?: number;
  step?: number;
};

type SelectStyleField = BaseStyleField & {
  type: "select";
  options: readonly string[];
};

type SwitchStyleField = BaseStyleField & {
  type: "switch";
};

type StyleField =
  | TextStyleField
  | NumberStyleField
  | SelectStyleField
  | SwitchStyleField;

export const STYLE_FIELDS: StyleField[] = [
  /* { path: ["style", "name"], label: "Preset Name", type: "text" }, */
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
    path: ["style", "font", "fontColor"],
    label: "Font Color",
    type: "color",
  },
  {
    path: ["style", "font", "fontStrokeColor"],
    label: "Stroke Color",
    type: "color",
  },
  {
    path: ["style", "font", "fontStrokeWidth"],
    label: "Stroke Width",
    type: "number",
    min: 0,
    max: 10,
    step: 1,
  },
  {
    path: ["style", "font", "fontCapitalize"],
    label: "Capitalize",
    type: "switch",
  },
  { path: ["style", "font", "italic"], label: "Italic", type: "switch" },
  { path: ["style", "font", "underline"], label: "Underline", type: "switch" },
  {
    path: ["style", "font", "shadow", "fontShadowColor"],
    label: "Shadow Color",
    type: "color",
  },
  {
    path: ["style", "font", "shadow", "fontShadowBlur"],
    label: "Shadow Blur",
    type: "number",
    min: 0,
    max: 40,
    step: 1,
  },
  {
    path: ["style", "font", "shadow", "fontShadowOffsetX"],
    label: "Shadow X Offset",
    type: "number",
    min: -20,
    max: 20,
    step: 1,
  },
  {
    path: ["style", "font", "shadow", "fontShadowOffsetY"],
    label: "Shadow Y Offset",
    type: "number",
    min: -20,
    max: 20,
    step: 1,
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
    path: ["position"],
    label: "Position",
    type: "select",
    options: POSITION_OPTIONS,
  },
  {
    path: ["positionTopOffset"],
    label: "Top Offset",
    type: "number",
    min: 0,
    max: 200,
  },
  {
    path: ["linesPerPage"],
    label: "Lines Per Page",
    type: "number",
    min: 1,
    max: 4,
  },
];
