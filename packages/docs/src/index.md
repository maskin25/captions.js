# captions.js

Render animated, highly styled captions on HTML5 video elements or offscreen canvases using a single declarative preset.

```ts
import captionsjs, { stylePresets } from "captions.js";

const captions = captionsjs({
  video: document.querySelector("video")!,
  preset: stylePresets[0],
  captions: [
    { word: "Hello", startTime: 0, endTime: 0.5 },
    { word: "world", startTime: 0.5, endTime: 1.2 },
  ],
});

captions.enable();
```

## Workflow

1. Pick a base look & feel from `stylePresets` or craft your own preset.
2. Load captions with per-word timestamps.
3. Use the `Captions` instance to toggle overlays, swap presets, or update the caption track in real time.

## API reference

The full TypeDoc-generated API (classes, functions, type aliases, etc.) lives under the [API](/api/README) section and updates automatically whenever you run:

```bash
pnpm --filter docs run docs:generate
```
