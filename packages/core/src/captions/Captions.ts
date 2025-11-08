import Konva from "konva";
import { renderFrame } from "../canvas-captions";
import { loadGoogleFont2 } from "../fonts/googleFonts.helpers";
import { googleFontsList } from "../fonts/googleFonts.config";
import type { Caption } from "../entities/captions/captions.types";
import type { StylePreset } from "../stylePresets/stylePresets.config";

/**
 * Configuration passed to the captions runtime when binding to a video element.
 *
 * @public
 */
export type CaptionsOptions = {
  /** Video element that should receive overlays. */
  video: HTMLVideoElement;
  /** Optional custom container to host the Konva stage. */
  container?: HTMLDivElement;
  /** Initial preset controlling font, colors, animations. */
  preset: StylePreset;
  /** Initial caption track. */
  captions?: Caption[] | null;
  /** When false, caller must invoke {@link Captions.enable} manually. */
  autoEnable?: boolean;
};

/**
 * Imperative controller that owns the Konva stage lifecycle for a single video element.
 *
 * @public
 */
export class Captions {
  private enabled = false;
  private readonly video: HTMLVideoElement;
  private readonly providedContainer?: HTMLDivElement;
  private presetState: StylePreset;
  private captionsState: Caption[] | null;
  private containerElement?: HTMLDivElement;
  private ownsContainer = false;
  private stage: Konva.Stage | null = null;
  private layer: Konva.Layer | null = null;
  private resizeObserver?: ResizeObserver;
  private animationFrameId: number | null = null;
  private videoWidth = 0;
  private videoHeight = 0;

  private readonly handleResize = () => {
    this.syncStageDimensions();
  };

  private readonly handleMetadata = () => {
    this.syncStageDimensions();
  };

  private readonly animationLoop = () => {
    this.updateFrame();
    this.animationFrameId = requestAnimationFrame(this.animationLoop);
  };

  /**
   * Create a controller bound to the provided video element and preset.
   *
   * @param options - Complete configuration for the controller.
   */
  constructor(options: CaptionsOptions) {
    if (!options.video) {
      throw new Error("captionsjs requires a video element");
    }

    this.video = options.video;
    this.providedContainer = options.container;
    this.presetState = options.preset;
    this.captionsState = options.captions ?? null;

    if (options.autoEnable ?? true) {
      this.enable();
    }
  }

  /**
   * Mount caption overlays onto the configured video if they are not active yet.
   */
  enable() {
    if (this.enabled) {
      return;
    }

    this.containerElement = this.providedContainer ?? this.createOverlay();
    this.ownsContainer = !this.providedContainer;

    this.stage = new Konva.Stage({
      container: this.containerElement,
    });

    this.layer = new Konva.Layer();
    this.stage.add(this.layer);

    this.videoWidth = this.video.videoWidth;
    this.videoHeight = this.video.videoHeight;

    window.addEventListener("resize", this.handleResize);

    if (typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver(this.handleResize);
      this.resizeObserver.observe(this.video);
    }

    this.video.addEventListener("loadedmetadata", this.handleMetadata);

    this.syncStageDimensions();

    this.animationFrameId = requestAnimationFrame(this.animationLoop);

    this.enabled = true;

    void this.refreshFrame();
  }

  /**
   * Tear down overlays, observers and animation loops to free resources.
   */
  disable() {
    if (!this.enabled) {
      return;
    }

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    window.removeEventListener("resize", this.handleResize);
    this.video.removeEventListener("loadedmetadata", this.handleMetadata);
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;

    if (this.ownsContainer && this.containerElement?.parentElement) {
      this.containerElement.parentElement.removeChild(this.containerElement);
    }

    this.stage?.destroy();
    this.stage = null;
    this.layer = null;
    this.containerElement = undefined;
    this.ownsContainer = false;
    this.enabled = false;
  }

