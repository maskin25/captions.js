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
