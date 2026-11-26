import type Konva from "konva";

/** Width of a word without its trailing space, as drawn. */
export const inkWidth = (text: Konva.Text) => {
  const label = text.text().trimEnd();
  return label === text.text() ? text.width() : text.clone({ text: label }).width();
};
