import { useEffect, useRef, useState } from "react";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import captionsjs, {
  // renderCaptions,
  // renderString,
  // googleFontsList,
  stylePresets,
  type StylePreset,
  // type Caption,
} from "captions.js";

const DEFAULT_CANVAS_WIDTH = 640;
const DEFAULT_CANVAS_HEIGHT = 360;

type ExampleFeaturedProps = {
  videoSrc?: string;
  captionsSrc?: string;
  presetName?: StylePreset["captionsSettings"]["style"]["name"];
};

function ExampleFeatured({
  videoSrc,
  captionsSrc,
  presetName,
}: ExampleFeaturedProps) {
  const [preset, setPreset] = useState(
    stylePresets.find((p) => p.captionsSettings.style.name === presetName) ||
      stylePresets[0]
  );
  // const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const captionsRef = useRef<ReturnType<typeof captionsjs> | null>(null);

  const [captions, setCaptions] = useState(null);

  const [canvasSize, setCanvasSize] = useState<[number, number]>([
    DEFAULT_CANVAS_WIDTH,
    DEFAULT_CANVAS_HEIGHT,
  ]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleMetadata = () => {
      setCanvasSize([video.videoWidth, video.videoHeight]);
    };

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
    if (videoRef.current) {
      captionsRef.current = captionsjs({
        video: videoRef.current,
        preset,
        captions,
      });
    }

    return () => {
      if (captionsRef.current) {
        captionsRef.current.destroy();
        captionsRef.current = null;
      }
    };
  }, [videoRef]);

  useEffect(() => {
    if (captionsRef.current) {
      captionsRef.current.preset(preset);
    }
  }, [preset]);

  useEffect(() => {
    if (captionsRef.current) {
      captionsRef.current.captions(captions);
    }
  }, [captions]);

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
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      <Select
        value={String(preset.id)}
        onValueChange={(value) => {
          const selectedPreset = stylePresets.find(
            (preset) => String(preset.id) === value
          );
          if (selectedPreset) {
            setPreset(selectedPreset);
          }
        }}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select preset" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {stylePresets.map((preset) => (
              <SelectItem key={preset.id} value={String(preset.id)}>
                <SelectLabel>{preset.captionsSettings.style.name}</SelectLabel>
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <div className="relative bg-black">
        <video
          preload="metadata"
          ref={videoRef}
          src={videoSrc}
          width={canvasSize[0]}
          height={canvasSize[1]}
          controls
          style={{ display: "block" }}
        />
      </div>
    </div>
  );
}

export default ExampleFeatured;