  /**
    * Alias for {@link Captions.disable | disable()} to match typical imperative controller APIs.
   */
  destroy() {
    this.disable();
  }

  /**
   * Swap the active preset and re-render with updated typography/colors.
   *
   * @param nextPreset - Preset that becomes the new render baseline.
   */
  preset(nextPreset: StylePreset) {
    this.presetState = nextPreset;
    if (!this.enabled) {
      return;
    }

    void this.refreshFrame();
  }

  /**
   * Replace the current caption track and repaint without reloading fonts.
   *
   * @param nextCaptions - Timed words that should drive the overlay.
   */
  captions(nextCaptions: Caption[] | null) {
    this.captionsState = nextCaptions;
    if (!this.enabled) {
      return;
    }

    void this.refreshFrame(false);
  }

  /**
   * Whether the Konva overlay is currently attached to the video element.
   *
   * @returns `true` when the overlay is mounted on top of the video.
   */
  isEnabled() {
    return this.enabled;
  }

  private async refreshFrame(loadFont = true) {
    if (!this.layer || !this.stage) {
      return;
    }

    if (loadFont) {
      await this.loadFontForCurrentPreset();
    }

    this.updateFrame();
  }

  private async loadFontForCurrentPreset() {
    const fontFamily =
      this.presetState.captionsSettings.style.font
        .fontFamily as (typeof googleFontsList)[number];

    await loadGoogleFont2(fontFamily);
  }

  private updateFrame() {
    if (!this.layer || !this.stage) {
      return;
    }

    if (!this.videoWidth || !this.videoHeight) {
      return;
    }

    this.layer.destroyChildren();

    renderFrame(
      this.presetState.captionsSettings as any,
      undefined as any,
      this.captionsState || [],
      this.video.currentTime,
      [this.videoWidth, this.videoHeight],
      this.layer,
      1,
      { type: "bottom", positionTopOffset: 50 }
    );
  }

  private syncStageDimensions() {
    if (!this.stage) {
      return;
    }

    const currentVideoWidth = this.video.videoWidth || this.videoWidth;
    const currentVideoHeight = this.video.videoHeight || this.videoHeight;

    if (!currentVideoWidth || !currentVideoHeight) {
      return;
    }

    this.videoWidth = currentVideoWidth;
    this.videoHeight = currentVideoHeight;

    this.stage.width(this.videoWidth);
    this.stage.height(this.videoHeight);

    const rect = this.video.getBoundingClientRect();
    const stageContainer = this.stage.container() as HTMLDivElement;

    const displayWidth = rect.width || stageContainer.offsetWidth || this.videoWidth;
    const displayHeight =
      rect.height || stageContainer.offsetHeight || this.videoHeight;

    if (displayWidth && displayHeight) {
      stageContainer.style.width = `${displayWidth}px`;
      stageContainer.style.height = `${displayHeight}px`;

      const scaleX = displayWidth / this.videoWidth;
      const scaleY = displayHeight / this.videoHeight;
      this.stage.scale({ x: scaleX, y: scaleY });
    } else {
      this.stage.scale({ x: 1, y: 1 });
      stageContainer.style.width = `${this.videoWidth}px`;
      stageContainer.style.height = `${this.videoHeight}px`;
    }

    this.stage.batchDraw();
  }

  private createOverlay() {
    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.top = "0";
    container.style.left = "0";
    container.style.width = "100%";
    container.style.height = "100%";
    container.style.pointerEvents = "none";
    this.video.parentElement?.appendChild(container);
    return container;
  }
}

/**
 * Convenience alias for the concrete controller class.
 *
 * @public
 */
export type CaptionsInstance = Captions;

/**
 * Factory mirroring the legacy default export for ergonomic imports.
 *
 * @param options - Same options accepted by the {@link Captions} constructor.
 * @returns New controller instance.
 */
export function captionsjs(options: CaptionsOptions) {
  return new Captions(options);
}

export default captionsjs;
