/**
 * Main captions engine.
 *
 * Handles subtitle rendering, timing, and animations.
 *
 * @example
 * ```ts
 * import captionsjs from "captions.js"
 * const captions = captionsjs({ container: "#canvas" })
 * captions.addSubtitle({ text: "Hello!", start: 0, end: 2 })
 * captions.play()
 * ```
 */
export class Captions {
  /**
   * Add a subtitle to timeline.
   * @param subtitle Subtitle block to render.
   */
  addSubtitle(subtitle: { text: string; start: number; end: number }) {}

  /** Start playback. */
  play() {}
}
