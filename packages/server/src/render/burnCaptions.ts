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

import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { getFontPath } from "./render.helpers.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.join(path.dirname(__filename), "../..");

export interface BurnCaptionsParams {
  videoFile: string;
  captionsFile: string;
  tempDir: string;
  outputPath: string;
  preset: string;
}

export const burnCaptions = async (params: BurnCaptionsParams) => {
  const { captionsSettings } =
    stylePresets.find((p) => p.captionsSettings.style.name === params.preset) ||
    stylePresets[0];

  const [width, height] = await getDimensions(params.videoFile);

  const captionsJson = fs.readFileSync(params.captionsFile, "utf-8");
  const captions: Caption[] = JSON.parse(captionsJson);

  if (!params.outputPath) {
    params.outputPath = path.join(
      path.dirname(params.videoFile),
      `${path.parse(params.videoFile).name}-captions-${
        params.preset
      }-${Date.now()}${path.parse(params.videoFile).ext}`
    );
  }

  if (!params.tempDir) {
    params.tempDir = path.join(
      path.dirname(params.videoFile),
      `temp-captions-${Date.now()}`
    );
    fs.mkdirSync(params.tempDir);
  }

  const duration = await getDuration(params.videoFile);

  console.log(params);

  console.time("Burn captions time");
  await addCanvasCaptionsToVideo(
    params.videoFile,
    params.outputPath,
    params.tempDir,
    captions,
    captionsSettings as CaptionsSettings,
    [width, height],
    [0, duration],
    1
  );
  console.timeEnd("Burn captions time");
};

const addCanvasCaptionsToVideo = async (
  sourceVideo: string,
  outputVideo: string,
  tempFolder: string,
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
    path.join(__dirname, "/assets/fonts"),
    fontFamily,
    fontWeight,
    italic
  );

  console.log("Using font path:", fontPath);

  registerFont(fontPath, {
    family: fontFamily,
    style: italic ? "italic" : "normal",
    weight: fontWeight,
  });

  // console.log("Font registered", fontFamily, fontWeight, italic ? "italic" : "normal");

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

  const framesDir = path.join(tempFolder, "frames");
  if (!fs.existsSync(framesDir)) {
    fs.mkdirSync(framesDir);
  }

  const font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  canvas.getContext("2d").font = font;
  layer.getNativeCanvasElement().getContext("2d").font = font;

  const frameRate = 30;
  let time = 0;
  let frame = 0;
  while (time <= timeEnd) {
    layer.removeChildren();

    const offsetTime = time;

    renderFrame(
      captionsSettings,
      undefined,
      captions,
      time,
      targetSize,
      layer,
      toCoef,
      undefined
    );

    const outPath = path.join(
      framesDir,
      `frame-${String(frame).padStart(4, "0")}.png`
    );
    //@ts-ignore
    const maybeBuffer = layer.getNativeCanvasElement().toBuffer("image/png"); // Generate the PNG buffer
    const buffer =
      typeof (maybeBuffer as Promise<Buffer>)?.then === "function"
        ? await (maybeBuffer as Promise<Buffer>)
        : (maybeBuffer as Buffer);
    fs.writeFileSync(outPath, buffer); // Save PNG frame

    frame += 1;
    time += 1 / frameRate;
  }

  // console.log(frame, "Frames generated successfully");

  // overlay the frames on the video and use timeRange[0] as time offset for the frames
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(sourceVideo)
      .input(`${framesDir}/frame-%04d.png`)
      .inputOptions([`-framerate ${frameRate}`])
      .outputOptions([
        "-c:v libx264",
        "-pix_fmt yuv420p",
        "-map 0:a",
        "-c:a copy",
      ])
      .complexFilter(
        [
          {
            filter: "overlay",
            options: {
              x: 0,
              y: 0,
            },
            inputs: ["0:v", "1"],
            outputs: "output",
          },
        ],
        "output"
      )
      //.duration(timeRange[1] - timeRange[0])
      .output(outputVideo)
      .on("start", (commandLine) => {
        // console.log("Spawned FFmpeg with command: " + commandLine);
      })
      .on("error", async (err, stdout, stderr) => {
        console.error("Error during add canvas captions to video: " + err);
        console.error("stdout:", stdout);
        console.error("stderr:", stderr);

        reject({
          message: "Error during add canvas captions to video",
          err,
          stdout,
          stderr,
        });
      })
      .on("end", () => {
        console.log("Processing finished successfully");
        resolve(outputVideo);
      })
      .run();
  });
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
