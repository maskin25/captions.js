import { burnCaptions, BurnCaptionsParams } from "../render/burnCaptions.js";

export type MethodInvocation = {
  positional: string[];
  named: Record<string, string>;
};

export type MethodHandler = (
  context: MethodInvocation
) => Promise<unknown> | unknown;

export type MethodRegistry = Record<string, MethodHandler>;

/**
 * Extend or replace this registry with the Node.js functions you need to expose.
 */
export const methods: MethodRegistry = {
  "health-check": async () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
  }),
  echo: async ({ positional }) => positional.join(" "),
  sum: async ({ positional }) =>
    positional.reduce((total, value) => total + Number.parseFloat(value), 0),

  burnCaptions: async ({ named, positional }) => {
    await burnCaptions(named as unknown as BurnCaptionsParams);
  },
};
