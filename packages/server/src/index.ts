import { runMethodFromCli } from "./methods/methodRunner.js";
import { startServer } from "./server.js";

const args = process.argv.slice(2);

if (args.length === 0) {
  startServer();
} else {
  runMethodFromCli(args);
}
