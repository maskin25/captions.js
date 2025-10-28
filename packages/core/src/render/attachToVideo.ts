import Konva from "konva";
import { renderFrame } from "../canvas-captions";
import { loadGoogleFont2 } from "../fonts/googleFonts.helpers";
import { googleFontsList } from "../fonts/googleFonts.config";

const attachedVideos = new WeakMap();

export const attachToVideo = (
  videoElement: HTMLVideoElement,
  container?: HTMLDivElement,
  options?: any
) => {
  // Implementation for attaching captions to the video
  if (!container) {
    container = document.createElement("div");
    container.style.position = "absolute";
    container.style.top = "0";
    container.style.left = "0";
    container.style.width = "100%";
    container.style.height = "100%";
    container.style.pointerEvents = "none";
    videoElement.parentElement?.appendChild(container);
  }

  const stage = new Konva.Stage({
    container: container,
  });

  const layer = new Konva.Layer();
  stage.add(layer);

  let videoWidth = videoElement.videoWidth;
  let videoHeight = videoElement.videoHeight;

  const syncStageDimensions = () => {
    const currentVideoWidth = videoElement.videoWidth || videoWidth;
    const currentVideoHeight = videoElement.videoHeight || videoHeight;

    if (!currentVideoWidth || !currentVideoHeight) {
      return;
    }

    videoWidth = currentVideoWidth;
    videoHeight = currentVideoHeight;

    stage.width(videoWidth);
    stage.height(videoHeight);

    const rect = videoElement.getBoundingClientRect();
    const displayWidth =
      rect.width || stage.container().offsetWidth || videoWidth;
    const displayHeight =
      rect.height || stage.container().offsetHeight || videoHeight;

    const stageContainer = stage.container() as HTMLDivElement;

    if (displayWidth && displayHeight) {
      stageContainer.style.width = `${displayWidth}px`;
      stageContainer.style.height = `${displayHeight}px`;

      const scaleX = displayWidth / videoWidth;
      const scaleY = displayHeight / videoHeight;
      stage.scale({ x: scaleX, y: scaleY });
    } else {
      stage.scale({ x: 1, y: 1 });
      stageContainer.style.width = `${videoWidth}px`;
      stageContainer.style.height = `${videoHeight}px`;
    }

    stage.batchDraw();
  };

  const handleMetadata = () => {
    syncStageDimensions();
  };

  window.addEventListener("resize", syncStageDimensions);

  const resizeObserver =
    typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(() => syncStageDimensions())
      : undefined;

  resizeObserver?.observe(videoElement);

  videoElement.addEventListener("loadedmetadata", handleMetadata, {
    once: true,
  });

  syncStageDimensions();

  const update = () => {
    layer.destroyChildren();

    renderFrame(
      options.preset.captionsSettings,
      undefined as any,
      options.captions || [],
      videoElement.currentTime,
      [videoWidth, videoHeight],
      layer,
      1,
      { type: "bottom", positionTopOffset: 50 }
    );
  };

  let animationFrameId: number;
  const animationLoop = () => {
    update();
    animationFrameId = requestAnimationFrame(animationLoop);
  };

  animationLoop();

  // The 'detach' method needs to be updated to cancel the animation frame.
  // Find the 'detach' method below and replace 'videoElement.removeEventListener("timeupdate", update);'
  // with 'cancelAnimationFrame(animationFrameId);'

  const controls = {
    detach: () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", syncStageDimensions);
      resizeObserver?.disconnect();
      if (container && container.parentElement) {
        container.parentElement.removeChild(container);
      }
      stage.destroy();
      attachedVideos.delete(videoElement);
    },
    update: async (newOptions: any) => {
      options = { ...options, ...newOptions };

      await loadGoogleFont2(
        options.preset.captionsSettings.style.font
          .fontFamily as (typeof googleFontsList)[number]
      );

      update(); // re-render on update
    },
  };

  attachedVideos.set(videoElement, controls);

  return controls;
};
