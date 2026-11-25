// Server side: the package imports in Node (ESM and CJS) and renders to an
// empty string without touching the DOM.
//   node test/ssr.test.mjs
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import Default, { Captions, useCaptions, resolvePreset } from "../dist/index.js";

const require = createRequire(import.meta.url);
const cjs = require("../dist/index.cjs");
assert.equal(typeof cjs.Captions, "function", "CJS build exports Captions");
assert.equal(typeof cjs.useCaptions, "function", "CJS build exports useCaptions");
assert.equal(Default, Captions, "default export is Captions");
assert.equal(typeof useCaptions, "function");
console.log("ok   imports in Node (ESM and CJS)");

const words = [{ word: "hello", startTime: 0, endTime: 0.5 }];
const html = renderToString(createElement(Captions, { video: { current: null }, captions: words, preset: "Karaoke" }));
assert.equal(html, "", "Captions renders no markup");
console.log("ok   renderToString draws nothing and needs no DOM");

assert.equal(resolvePreset("karaoke").captionsSettings.style.name, "Karaoke", "names are case-insensitive");
const custom = { ...resolvePreset("Karaoke") };
assert.equal(resolvePreset(custom), custom, "objects pass through");
assert.throws(() => resolvePreset("No Such Style"), /Available:/, "unknown names list the presets");
console.log("ok   resolvePreset");
