import { Caption } from "../captions/captions.types";

export type PlainCaptions = Caption[];

export const toCaptions = (input: PlainCaptions): Caption[] => {
  return input;
};
