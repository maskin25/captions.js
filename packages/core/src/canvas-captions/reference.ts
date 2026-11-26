/**
 * Frame height, in px, at which a preset is drawn exactly as written: its
 * `fontSize`, stroke, shadow, line spacing, word gaps and effect sizes are px
 * on a frame this tall. On any other frame they are all multiplied by
 * `height / REFERENCE_HEIGHT` (see {@link frameScale}), so a preset looks the
 * same at every size, in the browser preview and in the export.
 *
 * Changing it rescales every preset (text included), so the built-in values
 * would need retuning with it.
 *
 * @public
 */
export const REFERENCE_HEIGHT = 480;

/**
 * Scale for a frame `height` px tall: what the browser overlay and the server
 * pass to `renderFrame` as `scale`. 1 for a frame without height.
 *
 * @public
 */
export const frameScale = (height: number) =>
  height > 0 ? height / REFERENCE_HEIGHT : 1;
