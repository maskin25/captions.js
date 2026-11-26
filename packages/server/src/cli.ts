#!/usr/bin/env node
import { parseArgs } from "node:util";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { annotationPrompt, presetNames, toTrack } from "captions.js";
import { burnCaptions } from "./render/burnCaptions.js";
import { loadCaptions } from "./render/loadCaptions.js";

const require = createRequire(import.meta.url);
const { version } = require("../package.json") as { version: string };

const HELP = `captions.js ${version} — burn animated word-level captions into a video

Usage
  npx captions.js burn <video> <transcript> [options]
  npx captions.js prompt <transcript> [--share 0.1]
  npx captions.js presets

Options for burn
  -p, --preset <name>    Style preset (default: Karaoke). See \`presets\`.
  -o, --output <file>    Output file (default: <video>.captions.mp4)
      --fps <n>          Overlay frame rate (default: source fps)
      --fonts-dir <dir>  Local folder with TTF fonts (default: download from Google Fonts)
      --crf <n>          x264 quality, lower is better (default: 20)
  -e, --expressiveness <0-1>
                         How strongly emphasized words stand out (default: 0, off)
  -a, --annotations <file>
                         Emphasis chosen by an LLM; see \`prompt\` below
  -s, --speakers <list>  Names (and colors) of speakers 1, 2, … in order, e.g.
                         "Scott,Neal" or "Scott:#FFD43B,Neal:#4DD2FF". Every
                         preset takes the colors; Speaker Tags shows the names.
  -q, --quiet            No progress output
  -h, --help

<transcript> can be [{ "word", "start", "end" }], SRT, WebVTT, or a Deepgram,
Whisper (OpenAI, faster-whisper, WhisperX), whisper.cpp, AssemblyAI or
ElevenLabs JSON response. SRT and VTT have no word times; they are spread
evenly over each cue. Needs ffmpeg and ffprobe on PATH (or FFMPEG_PATH/FFPROBE_PATH).

Emphasis
  Mark words in the transcript as *word*, or let an LLM pick them: \`prompt\`
  prints instructions with the numbered words; save the model's JSON reply and
  pass it with --annotations. captions.js never calls a model itself.

Example
  npx captions.js burn talk.mp4 words.json --preset "Focus Box"
  npx captions.js burn talk.mp4 talk.srt
  npx captions.js prompt words.json > prompt.txt     # send to your LLM
  npx captions.js burn talk.mp4 words.json -a reply.json -e 0.7
`;

const fail = (message: string): never => {
  process.stderr.write(`error: ${message}\n`);
  process.exit(1);
};

const checkFfmpeg = () => {
  for (const [bin, env] of [
    ["ffmpeg", "FFMPEG_PATH"],
    ["ffprobe", "FFPROBE_PATH"],
  ] as const) {
    const res = spawnSync(process.env[env] || bin, ["-version"], { stdio: "ignore" });
    if (res.error || res.status !== 0) {
      fail(
        `${bin} not found. Install FFmpeg (macOS: brew install ffmpeg, Debian/Ubuntu: apt install ffmpeg) ` +
          `or set ${env}.`,
      );
    }
  }
};

/** "Scott,Neal:#4DD2FF" → [{ label: "Scott" }, { label: "Neal", color: "#4DD2FF" }]. */
const parseSpeakers = (list: string) =>
  list.split(",").map((entry) => {
    const [label, color] = entry.split(":").map((part) => part.trim());
    if (color !== undefined && !/^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(color)) {
      fail(`--speakers: "${color}" is not a hex color like #FFD43B`);
    }
    return { ...(label ? { label } : {}), ...(color ? { color } : {}) };
  });

