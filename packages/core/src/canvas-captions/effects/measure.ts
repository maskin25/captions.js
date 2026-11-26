import type Konva from "konva";

/** Width of a word without its trailing space, as drawn. */
export const inkWidth = (text: Konva.Text) => {
  const label = text.text().trimEnd();
  return label === text.text() ? text.width() : text.clone({ text: label }).width();
};

/** A fixed pseudo-random value in [-1, 1) for a word index and a salt. */
export const seeded = (index: number, salt: number) => {
  const x = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
};

/** The word being spoken, or else the last one that started. */
export const latestStarted = <W extends { elapsed: number }>(words: W[], active?: W) => {
  if (active) return active;
  const started = words.filter((w) => w.elapsed >= 0);
  return started[started.length - 1];
};
