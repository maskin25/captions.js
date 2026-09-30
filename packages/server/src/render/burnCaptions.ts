import {
  getPreset,
  renderFrame,
  type Caption,
  type CaptionsSettings,
  type StylePreset,
} from "captions.js";
import ffmpeg from "fluent-ffmpeg";
import Konva from "konva";
import "konva/skia-backend";
import { FontLibrary } from "skia-canvas";

import path from "node:path";
import { PassThrough } from "node:stream";
import { once } from "node:events";
import { download } from "../utils/download.js";
import { loadCaptions } from "./loadCaptions.js";
import { resolveFontFile, type ResolveFontOptions } from "./fonts.js";

export interface BurnCaptionsParams {
  /** Input video: local path or http(s) URL. */
  video: string;
  /** Word timings: file path, URL, JSON string or an already parsed array/object. */
  captions: string | Caption[] | Record<string, unknown>;
  /** Output path. Defaults to `<input>.captions.mp4` next to the input. */
  output?: string;
  /** Preset name (case-insensitive) or a full preset object. Defaults to "Karaoke". */
  preset?: string | StylePreset;
  /** Override the output frame rate of the caption overlay. Defaults to the source fps. */
  fps?: number;
  /** Font lookup options, see {@link resolveFontFile}. */
  fonts?: ResolveFontOptions;
  /** x264 preset. Defaults to "veryfast". */
  x264Preset?: string;
  /** x264 CRF. Defaults to 20. */
  crf?: number;
  /**
   * Font-size multiplier passed to `renderFrame`. Defaults to `height / 480`,
   * the same rule the browser overlay uses, so the export matches the preview.
   */
  scale?: number;
  /** Called after each rendered frame. */
  onProgress?: (progress: { frame: number; totalFrames: number }) => void;
}

export interface BurnCaptionsResult {
  output: string;
  frames: number;
  width: number;
  height: number;
  fps: number;
  durationSec: number;
}

const DEFAULT_PRESET = "Karaoke";

/**
 * Renders captions with the same `renderFrame` the browser overlay uses and
 * burns them into a video with FFmpeg. No browser involved.
 */
export const burnCaptions = async (
  params: BurnCaptionsParams,
): Promise<BurnCaptionsResult> => {
  const preset =
    typeof params.preset === "object"
      ? params.preset
      : getPreset(params.preset || DEFAULT_PRESET);
  const captionsSettings = preset.captionsSettings as CaptionsSettings;

  const video = /^https?:\/\//i.test(params.video)
    ? await download(params.video)
    : params.video;

  const captions = await loadCaptions(params.captions);
  const probe = await probeVideo(video);
  const fps = params.fps ?? probe.fps;

  const output =
    params.output ||
    path.join(path.dirname(video), `${path.parse(video).name}.captions.mp4`);

  await registerPresetFont(captionsSettings, params.fonts);

  const frames = await addCanvasCaptionsToVideo({
    sourceVideo: video,
    outputVideo: output,
    captions,
    captionsSettings,
    size: [probe.width, probe.height],
    duration: probe.duration,
    fps,
    scale: params.scale ?? probe.height / 480,
    x264Preset: params.x264Preset ?? "veryfast",
    crf: params.crf ?? 20,
    onProgress: params.onProgress,
  });

  return {
    output,
    frames,
    width: probe.width,
    height: probe.height,
    fps,
    durationSec: probe.duration,
  };
};

const registeredFonts = new Set<string>();

const registerPresetFont = async (
  captionsSettings: CaptionsSettings,
  options?: ResolveFontOptions,
) => {
  const { fontFamily, fontWeight, italic } = captionsSettings.style.font;
  const file = await resolveFontFile({ fontFamily, fontWeight, italic }, options);
  if (registeredFonts.has(file)) return;
  FontLibrary.use(fontFamily, [file]);
  registeredFonts.add(file);
};

