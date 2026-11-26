# Browser vs server parity (measured 2026-11-25)

`pnpm --filter @captionsjs/server test:parity` renders the 260 golden frames
(26 presets × 5 moments × 540×960 and 1080×1920) in headless Chromium 141 and
compares them with the server renders (Konva on skia-canvas). Both sides use the
same font files, so this measures the two renderers, nothing else.

It also checks layout exactly: a 96-word English and Russian sample must break
into the same screens and lines in Chromium at 360×640, 540×960 and 1080×1920
and on the server at 540×960 and 1080×1920, once as is and once with every
fifth word emphasized at `expressiveness: 1`. A layout mismatch fails the run.

## Findings

1. **Same screens and lines everywhere.** All 26 presets break the sample into
   identical screens and lines in both engines and at every size, including a
   360×640 preview against a 1080×1920 export, with and without emphasis.
2. **Visually the same, not pixel-identical.** No frame has a block delta above
   76, while a different screen or a moved highlight starts around 90. Glyph
   edges, strokes and blur rasterize differently, and Chromium draws text about
   0.2–0.3% wider at caption sizes, so words drift by up to 1–2 px. Pixels off:
   0.4–2% for most presets, up to 7% for glow presets (Neon Pulse, Aurora Ink).
3. **Text the preset font has no glyphs for is not covered.** Kanit (From),
   Lato (Hook, Cinema), Poppins (Safari) and Permanent Marker (Beasty) have no
   Cyrillic. Each engine draws such text in its own fallback font, so glyphs
   and widths differ, and lines can break differently. The layout check leaves
   those words out for these presets.

## How layout stays identical (fixed 2026-11-25)

Characters per line used to come from
`Math.round(frameWidth / averageLetterWidth)`, measured at caption size. The
0.3% measuring difference landed on the other side of the rounding for From at
1080×1920, and the screen broke differently ("IN YOUR BROWSER" vs "BROWSER").
Run against that code, the new layout check also fails Marker and Classic at
360×640 and Midnight Serif at 1080×1920.

The cause is hinting: at caption sizes engines round glyph advances, each its
own way. At 1000 px the advances of unhinted fonts are exact in both engines
(measured: 0 differences over Latin, Cyrillic, digits and punctuation for 15 of
the 19 preset fonts; Roboto, which is hinted, is off by at most 0.5 of 1000).
So layout (`canvas-captions/layout.ts`):

- measures each character once at 1000 px, rounds it to a whole unit
  (1/1000 em) and adds the units up, ignoring kerning;
- works only in those integer units: the frame width, the side margin
  (2 average letters, 3 for box and bounce), and the word gap taken at the
  preset's 960-px-tall size, so its fixed-pixel parts do not depend on output
  resolution;
- decides lines and screens once, in one place; drawing uses the result.

Words are still drawn and positioned with each engine's own measurements; only
the decision where lines break is engine-independent.

## Per preset

Worst block Δ is the largest average difference of an 8×8 px block (16×16 at
1080), out of 255; the golden test fails above 32. "Pixels off" counts pixels with
any channel off by more than 2. Colors are compared premultiplied (color × alpha),
as they show over video: without that, a nearly transparent glow pixel that one
engine leaves at alpha 0 counted as a 255 difference (Neon Bloom read 255; with
premultiplied colors it reads 35, inside the range of the other presets).

| Preset | Layout | Worst block Δ | Max pixels off (>2) | Frames over limit |
| --- | --- | ---: | ---: | ---: |
| Karaoke | same (58 screens) | 61.3 | 1.348% | 7 / 10 |
| Focus Box | same (81 screens) | 38 | 0.369% | 1 / 10 |
| Banger | same (58 screens) | 29.1 | 1.099% | 0 / 10 |
| Acid | same (49 screens) | 49.7 | 0.446% | 3 / 10 |
| Lovly | same (24 screens) | 75.7 | 2.281% | 5 / 10 |
| Marvel | same (17 screens) | 42.9 | 2.253% | 3 / 10 |
| Marker | same (23 screens) | 40.3 | 4.408% | 5 / 10 |
| Neon Pulse | same (19 screens) | 65.5 | 6.695% | 8 / 10 |
| Beasty | same (37 screens, Latin only) | 47.8 | 0.525% | 5 / 10 |
| Crazy | same (38 screens) | 50.4 | 1.161% | 3 / 10 |
| Safari | same (33 screens, Latin only) | 75.7 | 0.592% | 9 / 10 |
| Popline | same (51 screens) | 70.3 | 0.875% | 6 / 10 |
| Desert | same (63 screens) | 59.8 | 0.658% | 7 / 10 |
| Hook | same (23 screens, Latin only) | 59.8 | 0.899% | 5 / 10 |
| Sky | same (30 screens) | 59.8 | 0.665% | 9 / 10 |
| Flamingo | same (30 screens) | 59.8 | 0.666% | 7 / 10 |
| Deep Diver B&W | same (62 screens) | 69 | 0.603% | 5 / 10 |
| New | same (23 screens) | 44.3 | 1.113% | 5 / 10 |
| Catchy | same (63 screens) | 58.4 | 1.297% | 7 / 10 |
| From | same (35 screens, Latin only) | 56.5 | 0.794% | 5 / 10 |
| Classic | same (17 screens) | 58.1 | 2.087% | 5 / 10 |
| Classic Big | same (32 screens) | 68.9 | 2.19% | 5 / 10 |
| Old Money | same (22 screens) | 55.8 | 2.117% | 2 / 10 |
| Cinema | same (11 screens, Latin only) | 60.2 | 1.998% | 5 / 10 |
| Midnight Serif | same (29 screens) | 58.3 | 1.545% | 4 / 10 |
| Aurora Ink | same (30 screens) | 57.3 | 6.711% | 7 / 10 |

"Frames over limit" are rasterization differences (finding 2), not different
content: every frame shows the same words, lines and highlight.
