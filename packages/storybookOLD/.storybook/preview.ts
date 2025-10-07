import type { Preview } from "@storybook/react";

const preview: Preview = {
  parameters: {
    layout: "centered",
    backgrounds: {
      default: "dark",
    },
    actions: { argTypesRegex: "^on.*" },
  },
};

export default preview;
