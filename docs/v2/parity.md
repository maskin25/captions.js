# Browser vs server parity (measured 2026-11-24)

`pnpm --filter @captionsjs/server test:parity` renders the 260 golden frames
(26 presets × 5 moments × 540×960 and 1080×1920) in headless Chromium 141 and
compares them with the server renders (Konva on skia-canvas). Both sides use the
same font files, so this measures the two renderers, nothing else.

## Findings

1. **The same words, styles, colors and animation states in 259 of 260 frames.**
   No other frame has a block delta above 70, while a different screen or a moved
   highlight starts around 90; the frames I compared side by side cannot be told
   apart.
2. **Not pixel-identical.** Chromium measures text about 0.2–0.3% wider than Skia
   (the uppercase alphabet in Kanit Black at 50 px: 1701 px vs 1697.25 px). Word
   positions drift by up to 1–2 px, and glyph edges, strokes and blur rasterize
   differently. Pixels off: 0.5–2% for most presets, up to 7% for glow presets
   (Neon Pulse, Aurora Ink).
3. **One frame shows different words:** From at 1080×1920, t=1.55 s. The server
   shows "IN YOUR BROWSER", Chromium only "BROWSER". Characters per line come from
   `Math.round(frameWidth / averageLetterWidth)`
   (`getAverageSymbolsInLine` in `canvas-captions/utils.ts`). The 0.3% measuring
   difference lands on the other side of the rounding, the line gets one character
   fewer, and the screen breaks differently. Any preset whose numbers fall near
   a rounding boundary at some size can do the same.

So "pixel-identical" (README) and "frame for frame" (README, site guides) are not
true as written. "Same layout, same motion, visually identical" holds once
finding 3 is fixed.

## Fixing finding 3

Line breaking has to be decided from numbers both engines agree on. Options, to
settle in the pixel-layout stage:

- measure with a tolerance: round widths to a coarse step before comparing them
  with the frame width, so a 0.3% difference cannot flip a decision near the edge
  (still flips at the step boundary, just much more rarely);
- read advance widths from the font file (the same bytes on both sides) instead of
  asking the canvas: exact agreement, costs a font parser in the browser bundle.

## Per preset

Worst block Δ is the largest average difference of an 8×8 px block (16×16 at
1080), out of 255; the golden test fails above 32. "Pixels off" counts pixels with
any channel off by more than 2.

| Preset | Worst block Δ | Max pixels off (>2) | Frames over limit |
| --- | ---: | ---: | ---: |
| Karaoke | 66.6 | 1.847% | 8 / 10 |
| Focus Box | 40.6 | 0.464% | 1 / 10 |
| Banger | 34.2 | 1.189% | 1 / 10 |
| Acid | 69 | 0.521% | 5 / 10 |
| Lovly | 67.3 | 1.744% | 5 / 10 |
| Marvel | 35.1 | 1.764% | 2 / 10 |
| Marker | 47.8 | 3.942% | 5 / 10 |
| Neon Pulse | 65.5 | 6.695% | 8 / 10 |
| Beasty | 47.8 | 0.525% | 5 / 10 |
| Crazy | 53.4 | 1.257% | 5 / 10 |
| Safari | 63.5 | 0.547% | 9 / 10 |
| Popline | 70.3 | 0.754% | 7 / 10 |
| Desert | 61.5 | 0.687% | 4 / 10 |
| Hook | 67.7 | 1.171% | 5 / 10 |
| Sky | 59.8 | 0.665% | 9 / 10 |
| Flamingo | 59.8 | 0.666% | 7 / 10 |
| Deep Diver B&W | 69 | 0.603% | 5 / 10 |
| New | 44.3 | 1.113% | 5 / 10 |
| Catchy | 51.2 | 1.35% | 3 / 10 |
| From | 255 | 2.248% | 7 / 10 |
| Classic | 58.1 | 1.549% | 5 / 10 |
| Classic Big | 49.5 | 1.625% | 5 / 10 |
| Old Money | 55.8 | 2.117% | 2 / 10 |
| Cinema | 60.2 | 1.587% | 4 / 10 |
| Midnight Serif | 58.3 | 1.545% | 5 / 10 |
| Aurora Ink | 58.2 | 6.83% | 7 / 10 |

From shows 255 because of the different screen at 1080×1920; everything else comes from finding 2.
