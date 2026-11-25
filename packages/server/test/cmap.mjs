// Minimal TrueType/OpenType cmap reader: which characters a font file has
// glyphs for. Tests only (formats 4 and 12, the Unicode subtables).
import fs from "node:fs";

export const fontCovers = (file, text) => {
  const buf = fs.readFileSync(file);
  const numTables = buf.readUInt16BE(4);
  let cmap = -1;
  for (let i = 0; i < numTables; i++) {
    const rec = 12 + i * 16;
    if (buf.toString("latin1", rec, rec + 4) === "cmap") cmap = buf.readUInt32BE(rec + 8);
  }
  if (cmap < 0) throw new Error(`${file}: no cmap table`);
  const subtables = [];
  for (let i = 0; i < buf.readUInt16BE(cmap + 2); i++) {
    const rec = cmap + 4 + i * 8;
    const platform = buf.readUInt16BE(rec);
    const encoding = buf.readUInt16BE(rec + 2);
    if (platform === 0 || (platform === 3 && (encoding === 1 || encoding === 10))) {
      subtables.push(cmap + buf.readUInt32BE(rec + 4));
    }
  }
  const has = (code) =>
    subtables.some((at) => {
      const format = buf.readUInt16BE(at);
      if (format === 4) {
        const segX2 = buf.readUInt16BE(at + 6);
        const ends = at + 14;
        const starts = ends + segX2 + 2;
        const deltas = starts + segX2;
        const offsets = deltas + segX2;
        for (let s = 0; s < segX2; s += 2) {
          if (code > buf.readUInt16BE(ends + s)) continue;
          if (code < buf.readUInt16BE(starts + s)) return false;
          const offset = buf.readUInt16BE(offsets + s);
          if (offset === 0) return ((code + buf.readInt16BE(deltas + s)) & 0xffff) !== 0;
          const glyphAt = offsets + s + offset + (code - buf.readUInt16BE(starts + s)) * 2;
          return buf.readUInt16BE(glyphAt) !== 0;
        }
        return false;
      }
      if (format === 12) {
        const groups = buf.readUInt32BE(at + 12);
        for (let g = 0; g < groups; g++) {
          const rec = at + 16 + g * 12;
          if (code >= buf.readUInt32BE(rec) && code <= buf.readUInt32BE(rec + 4)) return true;
        }
      }
      return false;
    });
  return [...text].every((char) => char === " " || has(char.codePointAt(0)));
};
