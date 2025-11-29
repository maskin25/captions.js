import ffmpeg, { ffprobe } from "fluent-ffmpeg";
import fs from "fs";
import axios from "axios";

import path, { resolve } from "path";
import { capitalizeFirstLetter, downloadFile } from "../utils";
import EventEmitter from "events";
import {
  fontWeightToNumber,
  getFileNameFromUrl,
  getFontPath,
  limitToBounds,
  prepareCaptions,
} from "./render.helpers";
import { uploadToFirebaseStorage } from "../storage/media-uploader";

import { createCanvas, registerFont } from "canvas";
import Konva from "konva";

import { renderFrame, trimLayoutsCaptions } from "@nexpanse/video-editor/dist/canvas-captions";

import { notifyFrontApi, sendOncallAlert } from "../jobs/webhooks";
import { Layout } from "@nexpanse/video-editor/dist/entities/layout/layout.types";
import {
  RenderFrameFn,
  Caption,
  CaptionsSettings,
  TrimLayoutsCaptionsFn,
  Timeline,
  Overlay,
} from "@nexpanse/video-editor";

const __dirname = process.cwd();
const __temp_dirname = "/tmp";

export interface RenderVideoInputParams {
  id: number;
  videoSrc: string;
  audioSrc?: string;
  timeline: Timeline;
  timeRange: [number, number];
  sourceSize: [number, number];
  targetSize: [number, number];
  captions: Caption[];
  captionsSettings: CaptionsSettings;
  sourceSizeOriginal?: [number, number];
  targetSizeLowRes: [number, number];
  renderCaptions?: boolean | undefined;
}

export interface BulkRenderVideoInputParams {
  projectId: number;
  videoSrc: string;
  audioSrc?: string;
  tasks: RenderVideoInputParams[];
}

export interface Task {
  id: string;
  status: "pending" | "running" | "completed" | "error";
  data?: any;
}

const outputDir = path.join(__temp_dirname, "/output/");
fs.mkdirSync(outputDir, { recursive: true });

export class FFMpeg extends EventEmitter {
  taskQueue: Task[] = [];

  constructor() {
    super();

    console.log(
      `Render instance created, NODE_ENV=${process.env.NODE_ENV}, APP_ENV=${process.env.APP_ENV}`
    );
  }

  async bulkRender(params: BulkRenderVideoInputParams, isAwait: Boolean) {
    const taskId = this.addTask();

    if (isAwait) {
      await this.bulkRenderTask(taskId, params, true);
    } else {
      this.bulkRenderTask(taskId, params, false);
    }

    return taskId;
  }

  async bulkRenderTask(taskId: string, input: BulkRenderVideoInputParams, isAwait: Boolean) {
    const { projectId, videoSrc, audioSrc, tasks: tasksToRender } = input;

    if (!videoSrc) {
      throw new Error("videoSrc is required");
    }

    this.updateTask(taskId, {
      status: "running",
      data: {
        projectId,
      },
    });

    const sendAlert = async (error: any) => {
      await sendOncallAlert({ projectId, error: error });
    };

    try {
      const tempFolderName = taskId;
      const dir = path.join(__temp_dirname, `/${tempFolderName}/`);
      fs.mkdirSync(dir, { recursive: true });
      const fileName = "input.mp4";
      const videoPath = await downloadFile(videoSrc, dir, fileName);

      let audioPath = undefined;
      if (audioSrc) {
        const audioFileName = "audio.mp4";
        audioPath = await downloadFile(audioSrc, dir, audioFileName);
      }

      const sourceSize = await this.getDimensions(videoPath);

      tasksToRender.forEach((taskToRender) => {
        taskToRender.sourceSize = sourceSize;
      });

      this.updateTask(taskId, {
        status: "running",
        data: {
          projectId,
          videoPath,
          audioPath,
        },
      });
    } catch (error) {
      console.error("Error during bulk render task", error);
      await sendAlert(error);
      this.updateTask(taskId, {
        status: "error",
        data: { error },
      });
    }

    for (var task of tasksToRender) {
      if (isAwait) {
        await this.renderVideo(task, taskId);
      } else {
        this.renderVideo(task, taskId);
      }
    }
  }

  async renderVideo(params: RenderVideoInputParams, parentTaskId?: string) {
    const taskId = this.addTask({ parentTaskId });

    await this.renderVideoTask(taskId, params);

    return taskId;
  }

