import { useEffect, useMemo, useRef, useState } from "react";
import captionsjs, {
  type Caption,
  googleFontsList,
  stylePresets,
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
import { CopyButton } from "./ui/shadcn-io/copy-button";
import { twMerge } from "tailwind-merge";

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

const POSITION_OPTIONS = ["auto", "top", "middle", "bottom"] as const;

const STYLE_FIELDS: StyleField[] = [
  /* { path: ["style", "name"], label: "Preset Name", type: "text" }, */
  {
    path: ["style", "font", "fontFamily"],
    label: "Font Family",
    type: "select",
    options: googleFontsList,
  },
  {
    path: ["style", "font", "fontSize"],
    label: "Font Size",
    type: "number",
    min: 10,
    max: 120,
    step: 1,
  },
  {
    path: ["style", "font", "fontColor"],
    label: "Font Color",
    type: "color",
  },
  {
    path: ["style", "font", "fontStrokeColor"],
    label: "Stroke Color",
    type: "color",
  },
  {
    path: ["style", "font", "fontStrokeWidth"],
    label: "Stroke Width",
    type: "number",
    min: 0,
    max: 10,
    step: 1,
  },
  {
    path: ["style", "font", "fontCapitalize"],
    label: "Capitalize",
    type: "switch",
  },
  { path: ["style", "font", "italic"], label: "Italic", type: "switch" },
  { path: ["style", "font", "underline"], label: "Underline", type: "switch" },
  {
    path: ["style", "font", "shadow", "fontShadowColor"],
    label: "Shadow Color",
    type: "color",
  },
  {
    path: ["style", "font", "shadow", "fontShadowBlur"],
    label: "Shadow Blur",
    type: "number",
    min: 0,
    max: 40,
    step: 1,
  },
  {
    path: ["style", "font", "shadow", "fontShadowOffsetX"],
    label: "Shadow X Offset",
    type: "number",
    min: -20,
    max: 20,
    step: 1,
  },
  {
    path: ["style", "font", "shadow", "fontShadowOffsetY"],
    label: "Shadow Y Offset",
    type: "number",
    min: -20,
    max: 20,
    step: 1,
  },
  {
    path: ["style", "aplifiedWordColor"],
    label: "Highlighted Word Color",
    type: "color",
  },
  {
    path: ["style", "backgroundColor"],
    label: "Background Color",
    type: "color",
  },
  {
    path: ["position"],
    label: "Position",
    type: "select",
    options: POSITION_OPTIONS,
  },
  {
    path: ["positionTopOffset"],
    label: "Top Offset",
    type: "number",
    min: 0,
    max: 200,
  },
  {
    path: ["linesPerPage"],
    label: "Lines Per Page",
    type: "number",
    min: 1,
    max: 4,
  },
];

const Configurator = ({ className }: { className?: string }) => {
  const clone = <T,>(value: T): T =>
    typeof globalThis.structuredClone === "function"
      ? globalThis.structuredClone(value)
      : (JSON.parse(JSON.stringify(value)) as T);

  const getPresetSettings = (
    presetId: number
  ): ConfiguratorCaptionsSettings => {
    const base =
      stylePresets.find((p) => p.id === presetId)?.captionsSettings ||
      stylePresets[0]?.captionsSettings;
    return clone(base) as ConfiguratorCaptionsSettings;
  };

  const [selectedPresetId, setSelectedPresetId] = useState(
    stylePresets.find((p) => p.captionsSettings.style.name === "From")?.id ?? 0
  );
  const [settings, setSettings] = useState<ConfiguratorCaptionsSettings>(() =>
    getPresetSettings(
      stylePresets.find((p) => p.captionsSettings.style.name === "From")?.id ??
        0
    )
  );
  const [videoOption, setVideoOption] = useState<VideoOption>(videoOptions[0]);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(
    aspectRatioOptions[0]
  );
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [isJsonOpen, setIsJsonOpen] = useState(false);

  const jsonRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (jsonRef.current && isJsonOpen) {
      jsonRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [isJsonOpen]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const captionsInstance = useRef<ReturnType<typeof captionsjs> | null>(null);

  const presetOptions = useMemo(
    () =>
      stylePresets.map((preset) => ({
        id: preset.id,
        label: preset.captionsSettings.style.name,
      })),
    []
  );
  const settingsJson = useMemo(
    () => JSON.stringify(settings, null, 2),
    [settings]
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    captionsInstance.current?.destroy();
    const nodeEnv =
      typeof globalThis === "object" &&
      typeof (globalThis as Record<string, any>).process === "object"
        ? (globalThis as Record<string, any>).process?.env?.NODE_ENV
        : undefined;
    const isDev = nodeEnv !== "production";

    const presetPayload = { id: 0, captionsSettings: settings } as any;

    const instance = captionsjs({
      video,
      preset: presetPayload,
      captions,
      debug: isDev,
    });

    captionsInstance.current = instance;

    return () => {
      instance.destroy();
      captionsInstance.current = null;
    };
  }, [videoOption.videoSrc]);

  useEffect(() => {
    captionsInstance.current?.preset({
      id: 0,
      captionsSettings: settings,
    } as any);
  }, [settings]);

  useEffect(() => {
    captionsInstance.current?.captions(captions);
  }, [captions]);

  useEffect(() => {
    let cancelled = false;
    setCaptions([]);

    const loadCaptions = async () => {
      try {
        const response = await fetch(videoOption.captionsSrc);
        if (!response.ok) {
          throw new Error(`Failed to fetch captions: ${response.statusText}`);
        }

        const data = await response.json();
        if (cancelled) return;

        const parsed: Caption[] = Array.isArray(data)
          ? data
              .map((entry: any) => ({
                word: String(entry.word ?? entry.text ?? entry.value ?? ""),
                startTime: Number(entry.startTime ?? entry.start ?? 0),
                endTime: Number(entry.endTime ?? entry.end ?? 0),
              }))
              .filter((item) => item.word)
          : [];

        setCaptions(parsed);
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          setCaptions([]);
        }
      }
    };

    void loadCaptions();

    return () => {
      cancelled = true;
    };
  }, [videoOption.captionsSrc]);

  const handlePresetChange = (presetId: number) => {
    const preset = stylePresets.find((p) => p.id === presetId);
    if (!preset) return;

    setSelectedPresetId(presetId);
    setSettings(getPresetSettings(presetId));
  };

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
        <Card className="flex flex-col overflow-hidden">
          <CardContent className="p-6 space-y-4 overflow-y-auto">
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

            <VideoOptionSelect
              value={videoOption.videoSrc}
              onChange={(value) => {
                const option = videoOptions.find(
                  (candidate) => candidate.videoSrc === value
                );
                if (option) {
                  setVideoOption(option);
                }
              }}
            />

            <Field>
              <FieldLabel>Style Preset</FieldLabel>
              <Select
                value={String(selectedPresetId)}
                onValueChange={(value) => handlePresetChange(Number(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select preset" />
                </SelectTrigger>
                <SelectContent>
                  {presetOptions.map((preset) => (
                    <SelectItem key={preset.id} value={String(preset.id)}>
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </CardContent>
        </Card>

        <Card className="flex flex-col overflow-hidden">
          <CardContent className="p-0 xl:p-6 flex flex-1 flex-col gap-4 overflow-hidden">
            <div
              className="relative rounded-xl overflow-hidden max-w-full bg-black mx-auto"
              style={{ aspectRatio: aspectRatio.ratio }}
            >
              <video
                playsInline
                disablePictureInPicture
                disableRemotePlayback
                key={videoOption.videoSrc}
                ref={videoRef}
                src={videoOption.videoSrc}
                controls
                className="h-full w-full bg-black"
              />
            </div>
          </CardContent>
        </Card>
        <Card className="flex flex-col overflow-hidden">
          <CardContent className="p-6 flex flex-col h-full">
            <Tabs defaultValue="font" className="flex flex-col h-full">
              <TabsList className="grid grid-cols-2 mb-2 w-full">
                <TabsTrigger value="font">Font</TabsTrigger>
                <TabsTrigger value="layout">Layout</TabsTrigger>
              </TabsList>
              <ScrollArea className={`-m-4 p-4 min-h-120 xl:min-h-none h-full`}>
                <div className="px-2">
                  <TabsContent value="font" className="space-y-4">
                    {STYLE_FIELDS.filter((field) =>
                      String(field.path.join(".")).startsWith("style")
                    ).map((field) => (
                      <StyleFieldInput
                        key={field.label}
                        field={field}
                        settings={settings}
                        onChange={updateSettingValue}
                      />
                    ))}
                  </TabsContent>

                  <TabsContent value="layout" className="mt-4 space-y-4">
                    {STYLE_FIELDS.filter(
                      (field) =>
                        !String(field.path.join(".")).startsWith("style")
                    ).map((field) => (
                      <StyleFieldInput
                        key={field.label}
                        field={field}
                        settings={settings}
                        onChange={updateSettingValue}
                      />
                    ))}
                  </TabsContent>
                </div>
              </ScrollArea>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <Collapsible ref={jsonRef} open={isJsonOpen} onOpenChange={setIsJsonOpen}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <CardTitle className="m-0">Captions Settings</CardTitle>
            <div className="flex items-center gap-3">
              <CopyButton
                content={settingsJson}
                size="sm"
                variant="outline"
                aria-label="Copy current caption JSON"
              />
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="rounded-full border border-input bg-transparent p-1 text-muted-foreground transition hover:text-foreground"
                  aria-label={`${
                    isJsonOpen ? "Hide" : "Show"
                  } current caption JSON`}
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
    </div>
  );
};

type StyleFieldInputProps = {
  field: StyleField;
  settings: ConfiguratorCaptionsSettings;
  onChange: (path: (string | number)[], value: unknown) => void;
};

const StyleFieldInput = ({
  field,
  settings,
  onChange,
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
          <FieldLabel>{field.label}</FieldLabel>
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
        <FieldLabel>{field.label}</FieldLabel>
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
        <FieldLabel>{field.label}</FieldLabel>
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
    return (
      <Field>
        <FieldLabel>{field.label}</FieldLabel>
        <Select
          value={typeof value === "string" ? value : undefined}
          onValueChange={(nextValue) => onChange(field.path, nextValue)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select font family" />
          </SelectTrigger>
          <SelectContent>
            {field.options.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
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
      <FieldLabel>{field.label}</FieldLabel>
      <Input
        type={field.type}
        value={inputValue}
        onChange={(event) => onChange(field.path, event.target.value)}
      />
    </Field>
  );
};

export default Configurator;
