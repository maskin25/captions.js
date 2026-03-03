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
  googleFontsList,
  stylePresets,
  toCaptions,
  getParagraphs,
} from "captions.js";
import { ChevronsUpDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Input } from "./ui/input";
import { Switch } from "./ui/switch";
import { Slider } from "./ui/slider";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Field, FieldLabel } from "./ui/field";
import {
  type AspectRatio,
  VideoOptionSelect,
  aspectRatioOptions,
  videoOptions,
  type VideoOption,
} from "./ConfiguratorLayoutControls";
import { ScrollArea } from "./ui/scroll-area";
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
import { STYLE_FIELDS } from "Configurator.config";
import PresetsCarousel from "components/PresetsCarousel";
import { CaptionsList } from "components/CaptionsList";
import { type Edits } from "components/caption-edits";
import useMediaQuery from "./hooks/use-media-query";
import {
  type ConfiguratorLang,
  t,
  translatePositionOption,
  translateStyleFieldLabel,
} from "./i18n";

type ConfiguratorCaptionsSettings =
  (typeof stylePresets)[number]["captionsSettings"];

type BaseStyleField = {
  path: (string | number)[];
  label: string;
};

type TextStyleField = BaseStyleField & {
  type: "text" | "color";
};

type NumberStyleField = BaseStyleField & {
  type: "number";
  min?: number;
  max?: number;
  step?: number;
};

type SelectStyleField = BaseStyleField & {
  type: "select";
  options: readonly string[];
};

type SwitchStyleField = BaseStyleField & {
  type: "switch";
};

type StyleField =
  | TextStyleField
  | NumberStyleField
  | SelectStyleField
  | SwitchStyleField;

type ConfiguratorProps = {
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
  getCaptions: () => Caption[];
};

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
      onStyleChange,
    },
    ref,
  ) => {
    const clone = <T,>(value: T): T =>
      typeof globalThis.structuredClone === "function"
        ? globalThis.structuredClone(value)
        : (JSON.parse(JSON.stringify(value)) as T);

    const getPresetSettings = (
      presetName: string,
    ): ConfiguratorCaptionsSettings => {
      const base =
        stylePresets.find((p) => p.captionsSettings.style.name === presetName)
          ?.captionsSettings || stylePresets[0]?.captionsSettings;
      return clone(base) as ConfiguratorCaptionsSettings;
    };

    const buildStylePreset = useCallback(
      (captionsSettings: ConfiguratorCaptionsSettings): StylePreset => {
        const nameFromSettings = captionsSettings.style.name;
        const matchedPreset =
          stylePresets.find(
            (preset) => preset.captionsSettings.style.name === nameFromSettings,
          ) ?? stylePresets[0];

        return {
          id: matchedPreset?.id ?? 0,
          captionsSettings: clone(captionsSettings),
          layoutSettings: clone(
            matchedPreset?.layoutSettings ?? DEFAULT_LAYOUT_SETTINGS,
          ),
        };
      },
      [],
    );

    const [selectedPresetName, setSelectedPresetName] = useState(
      styleProp?.captionsSettings.style.name ??
        stylePresets.find((p) => p.captionsSettings.style.name === "From")!
          .captionsSettings.style.name,
    );
    const [settings, setSettings] = useState<ConfiguratorCaptionsSettings>(() =>
      styleProp?.captionsSettings
        ? clone(styleProp.captionsSettings)
        : getPresetSettings(
            stylePresets.find((p) => p.captionsSettings.style.name === "From")!
              .captionsSettings.style.name,
          ),
    );
    const [videoOption, setVideoOption] = useState<VideoOption | undefined>(
      videoSrc ? undefined : videoOptions[0],
    );
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>(
      aspectRatioOptions[0],
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
    }, [styleProp]);

    const jsonRef = useRef<HTMLDivElement | null>(null);

    useImperativeHandle(
      ref,
      () => ({
        getCaptionsSettings: () => clone(settings),
        getCaptions: () => clone(captions),
      }),
      [captions, settings],
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
      () => JSON.stringify(settings, null, 2),
      [settings],
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
      if (!onStyleChange) return;

      const nextStyle = buildStylePreset(settings);
      const serialized = JSON.stringify(nextStyle);
      if (serialized === lastEmittedStyleRef.current) return;

      lastEmittedStyleRef.current = serialized;
      onStyleChange(nextStyle);
    }, [buildStylePreset, onStyleChange, settings]);

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
        cursor[path[path.length - 1]] = value;
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
                    setSelectedPresetName(presetName);
                    setSettings(getPresetSettings(presetName));
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
          <Card className="flex flex-col overflow-hidden">
            <CardContent className="p-6 flex flex-col h-full">
              <Tabs defaultValue="font" className="flex flex-col h-full">
                <TabsList className="grid grid-cols-2 mb-2 w-full">
                  <TabsTrigger value="font">{t(lang, "tabFont")}</TabsTrigger>
                  <TabsTrigger value="layout">{t(lang, "tabLayout")}</TabsTrigger>
                </TabsList>
                <ScrollArea
                  className={`-m-4 p-4 min-h-120 xl:min-h-none flex-1 ${scrollAreaClassName}`}
                >
                  <div className="px-2">
                    <TabsContent value="font" className="space-y-4">
                      {STYLE_FIELDS.filter((field) =>
                        String(field.path.join(".")).startsWith("style"),
                      ).map((field) => (
                        <StyleFieldInput
                          key={field.label}
                          field={field}
                          settings={settings}
                          onChange={updateSettingValue}
                          lang={lang}
                        />
                      ))}
                    </TabsContent>

                    <TabsContent value="layout" className="space-y-4">
                      {STYLE_FIELDS.filter(
                        (field) =>
                          !String(field.path.join(".")).startsWith("style"),
                      ).map((field) => (
                        <StyleFieldInput
                          key={field.label}
                          field={field}
                          settings={settings}
                          onChange={updateSettingValue}
                          lang={lang}
                        />
                      ))}
                    </TabsContent>
                  </div>
                </ScrollArea>
              </Tabs>
            </CardContent>
          </Card>
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

