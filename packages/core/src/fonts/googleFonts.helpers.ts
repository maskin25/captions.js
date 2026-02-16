import Konva from "konva";
import { googleFontsList } from "./googleFonts.config";

export async function loadGoogleFont(
  fontName: (typeof googleFontsList)[number],
  weights = ["400"],
) {
  const family = fontName.replace(/ /g, "+");
  const fontUrl = `https://fonts.googleapis.com/css2?family=${family}:wght@${weights.join(
    ";",
  )}&display=swap`;

  // 1️⃣ Load Google Fonts CSS
  const cssText = await fetch(fontUrl).then((res) => res.text());

  // 2️⃣ Extract the font URL from the CSS (woff2)
  const fontUrlMatch = cssText.match(/url\((https:[^)]+)\)/);
  if (!fontUrlMatch) throw new Error("Font URL not found");

  const fontFileUrl = fontUrlMatch[1];

  // 3️⃣ Load binary data and register the FontFace
  const fontFace = new FontFace(fontName, `url(${fontFileUrl})`);
  await fontFace.load();

  // 4️⃣ Register it in the document
  document.fonts.add(fontFace);
  console.log(`✅ Font "${fontName}" loaded`);

  return fontFace;
}

type GoogleFontFaceEntry = {
  url: string;
  weight: string;
  style: string;
  unicodeRange?: string;
};

type LoadGoogleFontOptions = {
  weights?: string[];
  text?: string;
  // true => load every subset returned by Google CSS. This avoids late lazy fetches.
  preloadAllSubsets?: boolean;
};

const fontLoadCache = new Map<string, Promise<void>>();

const parseGoogleFontCss = (cssText: string): GoogleFontFaceEntry[] => {
  const entries: GoogleFontFaceEntry[] = [];
  const faceBlocks = cssText.match(/@font-face\s*\{[^}]*\}/g) ?? [];

  for (const block of faceBlocks) {
    const style =
      block.match(/font-style\s*:\s*([^;]+);/i)?.[1]?.trim() ?? "normal";
    const weight =
      block.match(/font-weight\s*:\s*([^;]+);/i)?.[1]?.trim() ?? "400";
    const unicodeRange = block
      .match(/unicode-range\s*:\s*([^;]+);/i)?.[1]
      ?.trim();

    // Prefer woff2; fallback to first src url if needed.
    const woff2Url =
      block.match(/url\(([^)]+)\)\s*format\(["']?woff2["']?\)/i)?.[1] ??
      block.match(/url\(([^)]+)\)/i)?.[1];

    if (!woff2Url) continue;

    entries.push({
      url: woff2Url.replace(/^['"]|['"]$/g, ""),
      weight,
      style,
      unicodeRange,
    });
  }

  return entries;
};

const unicodeRangeIntersectsText = (
  unicodeRange: string | undefined,
  text: string,
): boolean => {
  if (!unicodeRange) return true;

  const ranges = unicodeRange
    .split(",")
    .map((x) => x.trim().toUpperCase())
    .filter(Boolean);

  const inRange = (codePoint: number, token: string): boolean => {
    const match = token.match(/^U\+([0-9A-F?]+)(?:-([0-9A-F]+))?$/i);
    if (!match) return false;

    const startToken = match[1];
    const endToken = match[2];

    if (startToken.includes("?")) {
      const low = Number.parseInt(startToken.replace(/\?/g, "0"), 16);
      const high = Number.parseInt(startToken.replace(/\?/g, "F"), 16);
      return codePoint >= low && codePoint <= high;
    }

    const start = Number.parseInt(startToken, 16);
    const end = endToken ? Number.parseInt(endToken, 16) : start;
    return codePoint >= start && codePoint <= end;
  };

  for (const ch of text) {
    const cp = ch.codePointAt(0);
    if (cp == null) continue;

    for (const range of ranges) {
      if (inRange(cp, range)) return true;
    }
  }

  return false;
};

/**
 * Bullet-proof browser preload for Google Fonts:
 * 1) Fetches Google CSS
 * 2) Parses every returned @font-face
 * 3) Loads each selected .woff2 via FontFace.load()
 * 4) Registers in document.fonts
 */
export async function loadGoogleFont2(
  fontFamily: string,
  options: LoadGoogleFontOptions = {},
) {
  const { weights = ["400", "700"], text, preloadAllSubsets = true } = options;

  const uniqueWeights = [...new Set(weights)].sort();
  const cacheKey = JSON.stringify({
    fontFamily,
    weights: uniqueWeights,
    text: text ?? "",
    preloadAllSubsets,
  });

  const cached = fontLoadCache.get(cacheKey);
  if (cached) {
    await cached;
    return;
  }

  const loadPromise = (async () => {
    if (typeof document === "undefined") return;

    const familyForUrl = fontFamily.replace(/\s+/g, "+");
    const cssUrlBase = `https://fonts.googleapis.com/css2?family=${familyForUrl}:wght@${uniqueWeights.join(";")}&display=block`;
    const cssUrl = text
      ? `${cssUrlBase}&text=${encodeURIComponent(text)}`
      : cssUrlBase;

    const cssText = await fetch(cssUrl).then((res) => {
      if (!res.ok) {
        throw new Error(`Google Fonts CSS fetch failed: ${res.status}`);
      }
      return res.text();
    });

    const parsedFaces = parseGoogleFontCss(cssText);
    const facesToLoad =
      preloadAllSubsets || !text
        ? parsedFaces
        : parsedFaces.filter((f) =>
            unicodeRangeIntersectsText(f.unicodeRange, text),
          );

    if (!facesToLoad.length) {
      throw new Error(`No font faces found for ${fontFamily}`);
    }

    await Promise.all(
      facesToLoad.map(async (face) => {
        const fontFace = new FontFace(fontFamily, `url("${face.url}")`, {
          style: face.style,
          weight: face.weight,
        });
        await fontFace.load();
        document.fonts.add(fontFace);
      }),
    );

    const probeText = text ?? "BESbswy0123456789";
    await Promise.all(
      uniqueWeights.map((weight) =>
        document.fonts.load(`16px "${fontFamily}"`, probeText),
      ),
    );
    await document.fonts.ready;

    Konva.stages?.forEach((stage) => stage.batchDraw());
  })();

  fontLoadCache.set(cacheKey, loadPromise);

  try {
    await loadPromise;
  } catch (err) {
    fontLoadCache.delete(cacheKey);
    console.warn(`[loadGoogleFont2] failed to load font "${fontFamily}":`, err);
    throw err;
  }
}
