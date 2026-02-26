import { type Caption } from "captions.js";

const toMs = (seconds: number): number =>
  Math.round((Number.isFinite(seconds) ? seconds : 0) * 1000);

const toNullableNumber = (value: number | undefined): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const toNullableColor = (value: string | undefined): string | null => {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

const toNullableSpeaker = (value: number | undefined): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

export type CaptionEditPatch = {
  word?: string;
  startTime?: number;
  endTime?: number;
  highlightColor?: string | null;
  sentenceStartTime?: number | null;
  sentenceEndTime?: number | null;
  paragraphStartTime?: number | null;
  paragraphEndTime?: number | null;
  speaker?: number | null;
};

export type Edits = {
  version: 1;
  keyStrategy: "index:startMs:endMs";
  baseCount: number;
  byId: Record<string, CaptionEditPatch>;
};

export const getCaptionEditId = (caption: Caption, index: number): string =>
  `${index}:${toMs(caption.startTime)}:${toMs(caption.endTime)}`;

const buildCaptionPatch = (
  base: Caption,
  current: Caption,
): CaptionEditPatch | null => {
  const patch: CaptionEditPatch = {};

  if (current.word !== base.word) {
    patch.word = current.word;
  }

  if (current.startTime !== base.startTime) {
    patch.startTime = current.startTime;
  }

  if (current.endTime !== base.endTime) {
    patch.endTime = current.endTime;
  }

  const baseHighlight = toNullableColor(base.highlightColor);
  const currentHighlight = toNullableColor(current.highlightColor);
  if (currentHighlight !== baseHighlight) {
    patch.highlightColor = currentHighlight;
  }

  const baseSentenceStart = toNullableNumber(base.sentenceStartTime);
  const currentSentenceStart = toNullableNumber(current.sentenceStartTime);
  if (currentSentenceStart !== baseSentenceStart) {
    patch.sentenceStartTime = currentSentenceStart;
  }

  const baseSentenceEnd = toNullableNumber(base.sentenceEndTime);
  const currentSentenceEnd = toNullableNumber(current.sentenceEndTime);
  if (currentSentenceEnd !== baseSentenceEnd) {
    patch.sentenceEndTime = currentSentenceEnd;
  }

  const baseParagraphStart = toNullableNumber(base.paragraphStartTime);
  const currentParagraphStart = toNullableNumber(current.paragraphStartTime);
  if (currentParagraphStart !== baseParagraphStart) {
    patch.paragraphStartTime = currentParagraphStart;
  }

  const baseParagraphEnd = toNullableNumber(base.paragraphEndTime);
  const currentParagraphEnd = toNullableNumber(current.paragraphEndTime);
  if (currentParagraphEnd !== baseParagraphEnd) {
    patch.paragraphEndTime = currentParagraphEnd;
  }

  const baseSpeaker = toNullableSpeaker(base.speaker);
  const currentSpeaker = toNullableSpeaker(current.speaker);
  if (currentSpeaker !== baseSpeaker) {
    patch.speaker = currentSpeaker;
  }

  return Object.keys(patch).length > 0 ? patch : null;
};

export const createEmptyEdits = (baseCaptions: Caption[]): Edits => ({
  version: 1,
  keyStrategy: "index:startMs:endMs",
  baseCount: baseCaptions.length,
  byId: {},
});

export const buildEdits = (baseCaptions: Caption[], current: Caption[]): Edits => {
  const byId: Record<string, CaptionEditPatch> = {};
  const comparableLength = Math.min(baseCaptions.length, current.length);

  for (let index = 0; index < comparableLength; index += 1) {
    const baseCaption = baseCaptions[index];
    const currentCaption = current[index];
    const patch = buildCaptionPatch(baseCaption, currentCaption);
    if (patch) {
      byId[getCaptionEditId(baseCaption, index)] = patch;
    }
  }

  return {
    version: 1,
    keyStrategy: "index:startMs:endMs",
    baseCount: baseCaptions.length,
    byId,
  };
};

export const applyEdits = (baseCaptions: Caption[], edits: Edits): Caption[] =>
  baseCaptions.map((caption, index) => {
    const patch = edits.byId[getCaptionEditId(caption, index)];
    if (!patch) return caption;

    const next: Caption = { ...caption };

    if (patch.word !== undefined) next.word = patch.word;
    if (patch.startTime !== undefined) next.startTime = patch.startTime;
    if (patch.endTime !== undefined) next.endTime = patch.endTime;
    if ("highlightColor" in patch) {
      next.highlightColor = patch.highlightColor ?? undefined;
    }
    if ("sentenceStartTime" in patch) {
      next.sentenceStartTime = patch.sentenceStartTime ?? undefined;
    }
    if ("sentenceEndTime" in patch) {
      next.sentenceEndTime = patch.sentenceEndTime ?? undefined;
    }
    if ("paragraphStartTime" in patch) {
      next.paragraphStartTime = patch.paragraphStartTime ?? undefined;
    }
    if ("paragraphEndTime" in patch) {
      next.paragraphEndTime = patch.paragraphEndTime ?? undefined;
    }
    if ("speaker" in patch) {
      next.speaker = patch.speaker ?? undefined;
    }

    return next;
  });
