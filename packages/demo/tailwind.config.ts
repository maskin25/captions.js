import type { Config } from "tailwindcss";

export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
    "./node_modules/@maskin25/captions-configurator/dist/**/*.{js,jsx,ts,tsx}",
  ],
} satisfies Config;
