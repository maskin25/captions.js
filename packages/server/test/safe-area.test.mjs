// Safe areas and customizePreset.
// Safe areas: with `safeArea` set, every preset keeps every word inside the
// platform's safe rectangle, breaks lines the same at every size, and `position`
// places captions inside the area. customizePreset: returns a new plain preset
// with the accent where each style keeps it, and never changes the original.
// Run after building core: node test/safe-area.test.mjs
import assert from "node:assert/strict";
import Konva from "konva";
import "konva/skia-backend";
import { FontLibrary } from "skia-canvas";
import {
  SAFE_AREAS,
  customizePreset,
  getEffect,
  getPreset,
  presetNames,
  registerEffect,
  renderFrame,
  resolveSafeArea,
} from "captions.js";
import { resolveFontFile } from "../dist/render/fonts.js";
import { LAYOUT_SAMPLE, layoutScreens } from "./frames.mjs";

const test = (name, fn) => {
  fn();
  console.log(`ok   ${name}`);
};

const registered = new Set();
const useFont = async ({ fontFamily, fontWeight, italic }) => {
  const file = await resolveFontFile({ fontFamily, fontWeight, italic }, { download: false });
  if (!registered.has(file)) {
    FontLibrary.use(fontFamily, [file]);
    registered.add(file);
  }
};

/** Rectangles of the words as drawn (not decorations), for every word's settled moment. */
const drawnWords = (settings, captions, [width, height]) => {
  const stage = new Konva.Stage({ width, height });
  const rects = [];
  for (const caption of captions) {
    const layer = new Konva.Layer();
    stage.add(layer);
    renderFrame(settings, undefined, captions, Math.max(caption.startTime + 0.01, caption.endTime - 0.01), [width, height], layer, height / 480);
    const group = layer.getChildren()[0];
    for (const text of (group?.find("Text") ?? []).filter((t) => !t.hasName("decoration") && t.opacity() > 0)) {
      rects.push({ word: text.text().trim(), ...text.getClientRect({ skipShadow: true, skipStroke: true }) });
    }
    layer.destroy();
  }
  stage.destroy();
  return rects;
};

test("platform insets match their published sources", () => {
  assert.deepEqual(SAFE_AREAS.shorts, { top: 288 / 1920, bottom: 672 / 1920, left: 48 / 1080, right: 192 / 1080 });
  assert.deepEqual(SAFE_AREAS.reels, { top: 0.14, bottom: 0.35, left: 0.06, right: 0.06 });
  assert.deepEqual(SAFE_AREAS.tiktok, { top: 240 / 1920, bottom: 660 / 1920, left: 120 / 1080, right: 120 / 1080 });
  assert.equal(resolveSafeArea(undefined), undefined);
  assert.equal(resolveSafeArea("Reels"), SAFE_AREAS.reels);
  assert.deepEqual(resolveSafeArea({ bottom: 0.2 }), { top: 0, bottom: 0.2, left: 0, right: 0 });
});

test("unknown names and impossible insets are refused", () => {
  assert.throws(() => resolveSafeArea("snapchat"), /unknown safeArea "snapchat".*tiktok, reels, shorts, none/);
  assert.throws(() => resolveSafeArea({ top: 0.6, bottom: 0.5 }), /top \+ bottom/);
  assert.throws(() => resolveSafeArea({ left: -0.1 }), /fractions/);
  assert.throws(() => resolveSafeArea({ right: 120 }), /fractions/);
});

// every preset, every platform: words stay inside the safe rectangle
const SIZE = [1080, 1920];
for (const name of presetNames) {
  const preset = getPreset(name);
  await useFont(preset.captionsSettings.style.font);
  const results = [];
  for (const platform of ["tiktok", "reels", "shorts"]) {
    const safe = SAFE_AREAS[platform];
    const settings = { ...preset.captionsSettings, safeArea: platform };
    const [width, height] = SIZE;
    const box = {
      left: safe.left * width,
      right: (1 - safe.right) * width,
      top: safe.top * height,
      bottom: (1 - safe.bottom) * height,
    };
    let closest = Infinity;
    for (const rect of drawnWords(settings, LAYOUT_SAMPLE, SIZE)) {
      const room = Math.min(rect.x - box.left, box.right - (rect.x + rect.width), rect.y - box.top, box.bottom - (rect.y + rect.height));
      assert.ok(room >= -1, `${name} on ${platform}: "${rect.word}" is ${(-room).toFixed(0)} px outside the safe area`);
      closest = Math.min(closest, room);
    }
    // same line breaks at every size inside the area
    const [reference, ...others] = [[360, 640], [540, 960], [1080, 1920]].map((size) =>
      layoutScreens({ Konva, renderFrame, getEffect, registerEffect, captionsSettings: settings, captions: LAYOUT_SAMPLE, size }),
    );
    others.forEach((screens) => assert.deepEqual(screens, reference, `${name} on ${platform}: line breaks differ by size`));
    results.push(`${platform} ${closest.toFixed(0)} px`);
  }
  console.log(`ok   ${name.padEnd(16)} inside every safe area, closest to its edge: ${results.join(", ")}`);
}

