import path from "path";
import fs from "fs";
import { Caption, CaptionsSettings } from "@nexpanse/video-editor";

export const prepareCaptions = (captions: Caption[], startTimeLayout) => {
  return (
    captions
      /* .filter(
      (caption) =>
        (caption.start_time >= startTime && caption.end_time <= endTime) ||
        (caption.start_time <= startTime && caption.end_time >= startTime) ||
        (caption.start_time <= endTime && caption.end_time >= endTime)
      //&& caption.end_time > caption.start_time
    ) */
      .map((caption) => ({
        ...caption,
        start_time: caption.start_time - startTimeLayout,
        end_time: caption.end_time - startTimeLayout,
      }))
    //.filter((caption) => caption.start_time > 0)
  );
};

export const getFontPath = (
  fontsPath: string = "/assets/fonts/",
  fontFamily: CaptionsSettings["style"]["font"]["fontFamily"],
  fontWeight: CaptionsSettings["style"]["font"]["fontWeight"],
  italic: CaptionsSettings["style"]["font"]["italic"]
) => {
  // TODO: analyze files in assets/fonts and provide me with the correct path

  // Normalize font family to lowercase for consistent checking
  const fontFamilyDir = fontFamily.split(" ").join("_");
  const normalizedFontFamily = fontFamily.replace(" ", "");
  // Define font weight mapping
  const weightMap: { [key: string]: string } = {
    thin: "ExtraLight",
    light: "Light",
    regular: "Regular",
    medium: "Medium",
    bold: "Bold",
    black: "Black",
  };

  const weight = weightMap[fontWeight] || "Regular";

  const fontStyle = italic ? "Italic" : "";

  // Construct the expected font filename
  const fontFileName = `${normalizedFontFamily}-${weight}${fontStyle}.ttf`;

  // Construct full path
  const fullPath = path.join(fontsPath, fontFamilyDir, fontFileName);

  const fallbacks = {
    ExtraLight: ["Thin", "Light", "Regular"],
    Light: ["Thin", "Regular"],
    Regular: [],
    Medium: ["SemiBold", "Regular"],
    Bold: ["Medium", "Regular"],
    Black: ["ExtraBold", "Bold", "Medium", "Regular"],
  };

  if (fs.existsSync(fullPath)) {
    return fullPath;
  }

  for (const fallback of fallbacks[weight]) {
    const fallbackFontFileName = `${normalizedFontFamily}-${fallback}${fontStyle}.ttf`;
    const fallbackFullPath = path.join(fontsPath, fontFamilyDir, fallbackFontFileName);
    if (fs.existsSync(fallbackFullPath)) {
      return fallbackFullPath;
    }
  }

  return `${normalizedFontFamily}-Regular.ttf`;
};

export const fontWeightToNumber = (fontWeight: string) => {
  switch (fontWeight) {
    case "thin":
      return 100;
    case "light":
      return 300;
    case "regular":
      return 400;
    case "medium":
      return 500;
    case "bold":
      return 700;
    case "black":
      return 900;
    default:
      return 400;
  }
};

export const limitToBounds = (bounds: [number, number, number, number]) => {
  return (x: number, index: number) => {
    switch (index) {
      case 0:
        return x < bounds[0] ? bounds[0] : x;
      case 1:
        return x < bounds[1] ? bounds[1] : x;
      case 2:
        return x > bounds[2] ? bounds[2] : x;
      case 3:
        return x > bounds[3] ? bounds[3] : x;
      default:
        return x;
    }
  };
};

export const getFileNameFromUrl = (fileUrl: string): string => {
  const parsedUrl = new URL(fileUrl);
  const pathname = parsedUrl.pathname;
  const fileName = path.basename(pathname);
  return fileName;
};
