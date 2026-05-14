import type { StylePreset } from "captions.js";
import { STYLE_FIELDS, type StyleField } from "Configurator.config";
import {
  t,
  type ConfiguratorLang,
  translatePositionOption,
  translateStyleFieldLabel,
} from "../i18n";
import { Card, CardContent } from "../ui/card";
import { Field, FieldLabel } from "../ui/field";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Slider } from "../ui/slider";
import { Switch } from "../ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

type CaptionsSettingsValue = StylePreset["captionsSettings"];

type ShadowSettings = {
  fontShadowColor: string;
  fontShadowBlur: number;
  fontShadowOffsetX: number;
  fontShadowOffsetY: number;
};

type StrokeSettings = {
  fontStrokeColor: string;
  fontStrokeWidth: number;
};

export type CaptionsSettingsProps = {
  settings: CaptionsSettingsValue;
  lang: ConfiguratorLang;
  scrollAreaClassName?: string;
  onChange: (path: (string | number)[], value: unknown) => void;
};

const DEFAULT_SHADOW_SETTINGS: ShadowSettings = {
  fontShadowColor: "#000000FF",
  fontShadowBlur: 0,
  fontShadowOffsetX: 2,
  fontShadowOffsetY: 2,
};

const DEFAULT_STROKE_SETTINGS: StrokeSettings = {
  fontStrokeColor: "#000000FF",
  fontStrokeWidth: 1,
};

const isStyleTabField = (field: StyleField) =>
  field.path[0] === "style" || field.path[0] === "animation";

