import os from "node:os";
import path from "node:path";
import fs from "node:fs";

export const download = async (url: string): Promise<string> => {
  const tmpDir = os.tmpdir();

  const remoteUrl = new URL(url);
  const remoteName = path.basename(remoteUrl.pathname);
  const tempPath = path.join(tmpDir, `${Date.now()}-${remoteName}`);

  console.log(
    `Downloading file from URL: ${url} to temp directory: ${tempPath}`
  );

  const clientModule =
    url.startsWith("https") || url.startsWith("HTTPS")
      ? await import("https")
      : await import("http");

  await new Promise<void>((resolve, reject) => {
    const fileStream = fs.createWriteStream(tempPath);
    const request = clientModule.get(url, (response) => {
      if (!response.statusCode || response.statusCode >= 400) {
        fileStream.destroy();
        request.destroy();
        return reject(
          new Error(
            `Failed to download video. Status code: ${response.statusCode}`
          )
        );
      }

      response.pipe(fileStream);
      response.on("error", reject);
      fileStream.on("finish", () => {
        fileStream.close((err) => (err ? reject(err) : resolve()));
      });
      fileStream.on("error", reject);
    });

    request.on("error", (error) => {
      fileStream.destroy();
      reject(error);
    });
  });

  return tempPath;
};
