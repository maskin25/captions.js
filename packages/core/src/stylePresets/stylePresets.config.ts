import { CaptionsSettings } from "../entities/captions/captions.types";

/**
 * Shared schema describing how a preset styles captions plus rough layout hints.
 *
 * @public
 */
export interface StylePreset {
  id: number;
  captionsSettings: CaptionsSettings;
  layoutSettings: {
    aspectRatio: string;
    aIAutoLayout: string[];
    fitLayoutAspectRatio: string;
  };
}

/**
 * Names of all available style presets.
 */

export type StylePresetName =
  | "Karaoke"
  | "Banger"
  | "Acid"
  | "Lovly"
  | "Marvel"
  | "Marker"
  | "Neon Pulse"
  | "Beasty"
  | "Crazy"
  | "Safari"
  | "Popline"
  | "Desert"
  | "Hook"
  | "Sky"
  | "Flamingo"
  | "Deep Diver B&W"
  | "New"
  | "Catchy"
  | "From"
  | "Classic"
  | "Classic Big"
  | "Old Money"
  | "Cinema"
  | "Midnight Serif"
  | "Aurora Ink";

/**
 * Curated set of presets that ship with captions.js out of the box.
 *
 * @remarks
 * Downstream apps can reference them directly or clone/extend as needed.
 *
 * @public
 */
