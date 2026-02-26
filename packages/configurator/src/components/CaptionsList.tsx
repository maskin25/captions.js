import {
  CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Caption } from "captions.js";
import { ScrollArea } from "ui/scroll-area";
import { CaptionForm } from "./CaptionForm";
import { CopyButton } from "ui/shadcn-io/copy-button";
import { Button } from "ui/button";

type CaptionParagraph = {
  start: number;
  end: number;
  speaker?: number;
};

const PARAGRAPH_ACTIVE_TOLERANCE_SEC = 0.12;

type ParagraphGroup = {
  paragraph: CaptionParagraph;
  paragraphIndex: number;
  indices: number[];
};

const getParagraphSpeakerStyle = (
  speaker: number | undefined,
  isActive: boolean
): CSSProperties | undefined => {
  if (typeof speaker !== "number") return undefined;

  const hue = (speaker * 57) % 360;

  return {
    backgroundColor: isActive
      ? `hsla(${hue}, 42%, 74%, 0.28)`
      : `hsla(${hue}, 34%, 82%, 0.12)`,
    borderColor: isActive
      ? `hsla(${hue}, 34%, 46%, 0.38)`
      : `hsla(${hue}, 26%, 54%, 0.24)`,
  };
};

const buildParagraphGroups = (
  captions: Caption[],
  paragraphs: CaptionParagraph[]
): { groups: ParagraphGroup[]; captionToGroupIndex: number[] } => {
  if (!captions.length || !paragraphs.length) {
    return { groups: [], captionToGroupIndex: [] };
  }

  const tempGroups: ParagraphGroup[] = paragraphs.map((paragraph, paragraphIndex) => ({
    paragraph,
    paragraphIndex,
    indices: [],
  }));

  const captionToParagraphIndex = new Array<number>(captions.length).fill(-1);
  let paragraphCursor = 0;

  captions.forEach((caption, captionIndex) => {
    const time = caption.startTime;
    while (
      paragraphCursor < paragraphs.length - 1 &&
      time >= paragraphs[paragraphCursor].end
    ) {
      paragraphCursor += 1;
    }

    const candidate = paragraphs[paragraphCursor];
    const isLast = paragraphCursor === paragraphs.length - 1;
    const matchesCandidate =
      time >= candidate.start && (isLast ? time <= candidate.end : time < candidate.end);

    if (matchesCandidate) {
      tempGroups[paragraphCursor].indices.push(captionIndex);
      captionToParagraphIndex[captionIndex] = paragraphCursor;
      return;
    }

    const prevIndex = paragraphCursor - 1;
    if (prevIndex >= 0) {
      const prev = paragraphs[prevIndex];
      const prevIsLast = prevIndex === paragraphs.length - 1;
      const matchesPrev =
        time >= prev.start && (prevIsLast ? time <= prev.end : time < prev.end);
      if (matchesPrev) {
        tempGroups[prevIndex].indices.push(captionIndex);
        captionToParagraphIndex[captionIndex] = prevIndex;
      }
    }
  });

  const groups = tempGroups.filter((group) => group.indices.length > 0);
  const paragraphToGroupIndex = new Map<number, number>();
  groups.forEach((group, index) => {
    paragraphToGroupIndex.set(group.paragraphIndex, index);
  });

  const captionToGroupIndex = captionToParagraphIndex.map((paragraphIndex) =>
    paragraphIndex < 0 ? -1 : (paragraphToGroupIndex.get(paragraphIndex) ?? -1)
  );

  return { groups, captionToGroupIndex };
};

