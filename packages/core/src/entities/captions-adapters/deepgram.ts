import { Caption } from "../captions/captions.types";

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
}

export interface DeepgramParagraphs {
  transcript: string;
  paragraphs: DeepgramParagraph[];
}

export interface DeepgramAlternative {
  transcript: string;
  confidence: number;
  words: DeepgramWord[];
  paragraphs?: DeepgramParagraphs;
}

export interface DeepgramChannel {
  alternatives: DeepgramAlternative[];
  detected_language?: string;
  language_confidence?: number;
}

export interface DeepgramResults {
  channels: DeepgramChannel[];
}

export interface DeepgramResultPayload {
  metadata: DeepgramMetadata;
  results: DeepgramResults;
}

export interface DeepgramResponse {
  result: DeepgramResultPayload;
  error: string | null;
}

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
  };
};

export const toCaptions = (input: DeepgramResponse): Caption[] => {
  if (input.error) {
    return [];
  }

  const captions: Caption[] = [];
  const channels = input.result.results.channels ?? [];

  channels.forEach((channel) => {
    const bestAlternative = channel.alternatives?.[0];
    if (!bestAlternative) return;

    if (bestAlternative.words.length > 0) {
      bestAlternative.words.forEach((word) => {
        const caption = toCaptionEntry(
          word.punctuated_word ?? word.word,
          word.start,
          word.end,
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
  const paragraphs: DeepgramParagraph[] = [];
  const channels = input.result.results.channels ?? [];

  channels.forEach((channel) => {
    const bestAlternative = channel.alternatives?.[0];
    if (!bestAlternative) return;

    bestAlternative.paragraphs?.paragraphs.forEach((paragraph) => {
      paragraphs.push(paragraph);
    });
  });

  return paragraphs.sort((a, b) => a.start - b.start);
};
