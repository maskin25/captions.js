/**
 * Shared schema describing how a preset styles captions plus rough layout hints.
 *
 * @public
 */
export interface StylePreset {
  id: number;
  captionsSettings: {
    style: {
      font: {
        italic: boolean;
        fontSize: number;
        fontColor: string;
        underline: boolean;
        fontFamily: string;
        fontWeight: string;
        fontCapitalize: boolean;
        fontStrokeColor: string;
        fontStrokeWidth: number;
        shadow?: {
          fontShadowBlur: number;
          fontShadowColor: string;
          fontShadowOffsetX: number;
          fontShadowOffsetY: number;
        };
      };
      name: string;
      backgroundColor: string;
      verticalCoverImg: string;
      aplifiedWordColor: string;
    };
    position: string;
    animation: string;
    linesPerPage: number;
    positionTopOffset?: number;
  };
  layoutSettings: {
    aspectRatio: string;
    aIAutoLayout: string[];
    fitLayoutAspectRatio: string;
  };
}

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
          fontFamily: "Montserrat",
          fontWeight: "black",
          fontCapitalize: false,
          fontStrokeColor: "#000000FF",
          fontStrokeWidth: 0,
        },
        name: "Karaoke",
        backgroundColor: "#E4E4E4FF",
        verticalCoverImg:
          "https://storage.googleapis.com/loomz-front-static/video-editor/img/karaoke_preview.png",
        aplifiedWordColor: "#04f827FF",
      },
      position: "bottom",
      animation: "bounce",
      linesPerPage: 3,
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
          "https://storage.googleapis.com/loomz-front-static/video-editor/img/beasty_preview.png",
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
    id: 3,
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
          "https://storage.googleapis.com/loomz-front-static/video-editor/img/safari_preview.png",
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
    id: 4,
    captionsSettings: {
      style: {
        font: {
          italic: false,
          fontSize: 24,
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
          "https://storage.googleapis.com/loomz-front-static/video-editor/img/aciv_preview.png",
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
    id: 5,
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
          "https://storage.googleapis.com/loomz-front-static/video-editor/img/popline_preview.png",
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
    id: 6,
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
          "https://storage.googleapis.com/loomz-front-static/video-editor/img/desert_preview.png",
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
    id: 7,
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
          "https://storage.googleapis.com/loomz-front-static/video-editor/img/hook_preview.png",
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
    id: 8,
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
          "https://storage.googleapis.com/loomz-front-static/video-editor/img/sky_preview.png",
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
    id: 9,
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
          "https://storage.googleapis.com/loomz-front-static/video-editor/img/flamingo_preview.png",
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
    id: 10,
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
          "https://storage.googleapis.com/loomz-front-static/video-editor/img/captions-deep-diver-b&w.png",
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
    id: 11,
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
          "https://storage.googleapis.com/loomz-front-static/video-editor/img/flamingo_preview.png",
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
    id: 12,
    captionsSettings: {
      style: {
        font: {
          italic: false,
          fontSize: 30,
          fontColor: "#ffffffFF",
          underline: false,
          fontFamily: "Bangers",
          fontWeight: "bold",
          fontCapitalize: true,
          fontStrokeColor: "#000000ff",
          fontStrokeWidth: 60,
        },
        name: "Banger",
        backgroundColor: "#E4E4E4FF",
        verticalCoverImg:
          "https://storage.googleapis.com/loomz-front-static/video-editor/img/beasty_preview.png",
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
    id: 13,
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
          "https://storage.googleapis.com/loomz-front-static/video-editor/img/desert_preview.png",
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
    id: 14,
    captionsSettings: {
      style: {
        font: {
          italic: false,
          fontSize: 25,
          fontColor: "#ffffffFF",
          underline: false,
          fontFamily: "Rubik",
          fontWeight: "black",
          fontCapitalize: true,
          fontStrokeColor: "#000000FF",
          fontStrokeWidth: 40,
        },
        name: "Karaoke 2",
        backgroundColor: "#E4E4E4FF",
        verticalCoverImg:
          "https://storage.googleapis.com/loomz-front-static/video-editor/img/karaoke_preview.png",
        aplifiedWordColor: "#2bf82aff",
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
    id: 15,
    captionsSettings: {
      style: {
        font: {
          italic: false,
          fontSize: 25,
          fontColor: "#ffffffFF",
          underline: false,
          fontFamily: "Rubik",
          fontWeight: "black",
          fontCapitalize: true,
          fontStrokeColor: "#000000FF",
          fontStrokeWidth: 60,
        },
        name: "Karaoke 3",
        backgroundColor: "#E4E4E4FF",
        verticalCoverImg:
          "https://storage.googleapis.com/loomz-front-static/video-editor/img/karaoke_preview.png",
        aplifiedWordColor: "#2bf82aff",
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
    id: 16,
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
          "https://storage.googleapis.com/loomz-front-static/video-editor/img/karaoke_preview.png",
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
    id: 17,
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
          "https://storage.googleapis.com/loomz-front-static/video-editor/img/safari_preview.png",
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
    id: 18,
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
          "https://storage.googleapis.com/loomz-front-static/video-editor/img/safari_preview.png",
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
    id: 19,
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
          "https://storage.googleapis.com/loomz-front-static/video-editor/img/desert_preview.png",
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
    id: 20,
    captionsSettings: {
      style: {
        font: {
          italic: false,
          fontSize: 30,
          fontColor: "#ffffffff",
          underline: false,
          fontFamily: "PT Sans",
          fontWeight: "black",
          fontCapitalize: false,
          fontStrokeColor: "#000000FF",
          fontStrokeWidth: 40,
        },
        name: "Acid 2",
        backgroundColor: "#00000000",
        verticalCoverImg:
          "https://storage.googleapis.com/loomz-front-static/video-editor/img/aciv_preview.png",
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
    id: 21,
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
          "https://storage.googleapis.com/loomz-front-static/video-editor/img/aciv_preview.png",
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
    id: 22,
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
          "https://storage.googleapis.com/loomz-front-static/video-editor/img/aciv_preview.png",
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
    id: 23,
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
          "https://storage.googleapis.com/loomz-front-static/video-editor/img/aciv_preview.png",
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
    id: 24,
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
          "https://storage.googleapis.com/loomz-front-static/video-editor/img/safari_preview.png",
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
    id: 25,
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
          "https://storage.googleapis.com/loomz-front-static/video-editor/img/flamingo_preview.png",
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
];
