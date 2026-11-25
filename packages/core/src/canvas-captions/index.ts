import Konva from "konva";
import { RenderFrameFn } from "./types";

import { Caption, CaptionsSettings } from "../entities/captions/captions.types";
import { LayoutSettings } from "../entities/layout/layout.types";
import { animate, boxWordMetrics } from "./animate";
import {
  alignLinesInGroup,
  detectAlphabetKind,
  fontWeightToFontStyle,
  getAlphabet,
  getCaptionsGroupY,
  getFillColor,
  splitIntoPhrases,
} from "./utils";

import {
  LAYOUT_UNITS_PER_EM,
  baselineRatio,
  emphasisScale,
  emphasisStrength,
  withFontReadiness,
  layoutFont,
  measureUnits,
  packScreens,
} from "./layout";
import { Timeline } from "../entities/timeline/timeline.types";
import { fonts } from "./fonts.config";
import { StylePreset } from "../stylePresets/stylePresets.config";
import { loadGoogleFont2 } from "../fonts/googleFonts.helpers";
import { googleFontsList } from "../fonts/googleFonts.config";

type ChunkRange = {
  start: number;
  end: number;
  chunk: Caption[];
  lines: Caption[][];
  /** Per line: font scale that makes an over-wide line fit (1 = as is). */
  fits: number[];
};

type ChunkCacheEntry = {
  ranges: ChunkRange[];
};

type ActiveCaptionRenderState = {
  caption: Caption;
  text: Konva.Text;
  progress: number;
  elapsed: number;
  textTrim?: Konva.Text | null;
};

const wordPriorityAnimations = new Set<CaptionsSettings["animation"]>([
  "bounce",
  "box-word",
]);

const chunkCache = new WeakMap<Caption[], Map<string, ChunkCacheEntry>>();

/**
 * Room kept free on each side of a line, in average letter widths of the
 * preset font. Box and bounce draw beyond the word (padding, overshoot), so
 * they keep more.
 */
const lineMarginLetters = (animation: CaptionsSettings["animation"]) =>
  animation === "box" || animation === "bounce" ? LINE_MARGIN_LETTERS + 1 : LINE_MARGIN_LETTERS;
const LINE_MARGIN_LETTERS = 2;

/**
 * Word gaps have fixed-pixel parts (bounce, capitals) tuned on a 960 px tall
 * frame. Layout takes the gap at that size, as a share of the font size, so
 * line breaks do not depend on the output resolution.
 */
const LAYOUT_REFERENCE_COEF = 960 / 480;

const getWordSpacing = (
  captionsSettings: CaptionsSettings,
  targetFontSize: number,
) =>
  targetFontSize * 0.1 +
  (captionsSettings.animation === "bounce" ? 8 : 0) +
  (captionsSettings.style.font.fontCapitalize ? 2 : 0) +
  // the box around the active word reaches into the gap on both sides
  (captionsSettings.animation === "box-word"
    ? 2 * boxWordMetrics(targetFontSize).paddingX
    : 0);

