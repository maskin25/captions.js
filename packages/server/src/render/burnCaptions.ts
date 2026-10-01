import {
  getPreset,
  renderFrame,
  type Caption,
  type CaptionsSettings,
  type StylePreset,
} from "captions.js";
import Konva from "konva";
import "konva/skia-backend";
import { FontLibrary } from "skia-canvas";

import path from "node:path";
import { download } from "../utils/download.js";
import { loadCaptions } from "./loadCaptions.js";
import { resolveFontFile, type ResolveFontOptions } from "./fonts.js";
import { probeVideo, runFfmpeg } from "./ffmpeg.js";

export { probeVideo };

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

  // Raw RGBA overlay frames on stdin: no PNG encode/decode per frame.
  const ffmpeg = runFfmpeg([
    "-i", opts.sourceVideo,
    "-f", "rawvideo", "-pix_fmt", "rgba", "-s", `${width}x${height}`, "-framerate", String(opts.fps),
    "-i", "pipe:0",
    "-filter_complex", "[0:v][1:v]overlay=x=0:y=0:format=auto[out]",
    "-map", "[out]", "-map", "0:a?", "-c:a", "copy",
    "-c:v", "libx264", "-preset", opts.x264Preset, "-crf", String(opts.crf),
    "-pix_fmt", "yuv420p", "-movflags", "+faststart",
    opts.outputVideo,
  ]);

  const writeFrames = async () => {
    try {
      for (let frame = 0; frame < totalFrames; frame++) {
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
        if (!(await ffmpeg.write(buffer))) return; // ffmpeg exited; `done` has the reason
        opts.onProgress?.({ frame: frame + 1, totalFrames });
      }
    } finally {
      ffmpeg.end();
    }
  };

  await Promise.all([ffmpeg.done, writeFrames()]);
  stage.destroy();
  return totalFrames;
};
