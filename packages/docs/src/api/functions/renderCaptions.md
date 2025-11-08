[**captions.js**](../README.md)

***

# Function: renderCaptions()

> **renderCaptions**(`ctx`, `text`): `boolean`

Defined in: [index.ts:12](https://github.com/maskin25/captions.js/blob/5306e4286bfd37e77c18c7059327f58bf33f0d1c/packages/core/src/index.ts#L12)

Simple canvas demo renderer used only for the docs playground.

## Parameters

### ctx

`CanvasRenderingContext2D`

Target 2D context to draw on.

### text

`string`

Arbitrary string that should be painted on the canvas.

## Returns

`boolean`

Always returns `true` to match the historical API surface.

## Remarks

Keeps a reference implementation of drawing raw text to a canvas so we can
showcase caption styling without a video element.
