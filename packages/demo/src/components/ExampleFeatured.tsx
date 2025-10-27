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

import {
  // renderCaptions,
  // renderString,
  attachToVideo,
  // googleFontsList,
  stylePresets,
  // type Caption,
} from "captions.js";

const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 360;

function ExampleFeatured() {
  const [preset, setPreset] = useState(
    stylePresets.find((p) => p.captionsSettings.style.name === "Safari") ||
      stylePresets[0]
  );
  // const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const captionsRef = useRef<any>(null);

  const [captions, setCaptions] = useState(null);

  useEffect(() => {
    if (videoRef.current) {
      captionsRef.current = attachToVideo(videoRef.current, undefined, {
        preset,
        captions,
      });
    }

    return () => {
      if (captionsRef.current) {
        captionsRef.current.detach();
        captionsRef.current = null;
      }
    };
  }, [videoRef]);

  useEffect(() => {
    if (captionsRef.current) {
      captionsRef.current.update({ preset, captions });
    }
  }, [preset, captions]);

  useEffect(() => {
    fetch(`${"/captions.js"}/margo-plain.json`)
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
          ref={videoRef}
          src="https://storage.googleapis.com/shorty-uploads/margo.mp4"
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          controls
          style={{ display: "block" }}
        ></video>

        {/*   <canvas
        ref={canvasRef}
        style={{ width: `${CANVAS_WIDTH}px`, height: `${CANVAS_HEIGHT}px` }}
        width={CANVAS_WIDTH * window.devicePixelRatio}
        height={CANVAS_HEIGHT * window.devicePixelRatio}
      ></canvas> */}
      </div>
    </div>
  );
}

export default ExampleFeatured;
