import { finalizeTrack, isObject, num, parseEventLabel, speakerId } from "../track.helpers";
import type { CaptionTrack, TrackEvent, TrackWord } from "../track.types";

interface ElevenLabsWord {
  text: string;
  start?: number;
  end?: number;
  type?: "word" | "spacing" | "audio_event";
  speaker_id?: string | null;
  logprob?: number;
}

/**
 * ElevenLabs Scribe speech-to-text response. Times are seconds. `spacing`
 * entries are skipped; `audio_event` entries (with `tag_audio_events`) become
 * events.
 *
 * @public
 */
export interface ElevenLabsTranscript {
  language_code?: string;
  language_probability?: number;
  text?: string;
  words: ElevenLabsWord[];
}

/** @public */
export const fromElevenLabs = (input: ElevenLabsTranscript): CaptionTrack => {
  const words: TrackWord[] = [];
  const events: TrackEvent[] = [];
  for (const w of input.words) {
    const start = num(w.start);
    const end = num(w.end);
    if (start === undefined || end === undefined || w.type === "spacing") continue;
    if (w.type === "audio_event") {
      events.push({ type: parseEventLabel(w.text) ?? w.text.toLowerCase(), start, end, label: w.text });
      continue;
    }
    const item: TrackWord = { text: w.text, start, end };
    if (typeof w.logprob === "number" && Number.isFinite(w.logprob)) {
      item.confidence = Math.round(Math.exp(Math.min(0, w.logprob)) * 1000) / 1000;
    }
    const speaker = speakerId(w.speaker_id);
    if (speaker !== undefined) item.speaker = speaker;
    words.push(item);
  }
  return finalizeTrack({
    words,
    events,
    meta: { source: "elevenlabs", ...(input.language_code ? { language: input.language_code } : {}) },
  });
};

export const isElevenLabs = (value: unknown): value is ElevenLabsTranscript =>
  isObject(value) &&
  Array.isArray(value.words) &&
  ("language_probability" in value || value.words.some((w: unknown) => isObject(w) && "type" in w && "text" in w));
