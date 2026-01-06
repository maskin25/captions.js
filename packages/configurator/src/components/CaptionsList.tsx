import { useEffect, useMemo, useRef, useState } from "react";
import { Caption } from "captions.js";
import { ScrollArea } from "ui/scroll-area";
import { CaptionForm } from "./CaptionForm";
import { CopyButton } from "ui/shadcn-io/copy-button";

export const CaptionsList = ({
  captions,
  onCaptionChange,
  onCaptionsChange,
  className,
  readonly = false,
  currentTime,
}: {
  captions: Caption[];
  onCaptionChange?: (caption: Caption, index: number) => void;
  onCaptionsChange?: (captions: Caption[]) => void;
  className?: string;
  readonly?: boolean;
  currentTime?: number | null;
}) => {
  const autoScrollTimeoutRef = useRef<number | null>(null);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const selectedCaption = useMemo(() => {
    if (selectedIndex === null) return null;
    return captions[selectedIndex] ?? null;
  }, [captions, selectedIndex]);

  const handleOpen = (index: number) => {
    if (readonly) return;
    setSelectedIndex(index);
    setIsFormOpen(true);
  };

  const handleCaptionsChange = (nextCaptions: Caption[]) => {
    onCaptionsChange?.(nextCaptions);
    if (
      onCaptionChange &&
      selectedIndex !== null &&
      nextCaptions.length === captions.length
    ) {
      const updated = nextCaptions[selectedIndex];
      if (updated) {
        onCaptionChange(updated, selectedIndex);
      }
    }
  };
  const captionsJson = useMemo(
    () => captions.map((caption) => caption.word).join(" "),
    [captions]
  );
  const activeIndex = useMemo(() => {
    if (currentTime === null || currentTime === undefined) return -1;
    return captions.findIndex(
      (caption) =>
        currentTime >= caption.startTime && currentTime <= caption.endTime
    );
  }, [captions, currentTime]);

  useEffect(() => {
    if (!autoScrollEnabled) return;
    if (activeIndex < 0) return;
    const node = document.getElementById(`caption-word-${activeIndex}`);
    if (!node) return;
    node.scrollIntoView({
      block: "center",
      behavior: "smooth",
    });
  }, [activeIndex, autoScrollEnabled]);

  useEffect(
    () => () => {
      if (autoScrollTimeoutRef.current !== null) {
        window.clearTimeout(autoScrollTimeoutRef.current);
      }
    },
    []
  );

  const handleManualScroll = () => {
    if (autoScrollTimeoutRef.current !== null) {
      window.clearTimeout(autoScrollTimeoutRef.current);
    }
    setAutoScrollEnabled(false);
    autoScrollTimeoutRef.current = window.setTimeout(() => {
      setAutoScrollEnabled(true);
      autoScrollTimeoutRef.current = null;
    }, 10000);
  };

  return (
    <>
      <div
        className={`relative group flex min-h-0 flex-1 flex-col ${
          className ?? ""
        }`}
      >
        <div className="absolute top-2 right-4 z-10">
          <CopyButton
            animate
            className="opacity-0 transition-opacity group-hover:opacity-100"
            content={captionsJson}
            size="sm"
            variant="ghost"
            aria-label="Copy captions"
          />
        </div>
        <ScrollArea
          className="min-h-0 flex-1"
          onWheel={handleManualScroll}
          onTouchMove={handleManualScroll}
          onPointerDown={handleManualScroll}
        >
          <div className="w-full flex flex-wrap items-start px-3 py-6">
            {captions.map((caption, index) => (
              <button
                key={`${caption.word}-${caption.startTime}-${index}`}
                id={`caption-word-${index}`}
                type="button"
                onClick={readonly ? undefined : () => handleOpen(index)}
                className={`rounded border border-transparent px-1 py-0 text-sm text-foreground transition ${
                  readonly
                    ? "cursor-default"
                    : "hover:border-dashed hover:border-muted-foreground/50 hover:bg-muted"
                } ${
                  index === activeIndex
                    ? "border-dashed border-muted-foreground/50 bg-muted ring-1 ring-muted-foreground/50"
                    : ""
                }`}
                style={
                  caption.highlightColor
                    ? {
                        backgroundColor: `${caption.highlightColor}99`,
                        borderColor: caption.highlightColor,
                      }
                    : undefined
                }
              >
                {caption.word}
              </button>
            ))}
          </div>
        </ScrollArea>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-linear-to-b from-background via-background/80 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-linear-to-t from-background via-background/80 to-transparent" />
      </div>
      <CaptionForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        caption={selectedCaption}
        index={selectedIndex ?? 0}
        captions={captions}
        onCaptionsChange={handleCaptionsChange}
      />
    </>
  );
};