const parseHexColor = (color: unknown) => {
  if (typeof color !== "string") return null;
  const match = color.match(/^#([0-9a-fA-F]{6})([0-9a-fA-F]{2})?$/);
  if (!match) return null;
  return {
    hex: `#${match[1]}`,
    alpha: match[2]?.toUpperCase(),
  };
};

const getFieldValue = (
  settings: CaptionsSettingsValue,
  path: (string | number)[],
) => path.reduce<any>((acc, key) => acc?.[key], settings);

const NumberFieldInput = ({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: unknown;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
}) => (
  <Field>
    <FieldLabel>{label}</FieldLabel>
    <Slider
      className="mb-2"
      value={[Number(value) || 0]}
      min={min ?? 0}
      max={max ?? 100}
      step={step ?? 1}
      onValueChange={([next]) => onChange(next)}
    />
    <Input
      type="number"
      value={
        typeof value === "number" || typeof value === "string" ? value : ""
      }
      onChange={(event) => onChange(Number(event.target.value))}
    />
  </Field>
);

const CaptionsSettings = ({
  settings,
  lang,
  scrollAreaClassName,
  onChange,
}: CaptionsSettingsProps) => (
  <Card className="flex flex-col overflow-hidden">
    <CardContent className="p-6 flex flex-col h-full">
      <Tabs defaultValue="style" className="flex flex-col h-full">
        <TabsList className="grid grid-cols-2 mb-2 w-full">
          <TabsTrigger value="style">{t(lang, "tabFont")}</TabsTrigger>
          <TabsTrigger value="layout">{t(lang, "tabLayout")}</TabsTrigger>
        </TabsList>
        <ScrollArea
          className={`-m-4 p-4 min-h-60 flex-1 ${scrollAreaClassName}`}
        >
          <div className="px-2">
            <TabsContent value="style" className="space-y-4">
              {STYLE_FIELDS.filter(isStyleTabField).map((field) => (
                <StyleFieldInput
                  key={field.label}
                  field={field}
                  settings={settings}
                  onChange={onChange}
                  lang={lang}
                />
              ))}
            </TabsContent>

            <TabsContent value="layout" className="space-y-4">
              {STYLE_FIELDS.filter((field) => !isStyleTabField(field)).map(
                (field) => (
                  <StyleFieldInput
                    key={field.label}
                    field={field}
                    settings={settings}
                    onChange={onChange}
                    lang={lang}
                  />
                ),
              )}
            </TabsContent>
          </div>
        </ScrollArea>
      </Tabs>
    </CardContent>
  </Card>
);

type StyleFieldInputProps = {
  field: StyleField;
  settings: CaptionsSettingsValue;
  onChange: (path: (string | number)[], value: unknown) => void;
  lang: ConfiguratorLang;
};

const StyleFieldInput = ({
  field,
  settings,
  onChange,
  lang,
}: StyleFieldInputProps) => {
  const value = getFieldValue(settings, field.path);

  if (field.type === "stroke") {
    const font = value && typeof value === "object" ? (value as any) : {};
    const hasStroke =
      typeof font.fontStrokeWidth === "number" && font.fontStrokeWidth > 0;
    const stroke: StrokeSettings = {
      fontStrokeColor:
        typeof font.fontStrokeColor === "string"
          ? font.fontStrokeColor
          : DEFAULT_STROKE_SETTINGS.fontStrokeColor,
      fontStrokeWidth: hasStroke
        ? font.fontStrokeWidth
        : DEFAULT_STROKE_SETTINGS.fontStrokeWidth,
    };
    const parsedColor = parseHexColor(stroke.fontStrokeColor);
    const colorValue = parsedColor?.hex ?? "#000000";
    const alphaSuffix = parsedColor?.alpha ?? "FF";
    const updateStroke = (patch: Partial<StrokeSettings>) => {
      onChange([...field.path, "fontStrokeColor"], stroke.fontStrokeColor);
      onChange([...field.path, "fontStrokeWidth"], stroke.fontStrokeWidth);
      Object.entries(patch).forEach(([key, next]) => {
        onChange([...field.path, key], next);
      });
    };

    return (
      <Field className="rounded-md border border-border px-3 py-2">
        <div className="flex items-center justify-between">
          <FieldLabel>{translateStyleFieldLabel(field.label, lang)}</FieldLabel>
          <Switch
            checked={hasStroke}
            onCheckedChange={(checked) => {
              if (checked) {
                onChange(
                  [...field.path, "fontStrokeColor"],
                  font.fontStrokeColor ?? DEFAULT_STROKE_SETTINGS.fontStrokeColor,
                );
                onChange(
                  [...field.path, "fontStrokeWidth"],
                  font.fontStrokeWidth && font.fontStrokeWidth > 0
                    ? font.fontStrokeWidth
                    : DEFAULT_STROKE_SETTINGS.fontStrokeWidth,
                );
                return;
              }

              onChange([...field.path, "fontStrokeColor"], undefined);
              onChange([...field.path, "fontStrokeWidth"], undefined);
            }}
          />
        </div>

        {hasStroke ? (
          <div className="mt-4 space-y-4 border-t border-border pt-4">
            <Field>
              <FieldLabel>
                {translateStyleFieldLabel("Stroke Color", lang)}
              </FieldLabel>
              <Input
                type="color"
                value={colorValue}
                onChange={(event) =>
                  updateStroke({
                    fontStrokeColor: `${event.target.value}${alphaSuffix}`,
                  })
                }
              />
            </Field>
            <NumberFieldInput
              label={translateStyleFieldLabel("Stroke Width", lang)}
              value={stroke.fontStrokeWidth}
              min={0}
              max={10}
              step={1}
              onChange={(next) => updateStroke({ fontStrokeWidth: next })}
            />
          </div>
        ) : null}
      </Field>
    );
  }

  if (field.type === "shadow") {
    const shadow =
      value && typeof value === "object"
        ? ({
            ...DEFAULT_SHADOW_SETTINGS,
            ...(value as Partial<ShadowSettings>),
          } as ShadowSettings)
        : null;
    const parsedColor = parseHexColor(shadow?.fontShadowColor);
    const colorValue = parsedColor?.hex ?? "#000000";
    const alphaSuffix = parsedColor?.alpha ?? "FF";
    const updateShadow = (patch: Partial<ShadowSettings>) => {
      onChange(field.path, {
        ...(shadow ?? DEFAULT_SHADOW_SETTINGS),
        ...patch,
      });
    };

    return (
      <Field className="rounded-md border border-border px-3 py-2">
        <div className="flex items-center justify-between">
          <FieldLabel>{translateStyleFieldLabel(field.label, lang)}</FieldLabel>
          <Switch
            checked={Boolean(shadow)}
            onCheckedChange={(checked) =>
              onChange(
                field.path,
                checked ? { ...DEFAULT_SHADOW_SETTINGS } : undefined,
              )
            }
          />
        </div>

        {shadow ? (
          <div className="mt-4 space-y-4 border-t border-border pt-4">
            <Field>
              <FieldLabel>
                {translateStyleFieldLabel("Shadow Color", lang)}
              </FieldLabel>
              <Input
                type="color"
                value={colorValue}
                onChange={(event) =>
                  updateShadow({
                    fontShadowColor: `${event.target.value}${alphaSuffix}`,
                  })
                }
              />
            </Field>
            <NumberFieldInput
              label={translateStyleFieldLabel("Shadow Blur", lang)}
              value={shadow.fontShadowBlur}
              min={0}
              max={40}
              step={1}
              onChange={(next) => updateShadow({ fontShadowBlur: next })}
            />
            <NumberFieldInput
              label={translateStyleFieldLabel("Shadow X Offset", lang)}
              value={shadow.fontShadowOffsetX}
              min={-20}
              max={20}
              step={1}
              onChange={(next) => updateShadow({ fontShadowOffsetX: next })}
            />
            <NumberFieldInput
              label={translateStyleFieldLabel("Shadow Y Offset", lang)}
              value={shadow.fontShadowOffsetY}
              min={-20}
              max={20}
              step={1}
              onChange={(next) => updateShadow({ fontShadowOffsetY: next })}
            />
          </div>
        ) : null}
      </Field>
    );
  }

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
      <NumberFieldInput
        label={translateStyleFieldLabel(field.label, lang)}
        value={value}
        min={field.min}
        max={field.max}
        step={field.step}
        onChange={(next) => onChange(field.path, next)}
      />
    );
  }

  if (field.type === "color") {
    const parsedColor = parseHexColor(value);
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

export default CaptionsSettings;
