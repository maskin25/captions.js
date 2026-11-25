// Frame comparison shared by the golden test and the browser parity check.
import { Canvas, loadImage } from "skia-canvas";

// Skia rasterizes blur (shadows, glows) slightly differently per CPU, so the
// same commit gives frames that differ by up to ~40 per channel at glyph edges
// on another machine. Frames are therefore compared as averages over square
// blocks (8 px at 540 wide, scaled with the frame): a frame fails when any
// block's average differs by more than BLOCK_TOLERANCE in any channel.
// Measured on GitHub runners vs a local i5-14600K: cross-machine noise peaks
// at 19, while a real change (a highlight moving one word) starts at ~90.
// Changes smaller than this, such as a slight color shift, are not caught.
export const BLOCK_SIZE_AT_540 = 8;
export const BLOCK_TOLERANCE = 32;
// For the diff image only: a pixel is drawn red when a channel differs more.
const CHANNEL_TOLERANCE = 2;

const pixels = async (png) => {
  const img = await loadImage(png);
  const canvas = new Canvas(img.width, img.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, img.width, img.height).data;
  // Compare premultiplied colors (color × alpha), which is what shows over the
  // video. Raw RGBA would count a nearly transparent glow pixel as a full
  // 255 difference when one engine gives it alpha 1 and the other alpha 0.
  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3] / 255;
    data[i] = Math.round(data[i] * alpha);
    data[i + 1] = Math.round(data[i + 1] * alpha);
    data[i + 2] = Math.round(data[i + 2] * alpha);
  }
  return { width: img.width, height: img.height, data };
};

/**
 * Compares two PNG buffers. `failed` is the block-average verdict; `worst`
 * (largest block delta), `badBlocks` and `changedRatio` (share of pixels off
 * by more than CHANNEL_TOLERANCE) are for reports. `diffPng` is set on failure,
 * or always with `{ diff: true }`.
 */
export const compare = async (expectedPng, actualPng, { diff: wantDiff = false } = {}) => {
  const a = await pixels(expectedPng);
  const b = await pixels(actualPng);
  if (a.width !== b.width || a.height !== b.height) {
    return { failed: true, worst: 255, badBlocks: Infinity, changedRatio: 1, diffPng: null, reason: `size ${a.width}x${a.height} vs ${b.width}x${b.height}` };
  }
  const { width, height } = a;

  // pass/fail: block averages
  const bs = Math.max(1, Math.round((BLOCK_SIZE_AT_540 * width) / 540));
  let worst = 0;
  let badBlocks = 0;
  for (let by = 0; by < height; by += bs) {
    for (let bx = 0; bx < width; bx += bs) {
      const sum = [0, 0, 0, 0];
      let n = 0;
      for (let y = by; y < Math.min(height, by + bs); y++) {
        for (let x = bx; x < Math.min(width, bx + bs); x++) {
          const i = (y * width + x) * 4;
          for (let c = 0; c < 4; c++) sum[c] += a.data[i + c] - b.data[i + c];
          n++;
        }
      }
      const delta = Math.max(...sum.map((v) => Math.abs(v) / n));
      if (delta > worst) worst = delta;
      if (delta > BLOCK_TOLERANCE) badBlocks++;
    }
  }

  // diff image for review: changed pixels in red over a faint expected frame
  const diff = new Canvas(width, height);
  const dctx = diff.getContext("2d");
  const out = dctx.createImageData(width, height);
  let changed = 0;
  for (let i = 0; i < a.data.length; i += 4) {
    const delta = Math.max(
      Math.abs(a.data[i] - b.data[i]),
      Math.abs(a.data[i + 1] - b.data[i + 1]),
      Math.abs(a.data[i + 2] - b.data[i + 2]),
      Math.abs(a.data[i + 3] - b.data[i + 3]),
    );
    if (delta > CHANNEL_TOLERANCE) {
      changed++;
      out.data.set([255, 0, 0, 255], i);
    } else {
      // faint copy of the expected frame for orientation
      out.data.set([a.data[i] / 4, a.data[i + 1] / 4, a.data[i + 2] / 4, a.data[i + 3] / 4], i);
    }
  }
  dctx.putImageData(out, 0, 0);
  const failed = badBlocks > 0;
  return {
    failed,
    worst,
    badBlocks,
    blockSize: bs,
    changedRatio: changed / (width * height),
    diffPng: failed || wantDiff ? await diff.toBuffer("png") : null,
    reason: `${badBlocks} block(s) of ${bs}px differ (worst average delta ${worst.toFixed(1)}, limit ${BLOCK_TOLERANCE})`,
  };
};

