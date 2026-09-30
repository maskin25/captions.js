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
  burnCaptions: async ({ named, positional }) => {
    return burnCaptions(named as unknown as BurnCaptionsParams);
  },
};