type StyleFieldInputProps = {
  field: StyleField;
  settings: ConfiguratorCaptionsSettings;
  onChange: (path: (string | number)[], value: unknown) => void;
  lang: ConfiguratorLang;
};

const StyleFieldInput = ({
  field,
  settings,
  onChange,
  lang,
}: StyleFieldInputProps) => {
  const value = field.path.reduce<any>((acc, key) => acc?.[key], settings);
  const parseHexColor = (color: unknown) => {
    if (typeof color !== "string") return null;
    const match = color.match(/^#([0-9a-fA-F]{6})([0-9a-fA-F]{2})?$/);
    if (!match) return null;
    return {
      hex: `#${match[1]}`,
      alpha: match[2]?.toUpperCase(),
    };
  };
  const parsedColor = field.type === "color" ? parseHexColor(value) : null;

  if (field.type === "switch") {
    return (
      <Field className="rounded-md border border-border px-3 py-2">
        <div className="flex items-center justify-between">
          <FieldLabel>{translateStyleFieldLabel(field.label, lang)}</FieldLabel>
          <Switch
            checked={Boolean(value)}
            onCheckedChange={(checked) => onChange(field.path, checked)}
          />
        </div>
      </Field>
    );
  }

  if (field.type === "number") {
    return (
      <Field>
        <FieldLabel>{translateStyleFieldLabel(field.label, lang)}</FieldLabel>
        <Slider
          className="mb-2"
          value={[Number(value) || 0]}
          min={field.min ?? 0}
          max={field.max ?? 100}
          step={field.step ?? 1}
          onValueChange={([next]) => onChange(field.path, next)}
        />
        <Input
          type="number"
          value={value ?? ""}
          onChange={(event) => onChange(field.path, Number(event.target.value))}
        />
      </Field>
    );
  }

  if (field.type === "color") {
    const colorValue = parsedColor?.hex ?? "#000000";
    const alphaSuffix = parsedColor?.alpha ?? "FF";

    return (
      <Field>
        <FieldLabel>{translateStyleFieldLabel(field.label, lang)}</FieldLabel>
        <Input
          type="color"
          value={colorValue}
          onChange={(event) =>
            onChange(field.path, `${event.target.value}${alphaSuffix}`)
          }
        />
      </Field>
    );
  }

  if (field.type === "select") {
    const isPositionField = String(field.path.join(".")) === "position";
    return (
      <Field>
        <FieldLabel>{translateStyleFieldLabel(field.label, lang)}</FieldLabel>
        <Select
          value={typeof value === "string" ? value : undefined}
          onValueChange={(nextValue) => onChange(field.path, nextValue)}
        >
          <SelectTrigger>
            <SelectValue placeholder={t(lang, "selectFontFamilyPlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            {field.options.map((option) => (
              <SelectItem key={option} value={option}>
                {isPositionField
                  ? translatePositionOption(option, lang)
                  : option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    );
  }

  const inputValue = value ?? "";

  return (
    <Field>
      <FieldLabel>{translateStyleFieldLabel(field.label, lang)}</FieldLabel>
      <Input
        type={field.type}
        value={inputValue}
        onChange={(event) => onChange(field.path, event.target.value)}
      />
    </Field>
  );
};

export default Configurator;
