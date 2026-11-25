/** `#rgb`, `#rgba`, `#rrggbb` or `#rrggbbaa` to channels 0–255 (alpha 0–1). */
export const parseHex = (color: string | undefined) => {
  const hex = (color ?? "").trim().replace(/^#/, "");
  if (!/^[0-9a-f]{3,8}$/i.test(hex) || hex.length === 5 || hex.length === 7) return null;
  const full = hex.length <= 4 ? [...hex].map((c) => c + c).join("") : hex;
  const channel = (i: number) => parseInt(full.slice(i, i + 2), 16);
  return {
    r: channel(0),
    g: channel(2),
    b: channel(4),
    a: full.length === 8 ? channel(6) / 255 : 1,
  };
};

/**
 * `color` moved `amount` (0–1) of the way towards `target`, as `rgba()`.
 * Colors that are not hex come back unchanged.
 */
export const mix = (color: string, target: string, amount: number) => {
  const from = parseHex(color);
  const to = parseHex(target);
  if (!from || !to) return color;
  const t = Math.min(1, Math.max(0, amount));
  const lerp = (a: number, b: number) => a + (b - a) * t;
  return `rgba(${Math.round(lerp(from.r, to.r))}, ${Math.round(lerp(from.g, to.g))}, ${Math.round(
    lerp(from.b, to.b),
  )}, ${+lerp(from.a, to.a).toFixed(3)})`;
};

/** A string option that looks like a color, or `fallback`. */
export const colorOption = (options: Record<string, unknown>, key: string, fallback: string) => {
  const value = options[key];
  return typeof value === "string" && value.trim() !== "" ? value : fallback;
};
