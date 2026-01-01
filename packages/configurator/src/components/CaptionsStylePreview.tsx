import { useEffect, useRef, useState } from "react";

import { renderStylePreset, StylePreset } from "captions.js";
import { Spinner } from "ui/spinner";

type StylePresetPreviewProps = {
  stylePreset: StylePreset;
  width: number;
  height: number;
  isSelected: boolean;
};

export default function StylePresetPreview({
  stylePreset,
  width,
  height,
  isSelected,
}: StylePresetPreviewProps) {
  const [frames, setFrames] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const [hoverFrameIndex, setHoverFrameIndex] = useState(0);
  const hoverIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadPreview = async () => {
      setIsLoading(true);
      try {
        const images = await renderStylePreset(
          {
            ...stylePreset,
            captionsSettings: {
              ...stylePreset.captionsSettings,
              style: {
                ...stylePreset.captionsSettings.style,
                font: {
                  ...stylePreset.captionsSettings.style.font,
                  fontSize: 20,
                  shadow: {
                    fontShadowBlur: 0,
                    fontShadowColor: "#333333",
                    fontShadowOffsetX: 2,
                    fontShadowOffsetY: 2,
                  },
                },
              },
              position: "middle",
              // animation: "bounce",
              linesPerPage: 1,
              positionTopOffset: 0,
            },
          },
          [width, height],
          [0, 0.6, 1.2, 1.8, 2.4, 3],
          "Hello world!"
        );
        if (!cancelled) {
          setFrames(images);
        }
      } catch (error) {
        console.error("Failed to render preset preview", error);
        if (!cancelled) {
          setFrames([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadPreview();

    return () => {
      cancelled = true;
      if (hoverIntervalRef.current) {
        clearInterval(hoverIntervalRef.current);
        hoverIntervalRef.current = null;
      }
    };
  }, [stylePreset, width, height]);

  const handleHoverStart = () => {
    if (!frames.length) {
      return;
    }

    setIsHovering(true);
    setHoverFrameIndex(0);

    if (hoverIntervalRef.current) {
      clearInterval(hoverIntervalRef.current);
    }

    hoverIntervalRef.current = window.setInterval(() => {
      setHoverFrameIndex((prev) => prev + 1);
    }, 200);
  };

  const handleHoverEnd = () => {
    setIsHovering(false);
    setHoverFrameIndex(0);
    if (hoverIntervalRef.current) {
      clearInterval(hoverIntervalRef.current);
      hoverIntervalRef.current = null;
    }
  };

  const restingFrameIndex =
    frames.length > 0 ? Math.min(2, frames.length - 1) : undefined;
  const activeFrameIndex =
    isHovering && frames.length > 0
      ? hoverFrameIndex % frames.length
      : restingFrameIndex ?? 0;
  const previewSrc = frames[activeFrameIndex];

  return (
    <div
      style={{
        width: `${width}px`,
        height: `${height}px`,
      }}
      className={`flex items-center justify-center px-2 py-3`}
      onMouseEnter={handleHoverStart}
      onMouseLeave={handleHoverEnd}
      onFocus={handleHoverStart}
      onBlur={handleHoverEnd}
      onTouchStart={handleHoverStart}
      onTouchEnd={handleHoverEnd}
      role="presentation"
    >
      {isLoading ? (
        <Spinner className="size-6 text-muted-foreground" />
      ) : (
        <img
          className={`w-full max-w-full object-contain transition-opacity ${
            previewSrc ? "opacity-100" : "opacity-50"
          } ${isSelected ? "drop-shadow-[0_0_8px_rgba(59,130,246,0.35)]" : ""}`}
          src={previewSrc ?? ""}
          alt={`${stylePreset.captionsSettings.style.name} preview`}
          width={width}
          height={height}
        />
      )}
    </div>
  );
}