const layoutRanges = (
  captionsSettings: CaptionsSettings,
  captions: Caption[],
  font: string,
  layerWidth: number,
  targetFontSize: number,
): ChunkRange[] => {
  const { fontCapitalize } = captionsSettings.style.font;
  const { linesPerPage, animation } = captionsSettings;
  // Everything below is in whole layout units (1/1000 em), so the same words
  // break into the same lines at any resolution and in any canvas engine.
  const toUnits = LAYOUT_UNITS_PER_EM / targetFontSize;
  const display = (word: string) =>
    (fontCapitalize ? word.toUpperCase() : word).trim();

  const alphabet = display(
    getAlphabet(
      detectAlphabetKind(
        captions
          .slice(0, 10)
          .map((x) => x.word)
          .join(""),
      ),
    ),
  );
  const averageLetter = measureUnits(alphabet, font) / [...alphabet].length;
  const referenceFontSize =
    captionsSettings.style.font.fontSize * LAYOUT_REFERENCE_COEF;
  const spacing = Math.round(
    (getWordSpacing(captionsSettings, referenceFontSize) / referenceFontSize) *
      LAYOUT_UNITS_PER_EM,
  );
  const maxLineWidth =
    Math.floor(layerWidth * toUnits + 1e-6) -
    Math.round(2 * lineMarginLetters(animation) * averageLetter);

  const widthOf = (caption: Caption) =>
    Math.round(
      measureUnits(display(caption.word), font) *
        emphasisScale(caption, captionsSettings),
    );

  const ranges: ChunkRange[] = [];
  splitIntoPhrases(captions).forEach((phrase) => {
    packScreens(
      phrase,
      widthOf,
      spacing,
      Math.max(0, maxLineWidth),
      linesPerPage,
    ).forEach((lines) => {
      const chunk = lines.flat();
      ranges.push({
        start: chunk[0].startTime,
        end: chunk[chunk.length - 1].endTime,
        chunk,
        lines,
        // only a single word can be wider than the line; it shrinks to fit
        fits: lines.map((line) => {
          const width =
            line.reduce((sum, caption) => sum + widthOf(caption), 0) +
            spacing * (line.length - 1);
          return maxLineWidth > 0 && width > maxLineWidth
            ? maxLineWidth / width
            : 1;
        }),
      });
    });
  });

  return ranges;
};

/**
 * Splits captions into screens of lines. Line breaks use layout widths
 * (see layout.ts), so the browser and the server break lines identically.
 */
const getChunksCached = (
  captionsSettings: CaptionsSettings,
  captions: Caption[],
  layerWidth: number,
  targetFontSize: number,
): ChunkCacheEntry => {
  const { fontFamily, fontWeight, italic, fontCapitalize } =
    captionsSettings.style.font;
  const font = layoutFont(
    fontFamily,
    fontWeightToFontStyle(fontWeight, Boolean(italic)),
  );
  const { linesPerPage, animation } = captionsSettings;
  const cacheKey = [
    font,
    layerWidth,
    targetFontSize,
    // word gaps are taken at the preset's own size (see LAYOUT_REFERENCE_COEF)
    captionsSettings.style.font.fontSize,
    fontCapitalize ? 1 : 0,
    animation,
    linesPerPage,
    captionsSettings.expressiveness ?? 0,
  ].join("|");

  let cacheByKey = chunkCache.get(captions);
  if (!cacheByKey) {
    cacheByKey = new Map<string, ChunkCacheEntry>();
    chunkCache.set(captions, cacheByKey);
  }

  const cached = cacheByKey.get(cacheKey);
  if (cached) {
    return cached;
  }

  const { result: ranges, ready } = withFontReadiness(() =>
    layoutRanges(captionsSettings, captions, font, layerWidth, targetFontSize),
  );
  const next: ChunkCacheEntry = { ranges };
  // widths taken before the font loaded are a fallback font's: measure again
  if (ready) cacheByKey.set(cacheKey, next);
  return next;
};

/** How long a finished screen stays up during a silence, in seconds. */
const SCREEN_HOLD_SEC = 1;

const findChunkByTime = (
  ranges: ChunkRange[],
  currentTime: number,
): ChunkRange | undefined => {
  let low = 0;
  let high = ranges.length - 1;

  while (low <= high) {
    const mid = (low + high) >> 1;
    const range = ranges[mid];

    if (currentTime < range.start) {
      high = mid - 1;
      continue;
    }
    if (currentTime > range.end) {
      low = mid + 1;
      continue;
    }

    return range;
  }

  // In a silence between screens, keep the finished screen up for a moment
  // instead of blinking to an empty frame. `high` is the last screen that
  // started before `currentTime`.
  const previous = ranges[high];
  if (previous && currentTime - previous.end <= SCREEN_HOLD_SEC) {
    return previous;
  }

  return undefined;
};

