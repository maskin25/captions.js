import {
  useCallback,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import captionsjs, {
  type Caption,
  type StylePreset,
  stylePresets,
  toCaptions,
  getParagraphs,
} from "captions.js";
import { ChevronsUpDown } from "lucide-react";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  VideoOptionSelect,
  videoOptions,
  type VideoOption,
} from "./ConfiguratorLayoutControls";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { CopyButton } from "./ui/shadcn-io/copy-button";
import { Button } from "./ui/button";
import { twMerge } from "tailwind-merge";
import PresetsCarousel from "components/PresetsCarousel";
import { CaptionsList } from "components/CaptionsList";
import CaptionsSettings from "components/CaptionsSettings";
import { type Edits } from "components/caption-edits";
import useMediaQuery from "./hooks/use-media-query";
import { type ConfiguratorLang, t } from "./i18n";

export type ConfiguratorStylePreset = StylePreset;
type ConfiguratorCaptionsSettings =
  ConfiguratorStylePreset["captionsSettings"];
type ConfiguratorLayoutSettings = ConfiguratorStylePreset["layoutSettings"];

export type ConfiguratorProps = {
  captions?: Caption[];
  style?: StylePreset;
  videoSrc?: string;
  lang?: ConfiguratorLang;
  className?: string;
  carouselContentClassName?: string;
  scrollAreaClassName?: string;
  captionsListClassName?: string;
  captionsReadonly?: boolean;
  hideFooter?: boolean;
  debug?: boolean;
  onEditsChange?: (edits: Edits) => void;
  onChange?: (style: ConfiguratorStylePreset) => void;
  onStyleChange?: (style: StylePreset) => void;
};

type CaptionParagraph = {
  start: number;
  end: number;
  speaker?: number;
};

const toFiniteNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const deriveParagraphsFromCaptions = (
  items: Caption[],
): CaptionParagraph[] | null => {
  const byKey = new Map<string, CaptionParagraph>();

  items.forEach((caption) => {
    const paragraphStart = toFiniteNumber(caption.paragraphStartTime);
    const paragraphEnd = toFiniteNumber(caption.paragraphEndTime);
    const sentenceStart = toFiniteNumber(caption.sentenceStartTime);
    const sentenceEnd = toFiniteNumber(caption.sentenceEndTime);

    const start = paragraphStart ?? sentenceStart;
    const end = paragraphEnd ?? sentenceEnd;
    if (start === null || end === null || end < start) return;

    const speaker =
      typeof caption.speaker === "number" ? caption.speaker : undefined;
    const key = `${start}|${end}|${speaker ?? ""}`;
    if (!byKey.has(key)) {
      byKey.set(key, { start, end, speaker });
    }
  });

  const paragraphs = Array.from(byKey.values()).sort(
    (a, b) => a.start - b.start,
  );
  return paragraphs.length > 0 ? paragraphs : null;
};

const DEFAULT_LAYOUT_SETTINGS: StylePreset["layoutSettings"] = {
  aspectRatio: "9:16",
  aIAutoLayout: [],
  fitLayoutAspectRatio: "original",
};

export type ConfiguratorHandle = {
  getCaptionsSettings: () => ConfiguratorCaptionsSettings;
  getSettings: () => ConfiguratorStylePreset;
  getStyle: () => ConfiguratorStylePreset;
  getStylePreset: () => ConfiguratorStylePreset;
  getCaptions: () => Caption[];
};

const clone = <T,>(value: T): T =>
  typeof globalThis.structuredClone === "function"
    ? globalThis.structuredClone(value)
    : (JSON.parse(JSON.stringify(value)) as T);

