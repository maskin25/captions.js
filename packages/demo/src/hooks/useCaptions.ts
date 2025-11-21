import captionsjs, {
  stylePresets,
  type Caption,
  type StylePreset,
} from "captions.js";
import { useEffect, useRef, useState } from "react";

export const useRemoteCaptions = (
  videoRef: React.RefObject<HTMLVideoElement | null>,
  captionsSrc: string,
  presetName?: StylePreset["captionsSettings"]["style"]["name"]
) => {
  const [captions, setCaptions] = useState<Caption[] | undefined>(undefined);

  const [preset, setPreset] = useState(
    stylePresets.find((p) => p.captionsSettings.style.name === presetName) ||
      stylePresets[0]
  );

  const captionsInstance = useRef<ReturnType<typeof captionsjs> | null>(null);

  useEffect(() => {
    if (!videoRef?.current) return;

    const video = videoRef.current;

    const handleMetadata = () => {};

    video.addEventListener("loadedmetadata", handleMetadata);

    // If metadata is already loaded
    if (video.readyState >= 1) {
      handleMetadata();
    }

    return () => {
      video.removeEventListener("loadedmetadata", handleMetadata);
    };
  }, [videoRef]);

  useEffect(() => {
    fetch(captionsSrc!)
      .then((res) => res.json())
      .then((data) => {
        // convert startTime and endTime to numbers
        return data.map((caption: any) => ({
          ...caption,
          startTime: parseFloat(caption.startTime),
          endTime: parseFloat(caption.endTime),
        }));
      })
      .then(setCaptions);
  }, [captionsSrc]);

  useEffect(() => {
    if (videoRef?.current && captions && preset && !captionsInstance.current) {
      captionsInstance.current = captionsjs({
        video: videoRef.current,
        preset: preset,
        captions: captions,
      });
    }
  }, [videoRef, captions, preset]);

  useEffect(() => {
    return () => {
      captionsInstance.current?.destroy();
    };
  }, []);

  useEffect(() => {
    if (captionsInstance.current) {
      captionsInstance.current.preset(preset);
    }
  }, [preset]);

  return { captions, preset, setPreset };
};
