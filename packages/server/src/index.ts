import { runMethodFromCli } from "./methods/methodRunner.js";
import { startServer } from "./server.js";

const args = process.argv.slice(2);
const CLI_COMMANDS = new Set(["burn", "presets", "help", "--help", "-h", "--version", "-v"]);

if (args.length === 0) {
  startServer();
} else if (CLI_COMMANDS.has(args[0])) {
  // `docker run … burn in.mp4 words.json` → the public CLI
  await import("./cli.js");
} else {
  // legacy: `node dist/index.js burnCaptions --video … --captions …`
  runMethodFromCli(args);
}
