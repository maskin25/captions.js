import { defineConfig } from "vitepress";

export default defineConfig({
  srcDir: "src",
  base: "/captions.js/docs/",
  title: "captions.js | Docs",
  description: "Render styled animated captions on HTML5 video & canvas.",
  cleanUrls: true,
  rewrites: {
    "api/README.md": "api/index.md",
  },
  themeConfig: {
    search: {
      provider: "local",
    },
    logoLink: "../",
    nav: [
      { text: "Guide", link: "/" },
      { text: "Server", link: "/server/" },
      { text: "API", link: "/api/" },
      { text: "Demo", link: "/..", target: "_blank" },
    ],
    sidebar: {
      "/": [
        {
          text: "Guide",
          items: [
            { text: "Introduction", link: "/" },
            { text: "Server", link: "/server/" },
            { text: "API Reference", link: "/api/" },
          ],
        },
      ],
      "/api/": [
        {
          text: "API Reference",
          items: [
            { text: "Overview", link: "/api/" },
            { text: "Captions Class", link: "/api/classes/Captions" },
            {
              text: "Rendering Functions",
              link: "/api/functions/renderString",
            },
            {
              text: "Utility Functions",
              link: "/api/functions/renderCaptions",
            },
            {
              text: "Style Preset Interface",
              link: "/api/interfaces/StylePreset",
            },
            { text: "Type Aliases", link: "/api/type-aliases/CaptionsOptions" },
          ],
        },
      ],
    },
    socialLinks: [
      { icon: "github", link: "https://github.com/maskin25/captions.js" },
    ],
    /*  footer: {
      message: "Released under the MIT License.",
      copyright: "© 2025 @maskin25",
    }, */
  },
});
