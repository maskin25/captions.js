export { default as Configurator } from "./Configurator";
export { default as PresetsCarousel } from "components/PresetsCarousel";
export { default as CaptionsSettings } from "components/CaptionsSettings";
export type { CaptionsSettingsProps } from "components/CaptionsSettings";
export type {
  ConfiguratorCaptionsSettings,
  ConfiguratorHandle,
  ConfiguratorProps,
  ConfiguratorStylePreset,
} from "./Configurator";
export type { ConfiguratorLang } from "./i18n";
export type { AspectRatio, VideoOption } from "./ConfiguratorLayoutControls";
export { VideoOptionSelect, videoOptions } from "./ConfiguratorLayoutControls";
export {
  applyEdits,
  buildEdits,
  createEmptyEdits,
  getCaptionEditId,
  type CaptionEditPatch,
  type Edits,
} from "components/caption-edits";