const drawDebugBoundingBox = (
  parent: Konva.Group,
  width: number,
  height: number,
  stroke: string,
  dash: number[] = [6, 4],
) => {
  const rect = new Konva.Rect({
    x: 0,
    y: 0,
    width,
    height,
    stroke,
    strokeWidth: 4,
    dash,
    listening: false,
  });

  parent.add(rect);
  rect.moveToTop();
};

export const renderFrame: RenderFrameFn = (
  captionsSettings: CaptionsSettings,
  layoutSettings: LayoutSettings,
  captions: Caption[],
  currentTime: number,
  targetSize: [number, number],
  layer: Konva.Layer,
  toCoef?: number,
  debug?: boolean,
) => {
  const [width, height] = targetSize;
  const targetFontSize = captionsSettings.style.font.fontSize * (toCoef ?? 1);
  const showDebugBoundingBoxes = Boolean(debug);
  const wordSpacing = getWordSpacing(captionsSettings, targetFontSize);
  const { ranges } = getChunksCached(
    captionsSettings,
    captions,
    layer.getWidth()!,
    targetFontSize,
  );
  const currentRange = findChunkByTime(ranges, currentTime);
  const currentChunk = currentRange?.chunk;
  // index in currentChunk of the last word of each line, and each word's
  // shrink-to-fit scale
  const lineEnds = new Set<number>();
  const wordFits: number[] = [];
  currentRange?.lines.forEach((line, lineIndex) => {
    line.forEach(() => wordFits.push(currentRange.fits[lineIndex]));
    lineEnds.add(wordFits.length - 1);
  });
  const yOffset = captionsSettings.lineSpacing ?? 4;

  if (currentChunk) {
    const group = new Konva.Group({
      drawBorder: true,
    });
    let x = 0;
    let y = 0;
    let maxGroupWidth = 0;
    let groupWidth = 0;
    let groupHeight = 0;
    let line: Konva.Group = new Konva.Group({
      drawBorder: true,
    });

    let lineTexts: Konva.Text[] = [];
    const layoutFontOf = (t: Konva.Text) => layoutFont(t.fontFamily(), t.fontStyle());

    let activeCaptionState: ActiveCaptionRenderState | undefined = undefined;
    let activeCaptionText: Konva.Text | null = null;

    const activeBoxWordCaptionIndex =
      captionsSettings.animation === "box-word"
        ? currentChunk.reduce((activeIndex, caption, index) => {
            if (
              caption.startTime > currentTime ||
              caption.endTime < currentTime
            ) {
              return activeIndex;
            }

            if (activeIndex === -1) {
              return index;
            }

            const activeCaption = currentChunk[activeIndex];
            return caption.startTime >= activeCaption.startTime
              ? index
              : activeIndex;
          }, -1)
        : -1;

    currentChunk.forEach((caption, index) => {
      const isCaptionAtCurrentTime =
        caption.startTime <= currentTime && caption.endTime >= currentTime;

      const isCurrentCaption =
        captionsSettings.animation === "box-word"
          ? index === activeBoxWordCaptionIndex
          : isCaptionAtCurrentTime;

      const isPastCaption = caption.endTime < currentTime;

      const strength = emphasisStrength(caption, captionsSettings);
      const { emphasisColor } = captionsSettings.style;
      const fillColor =
        emphasisColor && strength >= 0.5 && !isCurrentCaption
          ? emphasisColor
          : getFillColor(
              caption,
              isCurrentCaption,
              isPastCaption,
              captionsSettings,
            );
      const wordFontSize =
        targetFontSize *
        emphasisScale(caption, captionsSettings) *
        (wordFits[index] ?? 1);

      const isLastWordInLine = lineEnds.has(index);

      let word = captionsSettings.style.font.fontCapitalize
        ? caption.word.toUpperCase()
        : caption.word;

      word = isLastWordInLine ? word.trim() : word;

      const createKonvaText = (
        word: string,
        x: number,
        targetFontSize: number,
        captionsSettings: CaptionsSettings,
        fillColor: string,
        trim: boolean,
      ) => {
        return new Konva.Text({
          text: trim ? word?.trim() : word,
          x,
          y: 0,
          drawBorder: true,
          fontSize: targetFontSize,
          fontFamily: captionsSettings.style.font.fontFamily,
          fontStyle: fontWeightToFontStyle(
            captionsSettings.style.font.fontWeight,
            captionsSettings.style.font.italic,
          ),
          stroke: captionsSettings.style.font.fontStrokeColor,
          strokeWidth: captionsSettings.style.font.fontStrokeWidth
            ? captionsSettings.style.font.fontStrokeWidth / 10
            : 0,
          textDecoration: captionsSettings.style.font.underline
            ? "underline"
            : "",
          fill: fillColor,
          shadowColor: captionsSettings.style.font.shadow?.fontShadowColor,
          shadowBlur: captionsSettings.style.font.shadow?.fontShadowBlur ?? 0,
          shadowOffset: captionsSettings.style.font.shadow
            ? {
                x: captionsSettings.style.font.shadow?.fontShadowOffsetX ?? 0,
                y: captionsSettings.style.font.shadow?.fontShadowOffsetY ?? 0,
              }
            : undefined,
          listening: false,
          perfectDrawEnabled: false,
        });
      };

      const text = createKonvaText(
        word,
        x,
        wordFontSize,
        captionsSettings,
        fillColor,
        false,
      );
      text.fillAfterStrokeEnabled(true);

      const textTrim =
        captionsSettings.animation === "box-word"
          ? createKonvaText(
              word,
              x,
              wordFontSize,
              captionsSettings,
              fillColor,
              true,
            )
          : null;

      if (isCurrentCaption) {
        activeCaptionState = {
          caption,
          text,
          progress:
            caption.endTime > caption.startTime
              ? Math.min(
                  1,
                  Math.max(
                    0,
                    (currentTime - caption.startTime) /
                      (caption.endTime - caption.startTime),
                  ),
                )
              : 1,
          elapsed: Math.max(0, currentTime - caption.startTime),
          textTrim: textTrim,
        };
        activeCaptionText = text;
      }

      x += text.width() + wordSpacing;
      groupWidth += text.width() + (isLastWordInLine ? 0 : wordSpacing);

      line.y(y);
      line.add(text);
      lineTexts.push(text);

      if (isLastWordInLine) {
        group.add(line);
        x = 0;

        // words of different sizes (emphasis) share one baseline
        const largest = Math.max(...lineTexts.map((t) => t.fontSize()));
        lineTexts.forEach((t) =>
          t.y((largest - t.fontSize()) * baselineRatio(layoutFontOf(t))),
        );
        const lineHeight = Math.max(...lineTexts.map((t) => t.y() + t.height()));
        lineTexts = [];

        const isLastLine = index + 1 === currentChunk.length;

        y += lineHeight + yOffset;

        groupHeight += lineHeight + (isLastLine ? 0 : yOffset);

        if (groupWidth > maxGroupWidth) {
          maxGroupWidth = groupWidth;
        }
        groupWidth = 0;
        line = new Konva.Group({
          drawBorder: true,
        });
      }
    });

    const lineMetrics = alignLinesInGroup(group, maxGroupWidth, wordSpacing);

    /*  const progress =
      (currentTime - currentChunk[0].start_time) /
      (currentChunk[currentChunk.length - 1].end_time -
        currentChunk[0].start_time); */

    const progress = Math.min(
      1,
      (currentTime - currentChunk[0].startTime) / 0.2,
    );

    group.offsetX(maxGroupWidth / 2);
    group.offsetY(groupHeight / 2);

    group.x(width / 2);
    group.y(
      getCaptionsGroupY(
        groupHeight,
        width,
        height,
        captionsSettings.position,
        captionsSettings.positionTopOffset ?? 0,
        toCoef ?? 1,
      ),
    );

    animate(
      captionsSettings,
      progress,
      {
        group: group,
        width: maxGroupWidth,
        height: groupHeight,
      },
      activeCaptionState,
    );

    if (showDebugBoundingBoxes) {
      drawDebugBoundingBox(group, maxGroupWidth, groupHeight, "#ff4081");
      lineMetrics.forEach(({ line, width, height }) => {
        drawDebugBoundingBox(line, width, height, "#2196f3", [4, 3]);
      });
    }

    const currentText = activeCaptionText as Konva.Text | null;
    if (currentText !== null && wordPriorityAnimations.has(captionsSettings.animation)) {
      currentText.parent?.moveToTop();
      currentText.moveToTop();
    }

    layer.add(group);
  }

  layer.draw();
};