  async renderVideoTask(
    taskId: string,
    {
      id,
      videoSrc,
      audioSrc,
      timeline: { layouts: layoutsRaw, overlays },
      timeRange,
      sourceSize,
      targetSize,
      captions: rawCaptions,
      captionsSettings,
      sourceSizeOriginal,
      targetSizeLowRes,
      renderCaptions,
    }: RenderVideoInputParams
  ) {
    this.updateTask(taskId, {
      status: "running",
    });

    const [width, height] = targetSize;
    const [widthSourceOriginal, heightSourceOriginal] = sourceSizeOriginal ?? [1920, 360];
    const [targetSizeLowResWidth, targetSizeLowResHeight] = targetSizeLowRes;

    const fromCoef = Math.min(
      sourceSize[0] / widthSourceOriginal,
      sourceSize[1] / heightSourceOriginal
    );
    const toCoef = Math.min(width / targetSizeLowResWidth, height / targetSizeLowResHeight);

    const duration = layoutsRaw.reduce((acc, layout) => {
      return acc + layout.endTime - layout.startTime;
    }, 0);

    const startTimeLayout = layoutsRaw[0].startTime;
    console.log(`clip#${id}:info:total clip duration ${duration}`);

    const tempFolderName = taskId;
    const dir = path.join(__temp_dirname, `/${tempFolderName}/`);
    fs.mkdirSync(dir, { recursive: true });
    const fileName = "input.mp4";

    let videoPath = "";
    let audioPath = "";
    const task = this.getTask(taskId);
    if (task.data?.parentTaskId) {
      const parentTask = this.getTask(task.data.parentTaskId);

      if (parentTask.data.videoPath) {
        console.log("clip#${id}:info:video downloaded already");
        videoPath = parentTask.data.videoPath;
      }
      if (parentTask.data.audioPath) {
        console.log("clip#${id}:info:audio downloaded already");
        audioPath = parentTask.data.audioPath;
      }
    }

    const sendAlert = async (error: any) => {
      const projectId = this.getTask(task.data.parentTaskId).data?.projectId;
      const clipId = id;
      await sendOncallAlert({ projectId, clipId, error });
    };

    try {
      videoPath = videoPath || (await downloadFile(videoSrc, dir, fileName));

      const audioFileName = "audio.mp4";

      audioPath =
        audioPath || (audioSrc ? await downloadFile(audioSrc, dir, audioFileName) : undefined);

      const layouts = layoutsRaw
        .map((layout: any, index: number, arr: Layout[]) => ({
          ...layout,
          startTime: layout.startTime,
          endTime: layout.endTime,
        }))
        .filter((layout) => layout.startTime < layout.endTime);

      let stackedVideos = [];

      for (let i = 0; i < layouts.length; i++) {
        const layout = layouts[i];
        const duration = layout.endTime - layout.startTime;

        let croppedVideos: {
          video: string;
          videoBlur: string;
          to: [number, number, number, number];
          from: [number, number, number, number];
        }[] = [];

        for (var j = 0; j < layout.crops.length; j++) {
          const crop = layout.crops[j];

          const from = crop.from
            .map(limitToBounds([0, 0, widthSourceOriginal, heightSourceOriginal]))
            .map((x: number) => Math.round(x * fromCoef));

          const to = crop.to
            .map(limitToBounds([0, 0, targetSizeLowResWidth, targetSizeLowResHeight]))
            .map((x: number) => Math.round(x * toCoef));

          const outputPath = path.join(dir, `cropped_${i}-${j}.mp4`);
          const croppedVideo = await this.makeCropVideo(
            videoPath,
            outputPath,
            layout.startTime,
            layout.endTime,
            from,
            to
          );

          let croppedBlurVideoPath = "";
          if (layout.layoutType === "fit") {
            const outputBlurPath = path.join(dir, `cropped_blur_${i}-${j}.mp4`);
            croppedBlurVideoPath = await this.makeCropVideo(
              videoPath,
              outputBlurPath,
              layout.startTime,
              layout.endTime,
              from,
              to,
              true
            );
          }

          croppedVideos.push({
            to: crop.to,
            from: crop.from,
            video: croppedVideo,
            videoBlur: croppedBlurVideoPath,
          });
        }

        const outputPath = path.join(dir, `stacked_${i}.mp4`);
        const stackedVideo = await this.stackVideos(
          croppedVideos,
          [layout.startTime, layout.endTime],
          targetSize,
          outputPath,
          audioPath,
          videoSrc,
          toCoef,
          fromCoef,
          layout.layoutType
        );

        if (audioPath) {
          const audioOutputPath = path.join(dir, `trim_audio_out_${i}.mp4`);
          const pathAudio = await this.trimAudio(audioPath, audioOutputPath, {
            startTime: layout.startTime,
            endTime: layout.endTime,
          });
          const mergedAudioVideoOutputPath = path.join(dir, `merged_audio_video_out_${i}.mp4`);
          const mergedAudioVideo = await this.mergeAudioVideo(
            stackedVideo,
            pathAudio,
            mergedAudioVideoOutputPath
          );
          stackedVideos.push(mergedAudioVideo);
        } else {
          stackedVideos.push(stackedVideo);
        }
      }

      const combinedOutputPath = path.join(dir, `combined.mp4`);
      await this.makeCombinedVideo(stackedVideos, combinedOutputPath, dir);

      const trimLayoutsCaptionsFn: TrimLayoutsCaptionsFn = trimLayoutsCaptions;
      const trimCaptions = trimLayoutsCaptionsFn({ layouts: layouts, overlays }, rawCaptions);
      const captions = prepareCaptions(trimCaptions, startTimeLayout);

      let inputPath = combinedOutputPath;
      if (captions && captions.length > 0 && renderCaptions === true) {
        const captionedOutputPath = path.join(dir, `captioned.mp4`);
        const flatTimeline = layouts
          .map((x) => [x.startTime, x.endTime])
          .flat()
          .map((x) => x - startTimeLayout);

        await this.addCanvasCaptionsToVideo(
          combinedOutputPath,
          captionedOutputPath,
          dir,
          captions,
          captionsSettings,
          targetSize,
          duration,
          flatTimeline,
          startTimeLayout,
          toCoef,
          layoutsRaw
        );

        inputPath = captionedOutputPath;
      }

      if (overlays?.length) {
        const overlayedOutputPath = path.join(dir, `overlayed.mp4`);
        for (var overlay of overlays) {
          if (overlay.type === "image") {
            await this.addImageOverlayToVideo(
              inputPath,
              {
                ...overlay,
                to: overlay.to.map((x: number) => Math.round(x * toCoef)) as [
                  number,
                  number,
                  number,
                  number,
                ],
              },
              overlayedOutputPath,
              dir
            );
          }
          inputPath = overlayedOutputPath;
        }
      }

      const finalPath = inputPath;
      console.log("final upload path", finalPath);

      const link = await uploadToFirebaseStorage(finalPath, `${taskId}.mp4`);

      /* const newPath = path.join(outputDir, `${taskId}.mp4`);
    fs.renameSync(captionedOutputPath, newPath);

    const link = path.relative(
      "/Users/maksimmordasov/nexpanse/loomz-video-api/public/",
      newPath
    ); */

      fs.rmSync(dir, { recursive: true, force: true });
      console.log("Temp folder deleted successfully:", dir);

      await notifyFrontApi(id, {
        exportedVideoUrl: link,
        exportStatus: "COMPLETED",
      });

      this.updateTask(taskId, {
        data: { file: link },
        status: "completed",
      });
    } catch (error) {
      if (axios.isAxiosError(error) && error.response.status === 400) {
        console.error("Axios error 400", error.response.data);
      } else {
        console.error("Error during render video task", error);
        await sendAlert(error);
      }

      this.updateTask(taskId, {
        status: "error",
        data: { error },
      });
    }
  }

