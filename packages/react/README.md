# @captionsjs/react

Animated word-level captions over a `<video>` in React, drawn by
[captions.js](https://captionsjs.dev). The same styles render on the server
with `@captionsjs/server`, so a preview in your app matches the burned-in video.

```bash
npm install @captionsjs/react captions.js konva
```

Peers: `react` 18 or 19, `captions.js` 2, `konva` 10.

## Component

```tsx
import { useRef } from "react";
import { Captions } from "@captionsjs/react";
import { toCaptions } from "captions.js";

const words = toCaptions(transcript); // Deepgram, Whisper, SRT, VTT, AssemblyAI, …

export function Player() {
  const video = useRef<HTMLVideoElement>(null);
  return (
    <div>
      <video ref={video} src="/clip.mp4" controls />
      <Captions video={video} captions={words} preset="Karaoke" />
    </div>
  );
}
```

`<Captions>` renders no markup of its own. It adds the overlay canvas inside the
video's parent element and makes that element `position: relative`, so give the
video a wrapper of its own.

| Prop       | Type                                   | Default  |                                                       |
|------------|----------------------------------------|----------|-------------------------------------------------------|
| `video`    | `RefObject<HTMLVideoElement>` or element | required | The video to draw over                                |
| `preset`   | preset name or `StylePreset`           | required | `"Karaoke"`, `"focus box"`: case and spaces ignored |
| `captions` | `Caption[] \| null`                    | `null`   | Timed words, from `toCaptions()`                      |
| `enabled`  | `boolean`                              | `true`   | `false` removes the overlay                           |
| `debug`    | `boolean`                              | `false`  | Boxes around lines                                    |

Changing `preset` or `captions` updates the overlay in place. Pass a preset object
that keeps its identity between renders (a constant, `useMemo` or state); a new
object on every render reapplies the preset each time.

## Hook

```tsx
const { controller, preset } = useCaptions(videoRef, { preset: "Karaoke", captions: words });
```

`controller` is the captions.js `Captions` instance, `null` before mount and on
the server. `preset` is the resolved preset object. `resolvePreset(nameOrPreset)`
does the same lookup and throws for an unknown name, listing the available ones.

## Server rendering and Next.js

The package imports and renders on the server without touching the DOM; the
overlay is created after mount. Its build starts with `"use client"`, so the
component can be used from App Router pages. Put the `ref` and `<Captions>` in a
client component; transcripts can still be converted in a server component, as in
[examples/react-next](../../examples/react-next).

When both a server component and a client component import `captions.js`,
`next build` logs Konva's `Several Konva instances detected` once: Next loads
the server and SSR bundles in one process, each with its own Konva. Nothing is
drawn on the server, so the message is harmless.

## Examples

- [examples/react-vite](../../examples/react-vite): Vite and StrictMode, with a style picker.
- [examples/react-next](../../examples/react-next): Next.js App Router.

Each has `pnpm test`, which builds the app and checks it in headless Chromium.
