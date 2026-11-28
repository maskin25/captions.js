import { methods } from "./methods/index.js";
import { runMethodFromCli } from "./methods/methodRunner.js";

// The Docker entrypoint. Everything goes to the CLI (`burn`, `presets`,
// `serve`, …; no arguments prints help), except the old method form
// `node dist/index.js burnCaptions --video … --captions …`.
const [first] = process.argv.slice(2);
if (first && Object.hasOwn(methods, first)) {
  runMethodFromCli(process.argv.slice(2));
} else {
  await import("./cli.js");
}
