import Konva from "konva";
import { renderFrame } from "../canvas-captions";
import { loadGoogleFont2 } from "../fonts/googleFonts.helpers";
import { googleFontsList } from "../fonts/googleFonts.config";

const attachedVideos = new WeakMap();

export const attachToVideo = async (
  videoElement: HTMLVideoElement,
  container?: HTMLDivElement,
  options?: any
) => {
  if (attachedVideos.has(videoElement)) {
    console.warn("Captions are already attached to this video element.");
    return attachedVideos.get(videoElement);
  }

  await loadGoogleFont2(
    options.preset.captionsSettings.style.font
      .fontFamily as (typeof googleFontsList)[number]
  );

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
    width: videoElement.videoWidth,
    height: videoElement.videoHeight,
  });

  const layer = new Konva.Layer();
  stage.add(layer);

  stage.width(container.clientWidth);
  stage.height(container.clientHeight);

  const update = () => {
    layer.destroyChildren();
    renderFrame(
      options.preset.captionsSettings,
      undefined as any,
      options.captions,
      videoElement.currentTime,
      [640, 360],
      layer
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
      if (container && container.parentElement) {
        container.parentElement.removeChild(container);
      }
      stage.destroy();
      attachedVideos.delete(videoElement);
    },
    update: (newOptions: any) => {
      options = { ...options, ...newOptions };
      update(); // re-render on update
    },
  };

  attachedVideos.set(videoElement, controls);

  return controls;
};
