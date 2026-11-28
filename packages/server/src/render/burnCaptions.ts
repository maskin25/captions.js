import {
  getPreset,
  frameScale,
  renderFrame,
  resolveSafeArea,
  type AnnotationIssue,
  type Caption,
  type CaptionAnnotations,
  type CaptionsSettings,
  type SpeakerStyle,
  type StylePreset,
} from "captions.js";
import Konva from "./skia.js";
import { FontLibrary } from "skia-canvas";

import path from "node:path";
import { download } from "../utils/download.js";
import { annotateCaptions, loadAnnotations, loadTranscript } from "./loadCaptions.js";
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
  /**
   * How strongly the preset reacts to word emphasis, 0–1 (see
   * `CaptionsSettings.expressiveness`). Defaults to the preset's own value, or 0.
   */
  expressiveness?: number;
  /**
   * Emphasis annotations, e.g. written by an LLM: a file path, URL, JSON text
   * or object (see `applyAnnotations` in captions.js). Shown only when
   * `expressiveness` is above 0.
   */
  annotations?: string | CaptionAnnotations | Record<string, unknown>;
  /**
   * Color and label per speaker (`Caption.speaker` 0, 1, …), merged over the
   * preset's `speakers` and over names the transcript carries (WebVTT
   * voices, named speakers).
   */
  speakers?: SpeakerStyle[];
  /**
   * Keep captions clear of a platform's interface: `"tiktok"`, `"reels"`,
   * `"shorts"`, `"none"` or insets as fractions of the frame (see
   * `CaptionsSettings.safeArea`). Defaults to the preset's own value.
   */
  safeArea?: CaptionsSettings["safeArea"];
  /** Override the output frame rate of the caption overlay. Defaults to the source fps. */
  fps?: number;
  /** Font lookup options, see {@link resolveFontFile}. */
  fonts?: ResolveFontOptions;
  /** x264 preset. Defaults to "veryfast". */
  x264Preset?: string;
  /** x264 CRF. Defaults to 20. */
  crf?: number;
  /**
   * Font-size multiplier passed to `renderFrame`. Defaults to `frameScale(height)` (height / 480),
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
  /** Words whose emphasis came from `annotations`. */
  annotated?: number;
  /** Problems found in `annotations`; the entries concerned were skipped or adjusted. */
  annotationIssues?: AnnotationIssue[];
  /** Number of words with emphasis, from any source. */
  emphasized: number;
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
  const captionsSettings: CaptionsSettings = {
    ...(preset.captionsSettings as CaptionsSettings),
    ...(params.expressiveness !== undefined
      ? { expressiveness: params.expressiveness }
      : {}),
    ...(params.safeArea !== undefined ? { safeArea: params.safeArea } : {}),
  };
  // a bad value fails here, before any video work
  resolveSafeArea(captionsSettings.safeArea);

  const video = /^https?:\/\//i.test(params.video)
    ? await download(params.video)
    : params.video;

  const transcript = await loadTranscript(params.captions);
  let captions = transcript.captions;
  const speakerCount = Math.max(
    transcript.speakers.length,
    captionsSettings.speakers?.length ?? 0,
    params.speakers?.length ?? 0,
  );
  if (speakerCount > 0) {
    captionsSettings.speakers = Array.from({ length: speakerCount }, (_, i) => ({
      ...transcript.speakers[i],
      ...captionsSettings.speakers?.[i],
      ...params.speakers?.[i],
    }));
  }
  let annotated: number | undefined;
  let annotationIssues: AnnotationIssue[] | undefined;
  if (params.annotations !== undefined) {
    const result = annotateCaptions(captions, await loadAnnotations(params.annotations));
    captions = result.captions;
    annotated = result.applied;
    annotationIssues = result.issues;
  }
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
    scale: params.scale ?? frameScale(probe.height),
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
    annotated,
    annotationIssues,
    emphasized: captions.filter((c) => (c.emphasis ?? 0) > 0).length,
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
        renderFrame({
          settings: opts.captionsSettings,
          captions: opts.captions,
          time,
          size: opts.size,
          layer,
          scale: opts.scale,
        });
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
