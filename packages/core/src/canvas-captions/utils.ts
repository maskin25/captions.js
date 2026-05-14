import Konva from "konva";
import { Caption, CaptionsSettings } from "../entities/captions/captions.types";

const SOCIAL_NETWORK_OFFSET = 70;

export const secondsToHMMSSCS = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secondsInt = Math.floor(seconds % 60);
  const centiseconds = Math.floor((seconds - Math.floor(seconds)) * 100);

  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${secondsInt.toString().padStart(2, "0")}.${centiseconds
    .toString()
    .padStart(2, "0")}`;
};

export const splitCaptionsBy = (captions: Caption[], by: number) => {
  const result = [];
  for (let i = 0; i < captions.length; i += by) {
    result.push(captions.slice(i, i + by));
  }
  return result;
};

export const splitCaptionsBytotalWordsToDisplay = (
  captions: Caption[],
  totalWordsToDisplay: number,
  linesPerPage: number
) => {
  const result: Caption[][] = [];
  let currentCaptionIndex = 0;
  let currentSymbolsLength = 0;
  let currentBlock: Caption[] = [];
  let currentLine = 1;

  while (currentCaptionIndex < captions.length) {
    const caption = captions[currentCaptionIndex];
    if (currentSymbolsLength + caption.word.length + 1 <= totalWordsToDisplay) {
      currentBlock.push(caption);
      currentSymbolsLength += caption.word.length + 1;
      currentCaptionIndex++;
    } else if (linesPerPage > currentLine) {
      currentBlock.push(caption);
      currentCaptionIndex++;
      currentSymbolsLength = caption.word.length;
      currentLine++;
    } else {
      if (currentBlock.length > 0) {
        result.push(currentBlock);
      }
      currentBlock = [];
      currentBlock.push(caption);
      currentSymbolsLength = caption.word.length;
      currentCaptionIndex++;
      currentLine = 1;
    }
  }

  if (currentBlock.length > 0) {
    result.push(currentBlock);
  }

  return result;
};

const hasFiniteTime = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const hasSentenceMetadata = (caption: Caption): boolean =>
  hasFiniteTime(caption.sentenceStartTime) && hasFiniteTime(caption.sentenceEndTime);

const sameSentence = (left: Caption, right: Caption): boolean => {
  const leftHas = hasSentenceMetadata(left);
  const rightHas = hasSentenceMetadata(right);

  if (leftHas && rightHas) {
    return (
      left.sentenceStartTime === right.sentenceStartTime &&
      left.sentenceEndTime === right.sentenceEndTime
    );
  }

  if (!leftHas && !rightHas) {
    return true;
  }

  return false;
};

export const splitCaptionsBySentenceAwareBlocks = (
  captions: Caption[],
  totalWordsToDisplay: number,
  linesPerPage: number
) => {
  if (!captions.length) return [];

  const containsSentenceData = captions.some((caption) =>
    hasSentenceMetadata(caption)
  );
  if (!containsSentenceData) {
    return splitCaptionsBytotalWordsToDisplay(
      captions,
      totalWordsToDisplay,
      linesPerPage
    );
  }

  const result: Caption[][] = [];
  let sentenceBlock: Caption[] = [];

  const flushSentenceBlock = () => {
    if (!sentenceBlock.length) return;
    const sentenceChunks = splitCaptionsBytotalWordsToDisplay(
      sentenceBlock,
      totalWordsToDisplay,
      linesPerPage
    );
    sentenceChunks.forEach((chunk) => result.push(chunk));
    sentenceBlock = [];
  };

  captions.forEach((caption, index) => {
    if (!sentenceBlock.length) {
      sentenceBlock.push(caption);
      return;
    }

    const previous = captions[index - 1];
    if (previous && sameSentence(previous, caption)) {
      sentenceBlock.push(caption);
      return;
    }

    flushSentenceBlock();
    sentenceBlock.push(caption);
  });

  flushSentenceBlock();

  return result;
};

export const fontWeightToFontStyle = (
  fontWeight: string,
  isItalic: boolean
) => {
  return (isItalic ? "italic " : "") + fontWeightToNumber(fontWeight);
};

const fontWeightToNumber = (fontWeight: string) => {
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

export const splitCaptionsToLines = (
  captions: Caption[],
  linesPerPage: number
) => {
  const result = [];
  for (let i = 0; i < captions.length; i += linesPerPage) {
    result.push(captions.slice(i, i + linesPerPage));
  }
  return result;
};

export const getWordsPerLineByLinesPerPage = (linesPerPage: number) => {
  switch (linesPerPage) {
    default:
      return 2;
  }
};

export const getTotalSymbolInLine = (
  fontSize: number,
  width: number,
  captionsSettings: CaptionsSettings
) => {
  const boxOffset =
    captionsSettings.animation === "box" ||
    captionsSettings.animation === "bounce"
      ? 4
      : 0;
  const symbolWidth = fontSize * 0.9;
  const total = Math.floor(width / symbolWidth) - boxOffset;
  return total > 0 ? total : 0;
};

export const isVisibleColor = (color: unknown) => {
  if (typeof color !== "string") return false;

  const normalized = color.trim().toLowerCase();
  if (!normalized || normalized === "transparent") return false;

  const hexMatch = normalized.match(/^#[0-9a-f]{6}([0-9a-f]{2})?$/);
  if (hexMatch?.[1] === "00") return false;

  return true;
};

export const getFillColor = (
  caption: Caption,
  isCurrentCaption: boolean,
  isPastCaption: boolean,
  captionsSettings: CaptionsSettings
) => {
  if (captionsSettings.animation === "underline") {
    return captionsSettings.style.font.fontColor;
  }

  /* if (
    captionsSettings.animation === 'pop' ||
    captionsSettings.animation === 'scale'
  ) {
    return caption.highlightColor || captionsSettings.style.font.fontColor;
  } */

  if (
    captionsSettings.animation === "box" &&
    (isCurrentCaption || isPastCaption)
  ) {
    return caption.highlightColor || captionsSettings.style.aplifiedWordColor;
  }

  if (captionsSettings.animation === "box-word" && isCurrentCaption) {
    return isVisibleColor(captionsSettings.style.backgroundColor)
      ? caption.highlightColor || captionsSettings.style.aplifiedWordColor
      : captionsSettings.style.font.fontColor;
  }

  if (isCurrentCaption) {
    return caption.highlightColor || captionsSettings.style.aplifiedWordColor;
  }

  return captionsSettings.style.font.fontColor;
};

export const getBoxWordBackgroundColor = (
  caption: Caption,
  captionsSettings: CaptionsSettings
) =>
  isVisibleColor(captionsSettings.style.backgroundColor)
    ? captionsSettings.style.backgroundColor
    : caption.highlightColor || captionsSettings.style.aplifiedWordColor;

export const getCaptionsGroupY = (
  groupHeight: number,
  canvasWidth: number,
  canvasHeight: number,
  position: CaptionsSettings["position"],
  offset: number,
  toCoef: number
) => {
  const aspectRatio = canvasWidth / canvasHeight;
  const socialOffset = aspectRatio <= 1 ? SOCIAL_NETWORK_OFFSET * toCoef : 0;

  switch (position) {
    case "top":
      return (offset + 20) * toCoef + groupHeight / 2;
    case "middle":
      return canvasHeight / 2 + offset * toCoef;
    default:
      return (
        canvasHeight - groupHeight / 2 - (20 + offset) * toCoef - socialOffset
      );
  }
};

export const alignLinesInGroup = (
  group: Konva.Group,
  maxGroupWidth: number,
  xOffset: number
) => {
  return group.children.map((line) => {
    const lineWords = (line as Konva.Group).children;
    const lineWordsWidth = lineWords.reduce(
      (acc, word, currentIndex) =>
        acc + (word as Konva.Text).width() + (currentIndex > 0 ? xOffset : 0),
      0
    );
    const lineHeight = lineWords.reduce(
      (acc, word) => Math.max(acc, (word as Konva.Text).height()),
      0
    );

    const lineX = (maxGroupWidth - lineWordsWidth) / 2;
    line.x(lineX);

    return {
      line: line as Konva.Group,
      width: lineWordsWidth,
      height: lineHeight,
    };
  });
};

export const getGroupCenter = (group: Konva.Group) => {
  var boundingBox = group.getClientRect();
  var centerX = boundingBox.x + boundingBox.width / 2;
  var centerY = boundingBox.y + boundingBox.height / 2;
  return { centerX: centerX, centerY: centerY };
};

export const alphabetEN =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

export const alphabetRU =
  "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдеёжзийклмнопрстуфхцчшщъыьэюя";

export const alphabetArabic =
  "ا ب ت ث ج ح خ د ذ ر ز س ش ص ض ط ظ ع غ ف ق ك ل م ن ه و ي";

export const getAverageSymbolsInLine = (
  targetWidth: number,
  textWidth: number,
  alphabetLength: number,
  captionsSettings: CaptionsSettings
) => {
  const offset =
    captionsSettings.animation === "box" ||
    captionsSettings.animation === "bounce"
      ? 4
      : 2;
  const avg = Math.round(targetWidth / (textWidth / alphabetLength)) - offset;
  return avg > 0 ? avg : 0;
};

export const getAlphabet = (kind: AlphabetKinds) => {
  switch (kind) {
    case AlphabetKinds.Cyrillic:
      return alphabetRU;
    case AlphabetKinds.Latin:
      return alphabetEN;
    case AlphabetKinds.Arabic:
      return alphabetArabic;
    default:
      return AlphabetKinds.Latin;
  }
};

export const detectAlphabetKind = (text: string) => {
  if (isCyrillic(text)) {
    return AlphabetKinds.Cyrillic;
  }
  if (isLatin(text)) {
    return AlphabetKinds.Latin;
  }
  if (isArabic(text)) {
    return AlphabetKinds.Arabic;
  }

  return AlphabetKinds.Latin;
};

export enum AlphabetKinds {
  Cyrillic = "cyrillic",
  Latin = "latin",
  Arabic = "arabic",
}

function isCyrillic(text: string) {
  return /[\u0400-\u04FF]/.test(text);
}

function isLatin(text: string) {
  return /[A-Za-z]/.test(text);
}

function isArabic(text: string) {
  return /[\u0600-\u06FF]/.test(text);
}
