import path from "node:path";
import type { MethodInvocation } from "../methods/index.js";

const isFlagToken = (token: string) =>
  token.startsWith("--") && token.length > 2;
const isFileReference = (value: string) =>
  value.startsWith("@") && value.length > 1;

const resolveFileReference = (value: string, baseDir?: string) => {
  const rawPath = value.slice(1);

  if (baseDir && !path.isAbsolute(rawPath)) {
    return path.resolve(baseDir, rawPath.replace(/^\/+/, ""));
  }

  if (baseDir) {
    return path.resolve(baseDir, rawPath.replace(/^\/+/, ""));
  }

  return path.isAbsolute(rawPath)
    ? rawPath
    : path.resolve(process.cwd(), rawPath);
};

export const parseMethodArguments = async (
  args: string[]
): Promise<MethodInvocation> => {
  const invocation: MethodInvocation = {
    positional: [],
    named: {},
  };

  let rootDir: string | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const token = args[index];

    if (!token) {
      continue;
    }

    if (isFlagToken(token)) {
      let flag = token.slice(2);
      let value: string | undefined;
      const equalsIndex = flag.indexOf("=");

      if (equalsIndex !== -1) {
        value = flag.slice(equalsIndex + 1);
        flag = flag.slice(0, equalsIndex);
      } else {
        const maybeValue = args[index + 1];

        if (typeof maybeValue !== "undefined" && !isFlagToken(maybeValue)) {
          value = maybeValue;
          index += 1;
        }
      }

      if (!flag) {
        continue;
      }

      if (flag === "rootDir") {
        rootDir = value;
        continue;
      }

      const finalValue = value ?? "true";
      invocation.named[flag] = finalValue;

      if (isFileReference(finalValue)) {
        const absolutePath = resolveFileReference(finalValue, rootDir);
        invocation.named[flag] = absolutePath;
      }

      continue;
    }

    const equalsIndex = token.indexOf("=");

    if (equalsIndex !== -1) {
      const key = token.slice(0, equalsIndex);
      const value = token.slice(equalsIndex + 1);

      if (key) {
        if (key === "rootDir") {
          rootDir = value;
          continue;
        }

        invocation.named[key] = value;

        if (isFileReference(value)) {
          const absolutePath = resolveFileReference(value, rootDir);
          invocation.named[key] = absolutePath;
        }

        continue;
      }
    }

    invocation.positional.push(token);
  }

  return invocation;
};
