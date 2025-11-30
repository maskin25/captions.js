# captions.js Guide

Welcome to the captions.js developer documentation. Use the sidebar to explore the full API reference and learn how to embed animated captions into your video workflow.

```ts
import captionsjs, { stylePresets } from "captions.js";

const instance = captionsjs({
  video: document.querySelector("video")!,
  preset: stylePresets[0],
  captions: [
    { word: "Hello", startTime: 0, endTime: 0.4 },
    { word: "world", startTime: 0.4, endTime: 0.9 },
  ],
});

instance.enable();
```
