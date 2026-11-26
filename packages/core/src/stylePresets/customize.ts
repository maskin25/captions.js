import type { CaptionsSettings } from "../entities/captions/captions.types";
import { getEffect } from "../canvas-captions/effects";
import { getPreset, type StylePreset, type StylePresetName } from "./stylePresets.config";

type Font = CaptionsSettings["style"]["font"];

/**
 * What {@link customizePreset} changes. Every field is optional; what is left
 * out keeps the preset's value.
 *
 * @public
 */
export interface PresetCustomization {
  /**
   * The style's accent color. Most styles use it for the spoken word; styles
   * whose accent is a shape put it there instead (the box in Focus Box, the
   * plate in Highlight Sweep, the gradient in Gradient Wave).
   */
  accent?: string;
  /**
   * A font family name, or font fields to replace. The font must be available
   * where you render: loaded in the page, or resolvable by the server.
   */
  font?: string | Partial<Pick<Font, "fontFamily" | "fontWeight" | "italic" | "fontSize" | "fontCapitalize">>;
  /** Color of words that are not highlighted. */
  textColor?: string;
  /** Name for the new preset; defaults to the original name. */
  name?: string;
}

/**
 * A copy of a preset with a different accent color, font or text color.
 * The original is never changed, and the result is a plain object you can
 * store, send or customize again.
 *
 * @example
 * ```ts
 * const brand = customizePreset("Karaoke", { accent: "#FF5A1F", font: "Inter" });
 * renderFrame({ settings: brand.captionsSettings, captions, time, size, layer });
 * ```
 *
 * @throws Error for an unknown preset name.
 * @public
 */
export function customizePreset(
  preset: StylePreset | StylePresetName | (string & {}),
  changes: PresetCustomization,
): StylePreset {
  const source = typeof preset === "string" ? getPreset(preset) : preset;
  const copy: StylePreset = JSON.parse(JSON.stringify(source));
  let settings = copy.captionsSettings;
  const { accent, font, textColor, name } = changes;

  if (font !== undefined) {
    const fields = typeof font === "string" ? { fontFamily: font } : font;
    settings.style.font = { ...settings.style.font, ...definedOnly(fields) };
  }
  if (textColor !== undefined) settings.style.font.fontColor = textColor;
  if (name !== undefined) settings.style.name = name;
  if (accent !== undefined) {
    // the deprecated field would otherwise show through on old readers
    delete settings.style.aplifiedWordColor;
    const effect = getEffect(settings.animation);
    settings = effect.accent
      ? effect.accent(settings, accent)
      : { ...settings, style: { ...settings.style, highlightColor: accent } };
  }

  return { ...copy, captionsSettings: settings };
}

const definedOnly = <T extends object>(fields: T): Partial<T> =>
  Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== undefined)) as Partial<T>;
