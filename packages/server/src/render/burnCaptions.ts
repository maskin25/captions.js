import {
  Caption,
  CaptionsSettings,
  renderFrame,
  stylePresets,
} from "captions.js";
import ffmpeg from "fluent-ffmpeg";

import { createCanvas, registerFont } from "canvas";
import Konva from "konva";
import "konva/skia-backend";
import { FontLibrary } from "skia-canvas";

import path from "path";
import fs from "fs";
import { PassThrough } from "node:stream";
import { once } from "node:events";
import { fileURLToPath } from "url";
import { getFontPath } from "./render.helpers.js";
import { download } from "../utils/download.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.join(path.dirname(__filename), "../..");

export interface BurnCaptionsParams {
  video: string;
  captions: string;
  output: string;
  preset: string;
}

export const burnCaptions = async (params: BurnCaptionsParams) => {
  const { captionsSettings } =
    stylePresets.find((p) => p.captionsSettings.style.name === params.preset) ||
    stylePresets[0];

  if (/^https?:\/\//i.test(params.video)) {
    params.video = await download(params.video);
  }

  let captions: Caption[];
  try {
    captions = JSON.parse(params.captions);
  } catch (err) {
    if (/^https?:\/\//i.test(params.captions)) {
      params.captions = await download(params.captions);
    }
    const captionsJson = fs.readFileSync(params.captions, "utf-8");
    captions = JSON.parse(captionsJson);
  }

  const [width, height] = await getDimensions(params.video);

  if (!params.output) {
    params.output = path.join(
      path.dirname(params.video),
      `${path.parse(params.video).name}-captions-${
        params.preset
      }-${Date.now()}${path.parse(params.video).ext}`
    );
  }

  const duration = await getDuration(params.video);

  console.time("Burn captions time");
  await addCanvasCaptionsToVideo(
    params.video,
    params.output,
    captions,
    captionsSettings as CaptionsSettings,
    [width, height],
    [0, duration],
    1
  );
  console.timeEnd("Burn captions time");
  console.log("Output video saved to:", params.output);
};

const addCanvasCaptionsToVideo = async (
  sourceVideo: string,
  outputVideo: string,
  captions: Caption[],
  captionsSettings: CaptionsSettings,
  targetSize: [number, number],
  timeRange: [number, number],
  toCoef?: number
) => {
  const [width, height] = targetSize;
  const [timeStart, timeEnd] = timeRange;

  const { fontFamily, fontSize, fontWeight, italic } =
    captionsSettings.style.font;

  const fontPath = getFontPath(
    path.join(__dirname, "assets", "fonts"),
    fontFamily,
    fontWeight,
    italic
  );

  registerFont(fontPath, {
    family: fontFamily,
    style: italic ? "italic" : "normal",
    weight: fontWeight,
  });
  try {
    FontLibrary.use(fontFamily, [fontPath]);
  } catch (error) {
    console.warn("FontLibrary.use failed:", error);
  }

  const canvas = createCanvas(width, height);

  const stage = new Konva.Stage({
    //@ts-ignore
    container: canvas,
    width: width,
    height: height,
  });

  const layer = new Konva.Layer();
  layer.pixelSize(2);
  stage.add(layer);

  const font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  canvas.getContext("2d").font = font;
  layer.getNativeCanvasElement().getContext("2d").font = font;

  const frameRate = 30;
  const frameDuration = 1 / frameRate;
  const overlayStream = new PassThrough({ highWaterMark: 1024 * 1024 });

  const ffmpegPromise = new Promise<string>((resolve, reject) => {
    ffmpeg()
      .input(sourceVideo)
      .input(overlayStream)
      .inputFormat("image2pipe")
      .inputOptions([`-framerate ${frameRate}`])
      .outputOptions([
        "-c:v libx264",
        "-pix_fmt yuv420p",
        "-map 0:a?",
        "-c:a copy",
      ])
      .complexFilter(
        [
          {
            filter: "overlay",
            options: { x: 0, y: 0 },
            inputs: ["0:v", "1"],
            outputs: "output",
          },
        ],
        "output"
      )
      .output(outputVideo)
      .on("error", (err, stdout, stderr) => {
        console.error("Error during add canvas captions to video: " + err);
        console.error("stdout:", stdout);
        console.error("stderr:", stderr);
        overlayStream.destroy(err as Error);
        reject({
          message: "Error during add canvas captions to video",
          err,
          stdout,
          stderr,
        });
      })
      .on("progress", (progress) => {
        console.log(`Processing: ${progress.percent}% done`);
      })
      .on("end", () => {
        console.log("Processing finished successfully");
        resolve(outputVideo);
      })
      .run();
  });

  let time = timeStart;
  const writeFrames = async () => {
    try {
      while (time <= timeEnd + 1e-6) {
        layer.removeChildren();

        renderFrame(
          captionsSettings,
          undefined as any,
          captions,
          time,
          targetSize,
          layer,
          toCoef,
          undefined
        );

        //@ts-ignore
        const maybeBuffer = layer
          .getNativeCanvasElement()
          .toBuffer("image/png");
        const buffer =
          typeof (maybeBuffer as Promise<Buffer>)?.then === "function"
            ? await (maybeBuffer as Promise<Buffer>)
            : (maybeBuffer as Buffer);

        if (!overlayStream.write(buffer)) {
          await once(overlayStream, "drain");
        }

        time += frameDuration;
      }
    } finally {
      overlayStream.end();
    }
  };

  await Promise.all([ffmpegPromise, writeFrames()]);
  return outputVideo;
};

const getDimensions = async (videoPath: string): Promise<[number, number]> => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        console.error("Error inspecting video:", err);
        return reject({ message: "Error during getDimensions", err });
      }

      const videoStream = metadata.streams.find(
        (stream) => stream.codec_type === "video"
      );
      const rotation = videoStream?.rotation ? Number(videoStream.rotation) : 0;

      const size =
        Math.abs(rotation) === 90
          ? [videoStream?.height, videoStream?.width]
          : [videoStream?.width, videoStream?.height];
      resolve(size as [number, number]);
    });
  });
};

const getDuration = async (videoPath: string): Promise<number> => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        console.error("Error inspecting video:", err);
        return reject({ message: "Error during getDuration", err });
      }

      const duration = metadata.format.duration || 0;
      resolve(duration);
    });
  });
};
