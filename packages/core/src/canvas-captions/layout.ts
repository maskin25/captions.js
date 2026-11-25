import Konva from "konva";
import { Caption } from "../entities/captions/captions.types";

/**
 * Engine-independent text widths for line breaking.
 *
 * Browsers and Skia measure the same text slightly differently at caption sizes
 * (hinting rounds glyph advances to whole pixels, differently per engine), so a
 * line that just fits on one side can overflow on the other and the screen
 * breaks differently. At 1000 px the advances of unhinted fonts are exact in
 * both, so layout measures every character once at that size, rounds it to a
 * whole unit (1/1000 em) and adds the units up. Kerning is ignored: it only
 * makes rendered text slightly narrower than the layout width.
 *
 * Only line breaking uses these widths; words are still drawn and positioned
 * with the engine's own measurements.
 */
export const LAYOUT_UNITS_PER_EM = 1000;

const unitCache = new Map<string, Map<string, number>>();
let context: CanvasRenderingContext2D | null = null;

const getContext = () => {
  if (!context) {
    context = Konva.Util.createCanvasElement().getContext("2d");
  }
  return context!;
};

/** The canvas font string Konva builds for a text node, at the layout size. */
export const layoutFont = (fontFamily: string, fontStyle: string) =>
  `${fontStyle} normal ${LAYOUT_UNITS_PER_EM}px ${normalizeFontFamily(fontFamily)}`;

// Same quoting Konva applies to `fontFamily` before drawing.
const GENERIC_FAMILIES = new Set([
  "serif",
  "sans-serif",
  "monospace",
  "cursive",
  "fantasy",
  "system-ui",
]);
const normalizeFontFamily = (fontFamily: string) =>
  fontFamily
    .split(",")
    .map((family) => {
      const name = family.trim();
      const quoted = /^["'].*["']$/.test(name);
      return quoted || GENERIC_FAMILIES.has(name) ? name : `"${name}"`;
    })
    .join(", ");

/**
 * True once `char` can be measured in `font`: always in Node, and in the
 * browser once `document.fonts` has loaded the face that covers it (Google
 * Fonts splits a family into per-script files, loaded on first use). Widths
 * measured before that are a fallback font's and are not cached.
 */
const isGlyphReady = (font: string, char: string) => {
  const fonts =
    typeof document !== "undefined" ? (document as Document).fonts : undefined;
  if (!fonts || typeof fonts.check !== "function") return true;
  try {
    return fonts.check(font, char);
  } catch {
    return true;
  }
};

let measuredUnready = false;

/**
 * Runs `measure` and reports whether every width it took came from a loaded
 * font, so the caller knows whether its result may be cached.
 */
export const withFontReadiness = <T>(measure: () => T) => {
  measuredUnready = false;
  const result = measure();
  return { result, ready: !measuredUnready };
};

/** Width of `text` in layout units (1/1000 em) for a font from {@link layoutFont}. */
export const measureUnits = (text: string, font: string) => {
  let cache = unitCache.get(font);
  if (!cache) {
    cache = new Map();
    unitCache.set(font, cache);
  }
  let ctx: CanvasRenderingContext2D | null = null;
  let units = 0;
  for (const char of text) {
    let width = cache.get(char);
    if (width === undefined) {
      ctx ??= getContext();
      ctx.font = font;
      width = Math.round(ctx.measureText(char).width);
      if (isGlyphReady(font, char)) cache.set(char, width);
      else measuredUnready = true;
    }
    units += width;
  }
  return units;
};

/** One screen: lines of words, top to bottom. */
export type ScreenLines = Caption[][];

/**
 * Greedy line filling: a word goes on the current line when the line, with
 * `spacing` between words, stays within `maxWidth`; otherwise it starts a new
 * line, and after `linesPerPage` lines a new screen. A word wider than
 * `maxWidth` still gets a line of its own.
 */
export const packScreens = (
  words: Caption[],
  widthOf: (caption: Caption) => number,
  spacing: number,
  maxWidth: number,
  linesPerPage: number,
): ScreenLines[] => {
  const screens: ScreenLines[] = [];
  let screen: ScreenLines = [];
  let line: Caption[] = [];
  let lineWidth = 0;

  const closeLine = () => {
    if (!line.length) return;
    screen.push(line);
    line = [];
    lineWidth = 0;
    if (screen.length >= Math.max(1, linesPerPage)) {
      screens.push(screen);
      screen = [];
    }
  };

  for (const word of words) {
    const width = widthOf(word);
    const next = line.length ? lineWidth + spacing + width : width;
    if (line.length && next > maxWidth) {
      closeLine();
      line.push(word);
      lineWidth = width;
    } else {
      line.push(word);
      lineWidth = next;
    }
  }
  closeLine();
  if (screen.length) screens.push(screen);
  return screens;
};
