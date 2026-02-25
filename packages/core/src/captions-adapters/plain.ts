import { Caption } from "../entities/captions/captions.types";

export type PlainCaptions = Caption[];

export const toCaptions = (input: PlainCaptions): Caption[] => {
  return input;
};
