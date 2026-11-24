import { finalizeTrack, isObject, num, parseEventLabel, speakerId } from "../track.helpers";
import type { CaptionTrack, TrackEvent, TrackSegment, TrackWord } from "../track.types";

interface AssemblyAIWord {
  text: string;
  start: number;
  end: number;
  confidence?: number;
  speaker?: string | null;
}

/**
 * AssemblyAI transcript (`GET /v2/transcript/:id`). Times are milliseconds.
 * `utterances` (with `speaker_labels: true`) become paragraphs.
 *
 * @public
 */
export interface AssemblyAITranscript {
  id?: string;
  status?: string;
  language_code?: string;
  words?: AssemblyAIWord[] | null;
  utterances?: { speaker?: string | null; start: number; end: number; text: string }[] | null;
}

/** @public */
export const fromAssemblyAI = (input: AssemblyAITranscript): CaptionTrack => {
  const words: TrackWord[] = [];
  const events: TrackEvent[] = [];
  for (const w of input.words ?? []) {
    const start = num(w.start);
    const end = num(w.end);
    if (start === undefined || end === undefined) continue;
    const event = parseEventLabel(w.text);
    if (event) {
      events.push({ type: event, start: start / 1000, end: end / 1000, label: w.text });
      continue;
    }
    const item: TrackWord = { text: w.text, start: start / 1000, end: end / 1000 };
    if (w.confidence !== undefined) item.confidence = w.confidence;
    const speaker = speakerId(w.speaker);
    if (speaker !== undefined) item.speaker = speaker;
    words.push(item);
  }
  const paragraphs: TrackSegment[] = (input.utterances ?? []).flatMap((u) => {
    const start = num(u.start);
    const end = num(u.end);
    if (start === undefined || end === undefined) return [];
    const speaker = speakerId(u.speaker);
    return [{ start: start / 1000, end: end / 1000, ...(speaker ? { speaker } : {}) }];
  });
  return finalizeTrack({
    words,
    paragraphs,
    events,
    meta: { source: "assemblyai", ...(input.language_code ? { language: input.language_code } : {}) },
  });
};

export const isAssemblyAI = (value: unknown): value is AssemblyAITranscript =>
  isObject(value) &&
  ("audio_url" in value || "acoustic_model" in value || "status" in value) &&
  (Array.isArray(value.words) || Array.isArray(value.utterances));
