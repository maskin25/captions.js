import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { CaptionsSettings } from "captions.js";

type FontSettings = CaptionsSettings["style"]["font"];

const WEIGHTS: Record<FontSettings["fontWeight"], number> = {
  thin: 200,
  light: 300,
  regular: 400,
  medium: 500,
  bold: 700,
  black: 900,
};

/** Nearest weights to try, in order, when a family lacks the exact one. */
const weightFallbacks = (weight: number) =>
  [weight, 100, 200, 300, 400, 500, 600, 700, 800, 900]
    .filter((w, i, all) => all.indexOf(w) === i)
    .sort((a, b) => Math.abs(a - weight) - Math.abs(b - weight));

const FILE_WEIGHT_NAMES: Record<number, string> = {
  100: "Thin",
  200: "ExtraLight",
  300: "Light",
  400: "Regular",
  500: "Medium",
  600: "SemiBold",
  700: "Bold",
  800: "ExtraBold",
  900: "Black",
};

const packageRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

/** Fonts checked into the repo (used by the Docker image, not shipped to npm). */
const bundledFontsDir = path.join(packageRoot, "assets", "fonts");

export const defaultFontCacheDir = () =>
  process.env.CAPTIONSJS_CACHE_DIR
    ? path.join(process.env.CAPTIONSJS_CACHE_DIR, "fonts")
    : path.join(
        process.env.XDG_CACHE_HOME || path.join(os.homedir(), ".cache"),
        "captionsjs",
        "fonts",
      );

/**
 * Looks for `<Family_Name>/<FamilyName>-<Weight>[Italic].ttf` — the layout of
 * the Google Fonts zip downloads — in a local directory.
 */
const findLocalFont = (
  dir: string,
  family: string,
  weights: number[],
  italic: boolean,
) => {
  const familyDir = path.join(dir, family.split(" ").join("_"));
  const compact = family.replace(/\s+/g, "");
  for (const weight of weights) {
    const name = FILE_WEIGHT_NAMES[weight];
    const candidates = italic
      ? [`${compact}-${name}Italic.ttf`, weight === 400 ? `${compact}-Italic.ttf` : ""]
      : [`${compact}-${name}.ttf`];
    for (const file of candidates.filter(Boolean)) {
      const full = path.join(familyDir, file);
      if (fs.existsSync(full)) return full;
    }
  }
  // Variable font files, e.g. Montserrat[wght].ttf
  if (fs.existsSync(familyDir)) {
    const variable = fs
      .readdirSync(familyDir)
      .find(
        (file) =>
          file.endsWith(".ttf") &&
          file.includes("[") &&
          file.toLowerCase().includes("italic") === italic,
      );
    if (variable) return path.join(familyDir, variable);
  }
  return undefined;
};

const cachedFileName = (family: string, weight: number, italic: boolean) =>
  `${family.replace(/\s+/g, "_")}-${weight}${italic ? "i" : ""}.ttf`;

/**
 * Downloads a static TTF from the Google Fonts CSS2 API. Without a browser
 * User-Agent the API answers with `format('truetype')` URLs.
 */
const downloadGoogleFont = async (
  family: string,
  weight: number,
  italic: boolean,
  cacheDir: string,
): Promise<string | undefined> => {
  const target = path.join(cacheDir, cachedFileName(family, weight, italic));
  if (fs.existsSync(target)) return target;

  const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
    family,
  )}:ital,wght@${italic ? 1 : 0},${weight}`;
  const cssRes = await fetch(cssUrl);
  if (!cssRes.ok) return undefined; // weight/style not available for family
  const css = await cssRes.text();
  const match = css.match(/src:\s*url\(([^)]+)\)\s*format\('truetype'\)/);
  if (!match) return undefined;

  const fontRes = await fetch(match[1]);
  if (!fontRes.ok) {
    throw new Error(`Failed to download font ${family} ${weight}: HTTP ${fontRes.status}`);
  }
  fs.mkdirSync(cacheDir, { recursive: true });
  const tmp = `${target}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, Buffer.from(await fontRes.arrayBuffer()));
  fs.renameSync(tmp, target);
  return target;
};

export interface ResolveFontOptions {
  /** Extra directory with Google-Fonts-style folders to search first. */
  fontsDir?: string;
  /** Where downloaded fonts are cached. Defaults to ~/.cache/captionsjs/fonts. */
  cacheDir?: string;
  /** Set to false to fail instead of downloading from Google Fonts. */
  download?: boolean;
}

/**
 * Finds a TTF for the preset font: local dirs first, then the download cache,
 * then Google Fonts. Returns an absolute file path.
 */
export const resolveFontFile = async (
  font: Pick<FontSettings, "fontFamily" | "fontWeight" | "italic">,
  options: ResolveFontOptions = {},
): Promise<string> => {
  const family = font.fontFamily;
  const italic = Boolean(font.italic);
  const weights = weightFallbacks(WEIGHTS[font.fontWeight] ?? 400);

  const localDirs = [
    options.fontsDir,
    process.env.CAPTIONSJS_FONTS_DIR,
    bundledFontsDir,
  ].filter((dir): dir is string => Boolean(dir) && fs.existsSync(dir!));

  for (const dir of localDirs) {
    const found = findLocalFont(dir, family, weights, italic);
    if (found) return found;
  }

  const cacheDir = options.cacheDir ?? defaultFontCacheDir();
  for (const weight of weights) {
    const cached = path.join(cacheDir, cachedFileName(family, weight, italic));
    if (fs.existsSync(cached)) return cached;
  }

  if (options.download !== false) {
    for (const weight of weights) {
      const file = await downloadGoogleFont(family, weight, italic, cacheDir);
      if (file) return file;
    }
    if (italic) {
      // Family has no italic cut at all — use the upright one.
      return resolveFontFile({ ...font, italic: false }, options);
    }
  }

  throw new Error(
    `Font "${family}" not found. Put its TTF files into a folder and pass --fonts-dir, ` +
      `or allow downloading from Google Fonts.`,
  );
};