const findParagraphIndexByTime = (
  groups: ParagraphGroup[],
  currentTime: number
): number => {
  if (!groups.length) return -1;

  let low = 0;
  let high = groups.length - 1;
  let candidate = -1;

  while (low <= high) {
    const mid = (low + high) >> 1;
    if (groups[mid].paragraph.start <= currentTime) {
      candidate = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  const matches = (groupIndex: number): boolean => {
    if (groupIndex < 0 || groupIndex >= groups.length) return false;
    const group = groups[groupIndex];
    const isLast = groupIndex === groups.length - 1;
    const start = group.paragraph.start - PARAGRAPH_ACTIVE_TOLERANCE_SEC;
    const end =
      group.paragraph.end + (isLast ? PARAGRAPH_ACTIVE_TOLERANCE_SEC : 0);
    return currentTime >= start && currentTime <= end;
  };

  if (matches(candidate)) return candidate;
  if (matches(candidate + 1)) return candidate + 1;
  if (matches(candidate - 1)) return candidate - 1;

  return -1;
};

export const CaptionsList = ({
  captions,
  onCaptionChange,
  onCaptionsChange,
  onParagraphSeek,
  className,
  readonly = false,
  currentTime,
  isPlaying = false,
  paragraphs = null,
}: {
  captions: Caption[];
  onCaptionChange?: (caption: Caption, index: number) => void;
  onCaptionsChange?: (captions: Caption[]) => void;
  onParagraphSeek?: (time: number) => void;
  className?: string;
  readonly?: boolean;
  currentTime?: number | null;
  isPlaying?: boolean;
  paragraphs?: CaptionParagraph[] | null;
}) => {
  const autoScrollTimeoutRef = useRef<number | null>(null);
  const hadParagraphsRef = useRef(false);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const hasParagraphs = Boolean(paragraphs && paragraphs.length > 0);
  const [viewMode, setViewMode] = useState<"words" | "paragraphs">(
    hasParagraphs ? "paragraphs" : "words"
  );

  useEffect(() => {
    if (!hasParagraphs && viewMode === "paragraphs") {
      setViewMode("words");
    }
    if (hasParagraphs && !hadParagraphsRef.current) {
      setViewMode("paragraphs");
    }
    hadParagraphsRef.current = hasParagraphs;
  }, [hasParagraphs, viewMode]);

  const selectedCaption = useMemo(() => {
    if (selectedIndex === null) return null;
    return captions[selectedIndex] ?? null;
  }, [captions, selectedIndex]);

  const handleOpen = useCallback((index: number) => {
    if (readonly) return;
    setSelectedIndex(index);
    setIsFormOpen(true);
  }, [readonly]);

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

  const { groups: paragraphGroups, captionToGroupIndex } = useMemo(
    () => buildParagraphGroups(captions, paragraphs ?? []),
    [captions, paragraphs]
  );

  const activeParagraphIndex = useMemo(() => {
    if (currentTime !== null && currentTime !== undefined) {
      const timeBasedIndex = findParagraphIndexByTime(
        paragraphGroups,
        currentTime
      );
      if (timeBasedIndex >= 0) {
        return timeBasedIndex;
      }
    }

    if (activeIndex < 0) return -1;
    return captionToGroupIndex[activeIndex] ?? -1;
  }, [activeIndex, captionToGroupIndex, currentTime, paragraphGroups]);

  useEffect(() => {
    if (!isPlaying) return;
    if (!autoScrollEnabled) return;
    const targetId =
      viewMode === "paragraphs" && activeParagraphIndex >= 0
        ? `caption-paragraph-${activeParagraphIndex}`
        : activeIndex >= 0
        ? `caption-word-${activeIndex}`
        : null;
    if (!targetId) return;
    const node = document.getElementById(targetId);
    if (!node) return;
    node.scrollIntoView({
      block: "center",
      behavior: "smooth",
    });
  }, [
    activeIndex,
    activeParagraphIndex,
    autoScrollEnabled,
    isPlaying,
    viewMode,
  ]);

  useEffect(
    () => () => {
      if (autoScrollTimeoutRef.current !== null) {
        window.clearTimeout(autoScrollTimeoutRef.current);
      }
    },
    []
  );

  const handleManualScroll = useCallback(() => {
    if (autoScrollTimeoutRef.current !== null) {
      window.clearTimeout(autoScrollTimeoutRef.current);
    }
    setAutoScrollEnabled(false);
    autoScrollTimeoutRef.current = window.setTimeout(() => {
      setAutoScrollEnabled(true);
      autoScrollTimeoutRef.current = null;
    }, 10000);
  }, []);

  return (
    <>
      <div
        className={`relative group flex min-h-0 flex-1 flex-col ${
          className ?? ""
        }`}
      >
        <div className="absolute top-2 right-4 z-10">
          <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
            {hasParagraphs && (
              <div className="rounded-md border bg-background p-0.5">
                <Button
                  size="sm"
                  variant={viewMode === "paragraphs" ? "secondary" : "ghost"}
                  className="h-7 px-2 text-xs"
                  onClick={() => setViewMode("paragraphs")}
                >
                  Paragraphs
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === "words" ? "secondary" : "ghost"}
                  className="h-7 px-2 text-xs"
                  onClick={() => setViewMode("words")}
                >
                  Words
                </Button>
              </div>
            )}
            <CopyButton
              animate
              content={captionsJson}
              size="sm"
              variant="ghost"
              aria-label="Copy captions"
            />
          </div>
        </div>
        <ScrollArea
          className="min-h-0 flex-1"
          onWheel={handleManualScroll}
          onTouchMove={handleManualScroll}
          onPointerDown={handleManualScroll}
        >
          {viewMode === "paragraphs" && paragraphGroups.length > 0 ? (
            <div className="w-full space-y-3 px-3 py-6">
              {paragraphGroups.map((group, groupIndex) => (
                <div
                  key={`paragraph-${group.paragraph.start}-${group.paragraph.end}-${groupIndex}`}
                  id={`caption-paragraph-${groupIndex}`}
                  onClick={
                    onParagraphSeek
                      ? () => onParagraphSeek(group.paragraph.start)
                      : undefined
                  }
                  className={`rounded-lg border p-3 transition ${
                    groupIndex === activeParagraphIndex
                      ? "ring-1 ring-muted-foreground/40"
                      : "border-border/60"
                  } ${onParagraphSeek ? "cursor-pointer" : ""}`}
                  style={getParagraphSpeakerStyle(
                    group.paragraph.speaker,
                    groupIndex === activeParagraphIndex
                  )}
                >
                  <div className="flex flex-wrap items-start">
                    {group.indices.map((captionIndex) => {
                      const caption = captions[captionIndex];
                      if (!caption) return null;
                      return (
                        <button
                          key={`${caption.word}-${caption.startTime}-${captionIndex}`}
                          id={`caption-word-${captionIndex}`}
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            if (readonly) return;
                            handleOpen(captionIndex);
                          }}
                          className={`rounded border border-transparent px-1 py-0 text-sm text-foreground transition ${
                            readonly
                              ? "cursor-default"
                              : "hover:border-dashed hover:border-muted-foreground/50 hover:bg-muted"
                          } ${
                            captionIndex === activeIndex
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
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
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
          )}
        </ScrollArea>
        <div className="pointer-events-none absolute inset-x-0 -top-1 h-8 bg-linear-to-b from-background via-background/80 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 -bottom-1 h-8 bg-linear-to-t from-background via-background/80 to-transparent" />
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
