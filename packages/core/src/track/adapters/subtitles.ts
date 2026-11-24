import { finalizeTrack, interpolateWords, parseEventLabel } from "../track.helpers";
import type { CaptionTrack, TrackEvent, TrackSegment, TrackWord } from "../track.types";

/** `01:02:03,456`, `02:03.456`, `01:02:03.456` → seconds */
const parseTimestamp = (value: string): number | undefined => {
  const match = value.trim().match(/^(?:(\d+):)?(\d{1,2}):(\d{1,2})[.,](\d{1,3})$/);
  if (!match) return undefined;
  const [, h = "0", m, s, ms] = match;
  return Number(h) * 3600 + Number(m) * 60 + Number(s) + Number(ms.padEnd(3, "0")) / 1000;
};

const TIMING = /^\s*(\S+)\s+-->\s+(\S+)/;

const stripTags = (text: string) =>
  text
    .replace(/\{\\[^}]*\}/g, "") // SSA overrides like {\an8}
    .replace(/<\/?(?:i|b|u|font|c|ruby|rt|lang)[^>]*>/gi, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");

interface Cue {
  start: number;
  end: number;
  lines: string[];
}

const parseCues = (input: string): Cue[] => {
  const blocks = input.replace(/\r\n?/g, "\n").replace(/^﻿/, "").split(/\n\s*\n/);
  const cues: Cue[] = [];
  for (const block of blocks) {
    const lines = block.split("\n");
    const timingIndex = lines.findIndex((line) => TIMING.test(line));
    if (timingIndex === -1) continue; // header, NOTE, STYLE, REGION
    const [, from, to] = lines[timingIndex].match(TIMING)!;
    const start = parseTimestamp(from);
    const end = parseTimestamp(to);
    if (start === undefined || end === undefined) continue;
    cues.push({ start, end, lines: lines.slice(timingIndex + 1).filter((l) => l.trim()) });
  }
  return cues;
};

const VOICE = /<v(?:\.[^\s>]*)?\s+([^>]+)>/;
const INLINE_TIME = /<((?:\d+:)?\d{1,2}:\d{1,2}\.\d{1,3})>/g;

/** VTT karaoke cues: `<00:00:01.200>word <00:00:01.500>word` */
const wordsFromInlineTimes = (text: string, start: number, end: number): TrackWord[] | undefined => {
  if (!INLINE_TIME.test(text)) return undefined;
  INLINE_TIME.lastIndex = 0;
  const parts = text.split(INLINE_TIME);
  // parts: [before, time1, after1, time2, after2, ...]
  const pieces: { at: number; text: string }[] = [{ at: start, text: parts[0] }];
  for (let i = 1; i < parts.length; i += 2) {
    pieces.push({ at: parseTimestamp(parts[i]) ?? start, text: parts[i + 1] ?? "" });
  }
  const words: TrackWord[] = [];
  pieces.forEach((piece, i) => {
    const pieceEnd = pieces[i + 1]?.at ?? end;
    words.push(
      ...interpolateWords(stripTags(piece.text).replace(/<[^>]+>/g, ""), piece.at, pieceEnd).map((w) => {
        const { approximated, ...rest } = w;
        // one word per timestamp is exact; several words in one piece are not
        return piece.text.trim().split(/\s+/).length > 1 ? w : rest;
      }),
    );
  });
  return words;
};

const fromCues = (cues: Cue[], source: "srt" | "vtt"): CaptionTrack => {
  const words: TrackWord[] = [];
  const sentences: TrackSegment[] = [];
  const events: TrackEvent[] = [];

  for (const cue of cues) {
    const raw = cue.lines.join(" ");
    const voice = raw.match(VOICE)?.[1]?.trim();
    const speaker = voice || undefined;
    const text = raw.replace(/<\/?v[^>]*>/g, "");
    const plain = stripTags(text).replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    if (!plain) continue;

    const event = parseEventLabel(plain);
    if (event) {
      events.push({ type: event, start: cue.start, end: cue.end, label: plain });
      continue;
    }

    sentences.push({ start: cue.start, end: cue.end, ...(speaker ? { speaker } : {}) });
    const timed = source === "vtt" ? wordsFromInlineTimes(text, cue.start, cue.end) : undefined;
    const cueWords = timed ?? interpolateWords(plain, cue.start, cue.end);
    words.push(...cueWords.map((w) => (speaker ? { ...w, speaker } : w)));
  }

  return finalizeTrack({ words, sentences, events, meta: { source } });
};

/**
 * SubRip subtitles. SRT has no word times: each cue's time is spread over its
 * words in proportion to their length, and those words are marked
 * `approximated`. Cues that are only `[Music]` or `(laughs)` become events.
 *
 * @public
 */
export const fromSrt = (input: string): CaptionTrack => fromCues(parseCues(input), "srt");

/**
 * WebVTT subtitles. Like SRT, but `<v Speaker>` sets the speaker and inline
 * `<00:00:01.200>` timestamps give exact word times.
 *
 * @public
 */
export const fromVtt = (input: string): CaptionTrack => fromCues(parseCues(input), "vtt");

export const isVtt = (value: string) => /^﻿?WEBVTT/.test(value.trimStart());
export const isSrt = (value: string) => /^\s*(\d+\s*\n)?\s*\S+\s+-->\s+\S+/m.test(value.replace(/\r/g, ""));
