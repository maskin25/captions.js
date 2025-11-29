import { methods } from "./index.js";
import { logger } from "../utils/logger.js";
import { parseMethodArguments } from "../utils/cliParser.js";

export const runMethodFromCli = async (args: string[]) => {
  const [methodName, ...methodArgs] = args;

  if (!methodName) {
    logger.error(
      { availableMethods: Object.keys(methods) },
      "No method name provided. Usage: node dist/index.js <method> [--flag value ...]"
    );
    process.exit(1);
  }

  const method = methods[methodName];

  if (!method) {
    logger.error(
      { methodName, availableMethods: Object.keys(methods) },
      "Unknown method requested"
    );
    process.exit(1);
  }

  const invocation = await parseMethodArguments(methodArgs);

  try {
    const result = await method(invocation);

    if (typeof result !== "undefined") {
      if (typeof result === "object") {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(String(result));
      }
    }
  } catch (error) {
    logger.error({ err: error, methodName }, "Method execution failed");
    process.exit(1);
  }
};
