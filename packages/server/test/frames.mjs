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


// Longer text for the layout check: every line of every screen must hold the
// same words in the browser and on the server. English and Russian, mixed word
// lengths, numbers and punctuation; 0.3 s per word, so screens break only at
// sentence ends.
const SAMPLE_TEXT = [
  "So here is the thing nobody tells you about editing short videos.",
  "The preview always looks perfect, and then the export comes back with lines broken in different places.",
  "We measured 26 presets, two resolutions and thousands of words to make sure that never happens again.",
  "Extraordinarily long words like internationalization or counterproductive still have to fit somewhere.",
  "Short ones? Fine. A, I, OK, go!",
  "Мы проверили каждый пресет на русском тексте, потому что кириллица заметно шире латиницы.",
  "Высокогорный альпинизм требует подготовки, терпения и хорошей погоды.",
  "Достопримечательности, переосмысление и восьмидесятилетний — длинные слова тоже должны помещаться.",
].join(" ");

export const LAYOUT_SAMPLE = SAMPLE_TEXT.split(" ").map((word, i) => ({
  word,
  startTime: i * 0.3,
  endTime: i * 0.3 + 0.28,
}));

/** The same sample with every fifth word emphasized (strengths 0.4–1). */
export const EMPHASIS_SAMPLE = LAYOUT_SAMPLE.map((caption, i) =>
  i % 5 === 2 ? { ...caption, emphasis: [1, 0.4, 0.7][i % 3] } : caption,
);

/**
 * Renders the first moment of every word and returns the distinct screens as
 * lines of words. Runs in Node and in the browser (no imports): pass Konva and
 * renderFrame in.
 */
export const layoutScreens = ({ Konva, renderFrame, captionsSettings, captions, size }) => {
  const [width, height] = size;
  const stage = new Konva.Stage(typeof document === "undefined" ? { width, height } : { container: document.createElement("div"), width, height });
  const screens = [];
  for (const caption of captions) {
    const layer = new Konva.Layer({ listening: false });
    stage.add(layer);
    renderFrame({ settings: captionsSettings, captions, time: caption.startTime + 0.01, size, layer });
    const group = layer.getChildren()[0];
    const lines = group
      ? group
          .getChildren((node) => node.getClassName() === "Group")
          .map((line) =>
            line
              .getChildren((node) => node.getClassName() === "Text" && !node.hasName("decoration"))
              .slice()
              .sort((a, b) => a.x() - b.x())
              .map((text) => text.text().trim())
              .join(" "),
          )
      : [];
    const screen = lines.join(" / ");
    if (screen && screen !== screens[screens.length - 1]) screens.push(screen);
    layer.destroy();
  }
  stage.destroy();
  return screens;
};
