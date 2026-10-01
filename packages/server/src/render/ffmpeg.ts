import { execFile, spawn } from "node:child_process";

export const ffmpegBin = () => process.env.FFMPEG_PATH || "ffmpeg";
export const ffprobeBin = () => process.env.FFPROBE_PATH || "ffprobe";

export interface VideoInfo {
  width: number;
  height: number;
  duration: number;
  fps: number;
}

const parseRate = (rate?: string) => {
  if (!rate) return undefined;
  const [num, den = "1"] = rate.split("/");
  const value = Number(num) / Number(den);
  return Number.isFinite(value) && value > 0 ? value : undefined;
};

/** Size (rotation-aware), duration and frame rate of the first video stream. */
export const probeVideo = (videoPath: string): Promise<VideoInfo> =>
  new Promise((resolve, reject) => {
    execFile(
      ffprobeBin(),
      ["-v", "error", "-print_format", "json", "-show_format", "-show_streams", videoPath],
      { maxBuffer: 16 * 1024 * 1024 },
      (err, stdout, stderr) => {
        if (err) {
          return reject(
            new Error(`ffprobe failed for ${videoPath}: ${(stderr || err.message).trim()}`),
          );
        }
        const meta = JSON.parse(stdout) as {
          format?: { duration?: string };
          streams?: Array<Record<string, any>>;
        };
        const stream = meta.streams?.find((s) => s.codec_type === "video");
        if (!stream?.width || !stream?.height) {
          return reject(new Error(`No video stream in ${videoPath}`));
        }
        const rotation = Math.abs(
          Number(
            stream.side_data_list?.find((d: any) => d.rotation != null)?.rotation ??
              stream.tags?.rotate ??
              0,
          ),
        );
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
          duration: Number(meta.format?.duration ?? stream.duration ?? 0),
          fps: Math.round(fps * 1000) / 1000,
        });
      },
    );
  });

export class FfmpegError extends Error {
  constructor(
    message: string,
    readonly stderr: string,
  ) {
    super(message);
    this.name = "FfmpegError";
  }
}

/**
 * Spawns ffmpeg with `args`, exposing stdin for streaming frames in.
 * `done` resolves on exit code 0 and rejects with the stderr tail otherwise.
 */
export const runFfmpeg = (args: string[]) => {
  const child = spawn(ffmpegBin(), ["-hide_banner", "-loglevel", "error", "-y", ...args], {
    stdio: ["pipe", "ignore", "pipe"],
  });
  let stderr = "";
  child.stderr.setEncoding("utf8");
  child.stderr.on("data", (chunk: string) => {
    stderr = (stderr + chunk).slice(-16_000);
  });
  // ffmpeg closing stdin early (it failed) must not crash the process.
  child.stdin.on("error", () => {});

  const done = new Promise<void>((resolve, reject) => {
    child.on("error", (err) => reject(new FfmpegError(`Failed to start ffmpeg: ${err.message}`, "")));
    child.on("close", (code, signal) => {
      if (code === 0) resolve();
      else
        reject(
          new FfmpegError(
            `ffmpeg exited with ${signal ?? `code ${code}`}${stderr ? `: ${stderr.trim().split("\n").pop()}` : ""}`,
            stderr,
          ),
        );
    });
  });

  /** Writes one chunk to ffmpeg's stdin, waiting for drain. Returns false if ffmpeg is gone. */
  const write = async (chunk: Buffer): Promise<boolean> => {
    if (child.stdin.destroyed || !child.stdin.writable) return false;
    if (!child.stdin.write(chunk)) {
      // wait for drain, or for the pipe to close because ffmpeg exited
      await new Promise<void>((resolve) => {
        const finish = () => {
          child.stdin.off("drain", finish);
          child.stdin.off("close", finish);
          resolve();
        };
        child.stdin.on("drain", finish);
        child.stdin.on("close", finish);
      });
    }
    return child.stdin.writable;
  };

  const end = () => child.stdin.end();

  return { done, write, end };
};
