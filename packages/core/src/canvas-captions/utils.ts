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

/** A silence at least this long (seconds) between two words starts a new screen. */
export const SCREEN_BREAK_PAUSE = 0.6;

// Sentence-final punctuation, optionally followed by closing quotes or brackets.
const SENTENCE_END = /[.!?…。！？]["'»”’)\]]*$/;
// Words that end in a period without ending a sentence.
const ABBREVIATION =
  /^(?:[A-Za-z]\.){2,}$|^(?:mr|mrs|ms|dr|prof|sr|jr|st|vs|etc|e\.g|i\.e|approx|no|vol|т\.е|т\.д|т\.п|г|гг|др|им|ул|см|стр)\.$/i;

const endsSentence = (word: string) => {
  const text = word.trim();
  return SENTENCE_END.test(text) && !ABBREVIATION.test(text);
};

/**
 * True when `next` must start a new screen: it belongs to another sentence
 * (by sentence times when the transcript has them), the previous word ends a
 * sentence, the speaker changes, or there is a pause of
 * {@link SCREEN_BREAK_PAUSE} seconds or more between them.
 */
export const isScreenBreak = (previous: Caption, next: Caption): boolean => {
  if (!sameSentence(previous, next)) return true;
  if (endsSentence(previous.word)) return true;
  if (
    previous.speaker !== undefined &&
    next.speaker !== undefined &&
    previous.speaker !== next.speaker
  ) {
    return true;
  }
  return next.startTime - previous.endTime >= SCREEN_BREAK_PAUSE;
};

/**
 * Splits captions into phrases at every break found by {@link isScreenBreak}.
 * A screen never spans two phrases; layout packs each phrase into screens.
 */
export const splitIntoPhrases = (captions: Caption[]): Caption[][] => {
  const phrases: Caption[][] = [];
  let phrase: Caption[] = [];
  captions.forEach((caption, index) => {
    if (phrase.length && isScreenBreak(captions[index - 1], caption)) {
      phrases.push(phrase);
      phrase = [];
    }
    phrase.push(caption);
  });
  if (phrase.length) phrases.push(phrase);
  return phrases;
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
    return caption.highlightColor || getHighlightColor(captionsSettings);
  }

  if (captionsSettings.animation === "box-word" && isCurrentCaption) {
    return isVisibleColor(captionsSettings.style.backgroundColor)
      ? caption.highlightColor || getHighlightColor(captionsSettings)
      : captionsSettings.style.font.fontColor;
  }

  if (isCurrentCaption) {
    return caption.highlightColor || getHighlightColor(captionsSettings);
  }

  return captionsSettings.style.font.fontColor;
};

export const getBoxWordBackgroundColor = (
  caption: Caption,
  captionsSettings: CaptionsSettings
) =>
  isVisibleColor(captionsSettings.style.backgroundColor)
    ? captionsSettings.style.backgroundColor
    : caption.highlightColor || getHighlightColor(captionsSettings);

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

/**
 * Active-word color of a settings object, honouring the deprecated
 * `aplifiedWordColor` name for settings saved before 1.10.
 *
 * @public
 */
export const getHighlightColor = (captionsSettings: CaptionsSettings): string =>
  captionsSettings.style.highlightColor ??
  captionsSettings.style.aplifiedWordColor ??
  captionsSettings.style.font.fontColor;
