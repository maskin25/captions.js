// The frames every golden and parity check renders: one phrase, five moments, two sizes.

// Same reference phrase as the gallery previews (scripts/render-previews.mjs).
export const PHRASE = [
  ["Same", 0.15, 0.4], ["captions", 0.4, 0.85], ["in", 0.85, 0.95], ["your", 0.95, 1.15],
  ["browser", 1.15, 1.6], ["preview", 1.6, 2.1], ["and", 2.35, 2.5], ["in", 2.5, 2.6],
  ["your", 2.6, 2.8], ["final", 2.8, 3.15], ["export", 3.15, 3.7], ["pixel", 3.85, 4.2],
  ["for", 4.2, 4.35], ["pixel", 4.35, 4.85],
].map(([word, startTime, endTime]) => ({ word, startTime, endTime }));

// Moments chosen to hit different states, not just settled frames:
// 0.20 entry animation of the first word, 0.62 mid-word, 1.55 late in a word
// (the poster moment), 2.40 just after a pause, 4.40 entry on the last screen.
export const TIMES = [0.2, 0.62, 1.55, 2.4, 4.4];
export const SIZES = [
  [540, 960],
  [1080, 1920],
];

export const slugify = (name) =>
  name.toLowerCase().replace(/&/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

