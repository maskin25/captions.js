import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import {
  Captions as CaptionsController,
  getPreset,
  type Caption,
  type StylePreset,
  type StylePresetName,
} from "captions.js";

/**
 * A built-in preset by name (`"Karaoke"`, case and spaces ignored) or a
 * preset object, for example one from `stylePresets` that you changed.
 *
 * @public
 */
export type PresetInput = StylePresetName | (string & {}) | StylePreset;

/**
 * The video to draw over: a ref, or the element itself (from a callback ref
 * kept in state).
 *
 * @public
 */
export type VideoInput = RefObject<HTMLVideoElement | null> | HTMLVideoElement | null | undefined;

/** @public */
export interface UseCaptionsOptions {
  /** Style preset, by name or as an object. */
  preset: PresetInput;
  /** Timed words; `toCaptions()` from captions.js converts transcripts. */
  captions?: Caption[] | null;
  /** When false the overlay is removed. Default true. */
  enabled?: boolean;
  /** Draw debug boxes around lines. */
  debug?: boolean;
}

/** @public */
export interface CaptionsProps extends UseCaptionsOptions {
  /** The video to draw over. Its parent element gets the overlay. */
  video: VideoInput;
}

const videoElement = (video: VideoInput): HTMLVideoElement | null => {
  if (!video) return null;
  if (typeof HTMLVideoElement !== "undefined" && video instanceof HTMLVideoElement) return video;
  return (video as RefObject<HTMLVideoElement | null>).current ?? null;
};

/**
 * Resolves a preset name or object to a preset. Throws for an unknown name,
 * listing the available ones.
 *
 * @public
 */
export const resolvePreset = (preset: PresetInput): StylePreset =>
  typeof preset === "string" ? getPreset(preset) : preset;

/**
 * Draws captions over a `<video>` while it plays. Creates the captions.js
 * overlay after mount, updates it when `preset` or `captions` change, and
 * removes it on unmount. Safe under StrictMode and on the server, where it
 * does nothing.
 *
 * Returns the underlying controller (or `null` before mount) and the
 * resolved preset.
 *
 * @public
 */
export function useCaptions(video: VideoInput, options: UseCaptionsOptions) {
  const { preset, captions = null, enabled = true, debug = false } = options;
  const resolved = useMemo(() => resolvePreset(preset), [preset]);
  const [controller, setController] = useState<CaptionsController | null>(null);

  // The latest values, read when the controller is created so that a change
  // of preset or captions alone never re-creates it.
  const latest = useRef({ preset: resolved, captions });
  latest.current = { preset: resolved, captions };

  // A ref's element is read after every commit: refs are not reactive.
  const [element, setElement] = useState<HTMLVideoElement | null>(null);
  useEffect(() => {
    const next = videoElement(video);
    if (next !== element) setElement(next);
  });

  useEffect(() => {
    if (!element || !enabled) return;
    const instance = new CaptionsController({
      video: element,
      preset: latest.current.preset,
      captions: latest.current.captions,
      debug,
    });
    setController(instance);
    return () => {
      instance.destroy();
      setController((current) => (current === instance ? null : current));
    };
  }, [element, enabled, debug]);

  // Skip the first run after creation: the controller already has the values.
  const applied = useRef<{ instance: CaptionsController | null; preset: StylePreset | null; captions: Caption[] | null }>(
    { instance: null, preset: null, captions: null },
  );
  useEffect(() => {
    if (!controller) return;
    const last = applied.current;
    if (last.instance !== controller) {
      applied.current = { instance: controller, preset: resolved, captions };
      return;
    }
    if (last.preset !== resolved) controller.preset(resolved);
    if (last.captions !== captions) controller.captions(captions);
    applied.current = { instance: controller, preset: resolved, captions };
  }, [controller, resolved, captions]);

  return { controller, preset: resolved };
}

/**
 * Animated captions over a video. Renders nothing itself: the overlay canvas
 * is added inside the video's parent element, which becomes
 * `position: relative`.
 *
 * ```tsx
 * const video = useRef<HTMLVideoElement>(null);
 * <div>
 *   <video ref={video} src="/clip.mp4" controls />
 *   <Captions video={video} captions={words} preset="Karaoke" />
 * </div>
 * ```
 *
 * @public
 */
export function Captions({ video, ...options }: CaptionsProps) {
  useCaptions(video, options);
  return null;
}

export default Captions;
