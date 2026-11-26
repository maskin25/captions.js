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

/** Black or white, whichever reads better on `color`. */
export const textOn = (color: string) => {
  const c = parseHex(color);
  if (!c) return "#000000";
  const luminance = (0.299 * c.r + 0.587 * c.g + 0.114 * c.b) / 255;
  return luminance > 0.6 ? "#111111" : "#FFFFFF";
};

/** `color` with its hue turned by `degrees`, as `#rrggbb`; non-hex unchanged. */
export const rotateHue = (color: string, degrees: number) => {
  const c = parseHex(color);
  if (!c) return color;
  const [r, g, b] = [c.r / 255, c.g / 255, c.b / 255];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
  }
  h = (((h * 60 + degrees) % 360) + 360) % 360;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  const hex = (v: number) => Math.round(v * 255).toString(16).padStart(2, "0");
  return `#${hex(f(0))}${hex(f(8))}${hex(f(4))}`.toUpperCase();
};
