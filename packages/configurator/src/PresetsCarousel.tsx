import WheelGesturesPlugin from "embla-carousel-wheel-gestures";
import { useEffect, useState } from "react";
import { Card, CardContent } from "ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "ui/carousel";

import { renderStylePreset, StylePreset, stylePresets } from "captions.js";

export default function PresetsCarousel({
  value,
  onSelect,
}: {
  value: StylePreset["captionsSettings"]["style"]["name"];
  onSelect: (
    presetName: StylePreset["captionsSettings"]["style"]["name"]
  ) => void;
}) {
  const [previews, setPreviews] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;

    const loadPreviews = async () => {
      try {
        const entries = await Promise.all(
          stylePresets.map(async (preset) => {
            const image = await renderStylePreset(preset, [320, 84]);
            return [preset.captionsSettings.style.name, image] as const;
          })
        );
        if (!cancelled) {
          setPreviews(Object.fromEntries(entries));
        }
      } catch (error) {
        console.error("Failed to render preset previews", error);
      }
    };

    void loadPreviews();

    return () => {
      cancelled = true;
    };
  }, []);

  const getClickhandler = (
    presetName: StylePreset["captionsSettings"]["style"]["name"]
  ) => {
    return () => {
      onSelect(presetName);
    };
  };

  return (
    <Carousel
      plugins={[
        WheelGesturesPlugin({
          active: true,
        }),
      ]}
      opts={{
        align: "start",
        dragFree: true,
        slidesToScroll: 3,
      }}
      orientation="vertical"
      className="w-full max-w-xs"
    >
      <CarouselContent className="-mt-1 h-[calc(100vh-350px)]">
        {stylePresets.map((preset, index) => {
          const presetName = preset.captionsSettings.style.name;
          const isSelected = presetName === value;
          return (
            <CarouselItem
              key={index}
              className="basis-auto cursor-pointer"
              onClick={getClickhandler(presetName)}
            >
              <Card
                className={`h-full overflow-hidden rounded-xl transition-all duration-200 ease-out ${
                  isSelected
                    ? "border border-primary bg-white shadow-md shadow-primary/30 dark:bg-slate-900/80"
                    : "bg-white shadow hover:-translate-y-1 hover:shadow-lg dark:bg-slate-900/80 dark:hover:shadow-black/40"
                }`}
              >
                <CardContent className="flex items-center justify-center bg-linear-to-b from-white via-slate-50 to-neutral-100 p-0 dark:from-slate-900/80 dark:via-slate-900 dark:to-slate-800/80">
                  <img
                    className={`w-full max-w-full object-contain px-2 py-3 transition-opacity ${
                      previews[presetName] ? "opacity-100" : "opacity-50"
                    }`}
                    src={previews[presetName]}
                    alt={`Preset ${index + 1}`}
                  />
                </CardContent>
              </Card>
            </CarouselItem>
          );
        })}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}