const addCanvasCaptionsToVideo = async (opts: {
  sourceVideo: string;
  outputVideo: string;
  captions: Caption[];
  captionsSettings: CaptionsSettings;
  size: [number, number];
  duration: number;
  fps: number;
  scale: number;
  x264Preset: string;
  crf: number;
  onProgress?: BurnCaptionsParams["onProgress"];
}): Promise<number> => {
  const [width, height] = opts.size;

  const stage = new Konva.Stage({ width, height });
  const layer = new Konva.Layer({ listening: false });
  stage.add(layer);

  const totalFrames = Math.max(1, Math.ceil(opts.duration * opts.fps));
  // Raw RGBA frames: no PNG encode/decode per frame.
  const overlayStream = new PassThrough({ highWaterMark: width * height * 4 * 2 });

  const ffmpegPromise = new Promise<void>((resolve, reject) => {
    ffmpeg()
      .input(opts.sourceVideo)
      .input(overlayStream)
      .inputFormat("rawvideo")
      .inputOptions([
        "-pix_fmt rgba",
        `-s ${width}x${height}`,
        `-framerate ${opts.fps}`,
      ])
      .complexFilter(
        [
          {
            filter: "overlay",
            options: { x: 0, y: 0, format: "auto" },
            inputs: ["0:v", "1:v"],
            outputs: "out",
          },
        ],
        "out",
      )
      .outputOptions([
        "-map 0:a?",
        "-c:a copy",
        "-c:v libx264",
        `-preset ${opts.x264Preset}`,
        `-crf ${opts.crf}`,
        "-pix_fmt yuv420p",
        "-movflags +faststart",
      ])
      .output(opts.outputVideo)
      .on("error", (err, _stdout, stderr) => {
        overlayStream.destroy();
        const error = new Error(`FFmpeg failed: ${err.message}`);
        (error as Error & { stderr?: string }).stderr = stderr ?? undefined;
        reject(error);
      })
      .on("end", () => resolve())
      .run();
  });

  const writeFrames = async () => {
    try {
      for (let frame = 0; frame < totalFrames; frame++) {
        if (overlayStream.destroyed) return;
        const time = frame / opts.fps;
        layer.destroyChildren();
        renderFrame(
          opts.captionsSettings,
          undefined as any,
          opts.captions,
          time,
          opts.size,
          layer,
          opts.scale,
        );
        layer.draw();

        const buffer = await (layer.getNativeCanvasElement() as any).toBuffer("raw");
        if (!overlayStream.write(buffer)) {
          await once(overlayStream, "drain");
        }
        opts.onProgress?.({ frame: frame + 1, totalFrames });
      }
    } finally {
      overlayStream.end();
    }
  };

  await Promise.all([ffmpegPromise, writeFrames()]);
  stage.destroy();
  return totalFrames;
};

const parseRate = (rate?: string) => {
  if (!rate) return undefined;
  const [num, den = "1"] = rate.split("/");
  const value = Number(num) / Number(den);
  return Number.isFinite(value) && value > 0 ? value : undefined;
};

export const probeVideo = (
  videoPath: string,
): Promise<{ width: number; height: number; duration: number; fps: number }> =>
  new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        return reject(new Error(`ffprobe failed for ${videoPath}: ${err.message}`));
      }
      const stream = metadata.streams.find((s) => s.codec_type === "video");
      if (!stream?.width || !stream?.height) {
        return reject(new Error(`No video stream in ${videoPath}`));
      }
      const rotation = Math.abs(Number(stream.rotation ?? 0));
      const [width, height] =
        rotation === 90 || rotation === 270
          ? [stream.height, stream.width]
          : [stream.width, stream.height];
      const fps = Math.min(
        60,
        parseRate(stream.avg_frame_rate) ?? parseRate(stream.r_frame_rate) ?? 30,
      );
      resolve({
        width,
        height,
        duration: Number(metadata.format.duration ?? stream.duration ?? 0),
        fps: Math.round(fps * 1000) / 1000,
      });
    });
  });
