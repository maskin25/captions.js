import { useEffect, useMemo, useState } from "react";
import { Caption } from "captions.js";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "ui/dialog";
import { Button } from "ui/button";
import { Input } from "ui/input";
import { Label } from "ui/label";

type CaptionFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caption: Caption | null;
  index: number;
  captions: Caption[];
  onCaptionsChange?: (nextCaptions: Caption[]) => void;
};

const clampStartTime = (value: number, endTime: number) => {
  if (value < 0) return 0;
  if (value > endTime) return endTime;
  return value;
};

export const CaptionForm = ({
  open,
  onOpenChange,
  caption,
  index,
  captions,
  onCaptionsChange,
}: CaptionFormProps) => {
  const [word, setWord] = useState("");
  const [highlightColor, setHighlightColor] = useState("");

  useEffect(() => {
    setWord(caption?.word ?? "");
    setHighlightColor(caption?.highlightColor ?? "");
  }, [caption, open]);

  const isDirty = useMemo(() => {
    if (!caption) return false;
    return (
      word.trim() !== caption.word ||
      (highlightColor || "") !== (caption.highlightColor || "")
    );
  }, [caption, highlightColor, word]);

  const handleSave = () => {
    if (!caption) return;
    const nextCaptions = captions.slice();
    nextCaptions[index] = {
      ...caption,
      word: word.trim(),
      highlightColor: highlightColor || undefined,
    };
    onCaptionsChange?.(nextCaptions);
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (!caption) return;
    const nextCaptions = captions.slice();
    const removed = nextCaptions.splice(index, 1)[0];
    if (!removed) return;

    const previousIndex = index - 1;
    const nextIndex = index;

    if (previousIndex >= 0) {
      const previous = nextCaptions[previousIndex];
      nextCaptions[previousIndex] = {
        ...previous,
        endTime: Math.max(previous.startTime, removed.endTime),
      };
    }

    if (nextIndex < nextCaptions.length) {
      const next = nextCaptions[nextIndex];
      const adjustedStart = clampStartTime(removed.endTime, next.endTime);
      nextCaptions[nextIndex] = {
        ...next,
        startTime: adjustedStart,
      };
    }

    if (previousIndex >= 0 && nextIndex < nextCaptions.length) {
      const previous = nextCaptions[previousIndex];
      const next = nextCaptions[nextIndex];
      if (previous.endTime > next.startTime) {
        nextCaptions[previousIndex] = {
          ...previous,
          endTime: next.startTime,
        };
      }
    }

    onCaptionsChange?.(nextCaptions);
    onOpenChange(false);
  };

  const colorValue = highlightColor || "#000000";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit caption</DialogTitle>
          <DialogDescription>
            Update the word and highlight color, or remove the word.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="caption-word">Word</Label>
            <Input
              id="caption-word"
              value={word}
              onChange={(event) => setWord(event.target.value)}
              placeholder="Type the caption word"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="caption-highlight">Highlight color</Label>
            <div className="flex items-center gap-3">
              <Input
                id="caption-highlight"
                type="color"
                className="h-9 w-12 cursor-pointer p-1"
                value={colorValue}
                onChange={(event) => setHighlightColor(event.target.value)}
                aria-label="Highlight color"
              />
              <Input
                value={highlightColor}
                onChange={(event) => setHighlightColor(event.target.value)}
                placeholder="#F472B6"
              />
              <Button
                type="button"
                variant="ghost"
                onClick={() => setHighlightColor("")}
              >
                Clear
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-3">
          <Button type="button" variant="destructive" onClick={handleDelete}>
            Delete word
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={!isDirty}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
