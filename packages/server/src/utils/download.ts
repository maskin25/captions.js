import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

/**
 * Downloads an http(s) URL to a file in `dir` (the system temp folder by
 * default) and returns its path. Follows redirects; fails on a 4xx/5xx answer.
 */
export const download = async (url: string, dir: string = os.tmpdir()): Promise<string> => {
  const remote = new URL(url);
  if (remote.protocol !== "http:" && remote.protocol !== "https:") {
    throw new Error(`only http(s) URLs can be downloaded, got ${remote.protocol}`);
  }
  const name = path.basename(remote.pathname) || "download";
  const target = path.join(dir, `${Date.now()}-${name.replace(/[^\w.-]/g, "_")}`);

  const response = await fetch(remote, { redirect: "follow" });
  if (!response.ok || !response.body) {
    throw new Error(`download failed: ${url} answered ${response.status} ${response.statusText}`.trim());
  }
  try {
    await pipeline(Readable.fromWeb(response.body as never), fs.createWriteStream(target));
  } catch (error) {
    fs.rmSync(target, { force: true });
    throw error;
  }
  return target;
};