const burn = async (argv: string[]) => {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      preset: { type: "string", short: "p" },
      output: { type: "string", short: "o" },
      fps: { type: "string" },
      "fonts-dir": { type: "string" },
      crf: { type: "string" },
      expressiveness: { type: "string", short: "e" },
      annotations: { type: "string", short: "a" },
      speakers: { type: "string", short: "s" },
      quiet: { type: "boolean", short: "q" },
      help: { type: "boolean", short: "h" },
    },
  });
  if (values.help) return void process.stdout.write(HELP);

  const [video, captions] = positionals;
  if (!video || !captions) fail("burn needs <video> and <transcript>. Run with --help.");
  checkFfmpeg();

  let expressiveness: number | undefined;
  if (values.expressiveness !== undefined) {
    expressiveness = Number(values.expressiveness);
    if (!Number.isFinite(expressiveness) || expressiveness < 0 || expressiveness > 1) {
      fail("--expressiveness takes a number from 0 to 1");
    }
  }

  const quiet = values.quiet || !process.stderr.isTTY;
  const started = Date.now();
  let lastPct = -1;

  const result = await burnCaptions({
    video,
    captions,
    preset: values.preset,
    output: values.output,
    fps: values.fps ? Number(values.fps) : undefined,
    crf: values.crf ? Number(values.crf) : undefined,
    expressiveness,
    annotations: values.annotations,
    speakers: values.speakers !== undefined ? parseSpeakers(values.speakers) : undefined,
    fonts: { fontsDir: values["fonts-dir"] },
    onProgress: quiet
      ? undefined
      : ({ frame, totalFrames }) => {
          const pct = Math.floor((frame / totalFrames) * 100);
          if (pct !== lastPct) {
            lastPct = pct;
            process.stderr.write(`\rrendering ${pct}%  (${frame}/${totalFrames} frames)`);
          }
        },
  }).catch((err: Error & { stderr?: string }) => {
    if (!quiet) process.stderr.write("\n");
    if (err.stderr) process.stderr.write(err.stderr.trim().split("\n").slice(-8).join("\n") + "\n");
    return fail(err.message);
  });

  if (!quiet) process.stderr.write("\n");
  for (const issue of result.annotationIssues ?? []) {
    process.stderr.write(`annotations: entry ${issue.entry}: ${issue.message}\n`);
  }
  if (result.annotated !== undefined) {
    process.stderr.write(`annotations: ${result.annotated} word(s) emphasized\n`);
  }
  if (result.emphasized > 0 && !(expressiveness ?? 0)) {
    process.stderr.write(
      `note: ${result.emphasized} word(s) have emphasis, but expressiveness is 0, so they look like the rest. ` +
        `Add --expressiveness 0.7 to show it.\n`,
    );
  }
  const secs = ((Date.now() - started) / 1000).toFixed(1);
  process.stdout.write(
    `${result.output}  (${result.width}x${result.height}, ${result.durationSec.toFixed(1)}s video in ${secs}s)\n`,
  );
};

const prompt = async (argv: string[]) => {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: { share: { type: "string" }, help: { type: "boolean", short: "h" } },
  });
  if (values.help) return void process.stdout.write(HELP);
  const [transcript] = positionals;
  if (!transcript) fail("prompt needs <transcript>. Run with --help.");
  const share = values.share === undefined ? undefined : Number(values.share);
  if (share !== undefined && !(share > 0 && share <= 1)) fail("--share takes a number from 0 to 1");
  const captions = await loadCaptions(transcript);
  process.stdout.write(annotationPrompt(toTrack(captions), { share }) + "\n");
};

const main = async () => {
  const [command, ...rest] = process.argv.slice(2);
  switch (command) {
    case "burn":
      return burn(rest);
    case "prompt":
      return prompt(rest);
    case "presets":
      return void process.stdout.write(presetNames.join("\n") + "\n");
    case "-v":
    case "--version":
      return void process.stdout.write(`${version}\n`);
    case undefined:
    case "-h":
    case "--help":
    case "help":
      return void process.stdout.write(HELP);
    default:
      fail(`unknown command "${command}". Run with --help.`);
  }
};

main().catch((err) => fail(err instanceof Error ? err.message : String(err)));
