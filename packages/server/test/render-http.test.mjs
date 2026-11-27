// POST /render: JSON in, MP4 out, errors as JSON with a 4xx/5xx status.
// Run after `pnpm build`: node test/render-http.test.mjs  (needs ffmpeg)
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { createApp } from "../dist/server.js";

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "captionsjs-http-"));
const clip = path.join(dir, "in.mp4");
execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-f", "lavfi", "-i", "color=c=gray:s=360x640:d=2:r=25",
  "-c:v", "libx264", "-pix_fmt", "yuv420p", clip]);
const words = [
  { word: "Hello", start: 0.1, end: 0.9 },
  { word: "world", start: 0.9, end: 1.8 },
];

// a file server standing in for wherever the caller keeps its videos
const files = http.createServer((req, res) => {
  if (req.url === "/in.mp4") return fs.createReadStream(clip).pipe(res.writeHead(200, { "Content-Type": "video/mp4" }));
  if (req.url === "/moved.mp4") return res.writeHead(302, { Location: "/in.mp4" }).end();
  if (req.url === "/not-a-video.mp4") return res.writeHead(200).end("hello");
  res.writeHead(404).end();
});
const listen = (server) => new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server.address().port)));
const filesUrl = `http://127.0.0.1:${await listen(files)}`;
const api = createApp().listen(0, "127.0.0.1");
await new Promise((resolve) => api.once("listening", resolve));
const apiUrl = `http://127.0.0.1:${api.address().port}/render`;

const post = async (body) => {
  const res = await fetch(apiUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const type = res.headers.get("content-type") ?? "";
  return { status: res.status, type, headers: res.headers, body: type.includes("json") ? await res.json() : Buffer.from(await res.arrayBuffer()) };
};

try {
  // success: an MP4 comes back, through a redirect, with a customized preset
  const ok = await post({ video: `${filesUrl}/moved.mp4`, captions: words, preset: "Karaoke", customize: { accent: "#FF5A1F" }, safeArea: "shorts" });
  assert.equal(ok.status, 200, JSON.stringify(ok.body));
  assert.match(ok.type, /video\/mp4/);
  assert.equal(ok.headers.get("x-captions-size"), "360x640");
  const out = path.join(dir, "out.mp4");
  fs.writeFileSync(out, ok.body);
  const probe = execFileSync("ffprobe", ["-v", "error", "-show_entries", "stream=width,height", "-of", "csv=p=0", out]).toString().trim();
  assert.equal(probe, "360,640");
  console.log(`ok   POST /render returns the captioned MP4 (${ok.body.length} bytes)`);

  // request errors
  const cases = [
    [{ captions: words }, 400, /invalid request/, "missing video"],
    [{ video: "/etc/passwd", captions: words }, 400, /invalid request/, "local video path"],
    [{ video: `${filesUrl}/in.mp4`, captions: "/etc/passwd" }, 400, /invalid request/, "local transcript path"],
    [{ video: `${filesUrl}/in.mp4`, captions: words, preset: "Nope" }, 400, /preset/, "unknown preset"],
    [{ video: `${filesUrl}/in.mp4`, captions: words, safeArea: { top: 0.6, bottom: 0.6, left: 0, right: 0 } }, 400, /safeArea/, "bad safe area"],
    [{ video: `${filesUrl}/in.mp4`, captions: words, extra: 1 }, 400, /invalid request/, "unknown field"],
    [{ video: `${filesUrl}/missing.mp4`, captions: words }, 422, /404/, "video not found"],
    [{ video: `${filesUrl}/not-a-video.mp4`, captions: words }, 422, /not a video/, "not a video"],
    [{ video: `${filesUrl}/in.mp4`, captions: { nothing: "here" } }, 422, /captions/, "no words in the transcript"],
  ];
  for (const [body, status, message, name] of cases) {
    const res = await post(body);
    assert.equal(res.status, status, `${name}: ${JSON.stringify(res.body)}`);
    assert.match(res.body.error, message, name);
  }
  console.log(`ok   POST /render rejects ${cases.length} bad requests with JSON errors`);

  // the temp folders are cleaned up
  const left = fs.readdirSync(os.tmpdir()).filter((name) => name.startsWith("captionsjs-render-"));
  assert.deepEqual(left, [], `leftover temp folders: ${left}`);
  console.log("ok   no temp folders left behind");
} finally {
  api.close();
  files.close();
  fs.rmSync(dir, { recursive: true, force: true });
}
