import type { Caption } from "../entities/captions/captions.types";

export interface DeepgramModelInfoEntry {
  name: string;
  version: string;
  arch: string;
}

export interface DeepgramMetadata {
  transaction_key: string;
  request_id: string;
  sha256: string;
  created: string;
  duration: number;
  channels: number;
  models: string[];
  model_info: Record<string, DeepgramModelInfoEntry>;
}

export interface DeepgramWord {
  word: string;
  start: number;
  end: number;
  confidence?: number;
  speaker?: number;
  speaker_confidence?: number;
  punctuated_word?: string;
}

export interface DeepgramSentence {
  text: string;
  start: number;
  end: number;
}

export interface DeepgramParagraph {
  sentences: DeepgramSentence[];
  num_words: number;
  start: number;
  end: number;
  speaker?: number;
}

export interface DeepgramParagraphs {
  transcript: string;
  paragraphs: DeepgramParagraph[];
}

export interface DeepgramAlternative {
  transcript: string;
  confidence: number;
  words: DeepgramWord[];
  languages?: string[];
  paragraphs?: DeepgramParagraphs;
}

export interface DeepgramChannel {
  alternatives: DeepgramAlternative[];
  detected_language?: string;
  language_confidence?: number;
}

export interface DeepgramResults {
  channels: DeepgramChannel[];
  utterances?: DeepgramUtterance[];
}

export interface DeepgramUtterance {
  id: string;
  transcript: string;
  start: number;
  end: number;
  confidence: number;
  speaker: number;
  channel: number;
  words: DeepgramWord[];
}

export interface DeepgramResultPayload {
  metadata: DeepgramMetadata;
  results: DeepgramResults;
}

export interface DeepgramResponseEnvelope {
  result: DeepgramResultPayload;
  error?: string | null;
}

export type DeepgramResponse = DeepgramResultPayload | DeepgramResponseEnvelope;

const isEnvelope = (value: DeepgramResponse): value is DeepgramResponseEnvelope =>
  "result" in value;

const toResultPayload = (input: DeepgramResponse): DeepgramResultPayload | null => {
  if (isEnvelope(input)) {
    if (input.error) return null;
    return input.result;
  }

  return input;
};

const toFiniteNumber = (value: unknown): number | null => {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number.parseFloat(value)
        : Number.NaN;
  return Number.isFinite(parsed) ? parsed : null;
};

const toCaptionEntry = (
  word: string | undefined,
  start: unknown,
  end: unknown,
  extra?: Partial<Caption>,
): Caption | null => {
  const text = (word ?? "").trim();
  const startTime = toFiniteNumber(start);
  const endTime = toFiniteNumber(end);

  if (!text || startTime === null || endTime === null || endTime < startTime) {
    return null;
  }

  return {
    word: text,
    startTime,
    endTime,
    ...extra,
  };
};

type SentenceBounds = {
  sentenceStartTime: number;
  sentenceEndTime: number;
  paragraphStartTime: number;
  paragraphEndTime: number;
  speaker?: number;
};

const toSentenceBounds = (alternative: DeepgramAlternative): SentenceBounds[] => {
  const bounds: SentenceBounds[] = [];

  alternative.paragraphs?.paragraphs.forEach((paragraph) => {
    paragraph.sentences.forEach((sentence) => {
      const sentenceStartTime = toFiniteNumber(sentence.start);
      const sentenceEndTime = toFiniteNumber(sentence.end);
      const paragraphStartTime = toFiniteNumber(paragraph.start);
      const paragraphEndTime = toFiniteNumber(paragraph.end);

      if (
        sentenceStartTime === null ||
        sentenceEndTime === null ||
        paragraphStartTime === null ||
        paragraphEndTime === null
      ) {
        return;
      }

      bounds.push({
        sentenceStartTime,
        sentenceEndTime,
        paragraphStartTime,
        paragraphEndTime,
        speaker: paragraph.speaker,
      });
    });
  });

  return bounds.sort((a, b) => a.sentenceStartTime - b.sentenceStartTime);
};

const getSentenceMetaForWord = (
  sentenceBounds: SentenceBounds[],
  wordStart: number,
  cursor: number,
): { bounds?: SentenceBounds; cursor: number } => {
  if (!sentenceBounds.length) {
    return { cursor };
  }

  let nextCursor = cursor;
  while (
    nextCursor < sentenceBounds.length - 1 &&
    wordStart >= sentenceBounds[nextCursor].sentenceEndTime
  ) {
    nextCursor += 1;
  }

  const candidate = sentenceBounds[nextCursor];
  if (
    wordStart >= candidate.sentenceStartTime &&
    wordStart <= candidate.sentenceEndTime
  ) {
    return { bounds: candidate, cursor: nextCursor };
  }

  const previous = sentenceBounds[nextCursor - 1];
  if (
    previous &&
    wordStart >= previous.sentenceStartTime &&
    wordStart <= previous.sentenceEndTime
  ) {
    return { bounds: previous, cursor: nextCursor };
  }

  return { cursor: nextCursor };
};

export const toCaptions = (input: DeepgramResponse): Caption[] => {
  const payload = toResultPayload(input);
  if (!payload) {
    return [];
  }

  const captions: Caption[] = [];
  const channels = payload.results.channels ?? [];

  channels.forEach((channel) => {
    const bestAlternative = channel.alternatives?.[0];
    if (!bestAlternative) return;
    const sentenceBounds = toSentenceBounds(bestAlternative);
    let sentenceCursor = 0;

    if (bestAlternative.words.length > 0) {
      bestAlternative.words.forEach((word) => {
        const wordStart = toFiniteNumber(word.start);
        const sentenceMeta =
          wordStart === null
            ? { cursor: sentenceCursor }
            : getSentenceMetaForWord(sentenceBounds, wordStart, sentenceCursor);
        sentenceCursor = sentenceMeta.cursor;

        const caption = toCaptionEntry(
          word.punctuated_word ?? word.word,
          word.start,
          word.end,
          sentenceMeta.bounds,
        );
        if (caption) {
          captions.push(caption);
        }
      });
      return;
    }

    bestAlternative.paragraphs?.paragraphs.forEach((paragraph) => {
      paragraph.sentences.forEach((sentence) => {
        const caption = toCaptionEntry(
          sentence.text,
          sentence.start,
          sentence.end,
        );
        if (caption) {
          captions.push(caption);
        }
      });
    });
  });

  return captions.sort((a, b) => a.startTime - b.startTime);
};

export const getParagraphs = (input: DeepgramResponse): DeepgramParagraph[] => {
  const payload = toResultPayload(input);
  if (!payload) {
    return [];
  }

  const paragraphs: DeepgramParagraph[] = [];
  const channels = payload.results.channels ?? [];

  channels.forEach((channel) => {
    const bestAlternative = channel.alternatives?.[0];
    if (!bestAlternative) return;

    bestAlternative.paragraphs?.paragraphs.forEach((paragraph) => {
      paragraphs.push(paragraph);
    });
  });

  return paragraphs.sort((a, b) => a.start - b.start);
};