export const trimCaptions = (
  captions: Caption[],
  timeRange: [number, number],
  includeLast: boolean,
) => {
  const [startTime, endTime] = timeRange;
  return captions.filter((caption) => {
    return (
      (caption.startTime >= startTime && caption.endTime <= endTime) ||
      (includeLast &&
        caption.startTime <= endTime &&
        caption.endTime >= endTime)
    );
  });
};

export const trimLayoutsCaptions = (
  timeline: Timeline,
  captions: Caption[],
) => {
  return timeline.layouts
    .map((layout, index, arr) => {
      const timeRange = [layout.startTime, layout.endTime] as [number, number];

      const includeLast =
        Boolean(arr[index + 1]) && arr[index + 1].startTime === layout.endTime;

      const trimmedCaptions = trimCaptions(captions, timeRange, includeLast);
      return trimmedCaptions;
    })
    .flat();
};

export const fillWithGaps = (
  captions: Caption[],
  timeRange: [number, number],
) => {
  const [startTime, endTime] = timeRange;
  const filledCaptions = [];
  let lastEndTime = startTime;
  for (const caption of captions) {
    if (caption.startTime > lastEndTime) {
      filledCaptions.push({
        startTime: lastEndTime,
        endTime: caption.startTime,
        word: "",
      });
    }
    filledCaptions.push(caption);
    lastEndTime = caption.endTime;
  }
  if (lastEndTime < endTime) {
    filledCaptions.push({
      startTime: lastEndTime,
      endTime: endTime,
      word: "",
    });
  }
  return filledCaptions;
};

