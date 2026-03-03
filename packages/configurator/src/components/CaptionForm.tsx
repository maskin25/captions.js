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
import { type ConfiguratorLang, t } from "../i18n";

type CaptionFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caption: Caption | null;
  index: number;
  captions: Caption[];
  onCaptionsChange?: (nextCaptions: Caption[]) => void;
  lang?: ConfiguratorLang;
};

export const CaptionForm = ({
  open,
  onOpenChange,
  caption,
  index,
  captions,
  onCaptionsChange,
  lang = "en",
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
          <DialogTitle>{t(lang, "captionFormTitle")}</DialogTitle>
          <DialogDescription>
            {t(lang, "captionFormDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="caption-word">{t(lang, "captionFormWord")}</Label>
            <div className="relative">
              <Input
                id="caption-word"
                value={word}
                onChange={(event) => setWord(event.target.value)}
                placeholder={t(lang, "captionFormWordPlaceholder")}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="absolute right-1 top-1/2 -translate-y-1/2"
                onClick={() => setWord("")}
                aria-label={t(lang, "captionFormClearWordAria")}
              >
                <XIcon />
              </Button>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="caption-highlight">
              {t(lang, "captionFormHighlightColor")}
            </Label>
            <div className="flex items-center gap-3">
              <Input
                id="caption-highlight"
                type="color"
                className="h-9 w-12 cursor-pointer p-1"
                value={colorValue}
                onChange={(event) => setHighlightColor(event.target.value)}
                aria-label={t(lang, "captionFormHighlightColorAria")}
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
                {t(lang, "clear")}
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
            {t(lang, "cancel")}
          </Button>
          <Button type="button" onClick={handleSave} disabled={!isDirty}>
            {t(lang, "saveChanges")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