export const stylePresets: StylePreset[] = [
  {
    id: 1,
    captionsSettings: {
      style: {
        font: {
          italic: false,
          fontSize: 20,
          fontColor: "#ffffffFF",
          underline: false,
          fontFamily: "Rubik",
          fontWeight: "black",
          fontCapitalize: true,
          fontStrokeColor: "#000000FF",
          fontStrokeWidth: 60,
        },
        name: "Karaoke",
        backgroundColor: "#E4E4E4FF",
        verticalCoverImg:
          "https://cdn.shorty.plus/captions-preview/karaoke_preview.png",
        aplifiedWordColor: "#24deff",
      },
      position: "bottom",
      animation: "bounce",
      linesPerPage: 2,
    },
    layoutSettings: {
      aspectRatio: "9:16",
      aIAutoLayout: ["fill", "fit", "split", "three", "four", "screenShare"],
      fitLayoutAspectRatio: "original",
    },
  },
  {
    id: 2,
    captionsSettings: {
      style: {
        font: {
          italic: false,
          fontSize: 30,
          fontColor: "#ffffffFF",
          underline: false,
          fontFamily: "Oswald",
          fontWeight: "bold",
          fontCapitalize: true,
          fontStrokeColor: "#000000ff",
          fontStrokeWidth: 60,
        },
        name: "Banger",
        backgroundColor: "#E4E4E4FF",
        verticalCoverImg:
          "https://cdn.shorty.plus/captions-preview/beasty_preview.png",
        aplifiedWordColor: "#fdfa14ff",
      },
      position: "bottom",
      animation: "pop",
      linesPerPage: 1,
    },
    layoutSettings: {
      aspectRatio: "9:16",
      aIAutoLayout: ["fill", "fit", "split", "three", "four", "screenShare"],
      fitLayoutAspectRatio: "original",
    },
  },
  {
    id: 3,
    captionsSettings: {
      style: {
        font: {
          italic: false,
          fontSize: 28,
          fontColor: "#817B81FF",
          underline: false,
          fontFamily: "PT Sans",
          fontWeight: "black",
          fontCapitalize: false,
          fontStrokeColor: "#000000FF",
          fontStrokeWidth: 0,
        },
        name: "Acid",
        backgroundColor: "#00000000",
        verticalCoverImg:
          "https://cdn.shorty.plus/captions-preview/aciv_preview.png",
        aplifiedWordColor: "#6BF5C7FF",
      },
      position: "bottom",
      animation: "none",
      linesPerPage: 1,
      positionTopOffset: 42,
    },
    layoutSettings: {
      aspectRatio: "9:16",
      aIAutoLayout: ["fill", "fit", "split", "three", "four", "screenShare"],
      fitLayoutAspectRatio: "original",
    },
  },
  {
    id: 4,
    captionsSettings: {
      style: {
        font: {
          italic: false,
          shadow: {
            fontShadowBlur: 1,
            fontShadowColor: "0",
            fontShadowOffsetX: 2,
            fontShadowOffsetY: 2,
          },
          fontSize: 25,
          fontColor: "#ffffffff",
          underline: false,
          fontFamily: "Pacifico",
          fontWeight: "medium",
          fontCapitalize: false,
          fontStrokeColor: "#000000FF",
          fontStrokeWidth: 0,
        },
        name: "Lovly",
        backgroundColor: "#00000000",
        verticalCoverImg:
          "https://cdn.shorty.plus/captions-preview/aciv_preview.png",
        aplifiedWordColor: "#f866cfff",
      },
      position: "bottom",
      animation: "scale",
      linesPerPage: 2,
      positionTopOffset: 0,
    },
    layoutSettings: {
      aspectRatio: "9:16",
      aIAutoLayout: ["fill", "fit", "split", "three", "four", "screenShare"],
      fitLayoutAspectRatio: "original",
    },
  },
  {
    id: 5,
    captionsSettings: {
      style: {
        font: {
          italic: false,
          fontSize: 20,
          fontColor: "#ffffffff",
          underline: false,
          fontFamily: "Oswald",
          fontWeight: "medium",
          fontCapitalize: false,
          fontStrokeColor: "#000000FF",
          fontStrokeWidth: 40,
        },
        name: "Marvel",
        backgroundColor: "#00000000",
        verticalCoverImg:
          "https://cdn.shorty.plus/captions-preview/aciv_preview.png",
        aplifiedWordColor: "#a76dffff",
      },
      position: "bottom",
      animation: "scale",
      linesPerPage: 2,
      positionTopOffset: 0,
    },
    layoutSettings: {
      aspectRatio: "9:16",
      aIAutoLayout: ["fill", "fit", "split", "three", "four", "screenShare"],
      fitLayoutAspectRatio: "original",
    },
  },
  {
    id: 6,
    captionsSettings: {
      style: {
        font: {
          italic: false,
          shadow: {
            fontShadowBlur: 10,
            fontShadowColor: "#000000ff",
            fontShadowOffsetX: 2,
            fontShadowOffsetY: 2,
          },
          fontSize: 20,
          fontColor: "#FFFFFFFF",
          underline: false,
          fontFamily: "Raleway",
          fontWeight: "black",
          fontCapitalize: false,
          fontStrokeColor: "#000000FF",
          fontStrokeWidth: 0,
        },
        name: "Marker",
        backgroundColor: "#E4E4E4FF",
        verticalCoverImg:
          "https://cdn.shorty.plus/captions-preview/flamingo_preview.png",
        aplifiedWordColor: "#6f0eecff",
      },
      position: "bottom",
      animation: "underline",
      linesPerPage: 2,
    },
    layoutSettings: {
      aspectRatio: "9:16",
      aIAutoLayout: ["fill", "fit", "split", "three", "four", "screenShare"],
      fitLayoutAspectRatio: "original",
    },
  },
  {
    id: 7,
    captionsSettings: {
      style: {
        font: {
          italic: false,
          shadow: {
            fontShadowBlur: 6,
            fontShadowColor: "#001c2fff",
            fontShadowOffsetX: 0,
            fontShadowOffsetY: 2,
          },
          fontSize: 30,
          fontColor: "#d7fbffff",
          underline: false,
          fontFamily: "Amatic SC",
          fontWeight: "black",
          fontCapitalize: false,
          fontStrokeColor: "#091319ff",
          fontStrokeWidth: 10,
        },
        name: "Neon Pulse",
        backgroundColor: "#00000000",
        verticalCoverImg:
          "https://cdn.shorty.plus/captions-preview/popline_preview.png",
        aplifiedWordColor: "#5fffb0ff",
      },
      position: "bottom",
      animation: "slide-up",
      linesPerPage: 2,
      positionTopOffset: 0,
    },
    layoutSettings: {
      aspectRatio: "9:16",
      aIAutoLayout: ["fill", "fit", "split", "three", "four", "screenShare"],
      fitLayoutAspectRatio: "original",
    },
  },
  {
    id: 8,
    captionsSettings: {
      style: {
        font: {
          italic: false,
          fontSize: 25,
          fontColor: "#ffffffFF",
          underline: false,
          fontFamily: "Permanent Marker",
          fontWeight: "black",
          fontCapitalize: true,
          fontStrokeColor: "#000000FF",
          fontStrokeWidth: 0,
        },
        name: "Beasty",
        backgroundColor: "#E4E4E4FF",
        verticalCoverImg:
          "https://cdn.shorty.plus/captions-preview/beasty_preview.png",
        aplifiedWordColor: "#ff0000ff",
      },
      position: "bottom",
      animation: "pop",
      linesPerPage: 1,
    },
    layoutSettings: {
      aspectRatio: "9:16",
      aIAutoLayout: ["fill", "fit", "split", "three", "four", "screenShare"],
      fitLayoutAspectRatio: "original",
    },
  },
  {
    id: 9,
    captionsSettings: {
      style: {
        font: {
          italic: false,
          fontSize: 25,
          fontColor: "#FFFFFFFF",
          underline: false,
          fontFamily: "Montserrat",
          fontWeight: "black",
          fontCapitalize: true,
          fontStrokeColor: "#000000FF",
          fontStrokeWidth: 80,
        },
        name: "Crazy",
        backgroundColor: "#E4E4E4FF",
        verticalCoverImg:
          "https://cdn.shorty.plus/captions-preview/desert_preview.png",
        aplifiedWordColor: "#ebf901ff",
      },
      position: "bottom",
      animation: "none",
      linesPerPage: 2,
      positionTopOffset: 0,
    },
    layoutSettings: {
      aspectRatio: "9:16",
      aIAutoLayout: ["fill", "fit", "split", "three", "four", "screenShare"],
      fitLayoutAspectRatio: "original",
    },
  },
  {
    id: 10,
    captionsSettings: {
      style: {
        font: {
          italic: false,
          fontSize: 23,
          fontColor: "#C6C6C6FF",
          underline: false,
          fontFamily: "Poppins",
          fontWeight: "bold",
          fontCapitalize: false,
          fontStrokeColor: "#000000FF",
          fontStrokeWidth: 0,
        },
        name: "Safari",
        backgroundColor: "#E4E4E4FF",
        verticalCoverImg:
          "https://cdn.shorty.plus/captions-preview/safari_preview.png",
        aplifiedWordColor: "#000000FF",
      },
      position: "bottom",
      animation: "box",
      linesPerPage: 1,
    },
    layoutSettings: {
      aspectRatio: "9:16",
      aIAutoLayout: ["fill", "fit", "split", "three", "four", "screenShare"],
      fitLayoutAspectRatio: "original",
    },
  },
  {
    id: 11,
    captionsSettings: {
      style: {
        font: {
          italic: false,
          fontSize: 26,
          fontColor: "#F43FE0FF",
          underline: false,
          fontFamily: "Raleway",
          fontWeight: "bold",
          fontCapitalize: false,
          fontStrokeColor: "#000000FF",
          fontStrokeWidth: 8,
        },
        name: "Popline",
        backgroundColor: "#E4E4E4FF",
        verticalCoverImg:
          "https://cdn.shorty.plus/captions-preview/popline_preview.png",
        aplifiedWordColor: "#F43FE0FF",
      },
      position: "bottom",
      animation: "none",
      linesPerPage: 1,
    },
    layoutSettings: {
      aspectRatio: "9:16",
      aIAutoLayout: ["fill", "fit", "split", "three", "four", "screenShare"],
      fitLayoutAspectRatio: "original",
    },
  },
  {
    id: 12,
    captionsSettings: {
      style: {
        font: {
          italic: false,
          fontSize: 20,
          fontColor: "#FFFFFFFF",
          underline: false,
          fontFamily: "Montserrat",
          fontWeight: "black",
          fontCapitalize: true,
          fontStrokeColor: "#000000FF",
          fontStrokeWidth: 0,
        },
        name: "Desert",
        backgroundColor: "#E4E4E4FF",
        verticalCoverImg:
          "https://cdn.shorty.plus/captions-preview/desert_preview.png",
        aplifiedWordColor: "#8F2EEDFF",
      },
      position: "bottom",
      animation: "bounce",
      linesPerPage: 2,
    },
    layoutSettings: {
      aspectRatio: "9:16",
      aIAutoLayout: ["fill", "fit", "split", "three", "four", "screenShare"],
      fitLayoutAspectRatio: "original",
    },
  },
  {
    id: 13,
    captionsSettings: {
      style: {
        font: {
          italic: false,
          fontSize: 26,
          fontColor: "#FFFFFFFF",
          underline: false,
          fontFamily: "Lato",
          fontWeight: "black",
          fontCapitalize: true,
          fontStrokeColor: "#000000FF",
          fontStrokeWidth: 0,
        },
        name: "Hook",
        backgroundColor: "#E4E4E4FF",
        verticalCoverImg:
          "https://cdn.shorty.plus/captions-preview/hook_preview.png",
        aplifiedWordColor: "#8F2EEDFF",
      },
      position: "bottom",
      animation: "underline",
      linesPerPage: 2,
    },
    layoutSettings: {
      aspectRatio: "9:16",
      aIAutoLayout: ["fill", "fit", "split", "three", "four", "screenShare"],
      fitLayoutAspectRatio: "original",
    },
  },
  {
    id: 14,
    captionsSettings: {
      style: {
        font: {
          italic: false,
          fontSize: 20,
          fontColor: "#FFFFFFFF",
          underline: false,
          fontFamily: "Montserrat",
          fontWeight: "black",
          fontCapitalize: true,
          fontStrokeColor: "#000000FF",
          fontStrokeWidth: 0,
        },
        name: "Sky",
        backgroundColor: "#E4E4E4FF",
        verticalCoverImg:
          "https://cdn.shorty.plus/captions-preview/sky_preview.png",
        aplifiedWordColor: "#FFFFFFFF",
      },
      position: "bottom",
      animation: "slide-left",
      linesPerPage: 2,
    },
    layoutSettings: {
      aspectRatio: "9:16",
      aIAutoLayout: ["fill", "fit", "split", "three", "four", "screenShare"],
      fitLayoutAspectRatio: "original",
    },
  },
  {
    id: 15,
    captionsSettings: {
      style: {
        font: {
          italic: false,
          fontSize: 20,
          fontColor: "#FFFFFFFF",
          underline: false,
          fontFamily: "Montserrat",
          fontWeight: "black",
          fontCapitalize: true,
          fontStrokeColor: "#000000FF",
          fontStrokeWidth: 0,
        },
        name: "Flamingo",
        backgroundColor: "#E4E4E4FF",
        verticalCoverImg:
          "https://cdn.shorty.plus/captions-preview/flamingo_preview.png",
        aplifiedWordColor: "#ff0000ff",
      },
      position: "bottom",
      animation: "scale",
      linesPerPage: 2,
    },
    layoutSettings: {
      aspectRatio: "9:16",
      aIAutoLayout: ["fill", "fit", "split", "three", "four", "screenShare"],
      fitLayoutAspectRatio: "original",
    },
  },
  {
    id: 16,
    captionsSettings: {
      style: {
        font: {
          italic: false,
          fontSize: 26,
          fontColor: "#8a8a8aff",
          underline: false,
          fontFamily: "Raleway",
          fontWeight: "bold",
          fontCapitalize: false,
          fontStrokeColor: "#000000FF",
          fontStrokeWidth: 0,
        },
        name: "Deep Diver B&W",
        backgroundColor: "#000000ff",
        verticalCoverImg:
          "https://cdn.shorty.plus/captions-preview/captions-deep-diver-b&w.png",
        aplifiedWordColor: "#ffffffff",
      },
      position: "bottom",
      animation: "box",
      linesPerPage: 1,
    },
    layoutSettings: {
      aspectRatio: "9:16",
      aIAutoLayout: ["fill", "fit", "split", "three", "four", "screenShare"],
      fitLayoutAspectRatio: "original",
    },
  },
  {
    id: 17,
    captionsSettings: {
      style: {
        font: {
          italic: false,
          fontSize: 20,
          fontColor: "#b0b0b0ff",
          underline: false,
          fontFamily: "Montserrat",
          fontWeight: "bold",
          fontCapitalize: true,
          fontStrokeColor: "#000000FF",
          fontStrokeWidth: 0,
        },
        name: "New",
        backgroundColor: "#E4E4E4FF",
        verticalCoverImg:
          "https://cdn.shorty.plus/captions-preview/flamingo_preview.png",
        aplifiedWordColor: "#dbff00ff",
      },
      position: "middle",
      animation: "pop",
      linesPerPage: 3,
    },
    layoutSettings: {
      aspectRatio: "9:16",
      aIAutoLayout: ["fill", "fit", "split", "three", "four", "screenShare"],
      fitLayoutAspectRatio: "original",
    },
  },
  {
    id: 18,
    captionsSettings: {
      style: {
        font: {
          italic: false,
          fontSize: 20,
          fontColor: "#FFFFFFFF",
          underline: false,
          fontFamily: "Montserrat",
          fontWeight: "black",
          fontCapitalize: true,
          fontStrokeColor: "#000000FF",
          fontStrokeWidth: 30,
        },
        name: "Catchy",
        backgroundColor: "#E4E4E4FF",
        verticalCoverImg:
          "https://cdn.shorty.plus/captions-preview/desert_preview.png",
        aplifiedWordColor: "#ff5700ff",
      },
      position: "bottom",
      animation: "bounce",
      linesPerPage: 2,
    },
    layoutSettings: {
      aspectRatio: "9:16",
      aIAutoLayout: ["fill", "fit", "split", "three", "four", "screenShare"],
      fitLayoutAspectRatio: "original",
    },
  },
  {
    id: 19,
    captionsSettings: {
      style: {
        font: {
          italic: false,
          shadow: {
            fontShadowBlur: 0,
            fontShadowColor: "#000000ff",
            fontShadowOffsetX: 2,
            fontShadowOffsetY: 2,
          },
          fontSize: 25,
          fontColor: "#ffffffFF",
          underline: false,
          fontFamily: "Kanit",
          fontWeight: "black",
          fontCapitalize: true,
          fontStrokeColor: "#000000FF",
          fontStrokeWidth: 40,
        },
        name: "From",
        backgroundColor: "#E4E4E4FF",
        verticalCoverImg:
          "https://cdn.shorty.plus/captions-preview/karaoke_preview.png",
        aplifiedWordColor: "#ffdd03ff",
      },
      position: "bottom",
      animation: "pop",
      linesPerPage: 1,
    },
    layoutSettings: {
      aspectRatio: "9:16",
      aIAutoLayout: ["fill", "fit", "split", "three", "four", "screenShare"],
      fitLayoutAspectRatio: "original",
    },
  },
  {
    id: 20,
    captionsSettings: {
      style: {
        font: {
          italic: false,
          fontSize: 15,
          fontColor: "#ffffffff",
          underline: false,
          fontFamily: "Roboto",
          fontWeight: "bold",
          fontCapitalize: false,
          fontStrokeColor: "#000000FF",
          fontStrokeWidth: 20,
        },
        name: "Classic",
        backgroundColor: "#000000ff",
        verticalCoverImg:
          "https://cdn.shorty.plus/captions-preview/safari_preview.png",
        aplifiedWordColor: "#ffffffff",
      },
      position: "bottom",
      animation: "none",
      linesPerPage: 2,
    },
    layoutSettings: {
      aspectRatio: "9:16",
      aIAutoLayout: ["fill", "fit", "split", "three", "four", "screenShare"],
      fitLayoutAspectRatio: "original",
    },
  },
  {
    id: 21,
    captionsSettings: {
      style: {
        font: {
          italic: false,
          fontSize: 30,
          fontColor: "#ffffffff",
          underline: false,
          fontFamily: "Roboto",
          fontWeight: "medium",
          fontCapitalize: false,
          fontStrokeColor: "#000000FF",
          fontStrokeWidth: 40,
        },
        name: "Classic Big",
        backgroundColor: "#000000ff",
        verticalCoverImg:
          "https://cdn.shorty.plus/captions-preview/safari_preview.png",
        aplifiedWordColor: "#ffffffff",
      },
      position: "bottom",
      animation: "none",
      linesPerPage: 2,
    },
    layoutSettings: {
      aspectRatio: "9:16",
      aIAutoLayout: ["fill", "fit", "split", "three", "four", "screenShare"],
      fitLayoutAspectRatio: "original",
    },
  },
  {
    id: 22,
    captionsSettings: {
      style: {
        font: {
          italic: false,
          shadow: {
            fontShadowBlur: 0,
            fontShadowColor: "#023210ff",
            fontShadowOffsetX: 2,
            fontShadowOffsetY: 2,
          },
          fontSize: 25,
          fontColor: "#ffffffff",
          underline: false,
          fontFamily: "Playfair Display",
          fontWeight: "regular",
          fontCapitalize: false,
          fontStrokeColor: "#000000FF",
          fontStrokeWidth: 0,
        },
        name: "Old Money",
        backgroundColor: "#00000000",
        verticalCoverImg:
          "https://cdn.shorty.plus/captions-preview/aciv_preview.png",
        aplifiedWordColor: "#ffffffff",
      },
      position: "bottom",
      animation: "slide-up",
      linesPerPage: 3,
      positionTopOffset: 0,
    },
    layoutSettings: {
      aspectRatio: "9:16",
      aIAutoLayout: ["fill", "fit", "split", "three", "four", "screenShare"],
      fitLayoutAspectRatio: "original",
    },
  },
  {
    id: 23,
    captionsSettings: {
      style: {
        font: {
          italic: false,
          fontSize: 14,
          fontColor: "#e4e900ff",
          underline: false,
          fontFamily: "Lato",
          fontWeight: "bold",
          fontCapitalize: false,
          fontStrokeColor: "#000000FF",
          fontStrokeWidth: 20,
        },
        name: "Cinema",
        backgroundColor: "#000000ff",
        verticalCoverImg:
          "https://cdn.shorty.plus/captions-preview/safari_preview.png",
        aplifiedWordColor: "#e4e900ff",
      },
      position: "bottom",
      animation: "none",
      linesPerPage: 2,
    },
    layoutSettings: {
      aspectRatio: "9:16",
      aIAutoLayout: ["fill", "fit", "split", "three", "four", "screenShare"],
      fitLayoutAspectRatio: "original",
    },
  },
  {
    id: 24,
    captionsSettings: {
      style: {
        font: {
          italic: false,
          shadow: {
            fontShadowBlur: 0,
            fontShadowColor: "#0f1324ff",
            fontShadowOffsetX: 1,
            fontShadowOffsetY: 1,
          },
          fontSize: 23,
          fontColor: "#f7f4edff",
          underline: false,
          fontFamily: "Playfair Display",
          fontWeight: "bold",
          fontCapitalize: false,
          fontStrokeColor: "#0f1324ff",
          fontStrokeWidth: 6,
        },
        name: "Midnight Serif",
        backgroundColor: "#00000000",
        verticalCoverImg:
          "https://cdn.shorty.plus/captions-preview/captions-deep-diver-b&w.png",
        aplifiedWordColor: "#f3ca72ff",
      },
      position: "bottom",
      animation: "box",
      linesPerPage: 2,
      positionTopOffset: 0,
    },
    layoutSettings: {
      aspectRatio: "9:16",
      aIAutoLayout: ["fill", "fit", "split", "three", "four", "screenShare"],
      fitLayoutAspectRatio: "original",
    },
  },
  {
    id: 25,
    captionsSettings: {
      style: {
        font: {
          italic: false,
          shadow: {
            fontShadowBlur: 12,
            fontShadowColor: "#2a0834ff",
            fontShadowOffsetX: 0,
            fontShadowOffsetY: 3,
          },
          fontSize: 26,
          fontColor: "#fff6d9ff",
          underline: false,
          fontFamily: "Oswald",
          fontWeight: "bold",
          fontCapitalize: true,
          fontStrokeColor: "#3a1240ff",
          fontStrokeWidth: 18,
        },
        name: "Aurora Ink",
        backgroundColor: "#00000000",
        verticalCoverImg:
          "https://cdn.shorty.plus/captions-preview/flamingo_preview.png",
        aplifiedWordColor: "#ff7b00",
      },
      position: "bottom",
      animation: "underline",
      linesPerPage: 2,
      positionTopOffset: 0,
    },
    layoutSettings: {
      aspectRatio: "9:16",
      aIAutoLayout: ["fill", "fit", "split", "three", "four", "screenShare"],
      fitLayoutAspectRatio: "original",
    },
  },
];
