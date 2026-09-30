#!/usr/bin/env node
// `npx captions.js <command>` — thin launcher. Rendering to video lives in
// @captionsjs/server (FFmpeg + skia-canvas), which is kept out of this
// package so browser users don't install native modules. If it's already
// installed we run it; otherwise we fetch it on demand via npx.
"use strict";

const { spawnSync } = require("node:child_process");
const path = require("node:path");

const SERVER_PKG = "@captionsjs/server";
const SERVER_RANGE = "^0.1.0";
const args = process.argv.slice(2);

const findLocalServer = () => {
  for (const base of [process.cwd(), __dirname]) {
    try {
      const pkgJson = require.resolve(`${SERVER_PKG}/package.json`, { paths: [base] });
      const bin = require(pkgJson).bin;
      const rel = typeof bin === "string" ? bin : bin && bin.captionsjs;
      if (rel) return path.join(path.dirname(pkgJson), rel);
    } catch {
      // not installed from here
    }
  }
  return null;
};

const local = findLocalServer();
const result = local
  ? spawnSync(process.execPath, [local, ...args], { stdio: "inherit" })
  : spawnSync(
      process.platform === "win32" ? "npx.cmd" : "npx",
      ["--yes", "--package", `${SERVER_PKG}@${SERVER_RANGE}`, "--", "captionsjs", ...args],
      { stdio: "inherit", shell: process.platform === "win32" },
    );

if (result.error) {
  console.error(`captions.js: failed to start ${SERVER_PKG}: ${result.error.message}`);
  process.exit(1);
}
process.exit(result.status === null ? 1 : result.status);