  async makeCombinedVideo(videos: string[], output: string, tempDir: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const concatCommand = ffmpeg();

      videos.forEach((video) => {
        concatCommand.input(video); // Add each video file to the ffmpeg input
      });

      concatCommand
        .on("start", function (commandLine) {
          // console.log("Spawned FFmpeg with command: " + commandLine);
        })
        .on("error", async (err, stdout, stderr) => {
          console.error("Error during make combined video: " + err);
          console.error("stdout:", stdout);
          console.error("stderr:", stderr);

          reject({ message: "Error during make combined video", err, stdout, stderr });
        })

        .on("end", () => {
          // console.log("Concatenation finished successfully");
          resolve(output);
        })
        .mergeToFile(output, tempDir);
    });

    /* return await concat({
      output,
      videos,
       transition: {
        name: "fade",
        duration: 500,
      },
    }); */
  }

  async trimAudio(audioPath: string, output: string, interval: any): Promise<string> {
    return new Promise((resolve, reject) => {
      const command = ffmpeg(audioPath);
      command
        .setStartTime(interval.startTime)
        .setDuration(interval.endTime - interval.startTime)
        .output(output)
        .on("error", async (err, stdout, stderr) => {
          console.error("Error during trim audio: " + err);
          console.error("stdout:", stdout);
          console.error("stderr:", stderr);

          reject({ message: "Error during trim audio", err, stdout, stderr });
        })
        .on("end", () => {
          // console.log("Trim audio successfully");
          resolve(output);
        })
        .run();
    });
  }

  async mergeAudioVideo(videoPath: string, audioPath: string, output: string): Promise<string> {
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .input(audioPath)
        .output(output)
        .on("error", async (err, stdout, stderr) => {
          console.error("Error merge audio video: " + err);
          console.error("stdout:", stdout);
          console.error("stderr:", stderr);

          reject({ message: "Error during merge audio video", err, stdout, stderr });
        })
        .on("end", () => {
          // console.log("Merge audio video successfully");
          resolve(output);
        })
        .run();
    });
  }

  async hasAudioTrack(videoPath: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) {
          console.error("Error inspecting video:", err);
          return reject({ message: "Error during hasAudioTrack", err });
        }

        const hasAudio = metadata.streams.some((stream) => stream.codec_type === "audio");
        if (hasAudio) {
          console.log("The video contains an audio track.");
          resolve(true);
        } else {
          console.log("The video does not contain an audio track.");
          resolve(false);
        }
      });
    });
  }

  async getDimensions(videoPath: string): Promise<[number, number]> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) {
          console.error("Error inspecting video:", err);
          return reject({ message: "Error during getDimensions", err });
        }

        const videoStream = metadata.streams.find((stream) => stream.codec_type === "video");
        const rotation = videoStream?.rotation ? Number(videoStream.rotation) : 0;

        const size =
          Math.abs(rotation) === 90
            ? [videoStream?.height, videoStream?.width]
            : [videoStream?.width, videoStream?.height];
        resolve(size as [number, number]);
      });
    });
  }

  async stackVideos(
    videos: {
      to: [number, number, number, number];
      from: [number, number, number, number];
      video: string;
      videoBlur: string;
    }[],

    timeRange: [number, number],
    targetSize: [number, number],
    outputVideo: string,
    audioPath: string,
    videoSrc: string,
    toCoef: number,
    fromCoef: number,
    layoutType: string
  ): Promise<string> {
    const [startTime, endTime] = timeRange;
    const duration = endTime - startTime;

    return new Promise(async (resolve, reject) => {
      let command = ffmpeg();

      const [width, height] = targetSize;
      // Add each video as an input
      videos.forEach(({ video }, index) => {
        command = command.input(video);
      });

      if (layoutType === "fit") {
        command = command.input(videos[0].videoBlur);
      }
      let defaultOutput = "background";

      let filters: any = [
        {
          //filter: `nullsrc=size=${width}x${height}`,
          filter: `color=size=${width}x${height}:color=black`,
          options: {},
          outputs: "background",
        },
      ];

      if (layoutType === "fit") {
        filters.push({
          filter: "scale",
          options: { width: targetSize[0], height: targetSize[1] },
          inputs: "1:v",
          outputs: "scaledOverlay",
        });
        filters.push({
          filter: "overlay",
          options: { x: 0, y: 0 },
          inputs: [defaultOutput, `scaledOverlay`],
          outputs: `fitBlur`,
        });
        defaultOutput = "fitBlur";
      }

      //command = command.input('color=size=640x480:color=black').inputOptions('-t 12');

      videos.forEach(({ video, to }, index) => {
        let [x, y] = to;
        x = x * toCoef;
        y = y * toCoef;
        filters.push({
          filter: "overlay",
          options: { x, y },
          inputs: [index === 0 ? defaultOutput : `tmp${index - 1}`, `${index}:v`],
          outputs: `tmp${index}`,
        });
      });

      filters[filters.length - 1].outputs = "output";

      // Use the complexFilter method to specify the layout of the videos in the output
      command = command.complexFilter(filters, "output");

      // Set the output options for the video
      if (!audioPath) {
        const hasAudioTrack = await this.hasAudioTrack(videoSrc);
        if (hasAudioTrack) {
          // console.log("Add outputOptions with audio -map 0:a-c:a copy");
          command = command.outputOptions(["-pix_fmt yuv420p", "-map 0:a", "-c:a copy"]);
        } else {
          // console.log("Add outputOptions no audio");
          command = command.outputOptions("-pix_fmt yuv420p");
        }
      } else {
        // console.log("Add outputOptions no audio");
        command = command.outputOptions("-pix_fmt yuv420p");
      }

      // Specify the output file
      command = command.output(outputVideo);

      command = command.duration(duration);

      // Run the command
      command
        .on("start", function (commandLine) {
          // console.log("Spawned FFmpeg with command: " + commandLine);
        })
        .on("error", async (err, stdout, stderr) => {
          console.error("Error during make stack videos: " + err);
          console.error("stdout:", stdout);
          console.error("stderr:", stderr);

          reject({ message: "Error during make stack videos", err, stdout, stderr });
        })
        .on("end", () => {
          // console.log("End videoCropCenterFFmpeg:", outputVideo);
          resolve(outputVideo);
        })
        .run();
    });
  }

  makeCropVideo(
    sourceVideo: string,
    outputVideo: string,
    startTime: number,
    endTime: number,
    from: [number, number, number, number],
    to: [number, number, number, number],

    withBlur: boolean = false
  ): Promise<string> {
    const [x1, y1, x2, y2] = from;
    const width = x2 - x1;
    const height = y2 - y1;

    const targetWidth = Math.round(to[2] - to[0]);
    const targetHeight = Math.round(to[3] - to[1]);

    const duration = endTime - startTime;

    const bh = height;
    const bw = (9 / 16) * bh;
    const bx = width / 2 - bw / 2;

    const filters = withBlur
      ? [
          {
            filter: "crop",
            options: {
              x: bx,
              y: y1,
              w: bw,
              h: bh,
            },
          },
          {
            filter: "gblur",
            options: "sigma=45",
          },
        ]
      : [
          {
            filter: "crop",
            options: {
              x: x1,
              y: y1,
              w: width,
              h: height,
            },
          },
        ];

    return new Promise((res, rej) => {
      ffmpeg()
        .input(sourceVideo)
        .setStartTime(startTime)
        .setDuration(duration)
        .videoFilters(filters)
        .size(`${targetWidth}x${targetHeight}`)
        .output(outputVideo)
        .on("start", function (commandLine) {
          // console.log("Spawned FFmpeg with command: " + commandLine);
          // console.log("Start videoCropCenterFFmpeg:", sourceVideo);
        })
        .on("error", async (err, stdout, stderr) => {
          console.error("Error during make crop video: " + err);
          console.error("stdout:", stdout);
          console.error("stderr:", stderr);

          rej({ message: "Error during make crop video", err, stdout, stderr });
        })

        .on("end", function () {
          // console.log("End videoCropCenterFFmpeg:", outputVideo);
          res(outputVideo);
        })
        .run();
    });
  }

  addCanvasCaptionsToVideo(
    sourceVideo: string,
    outputVideo: string,
    tempFolder: string,
    captions: Caption[],
    captionsSettings: CaptionsSettings,
    targetSize: [number, number],
    duration: number,
    flatTimeline: number[],
    startTimeLayout: number,
    toCoef?: number,
    layouts?: Layout[]
  ) {
    const [width, height] = targetSize;

    const { fontFamily, fontSize, fontWeight, italic } = captionsSettings.style.font;

    const fontPath = getFontPath(
      path.join(__dirname, "/assets/fonts"),
      fontFamily,
      fontWeight,
      italic
    );

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
    let currentEnd = flatTimeline[1];
    let timeLineIndex = 0;
    while (time <= flatTimeline[flatTimeline.length - 1]) {
      layer.removeChildren();

      const offsetTime = startTimeLayout + time;

      const layout = layouts.find((x) => x.startTime <= offsetTime && x.endTime >= offsetTime);

      const render: RenderFrameFn = renderFrame;
      render(
        captionsSettings,
        null,
        captions,
        time,
        targetSize,
        layer,
        toCoef,
        !!layout
          ? {
              positionTopOffset: layout?.position?.positionTopOffset,
              type: layout?.position?.type,
            }
          : undefined
      );

      const outPath = path.join(framesDir, `frame-${String(frame).padStart(4, "0")}.png`);
      //@ts-ignore
      const buffer = layer.getNativeCanvasElement().toBuffer("image/png"); // Generate the PNG buffer
      fs.writeFileSync(outPath, buffer); // Save PNG frame

      frame += 1;
      time += 1 / frameRate;

      // move to gap if timeline is rugged
      if (time > currentEnd) {
        timeLineIndex = timeLineIndex + 2;
        time = flatTimeline[timeLineIndex] ?? time;
        currentEnd = flatTimeline[timeLineIndex + 1];
      }
    }

    // console.log(frame, "Frames generated successfully");

    // overlay the frames on the video and use timeRange[0] as time offset for the frames
    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(sourceVideo)
        .input(`${framesDir}/frame-%04d.png`)
        .inputOptions([`-framerate ${frameRate}`])
        .outputOptions(["-c:v libx264", "-pix_fmt yuv420p", "-map 0:a", "-c:a copy"])
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

          reject({ message: "Error during add canvas captions to video", err, stdout, stderr });
        })
        .on("end", () => {
          // console.log("Processing finished successfully");
          resolve(outputVideo);
        })
        .run();
    });
  }

  async addImageOverlayToVideo(
    video: string,
    overlay: Overlay,
    outputVideo: string,
    tempFolder: string
  ): Promise<string> {
    const imageName = getFileNameFromUrl(overlay.url);
    const overlayImage = await downloadFile(overlay.url, tempFolder, imageName);

    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(video)
        .input(overlayImage)
        .complexFilter([
          {
            filter: "scale",
            options: {
              width: overlay.to[2] - overlay.to[0],
              height: overlay.to[3] - overlay.to[1],
            },
            inputs: "1:v",
            outputs: "scaledOverlay",
          },
          {
            filter: "overlay",
            options: { x: overlay.to[0], y: overlay.to[1] },
            inputs: ["0:v", "scaledOverlay"],
            // enable:  `between(t,${overlay.startTime},${overlay.endTime})`, // Specify the start and end times
          },
        ])
        .output(outputVideo)
        .on("start", function (commandLine) {
          // console.log("Spawned FFmpeg with command: " + commandLine);
        })
        .on("error", function (err, stdout, stderr) {
          console.error("Error during adding overlay: " + err);
          console.error("stdout:", stdout);
          console.error("stderr:", stderr);
          reject({ message: "Error during adding overlay", err, stdout, stderr });
        })
        .on("end", function () {
          // console.log("Processing finished successfully");
          resolve(outputVideo);
        })
        .run();
    });
  }

  trimVideo(video: string, timeRange: [number, number], output: string): Promise<string> {
    const [startTime, endTime] = timeRange;

    return new Promise((res, rej) => {
      ffmpeg()
        .input(video)
        .setStartTime(startTime)
        .setDuration(endTime - startTime)
        .output(output)
        .on("start", function (commandLine) {
          // console.log("Spawned FFmpeg with command: " + commandLine);
          // console.log("Start videoCropCenterFFmpeg:", video);
        })
        .on("error", async (err, stdout, stderr) => {
          console.error("Error during trim video: " + err);
          console.error("stdout:", stdout);
          console.error("stderr:", stderr);

          rej({ message: "Error during trim video", err, stdout, stderr });
        })
        .on("end", function () {
          // console.log("End videoCropCenterFFmpeg:", output);
          res(output);
        })
        .run();
    });
  }

  addTask(data?: Task["data"]) {
    const id = crypto.randomUUID();

    const task: Task = {
      id,
      status: "pending" as Task["status"],
      data,
    };

    this.taskQueue.push(task);

    this.emit("taskPending", {
      task,
    });

    return id;
  }

  updateTask(taskId: string, data: Partial<Task>) {
    let task = this.taskQueue.find((t) => t.id === taskId);

    const updatedTask = { ...task, ...data };

    this.taskQueue = this.taskQueue.map((t) => (t.id === taskId ? updatedTask : t));

    this.emit(`task${capitalizeFirstLetter(data.status)}`, {
      task: updatedTask,
    });

    if (data.status === "completed" && task.data?.parentTaskId) {
      const parentTask = this.getTask(task.data.parentTaskId);
      const childTasks = this.taskQueue.filter((t) => t.data?.parentTaskId === parentTask.id);
      if (childTasks.every((t) => t.status === "completed")) {
        this.updateTask(parentTask.id, {
          status: "completed",
        });

        const dir = path.join(__dirname, `/temp/${parentTask.id}/`);
        fs.rmSync(dir, { recursive: true, force: true });
      }
    }
  }

  getTask(taskId: string) {
    return this.taskQueue.find((t) => t.id === taskId);
  }
}

export const ffmpegInstance = new FFMpeg();
