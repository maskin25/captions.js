import { useMemo, useState } from "react";
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
}: {
  captions: Caption[];
  onCaptionChange?: (caption: Caption, index: number) => void;
  onCaptionsChange?: (captions: Caption[]) => void;
  className?: string;
  readonly?: boolean;
}) => {
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

  return (
    <>
      <div className={`flex min-h-0 flex-1 flex-col ${className ?? ""}`}>
        <ScrollArea className="min-h-0 flex-1 px-3">
          <div className="group relative w-full flex flex-wrap items-start">
          <CopyButton
            className="absolute top-0 right-2 opacity-0 transition-opacity group-hover:opacity-100"
            content={captionsJson}
            size="sm"
            variant="outline"
            aria-label="Copy captions"
          />
          {captions.map((caption, index) => (
            <button
              key={`${caption.word}-${caption.startTime}-${index}`}
              type="button"
              onClick={readonly ? undefined : () => handleOpen(index)}
              className={`rounded border border-transparent px-1 py-0 text-sm text-foreground transition ${
                readonly
                  ? "cursor-default"
                  : "hover:border-dashed hover:border-muted-foreground/50 hover:bg-muted"
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
