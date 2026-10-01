#!/usr/bin/env node
import { parseArgs } from "node:util";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { presetNames } from "captions.js";
import { burnCaptions } from "./render/burnCaptions.js";

const require = createRequire(import.meta.url);
const { version } = require("../package.json") as { version: string };

const HELP = `captions.js ${version} — burn animated word-level captions into a video

Usage
  npx captions.js burn <video> <words.json> [options]
  npx captions.js presets

Options for burn
  -p, --preset <name>    Style preset (default: Karaoke). See \`presets\`.
  -o, --output <file>    Output file (default: <video>.captions.mp4)
      --fps <n>          Overlay frame rate (default: source fps)
      --fonts-dir <dir>  Local folder with TTF fonts (default: download from Google Fonts)
      --crf <n>          x264 quality, lower is better (default: 20)
  -q, --quiet            No progress output
  -h, --help

<words.json> can be [{ "word", "start", "end" }], Whisper verbose_json,
or a Deepgram response. Needs ffmpeg and ffprobe on PATH (or FFMPEG_PATH/FFPROBE_PATH).

Example
  npx captions.js burn talk.mp4 words.json --preset "Focus Box"
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
      quiet: { type: "boolean", short: "q" },
      help: { type: "boolean", short: "h" },
    },
  });
  if (values.help) return void process.stdout.write(HELP);

  const [video, captions] = positionals;
  if (!video || !captions) fail("burn needs <video> and <words.json>. Run with --help.");
  checkFfmpeg();

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
  const secs = ((Date.now() - started) / 1000).toFixed(1);
  process.stdout.write(
    `${result.output}  (${result.width}x${result.height}, ${result.durationSec.toFixed(1)}s video in ${secs}s)\n`,
  );
};

const main = async () => {
  const [command, ...rest] = process.argv.slice(2);
  switch (command) {
    case "burn":
      return burn(rest);
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
