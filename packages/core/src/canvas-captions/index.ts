import Konva from "konva";
import { RenderFrameFn } from "./types";

import { Caption, CaptionsSettings } from "../entities/captions/captions.types";
import { LayoutSettings } from "../entities/layout/layout.types";
import { animate } from "./animate";
import {
  alignLinesInGroup,
  detectAlphabetKind,
  fontWeightToFontStyle,
  getAlphabet,
  getAverageSymbolsInLine,
  getCaptionsGroupY,
  getFillColor,
  splitCaptionsBySentenceAwareBlocks,
} from "./utils";

import { Timeline } from "../entities/timeline/timeline.types";
import { fonts } from "./fonts.config";
import { StylePreset } from "../stylePresets/stylePresets.config";
import { loadGoogleFont2 } from "../fonts/googleFonts.helpers";
import { googleFontsList } from "../fonts/googleFonts.config";

type ChunkRange = {
  start: number;
  end: number;
  chunk: Caption[];
};

type ChunkCacheEntry = {
  chunks: Caption[][];
  ranges: ChunkRange[];
};

type ActiveCaptionRenderState = {
  caption: Caption;
  text: Konva.Text;
  progress: number;
  textTrim?: Konva.Text | null;
};

const wordPriorityAnimations = new Set<CaptionsSettings["animation"]>([
  "bounce",
  "box-word",
]);

const symbolsPerLineCache = new WeakMap<CaptionsSettings, Map<string, number>>();
const chunkCache = new WeakMap<Caption[], Map<string, ChunkCacheEntry>>();

const getSymbolsPerLineCacheKey = (
  layerWidth: number,
  targetFontSize: number,
  captionsSettings: CaptionsSettings,
) => {
  const font = captionsSettings.style.font;
  return [
    layerWidth,
    targetFontSize,
    font.fontFamily,
    font.fontWeight,
    font.italic ? 1 : 0,
    font.fontStrokeWidth || 0,
    font.fontCapitalize ? 1 : 0,
    captionsSettings.animation,
    captionsSettings.linesPerPage,
  ].join("|");
};

const getTotalSymbolInLineCached = (
  captionsSettings: CaptionsSettings,
  captions: Caption[],
  layer: Konva.Layer,
  targetFontSize: number,
) => {
  const layerWidth = layer.getWidth()!;
  const cacheKey = getSymbolsPerLineCacheKey(
    layerWidth,
    targetFontSize,
    captionsSettings,
  );

  let cacheByKey = symbolsPerLineCache.get(captionsSettings);
  if (!cacheByKey) {
    cacheByKey = new Map<string, number>();
    symbolsPerLineCache.set(captionsSettings, cacheByKey);
  }

  const cached = cacheByKey.get(cacheKey);
  if (typeof cached === "number") {
    return cached;
  }

  const textForDetectAlphabet = captions
    .slice(0, 10)
    .map((x) => x.word)
    .join("");

  const alphabetKind = detectAlphabetKind(textForDetectAlphabet);
  const alphabet = getAlphabet(alphabetKind);

  const alphabetText = new Konva.Text({
    text: captionsSettings.style.font.fontCapitalize
      ? alphabet.toUpperCase()
      : alphabet,
    x: 0,
    y: 0,
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
    textDecoration: captionsSettings.style.font.underline ? "underline" : "",
    fill: "black",
  });

  alphabetText.fillAfterStrokeEnabled(true);

  const totalSymbolInLine = getAverageSymbolsInLine(
    layerWidth,
    alphabetText.getWidth(),
    alphabet.length,
    captionsSettings,
  );

  cacheByKey.set(cacheKey, totalSymbolInLine);
  return totalSymbolInLine;
};

const getChunkCacheKey = (
  totalSymbolInLine: number,
  linesPerPage: number,
) => `${totalSymbolInLine}|${linesPerPage}`;

const getChunksCached = (
  captions: Caption[],
  totalSymbolInLine: number,
  linesPerPage: number,
): ChunkCacheEntry => {
  const cacheKey = getChunkCacheKey(totalSymbolInLine, linesPerPage);

  let cacheByKey = chunkCache.get(captions);
  if (!cacheByKey) {
    cacheByKey = new Map<string, ChunkCacheEntry>();
    chunkCache.set(captions, cacheByKey);
  }

  const cached = cacheByKey.get(cacheKey);
  if (cached) {
    return cached;
  }

  const chunks = splitCaptionsBySentenceAwareBlocks(
    captions,
    totalSymbolInLine,
    linesPerPage,
  );
  const ranges: ChunkRange[] = chunks.map((chunk) => ({
    start: chunk[0].startTime,
    end: chunk[chunk.length - 1].endTime,
    chunk,
  }));

  const next: ChunkCacheEntry = { chunks, ranges };
  cacheByKey.set(cacheKey, next);
  return next;
};

const findChunkByTime = (
  ranges: ChunkRange[],
  currentTime: number,
): Caption[] | undefined => {
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

    return range.chunk;
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
  const totalSymbolInLine = getTotalSymbolInLineCached(
    captionsSettings,
    captions,
    layer,
    targetFontSize,
  );
  const { ranges } = getChunksCached(
    captions,
    totalSymbolInLine,
    captionsSettings.linesPerPage,
  );
  const currentChunk = findChunkByTime(ranges, currentTime);

  const xOffset = targetFontSize * 0.1;
  const wordSpacing =
    xOffset +
    (captionsSettings.animation === "bounce" ? 8 : 0) +
    (captionsSettings.style.font.fontCapitalize ? 2 : 0);
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
    let currentSymbolsLength = 0;

    let activeCaptionState: ActiveCaptionRenderState | undefined = undefined;

    currentChunk.forEach((caption, index) => {
      const isCurrentCaption =
        caption.startTime <= currentTime && caption.endTime >= currentTime;

      const isPastCaption = caption.endTime < currentTime;

      const fillColor = getFillColor(
        caption,
        isCurrentCaption,
        isPastCaption,
        captionsSettings,
      );

      const isLastWordInLine =
        currentSymbolsLength +
          caption.word.length +
          (index < currentChunk.length - 1
            ? currentChunk[index + 1].word.length
            : 0) >
          totalSymbolInLine || currentChunk.length - 1 === index;

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
        targetFontSize,
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
              targetFontSize,
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
            (currentTime - caption.startTime) /
            (caption.endTime - caption.startTime),
          textTrim: textTrim,
          //progress: Math.min(1, (currentTime - caption.start_time) / 0.5),
        };
      }

      x += text.width() + wordSpacing;
      groupWidth += text.width() + (isLastWordInLine ? 0 : wordSpacing);

      line.y(y);
      line.add(text);

      if (isLastWordInLine) {
        group.add(line);
        x = 0;

        const isLastLine = index + 1 === currentChunk.length;

        y += text.height() + yOffset;

        groupHeight += text.height() + (isLastLine ? 0 : yOffset);

        if (groupWidth > maxGroupWidth) {
          maxGroupWidth = groupWidth;
        }
        groupWidth = 0;
        line = new Konva.Group({
          drawBorder: true,
        });
        currentSymbolsLength = 0;
      } else {
        currentSymbolsLength += caption.word.length + 1;
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

    const currentText = activeCaptionState?.text;
    if (currentText && wordPriorityAnimations.has(captionsSettings.animation)) {
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