export const warmUpKonvaFonts = (layer: Konva.Layer) => {
  const texts: Konva.Text[] = [];
  fonts.forEach((font) => {
    const text = new Konva.Text({
      text: "w",
      x: -100,
      y: 0,
      fontSize: 1,
      fontFamily: font,
      fill: "black",
    });
    layer.add(text);
    texts.push(text);
  });
  const timeout = setTimeout(() => {
    texts.forEach((x) => x.destroy());
    clearTimeout(timeout);
  }, 2000);
};

export const renderStylePreset = async (
  stylePreset: StylePreset,
  size: [number, number],
  frames: number[],
  text: string = "Hello World",
) => {
  const [width, height] = size;
  const containerElement = document.createElement("div");

  const stage = new Konva.Stage({
    container: containerElement,
    width,
    height,
  });

  const layer = new Konva.Layer({ listening: false });
  stage.add(layer);

  const fontSettings = stylePreset.captionsSettings.style.font;
  const fontFamily = stylePreset.captionsSettings.style.font
    .fontFamily as (typeof googleFontsList)[number];
  await loadGoogleFont2(fontFamily);

  const [firstWord, secondWord = ""] = text.split(" ");
  const previewCaptions: Caption[] = [
    {
      startTime: 0,
      endTime: 1,
      word: "",
    },
    {
      startTime: 1,
      endTime: 2,
      word: firstWord,
    },
    {
      startTime: 2,
      endTime: 3,
      word: secondWord,
    },
  ];

  const renderAtTime = (currentTime: number) => {
    layer.destroyChildren();
    renderFrame(
      stylePreset.captionsSettings,
      undefined as any,
      previewCaptions,
      currentTime,
      size,
      layer,
      1.3,
    );
    return stage.toDataURL({ pixelRatio: devicePixelRatio });
  };

  const images = frames.map((time) => renderAtTime(time));

  stage.destroy();

  return images;
};
