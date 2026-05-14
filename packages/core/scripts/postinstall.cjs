#!/usr/bin/env node

const isCi =
  process.env.CI === "true" ||
  process.env.CI === "1" ||
  process.env.GITHUB_ACTIONS === "true" ||
  process.env.BUILDkite === "true";

if (isCi || process.env.CAPTIONS_JS_SKIP_POSTINSTALL === "1") {
  process.exit(0);
}

const bold = process.stdout.isTTY ? "\x1b[1m" : "";
const reset = process.stdout.isTTY ? "\x1b[0m" : "";

console.log(
  `\n${bold}captions.js installed.${reset} If it saves you time, a GitHub star helps maintain the project:\nhttps://github.com/maskin25/captions.js\n`,
);
