import { useEffect, useMemo, useState } from "react";
import { Caption } from "captions.js";
import { XIcon } from "lucide-react";
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

  const colorValue = highlightColor || "#000000";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit caption</DialogTitle>
          <DialogDescription>
            Update the word and highlight color. Clear the word to create a gap.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="caption-word">Word</Label>
            <div className="relative">
              <Input
                id="caption-word"
                value={word}
                onChange={(event) => setWord(event.target.value)}
                placeholder="Type the caption word"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="absolute right-1 top-1/2 -translate-y-1/2"
                onClick={() => setWord("")}
                aria-label="Clear word"
              >
                <XIcon />
              </Button>
            </div>
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
