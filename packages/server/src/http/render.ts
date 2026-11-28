import { customizePreset, getPreset, resolveSafeArea, type StylePreset } from "captions.js";
import type { Request, Response } from "express";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { z } from "zod";
import { burnCaptions, probeVideo } from "../render/burnCaptions.js";
import { loadTranscript } from "../render/loadCaptions.js";
import { download } from "../utils/download.js";

const httpUrl = z
  .string()
  .url()
  .refine((value) => /^https?:\/\//i.test(value), "must be an http(s) URL");

// Transcripts and annotations come inline or by URL. A plain string is never
// read as a file path: this is a network service.
const inlineOrUrl = z.union([httpUrl, z.array(z.unknown()), z.record(z.unknown())]);

const safeArea = z.union([
  z.enum(["tiktok", "reels", "shorts", "none"]),
  z.object({ top: z.number(), bottom: z.number(), left: z.number(), right: z.number() }),
]);

export const renderRequest = z
  .object({
    /** The video to caption: an http(s) URL the service can fetch. */
    video: httpUrl,
    /** Word timings in any format the CLI takes, inline or as an http(s) URL. */
    captions: inlineOrUrl,
    /** Preset name or a full preset object. Defaults to Karaoke. */
    preset: z.union([z.string(), z.record(z.unknown())]).optional(),
    /** customizePreset() changes applied to the preset. */
    customize: z
      .object({
        accent: z.string().optional(),
        font: z.union([z.string(), z.record(z.unknown())]).optional(),
        textColor: z.string().optional(),
      })
      .strict()
      .optional(),
    safeArea: safeArea.optional(),
    speakers: z
      .array(z.object({ color: z.string().optional(), label: z.string().optional() }).strict())
      .optional(),
    expressiveness: z.number().min(0).max(1).optional(),
    annotations: inlineOrUrl.optional(),
    fps: z.number().positive().max(120).optional(),
    crf: z.number().int().min(0).max(51).optional(),
  })
  .strict();

export type RenderRequest = z.infer<typeof renderRequest>;

class RequestError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

const maxRenders = Math.max(1, Number(process.env.MAX_CONCURRENT_RENDERS) || 2);
let running = 0;

const firstLine = (error: unknown) => String((error as Error)?.message ?? error).split("\n")[0].replace(/\/tmp\/\S+/g, "<file>");

const resolvePreset = (body: RenderRequest): StylePreset => {
  try {
    const base = typeof body.preset === "object" ? (body.preset as unknown as StylePreset) : getPreset(body.preset ?? "Karaoke");
    if (!base?.captionsSettings) throw new Error("a preset object needs captionsSettings");
    return body.customize ? customizePreset(base, body.customize as Parameters<typeof customizePreset>[1]) : base;
  } catch (error) {
    throw new RequestError(400, `preset: ${(error as Error).message}`);
  }
};

/**
 * `POST /render`: JSON in, MP4 out. Renders while the client waits and
 * answers with the captioned video, or with `{ error }` and a 4xx/5xx status.
 */
export const handleRender = async (req: Request, res: Response) => {
  const parsed = renderRequest.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "invalid request",
      issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    });
  }
  const body = parsed.data;

  if (running >= maxRenders) {
    res.setHeader("Retry-After", "10");
    return res.status(503).json({ error: `busy: ${running} render(s) running, the limit is ${maxRenders}` });
  }
  running++;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "captionsjs-render-"));
  try {
    const preset = resolvePreset(body);
    if (body.safeArea !== undefined) {
      try {
        resolveSafeArea(body.safeArea);
      } catch (error) {
        throw new RequestError(400, `safeArea: ${(error as Error).message}`);
      }
    }

    let video: string;
    try {
      video = await download(body.video, dir);
    } catch (error) {
      throw new RequestError(422, `video: ${(error as Error).message}`);
    }
    try {
      await probeVideo(video);
    } catch (error) {
      throw new RequestError(422, `video: not a video FFmpeg can read (${firstLine(error)})`);
    }
    try {
      const { captions } = await loadTranscript(body.captions as Parameters<typeof loadTranscript>[0]);
      if (captions.length === 0) throw new Error("no words found");
    } catch (error) {
      throw new RequestError(422, `captions: ${firstLine(error)}`);
    }

    const output = path.join(dir, "output.mp4");
    let result;
    try {
      result = await burnCaptions({
        video,
        output,
        captions: body.captions as Parameters<typeof burnCaptions>[0]["captions"],
        preset,
        safeArea: body.safeArea,
        speakers: body.speakers,
        expressiveness: body.expressiveness,
        annotations: body.annotations as Parameters<typeof burnCaptions>[0]["annotations"],
        fps: body.fps,
        crf: body.crf,
      });
    } catch (error) {
      const err = error as Error & { stderr?: string };
      // FFmpeg rejecting the input is the caller's problem; anything else is ours
      const status = err.stderr ? 422 : 500;
      return res.status(status).json({
        error: err.message,
        ...(err.stderr ? { ffmpeg: err.stderr.trim().split("\n").slice(-8).join("\n") } : {}),
      });
    }

    res.setHeader("Content-Type", "video/mp4");
    res.setHeader("Content-Length", fs.statSync(output).size);
    res.setHeader("X-Captions-Frames", String(result.frames));
    res.setHeader("X-Captions-Size", `${result.width}x${result.height}`);
    await new Promise<void>((resolve, reject) => {
      const stream = fs.createReadStream(output);
      stream.on("error", reject);
      res.on("close", resolve);
      stream.pipe(res);
    });
  } catch (error) {
    if (res.headersSent) return void res.destroy();
    if (error instanceof RequestError) return res.status(error.status).json({ error: error.message });
    return res.status(500).json({ error: (error as Error).message });
  } finally {
    running--;
    fs.rmSync(dir, { recursive: true, force: true });
  }
};