const Configurator = forwardRef<ConfiguratorHandle, ConfiguratorProps>(
  (
    {
      captions: captionsProp,
      style: styleProp,
      className,
      videoSrc,
      lang = "en",
      carouselContentClassName,
      scrollAreaClassName,
      captionsListClassName,
      captionsReadonly,
      hideFooter,
      debug = false,
      onEditsChange,
      onChange,
      onStyleChange,
    },
    ref,
  ) => {
    const getPresetStyle = (presetName: string): ConfiguratorStylePreset => {
      const base =
        stylePresets.find((p) => p.captionsSettings.style.name === presetName)
          ?? stylePresets[0];
      return clone(base) as ConfiguratorStylePreset;
    };

    const buildStylePreset = useCallback(
      (
        id: number,
        captionsSettings: ConfiguratorCaptionsSettings,
        nextLayoutSettings: ConfiguratorLayoutSettings,
      ): ConfiguratorStylePreset => {
        return {
          id,
          captionsSettings: clone(captionsSettings),
          layoutSettings: clone(nextLayoutSettings),
        };
      },
      [],
    );
    const defaultPresetName =
      stylePresets.find((p) => p.captionsSettings.style.name === "From")
        ?.captionsSettings.style.name ??
      stylePresets[0]?.captionsSettings.style.name ??
      "";

    const [selectedPresetName, setSelectedPresetName] = useState(
      styleProp?.captionsSettings.style.name ?? defaultPresetName,
    );
    const [settings, setSettings] = useState<ConfiguratorCaptionsSettings>(
      () =>
        styleProp?.captionsSettings
          ? clone(styleProp.captionsSettings)
          : getPresetStyle(defaultPresetName).captionsSettings,
    );
    const [styleId, setStyleId] = useState(
      () => styleProp?.id ?? getPresetStyle(defaultPresetName).id ?? 0,
    );
    const [layoutSettings, setLayoutSettings] =
      useState<ConfiguratorLayoutSettings>(() =>
        styleProp?.layoutSettings
          ? clone(styleProp.layoutSettings)
          : (getPresetStyle(
              styleProp?.captionsSettings.style.name ?? defaultPresetName,
            ).layoutSettings ??
            clone(DEFAULT_LAYOUT_SETTINGS)),
      );
    const [videoOption, setVideoOption] = useState<VideoOption | undefined>(
      videoSrc ? undefined : videoOptions[0],
    );
    const [captions, setCaptions] = useState<Caption[]>(
      () => captionsProp || [],
    );
    const [baseCaptionsForEdits, setBaseCaptionsForEdits] = useState<Caption[]>(
      () => captionsProp || [],
    );
    const [captionParagraphs, setCaptionParagraphs] = useState<
      CaptionParagraph[] | null
    >(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [isVideoPlaying, setIsVideoPlaying] = useState(false);
    const [isJsonOpen, setIsJsonOpen] = useState(false);
    const [isCaptionsDialogOpen, setIsCaptionsDialogOpen] = useState(false);
    const lastEmittedStyleRef = useRef<string | null>(null);
    const isDesktop = useMediaQuery("(min-width: 1280px)");
    const isShortHeight = useMediaQuery("(max-height: 800px)");
    const shouldUseCaptionsDialog = !isDesktop || isShortHeight;

    useEffect(() => {
      const nextCaptions = captionsProp || [];
      setCaptions(nextCaptions);
      setBaseCaptionsForEdits(nextCaptions);
      setCaptionParagraphs(deriveParagraphsFromCaptions(nextCaptions));
    }, [captionsProp]);

    useEffect(() => {
      if (!styleProp?.captionsSettings) return;

      setSelectedPresetName((prev) =>
        prev === styleProp.captionsSettings.style.name
          ? prev
          : styleProp.captionsSettings.style.name,
      );
      setSettings((prev) => {
        const prevSerialized = JSON.stringify(prev);
        const nextSerialized = JSON.stringify(styleProp.captionsSettings);
        if (prevSerialized === nextSerialized) {
          return prev;
        }

        return clone(styleProp.captionsSettings);
      });
      setStyleId(
        styleProp.id ??
          getPresetStyle(styleProp.captionsSettings.style.name).id ??
          0,
      );
      setLayoutSettings((prev) => {
        const nextLayoutSettings =
          styleProp.layoutSettings ??
          getPresetStyle(styleProp.captionsSettings.style.name).layoutSettings ??
          DEFAULT_LAYOUT_SETTINGS;
        const prevSerialized = JSON.stringify(prev);
        const nextSerialized = JSON.stringify(nextLayoutSettings);
        if (prevSerialized === nextSerialized) {
          return prev;
        }

        return clone(nextLayoutSettings);
      });
    }, [styleProp]);

    const jsonRef = useRef<HTMLDivElement | null>(null);
    const currentStyle = useMemo(
      () => buildStylePreset(styleId, settings, layoutSettings),
      [buildStylePreset, layoutSettings, settings, styleId],
    );

    useImperativeHandle(
      ref,
      () => ({
        getCaptionsSettings: () => clone(settings),
        getSettings: () => clone(currentStyle),
        getStyle: () => clone(currentStyle),
        getStylePreset: () => clone(currentStyle),
        getCaptions: () => clone(captions),
      }),
      [captions, currentStyle, settings],
    );

    useEffect(() => {
      if (jsonRef.current && isJsonOpen) {
        jsonRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, [isJsonOpen]);

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const captionsInstance = useRef<ReturnType<typeof captionsjs> | null>(null);
    const seekToTime = useCallback((time: number) => {
      const video = videoRef.current;
      if (!video) return;

      const normalizedTime = Math.max(0, Number.isFinite(time) ? time : 0);
      const duration =
        Number.isFinite(video.duration) && video.duration > 0
          ? video.duration
          : null;
      const safeTime =
        duration === null
          ? normalizedTime
          : Math.min(normalizedTime, Math.max(duration - 0.01, 0));

      video.currentTime = safeTime;
      setCurrentTime(safeTime);
    }, []);

    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;
      const handleTimeUpdate = () => setCurrentTime(video.currentTime);
      const handlePlay = () => setIsVideoPlaying(true);
      const handlePause = () => setIsVideoPlaying(false);
      video.addEventListener("timeupdate", handleTimeUpdate);
      video.addEventListener("play", handlePlay);
      video.addEventListener("pause", handlePause);
      video.addEventListener("ended", handlePause);
      setIsVideoPlaying(!video.paused && !video.ended);
      handleTimeUpdate();
      return () => {
        video.removeEventListener("timeupdate", handleTimeUpdate);
        video.removeEventListener("play", handlePlay);
        video.removeEventListener("pause", handlePause);
        video.removeEventListener("ended", handlePause);
      };
    }, [videoRef.current]);

    const presetOptions = useMemo(
      () =>
        stylePresets.map((preset) => ({
          id: preset.id,
          label: preset.captionsSettings.style.name,
        })),
      [],
    );
    const settingsJson = useMemo(
      () => JSON.stringify(currentStyle, null, 2),
      [currentStyle],
    );
    const previewText = useMemo(() => {
      const words = captions
        .map((caption) => {
          if (typeof caption.word === "string" && caption.word.trim().length) {
            return caption.word.trim();
          }
          if (typeof (caption as any).text === "string") {
            return (caption as any).text.trim();
          }
          return "";
        })
        .filter(Boolean);
      return words.slice(0, 2).join(" ") || t(lang, "previewFallbackText");
    }, [captions, lang]);

    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;

      captionsInstance.current?.destroy();

      const presetPayload = { id: 0, captionsSettings: settings } as any;

      const instance = captionsjs({
        video,
        preset: presetPayload,
        captions,
        debug,
      });

      captionsInstance.current = instance;

      return () => {
        instance.destroy();
        captionsInstance.current = null;
      };
    }, [videoOption?.videoSrc, captions]);

    useEffect(() => {
      captionsInstance.current?.preset({
        id: 0,
        captionsSettings: settings,
      } as any);
    }, [settings]);

    useEffect(() => {
      if (!onChange && !onStyleChange) return;

      const serialized = JSON.stringify(currentStyle);
      if (serialized === lastEmittedStyleRef.current) return;

      lastEmittedStyleRef.current = serialized;
      onChange?.(clone(currentStyle));
      onStyleChange?.(clone(currentStyle));
    }, [currentStyle, onChange, onStyleChange]);

    useEffect(() => {
      captionsInstance.current?.captions(captions);
    }, [captions]);

    useEffect(() => {
      if (!videoOption?.captionsSrc) {
        return;
      }

      let cancelled = false;
      setCaptions([]);
      setBaseCaptionsForEdits([]);
      setCaptionParagraphs(null);

      const loadCaptions = async () => {
        if (!videoOption?.captionsSrc) {
          return;
        }

        try {
          const response = await fetch(videoOption.captionsSrc);
          if (!response.ok) {
            throw new Error(`Failed to fetch captions: ${response.statusText}`);
          }

          const data = await response.json();
          if (cancelled) return;

          const parsed: Caption[] = toCaptions(data);
          const parsedParagraphs = getParagraphs(data)?.map((paragraph) => ({
            start: paragraph.start,
            end: paragraph.end,
            speaker: paragraph.speaker,
          }));
          const derivedParagraphs = deriveParagraphsFromCaptions(parsed);

          setCaptions(parsed);
          setBaseCaptionsForEdits(parsed);
          setCaptionParagraphs(
            parsedParagraphs && parsedParagraphs.length > 0
              ? parsedParagraphs
              : derivedParagraphs,
          );
        } catch (error) {
          console.error(error);
          if (!cancelled) {
            setCaptions([]);
            setBaseCaptionsForEdits([]);
            setCaptionParagraphs(null);
          }
        }
      };

      void loadCaptions();

      return () => {
        cancelled = true;
      };
    }, [videoOption?.captionsSrc]);

    const updateSettingValue = (path: (string | number)[], value: unknown) => {
      setSettings((prev) => {
        const next = clone(prev);
        let cursor: any = next;
        for (let i = 0; i < path.length - 1; i++) {
          const key = path[i];
          cursor[key] = cursor[key] ?? {};
          cursor = cursor[key];
        }
        const lastKey = path[path.length - 1];
        if (value === undefined) {
          delete cursor[lastKey];
        } else {
          cursor[lastKey] = value;
        }
        return next;
      });
    };

    return (
      <div className={twMerge(`flex flex-col p-4 gap-4`, className)}>
        <div className="grid flex-1 grid-cols-1 gap-4 xl:grid-cols-[320px_minmax(0,1fr)_340px] h-full">
          <Card className="flex flex-col">
            <CardContent className="p-6">
              {/*   <Field>
              <FieldLabel>Aspect Ratio</FieldLabel>
              <Select
                value={aspectRatio.value}
                onValueChange={(val) => {
                  const option = aspectRatioOptions.find(
                    (item) => item.value === val
                  );
                  if (option) setAspectRatio(option);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {aspectRatioOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field> */}

              <div className="flex w-full justify-center items-center my-6">
                <PresetsCarousel
                  contentClassName={carouselContentClassName}
                  value={selectedPresetName}
                  previewText={previewText}
                  onSelect={(presetName) => {
                    const nextStyle = getPresetStyle(presetName);
                    setSelectedPresetName(presetName);
                    setStyleId(nextStyle.id);
                    setSettings(nextStyle.captionsSettings);
                    setLayoutSettings(nextStyle.layoutSettings);
                  }}
                />
              </div>
            </CardContent>
          </Card>
          <div className="flex min-h-0 flex-1 flex-col gap-4">
            <Card
              className={`flex flex-col overflow-hidden ${
                !shouldUseCaptionsDialog ? "xl:max-h-[60%]" : ""
              }`}
            >
              <CardContent className="relative flex flex-1 flex-col gap-4 overflow-hidden p-0 xl:p-6">
                <div
                  className="group relative rounded-xl overflow-hidden bg-black mx-auto"
                  /*  style={{ aspectRatio: aspectRatio.ratio }} */
                >
                  {!videoSrc && (
                    <div className="pointer-events-none absolute top-4 left-4 z-10 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
                      <VideoOptionSelect
                        // @ts-expect-error it can not be null
                        value={videoOption?.videoSrc}
                        onChange={(value) => {
                          const option = videoOptions.find(
                            (candidate) => candidate.videoSrc === value,
                          );
                          if (option) {
                            setVideoOption(option);
                          }
                        }}
                      />
                    </div>
                  )}
                  <video
                    playsInline
                    disablePictureInPicture
                    disableRemotePlayback
                    key={videoSrc || videoOption?.videoSrc}
                    ref={videoRef}
                    src={videoSrc || videoOption?.videoSrc}
                    controls
                    className="h-full w-full bg-black"
                  />
                </div>
              </CardContent>
            </Card>
            {shouldUseCaptionsDialog && (
              <div className="flex items-center justify-end">
                <Dialog
                  open={isCaptionsDialogOpen}
                  onOpenChange={setIsCaptionsDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      {captionsReadonly
                        ? t(lang, "viewCaptions")
                        : t(lang, "editCaptions")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="flex h-[80vh] max-w-[calc(100%-1.5rem)] flex-col gap-3 p-4 sm:h-[75vh] sm:max-w-4xl">
                    <DialogHeader>
                      <DialogTitle>{t(lang, "captionsTitle")}</DialogTitle>
                    </DialogHeader>
                    <CaptionsList
                      className={`min-h-0 flex-1 ${
                        captionsListClassName || ""
                      }`}
                      onCaptionsChange={setCaptions}
                      onParagraphSeek={seekToTime}
                      captions={captions}
                      baseCaptions={baseCaptionsForEdits}
                      paragraphs={captionParagraphs}
                      readonly={captionsReadonly}
                      currentTime={currentTime}
                      isPlaying={isVideoPlaying}
                      onEditsChange={onEditsChange}
                      lang={lang}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            )}
            {!shouldUseCaptionsDialog && (
              <CaptionsList
                className={`min-h-0 flex-1 ${captionsListClassName || ""}`}
                onCaptionsChange={setCaptions}
                onParagraphSeek={seekToTime}
                captions={captions}
                baseCaptions={baseCaptionsForEdits}
                paragraphs={captionParagraphs}
                readonly={captionsReadonly}
                currentTime={currentTime}
                isPlaying={isVideoPlaying}
                onEditsChange={onEditsChange}
                lang={lang}
              />
            )}
          </div>
          <CaptionsSettings
            settings={settings}
            lang={lang}
            scrollAreaClassName={scrollAreaClassName}
            onChange={updateSettingValue}
          />
        </div>
        {!hideFooter && (
          <Collapsible
            ref={jsonRef}
            open={isJsonOpen}
            onOpenChange={setIsJsonOpen}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between py-4">
                <CardTitle className="m-0">
                  {t(lang, "settingsJsonTitle")}
                </CardTitle>
                <div className="flex items-center gap-3">
                  <CopyButton
                    content={settingsJson}
                    size="sm"
                    variant="outline"
                    aria-label={t(lang, "copyCurrentCaptionJsonAria")}
                  />
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className="rounded-full border border-input bg-transparent p-1 text-muted-foreground transition hover:text-foreground"
                      aria-label={
                        isJsonOpen
                          ? t(lang, "hideCurrentCaptionJsonAria")
                          : t(lang, "showCurrentCaptionJsonAria")
                      }
                    >
                      <ChevronsUpDown
                        className={`h-4 w-4 transition-transform ${
                          isJsonOpen ? "rotate-180" : "rotate-0"
                        }`}
                      />
                    </button>
                  </CollapsibleTrigger>
                </div>
              </CardHeader>
              <CollapsibleContent className="data-[state=closed]:hidden">
                <CardContent className="h-full">
                  <Textarea
                    readOnly
                    className="resize-none font-mono text-xs"
                    value={settingsJson}
                    rows={30}
                  />
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}
      </div>
    );
  },
);

export default Configurator;
