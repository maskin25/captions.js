import { fromAssemblyAI, isAssemblyAI } from "./assemblyai";
import { fromDeepgram, isDeepgram } from "./deepgram";
import { fromElevenLabs, isElevenLabs } from "./elevenlabs";
import { fromCaptions, fromWords, isCaptions, isWords } from "./loose";
import { fromSrt, fromVtt, isSrt, isVtt } from "./subtitles";
import { fromWhisper, isWhisper } from "./whisper";
import { fromWhisperCpp, isWhisperCpp } from "./whisperCpp";
import type { CaptionTrack } from "../track.types";

export {
  fromAssemblyAI,
  fromCaptions,
  fromDeepgram,
  fromElevenLabs,
  fromSrt,
  fromVtt,
  fromWhisper,
  fromWhisperCpp,
  fromWords,
};
export type { AssemblyAITranscript } from "./assemblyai";
export type { ElevenLabsTranscript } from "./elevenlabs";
export type { WhisperVerboseJson } from "./whisper";
export type { WhisperCppJson } from "./whisperCpp";

/** Shapes the detector checks, in order. */
const detectors: [string, (v: unknown) => boolean, (v: any) => CaptionTrack][] = [
  ["captions", isCaptions, fromCaptions],
  ["deepgram", isDeepgram, fromDeepgram],
  ["whisper.cpp", isWhisperCpp, fromWhisperCpp],
  ["elevenlabs", isElevenLabs, fromElevenLabs],
  ["assemblyai", isAssemblyAI, fromAssemblyAI],
  ["whisper", isWhisper, fromWhisper],
  ["words", isWords, fromWords],
];

/**
 * Detects the format of a transcript and converts it to a {@link CaptionTrack}.
 *
 * Accepts: `Caption[]`, `{ word | text, start, end }` arrays, a `CaptionTrack`,
 * Deepgram, OpenAI Whisper `verbose_json` (also faster-whisper and WhisperX),
 * whisper.cpp JSON, AssemblyAI, ElevenLabs Scribe, and SRT or WebVTT text.
 * A string that starts with `{` or `[` is parsed as JSON first.
 *
 * @throws When the format is not recognized.
 * @public
 */
export const toTrack = (input: unknown): CaptionTrack => {
  if (typeof input === "string") {
    const text = input.trim();
    if (text.startsWith("{") || text.startsWith("[")) return toTrack(JSON.parse(text));
    if (isVtt(text)) return fromVtt(text);
    if (isSrt(text)) return fromSrt(text);
    throw new Error("Unsupported captions text: expected JSON, SRT or WebVTT.");
  }
  for (const [, test, convert] of detectors) {
    if (test(input)) return convert(input);
  }
  throw new Error(
    "Unsupported captions format. Expected word timings like " +
      '[{ "word": "Hello", "start": 0.1, "end": 0.4 }], a CaptionTrack, SRT, WebVTT, ' +
      "or a Deepgram, Whisper, whisper.cpp, AssemblyAI or ElevenLabs response.",
  );
};

/**
 * Name of the format {@link toTrack} would use for this input, or undefined.
 *
 * @public
 */
export const detectFormat = (input: unknown): string | undefined => {
  if (typeof input === "string") {
    const text = input.trim();
    if (text.startsWith("{") || text.startsWith("[")) {
      try {
        return detectFormat(JSON.parse(text));
      } catch {
        return undefined;
      }
    }
    return isVtt(text) ? "vtt" : isSrt(text) ? "srt" : undefined;
  }
  return detectors.find(([, test]) => test(input))?.[0];
};