test("position places captions inside the area", () => {
  const base = getPreset("Classic").captionsSettings;
  const [width, height] = SIZE;
  const safe = SAFE_AREAS.shorts;
  const words = LAYOUT_SAMPLE.slice(0, 3);
  const span = (position) => {
    const rects = drawnWords({ ...base, safeArea: "shorts", position }, words, SIZE);
    return {
      top: Math.min(...rects.map((r) => r.y)),
      bottom: Math.max(...rects.map((r) => r.y + r.height)),
      centerX: (Math.min(...rects.map((r) => r.x)) + Math.max(...rects.map((r) => r.x + r.width))) / 2,
    };
  };
  const top = span("top");
  const bottom = span("bottom");
  const middle = span("middle");
  const areaTop = safe.top * height;
  const areaBottom = (1 - safe.bottom) * height;
  // the same small gap from the area's edge as from the frame's edge without one
  assert.ok(top.top > areaTop && top.top < areaTop + 0.05 * height, `top: starts at ${top.top}`);
  assert.ok(bottom.bottom < areaBottom && bottom.bottom > areaBottom - 0.05 * height, `bottom: ends at ${bottom.bottom}`);
  assert.ok(Math.abs((middle.top + middle.bottom) / 2 - (areaTop + areaBottom) / 2) < 0.02 * height, "middle: centred in the area");
  // centred between the side insets, so left of the frame's centre on Shorts
  const areaCenter = (safe.left + (1 - safe.left - safe.right) / 2) * width;
  for (const s of [top, bottom, middle]) assert.ok(Math.abs(s.centerX - areaCenter) < 2, `centred at ${s.centerX}, area centre ${areaCenter}`);
});

test("unset keeps the old placement; none drops the portrait offset", () => {
  const base = getPreset("Classic").captionsSettings;
  const words = LAYOUT_SAMPLE.slice(0, 3);
  const bottomOf = (settings) => Math.max(...drawnWords(settings, words, SIZE).map((r) => r.y + r.height));
  const old = bottomOf(base);
  const none = bottomOf({ ...base, safeArea: "none" });
  // the old renderer leaves 70 units (of 480) above the bottom on portrait video
  assert.ok(Math.abs(none - old - (70 * 1920) / 480) < 2, `none ${none} vs unset ${old}`);
});

test("customizePreset: accent, font, text color, name; the original stays", () => {
  const before = JSON.stringify(getPreset("Karaoke"));
  const brand = customizePreset("Karaoke", { accent: "#FF5A1F", font: "Inter", textColor: "#FAFAFA", name: "Brand" });
  assert.equal(JSON.stringify(getPreset("Karaoke")), before);
  const { style } = brand.captionsSettings;
  assert.equal(style.highlightColor, "#FF5A1F");
  assert.equal(style.aplifiedWordColor, undefined);
  assert.equal(style.font.fontFamily, "Inter");
  assert.equal(style.font.fontWeight, getPreset("Karaoke").captionsSettings.style.font.fontWeight);
  assert.equal(style.font.fontColor, "#FAFAFA");
  assert.equal(style.name, "Brand");
  assert.equal(brand.captionsSettings.animation, "bounce");
  // plain data: survives JSON and can be customized again
  assert.deepEqual(JSON.parse(JSON.stringify(brand)), brand);
  const again = customizePreset(brand, { font: { fontWeight: "black", fontSize: 30 } });
  assert.equal(again.captionsSettings.style.font.fontFamily, "Inter");
  assert.equal(again.captionsSettings.style.font.fontWeight, "black");
  assert.equal(again.captionsSettings.style.font.fontSize, 30);
  assert.equal(brand.captionsSettings.style.font.fontSize, getPreset("Karaoke").captionsSettings.style.font.fontSize);
  assert.throws(() => customizePreset("Nope", { accent: "#fff" }), /Unknown captions preset "Nope"/);
});

test("customizePreset puts the accent where each style keeps it", () => {
  const focus = customizePreset("Focus Box", { accent: "#1E40FF" }).captionsSettings.style;
  assert.equal(focus.backgroundColor, "#1E40FF");
  assert.equal(focus.highlightColor, "#FFFFFF", "word on a dark box turns white");
  const light = customizePreset("Focus Box", { accent: "#FFE03A" }).captionsSettings.style;
  assert.equal(light.highlightColor, "#111111", "word on a light box turns dark");

  const sweep = customizePreset("Highlight Sweep", { accent: "#00C2A8" }).captionsSettings;
  assert.equal(sweep.style.backgroundColor, "#00C2A8");
  assert.equal(sweep.animationOptions?.sweepColor, undefined);

  const wave = customizePreset("Gradient Wave", { accent: "#FF0000" }).captionsSettings;
  assert.deepEqual(wave.animationOptions.gradientColors, ["#FF0000", "#FFAA00", "#FF00AA"]);

  // every preset takes an accent and still renders
  for (const name of presetNames) {
    const { captionsSettings } = customizePreset(name, { accent: "#12AB34" });
    const stage = new Konva.Stage({ width: 540, height: 960 });
    const layer = new Konva.Layer();
    stage.add(layer);
    renderFrame(captionsSettings, undefined, LAYOUT_SAMPLE, 0.5, [540, 960], layer, 2);
    assert.ok(layer.getChildren().length > 0, `${name} draws`);
    stage.destroy();
  }
});

test("customized accent reaches the spoken word", () => {
  const { captionsSettings } = customizePreset("Classic", { accent: "#12AB34" });
  const stage = new Konva.Stage({ width: 540, height: 960 });
  const layer = new Konva.Layer();
  stage.add(layer);
  const word = LAYOUT_SAMPLE[1];
  renderFrame(captionsSettings, undefined, LAYOUT_SAMPLE, (word.startTime + word.endTime) / 2, [540, 960], layer, 2);
  const fills = layer.find("Text").filter((t) => !t.hasName("decoration")).map((t) => String(t.fill()).toUpperCase());
  assert.ok(fills.includes("#12AB34"), `fills: ${[...new Set(fills)].join(", ")}`);
  stage.destroy();
});
