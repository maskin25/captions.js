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

import { StylePreset, stylePresets } from "captions.js";
import StylePresetPreview from "components/CaptionsStylePreview";
import type { CarouselApi } from "ui/carousel";

const SLIDES_TO_SCROLL = 3;

type PresetsCarouselProps = {
  value: StylePreset["captionsSettings"]["style"]["name"];
  onSelect: (
    presetName: StylePreset["captionsSettings"]["style"]["name"]
  ) => void;
  className?: string;
  contentClassName?: string;
  previewText?: string;
};

export default function PresetsCarousel({
  value,
  onSelect,
  className,
  contentClassName,
  previewText,
}: PresetsCarouselProps) {
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);

  useEffect(() => {
    if (!carouselApi) {
      return;
    }
    const targetIndex = stylePresets.findIndex(
      (preset) => preset.captionsSettings.style.name === value
    );

    if (targetIndex >= 0) {
      carouselApi.scrollTo(Math.floor(targetIndex / SLIDES_TO_SCROLL), false);
    }
  }, [carouselApi, value]);

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
        slidesToScroll: SLIDES_TO_SCROLL,
      }}
      orientation="vertical"
      className={`w-full ${className}`}
      setApi={setCarouselApi}
    >
      <CarouselContent className={`-mt-1 ${contentClassName}`}>
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
                  <StylePresetPreview
                    stylePreset={preset}
                    isSelected={isSelected}
                    width={320}
                    height={84}
                    text={previewText}
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
