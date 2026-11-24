/**
 * The normalized caption track. Every input adapter produces one, and
 * {@link trackToCaptions} turns it into the `Caption[]` the renderer reads.
 *
 * All times are in seconds from the start of the media. Every field beyond a
 * word's `text`, `start` and `end` is optional: each one switches on one more
 * behavior and is ignored where unsupported.
 *
 * @public
 */
export interface CaptionTrack {
  words: TrackWord[];
  /** Sentence-like units. Screens never span two of them. */
  sentences?: TrackSegment[];
  /** Larger units such as paragraphs or speaker turns. */
  paragraphs?: TrackSegment[];
  speakers?: TrackSpeaker[];
  /** Non-speech audio: laughter, music, applause. */
  events?: TrackEvent[];
  meta?: TrackMeta;
}

/** @public */
export interface TrackWord {
  text: string;
  start: number;
  end: number;
  /** 0–1, as reported by the speech-to-text engine. */
  confidence?: number;
  /** Id of an entry in {@link CaptionTrack.speakers}. */
  speaker?: string;
  /** BCP 47 language tag, when it differs per word. */
  lang?: string;
  /** How strongly to stress the word, 0–1. */
  emphasis?: number;
  /** Where {@link TrackWord.emphasis} came from. A manual mark wins over the others. */
  emphasisSource?: EmphasisSource;
  /** True when the times were interpolated rather than measured (SRT, VTT). */
  approximated?: boolean;
  /** Per-word color override, carried through to `Caption.highlightColor`. */
  highlightColor?: string;
}

/**
 * - `manual`: set in the data, by `*word*` markup, or by a click in an editor.
 * - `annotation`: from an annotations file, for example written by an LLM.
 * - `audio`: computed from loudness.
 *
 * @public
 */
export type EmphasisSource = "manual" | "annotation" | "audio";

/** @public */
export interface TrackSegment {
  start: number;
  end: number;
  speaker?: string;
}

/** @public */
export interface TrackSpeaker {
  id: string;
  name?: string;
  role?: string;
}

/** @public */
export interface TrackEvent {
  /** Lowercase kind, e.g. `laughter`, `music`, `applause`. */
  type: string;
  start: number;
  end: number;
  /** Original text of the event, e.g. `(laughs)` or `[Music]`. */
  label?: string;
}

/**
 * Name of the adapter a track came from.
 *
 * @public
 */
export type TrackSource =
  | "captions"
  | "words"
  | "deepgram"
  | "whisper"
  | "whisper.cpp"
  | "srt"
  | "vtt"
  | "assemblyai"
  | "elevenlabs"
  | "track";

/** @public */
export interface TrackMeta {
  source?: TrackSource;
  /** Main language of the track (BCP 47 or the engine's code). */
  language?: string;
  /** True when some word times were interpolated. */
  approximated?: boolean;
}
