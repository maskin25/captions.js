#!/usr/bin/env node
// Renders a looping preview of every built-in preset with the real engine,
// so gallery images can never drift from what the library actually draws.
//
//   node scripts/render-previews.mjs [outDir] [--only "Karaoke,Focus Box"]
//
// Writes <slug>.mp4 (H.264), <slug>.webm (VP9), <slug>.jpg (poster),
// manifest.json and index.html (a minimal gallery) into outDir.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { parseArgs } from "node:util";
import { presetNames, getPreset } from "captions.js";
import { burnCaptions } from "../dist/lib.js";

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { only: { type: "string" }, size: { type: "string", default: "540x960" } },
});
const outDir = path.resolve(positionals[0] ?? "previews");
const [W, H] = values.size.split("x").map(Number);
const DURATION = 5;
const POSTER_AT = 1.55; // a moment with a highlighted word mid-sentence

const only = values.only?.split(",").map((s) => s.trim().toLowerCase());
const names = presetNames.filter((n) => !only || only.includes(n.toLowerCase()));

// Reference phrase: two screens of text, natural speech timing.
const PHRASE = [
  ["Same", 0.15, 0.4], ["captions", 0.4, 0.85], ["in", 0.85, 0.95], ["your", 0.95, 1.15],
  ["browser", 1.15, 1.6], ["preview", 1.6, 2.1], ["and", 2.35, 2.5], ["in", 2.5, 2.6],
  ["your", 2.6, 2.8], ["final", 2.8, 3.15], ["export", 3.15, 3.7], ["pixel", 3.85, 4.2],
  ["for", 4.2, 4.35], ["pixel", 4.35, 4.85],
].map(([word, startTime, endTime]) => ({ word, startTime, endTime }));

const slugify = (name) =>
  name.toLowerCase().replace(/&/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const ff = (args) =>
  execFileSync(process.env.FFMPEG_PATH || "ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...args]);

fs.mkdirSync(outDir, { recursive: true });
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "captionsjs-previews-"));
const background = path.join(tmp, "bg.mp4");
// Slowly drifting dark gradient: stands in for footage, readable for every preset.
ff([
  "-f", "lavfi",
  "-i", `gradients=s=${W}x${H}:d=${DURATION}:r=30:c0=0x1d2433:c1=0x3a3550:c2=0x24343a:n=3:speed=0.008`,
  "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "16", background,
]);

const manifest = [];
for (const name of names) {
  const slug = slugify(name);
  const mp4 = path.join(outDir, `${slug}.mp4`);
  const started = Date.now();
  await burnCaptions({ video: background, captions: PHRASE, preset: name, output: mp4, crf: 23 });
  ff(["-i", mp4, "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "38", "-row-mt", "1", "-an",
      path.join(outDir, `${slug}.webm`)]);
  ff(["-ss", String(POSTER_AT), "-i", mp4, "-frames:v", "1", "-q:v", "3", path.join(outDir, `${slug}.jpg`)]);

  const { captionsSettings } = getPreset(name);
  manifest.push({
    name,
    slug,
    animation: captionsSettings.animation,
    font: `${captionsSettings.style.font.fontFamily} ${captionsSettings.style.font.fontWeight}`,
    files: { mp4: `${slug}.mp4`, webm: `${slug}.webm`, poster: `${slug}.jpg` },
  });
  console.log(`${name.padEnd(16)} ${((Date.now() - started) / 1000).toFixed(1)}s`);
}

fs.writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");

const card = (p) => `
  <figure id="${p.slug}">
    <video autoplay muted loop playsinline preload="metadata" poster="${p.files.poster}">
      <source src="${p.files.webm}" type="video/webm"><source src="${p.files.mp4}" type="video/mp4">
    </video>
    <figcaption><a href="#${p.slug}">${p.name}</a><span>${p.animation} · ${p.font}</span>
      <code>getPreset("${p.name}")</code></figcaption>
  </figure>`;
fs.writeFileSync(
  path.join(outDir, "index.html"),
  `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>captions.js — caption style presets</title>
<meta name="description" content="${manifest.length} animated caption styles for TikTok, Reels and Shorts. Rendered by captions.js — the same output in the browser and in FFmpeg.">
<style>
  :root{color-scheme:dark;--bg:#0e1116;--card:#171b22;--muted:#8b95a3}
  body{margin:0;background:var(--bg);color:#e8ecf1;font:15px/1.5 system-ui,sans-serif}
  header{max-width:1200px;margin:0 auto;padding:40px 16px 8px}
  h1{margin:0 0 6px;font-size:28px} header p{margin:0;color:var(--muted)}
  main{max-width:1200px;margin:0 auto;padding:16px;display:grid;gap:16px;
       grid-template-columns:repeat(auto-fill,minmax(200px,1fr))}
  figure{margin:0;background:var(--card);border-radius:12px;overflow:hidden}
  video{display:block;width:100%;aspect-ratio:${W}/${H};background:#000}
  figcaption{padding:10px 12px;display:flex;flex-direction:column;gap:2px}
  figcaption a{color:inherit;font-weight:600;text-decoration:none}
  figcaption span{color:var(--muted);font-size:12.5px}
  code{font-size:12px;color:#9fd3ff}
</style></head><body>
<header><h1>Caption styles</h1>
<p>${manifest.length} presets, each rendered by the engine itself. Burn any of them: <code>npx captions.js burn video.mp4 words.json --preset Karaoke</code></p></header>
<main>${manifest.map(card).join("")}
</main></body></html>
`,
);

fs.rmSync(tmp, { recursive: true, force: true });
console.log(`\n${manifest.length} previews → ${outDir}`);
