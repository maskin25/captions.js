import { useEffect, useState } from "react";

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
  renderString,
  // googleFontsList,
  stylePresets,
} from "captions.js";

const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 480;

function HomePage() {
  const [preset, setPreset] = useState(stylePresets[0]);

  useEffect(() => {
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    if (canvas) {
      renderString(canvas, "Hello from captions.js!", { preset });
    }
  }, [preset]);

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <Select
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

      <canvas
        style={{ width: `${CANVAS_WIDTH}px`, height: `${CANVAS_HEIGHT}px` }}
        id="canvas"
        width={CANVAS_WIDTH * window.devicePixelRatio}
        height={CANVAS_HEIGHT * window.devicePixelRatio}
      ></canvas>
    </div>
  );
}

export default HomePage;
