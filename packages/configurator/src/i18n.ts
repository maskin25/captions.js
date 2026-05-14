import i18next from "i18next";

export type ConfiguratorLang = "en" | "ru";

const FIELD_LABEL_KEY_BY_LABEL: Record<string, string> = {
  "Font Family": "styleFieldLabel.fontFamily",
  "Font Size": "styleFieldLabel.fontSize",
  "Font Weight": "styleFieldLabel.fontWeight",
  "Font Color": "styleFieldLabel.fontColor",
  Stroke: "styleFieldLabel.stroke",
  "Stroke Color": "styleFieldLabel.strokeColor",
  "Stroke Width": "styleFieldLabel.strokeWidth",
  Capitalize: "styleFieldLabel.capitalize",
  Italic: "styleFieldLabel.italic",
  Underline: "styleFieldLabel.underline",
  Shadow: "styleFieldLabel.shadow",
  "Shadow Color": "styleFieldLabel.shadowColor",
  "Shadow Blur": "styleFieldLabel.shadowBlur",
  "Shadow X Offset": "styleFieldLabel.shadowXOffset",
  "Shadow Y Offset": "styleFieldLabel.shadowYOffset",
  "Highlighted Word Color": "styleFieldLabel.highlightedWordColor",
  "Background Color": "styleFieldLabel.backgroundColor",
  Position: "styleFieldLabel.position",
  "Top Offset": "styleFieldLabel.topOffset",
  Animation: "styleFieldLabel.animation",
  "Lines Per Page": "styleFieldLabel.linesPerPage",
  "Line Spacing": "styleFieldLabel.lineSpacing",
};

const POSITION_OPTION_KEY_BY_VALUE: Record<string, string> = {
  auto: "positionOption.auto",
  top: "positionOption.top",
  middle: "positionOption.middle",
  bottom: "positionOption.bottom",
};

const resources = {
  en: {
    translation: {
      previewFallbackText: "The quick brown fox jumps",
      editCaptions: "Edit captions",
      viewCaptions: "View captions",
      captionsTitle: "Captions",
      tabFont: "Style",
      tabLayout: "Layout",
      settingsJsonTitle: "Settings JSON",
      copyCurrentCaptionJsonAria: "Copy current caption JSON",
      showCurrentCaptionJsonAria: "Show current caption JSON",
      hideCurrentCaptionJsonAria: "Hide current caption JSON",
      selectFontFamilyPlaceholder: "Select font family",
      captionsListParagraphs: "Paragraphs",
      captionsListWords: "Words",
      copyCaptionsAria: "Copy captions",
      captionFormTitle: "Edit caption",
      captionFormDescription:
        "Update the word and highlight color. Clear the word to create a gap.",
      captionFormWord: "Word",
      captionFormWordPlaceholder: "Type the caption word",
      captionFormClearWordAria: "Clear word",
      captionFormHighlightColor: "Highlight color",
      captionFormHighlightColorAria: "Highlight color",
      clear: "Clear",
      cancel: "Cancel",
      saveChanges: "Save changes",
      positionOption: {
        auto: "Auto",
        top: "Top",
        middle: "Middle",
        bottom: "Bottom",
      },
      styleFieldLabel: {
        fontFamily: "Font Family",
        fontSize: "Font Size",
        fontWeight: "Font Weight",
        fontColor: "Font Color",
        stroke: "Stroke",
        strokeColor: "Stroke Color",
        strokeWidth: "Stroke Width",
        capitalize: "Capitalize",
        italic: "Italic",
        underline: "Underline",
        shadow: "Shadow",
        shadowColor: "Shadow Color",
        shadowBlur: "Shadow Blur",
        shadowXOffset: "Shadow X Offset",
        shadowYOffset: "Shadow Y Offset",
        highlightedWordColor: "Highlighted Word Color",
        backgroundColor: "Background Color",
        position: "Position",
        topOffset: "Top Offset",
        animation: "Animation",
        linesPerPage: "Lines Per Page",
        lineSpacing: "Line Spacing",
      },
    },
  },
  ru: {
    translation: {
      previewFallbackText: "Быстрая лиса",
      editCaptions: "Редактировать субтитры",
      viewCaptions: "Посмотреть субтитры",
      captionsTitle: "Субтитры",
      tabFont: "Стиль",
      tabLayout: "Макет",
      settingsJsonTitle: "JSON настроек",
      copyCurrentCaptionJsonAria: "Скопировать текущий JSON субтитров",
      showCurrentCaptionJsonAria: "Показать текущий JSON субтитров",
      hideCurrentCaptionJsonAria: "Скрыть текущий JSON субтитров",
      selectFontFamilyPlaceholder: "Выберите семейство шрифта",
      captionsListParagraphs: "Параграфы",
      captionsListWords: "Слова",
      copyCaptionsAria: "Скопировать субтитры",
      captionFormTitle: "Редактировать субтитры",
      captionFormDescription:
        "Измените слово и цвет подсветки. Очистите слово, чтобы создать паузу.",
      captionFormWord: "Слово",
      captionFormWordPlaceholder: "Введите слово субтитра",
      captionFormClearWordAria: "Очистить слово",
      captionFormHighlightColor: "Цвет подсветки",
      captionFormHighlightColorAria: "Цвет подсветки",
      clear: "Очистить",
      cancel: "Отмена",
      saveChanges: "Сохранить изменения",
      positionOption: {
        auto: "Авто",
        top: "Сверху",
        middle: "По центру",
        bottom: "Снизу",
      },
      styleFieldLabel: {
        fontFamily: "Семейство шрифта",
        fontSize: "Размер шрифта",
        fontWeight: "Насыщенность шрифта",
        fontColor: "Цвет шрифта",
        stroke: "Обводка",
        strokeColor: "Цвет обводки",
        strokeWidth: "Толщина обводки",
        capitalize: "Заглавные буквы",
        italic: "Курсив",
        underline: "Подчёркивание",
        shadow: "Тень",
        shadowColor: "Цвет тени",
        shadowBlur: "Размытие тени",
        shadowXOffset: "Смещение тени по X",
        shadowYOffset: "Смещение тени по Y",
        highlightedWordColor: "Цвет подсвеченного слова",
        backgroundColor: "Цвет фона",
        position: "Позиция",
        topOffset: "Верхний отступ",
        animation: "Анимация",
        linesPerPage: "Строк на странице",
        lineSpacing: "Межстрочный интервал",
      },
    },
  },
} as const;

let i18nReady = false;

const ensureI18n = () => {
  if (i18nReady) return;

  i18next.init({
    resources,
    lng: "en",
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    initImmediate: false,
  });

  i18nReady = true;
};

export const normalizeConfiguratorLang = (
  value: string | undefined,
): ConfiguratorLang => {
  if (!value) return "en";
  return value.toLowerCase().startsWith("ru") ? "ru" : "en";
};

export const t = (lang: string | undefined, key: string): string => {
  ensureI18n();
  return i18next.t(key, { lng: normalizeConfiguratorLang(lang) });
};

export const translateStyleFieldLabel = (
  label: string,
  lang: string | undefined,
): string => {
  const key = FIELD_LABEL_KEY_BY_LABEL[label];
  if (!key) return label;
  return t(lang, key);
};

export const translatePositionOption = (
  option: string,
  lang: string | undefined,
): string => {
  const key = POSITION_OPTION_KEY_BY_VALUE[option];
  if (!key) return option;
  return t(lang, key);
};
