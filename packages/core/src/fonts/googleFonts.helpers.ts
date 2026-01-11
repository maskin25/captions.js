import Konva from "konva";
import { googleFontsList } from "./googleFonts.config";

export async function loadGoogleFont(
  fontName: (typeof googleFontsList)[number],
  weights = ["400"]
) {
  const family = fontName.replace(/ /g, "+");
  const fontUrl = `https://fonts.googleapis.com/css2?family=${family}:wght@${weights.join(
    ";"
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

/**
 * Loads a Google Font and ensures it can be used in Konva.
 * Example:
 *   await loadGoogleFont("Roboto");
 *   const text = new Konva.Text({ fontFamily: "Roboto", text: "Hello" });
 */
export async function loadGoogleFont2(fontFamily: string) {
  // 1. Normalize the name (Google Fonts API uses + instead of spaces)
  const fontNameForUrl = fontFamily.replace(/\s+/g, "+");
  const fontUrl = `https://fonts.googleapis.com/css2?family=${fontNameForUrl}:wght@400;700&display=swap`;

  // 2. Add a <link> to load the font (if not already added)
  if (!document.querySelector(`link[href="${fontUrl}"]`)) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = fontUrl;
    document.head.appendChild(link);
  }

  // 3. Wait for the font to actually load
  // (using the FontFaceSet API, as in the example on the Konva website)
  try {
    await document.fonts.load(`16px "${fontFamily}"`);
    // some browsers require multiple checks
    await document.fonts.ready;
  } catch (err) {
    console.warn(`[loadGoogleFont] failed to load font "${fontFamily}":`, err);
  }

  await new Promise((resolve) => setTimeout(resolve, 100));

  // 4. Force update Konva layers (if necessary)
  Konva.stages?.forEach((stage) => stage.batchDraw());

  /*  console.log(
    `[loadGoogleFont] Font "${fontFamily}" loaded and ready for Konva.`
  ); */
}
