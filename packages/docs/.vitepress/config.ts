import { defineConfig } from "vitepress";

export default defineConfig({
  srcDir: "src",
  title: "captions.js",
  description: "Render styled animated captions on HTML5 video & canvas.",
  cleanUrls: true,
  rewrites: {
    "api/README.md": "api/index.md",
  },
  themeConfig: {
    search: {
      provider: "local",
    },
    nav: [
      { text: "Guide", link: "/" },
      { text: "API", link: "/api/README" },
      {
        text: "GitHub",
        link: "https://github.com/maskin25/captions.js",
      },
    ],
    sidebar: {
      "/": [
        {
          text: "Guide",
          items: [
            { text: "Introduction", link: "/" },
            { text: "API Reference", link: "/api/README" },
          ],
        },
      ],
      "/api/": [
        {
          text: "API Reference",
          items: [
            { text: "Overview", link: "/api/README" },
            { text: "Captions Class", link: "/api/classes/Captions" },
            { text: "Rendering Functions", link: "/api/functions/renderString" },
            { text: "Utility Functions", link: "/api/functions/renderCaptions" },
            { text: "Style Preset Interface", link: "/api/interfaces/StylePreset" },
            { text: "Type Aliases", link: "/api/type-aliases/CaptionsOptions" },
          ],
        },
      ],
    },
    socialLinks: [
      { icon: "github", link: "https://github.com/maskin25/captions.js" },
    ],
  },
});
