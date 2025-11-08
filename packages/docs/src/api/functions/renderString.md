[**captions.js**](../README.md)

***

# Function: renderString()

> **renderString**(`canvas`, `text`, `options`): `Promise`\<`boolean`\>

Defined in: [render/renderString.ts:21](https://github.com/maskin25/captions.js/blob/5306e4286bfd37e77c18c7059327f58bf33f0d1c/packages/core/src/render/renderString.ts#L21)

Server/worker-friendly helper that paints a text string onto a provided canvas.

## Parameters

### canvas

`HTMLCanvasElement`

Destination canvas that should receive the rendered text.

### text

`string`

Arbitrary content that needs to be painted.

### options

Rendering options that include the style preset.

#### preset

[`StylePreset`](../interfaces/StylePreset.md)

## Returns

`Promise`\<`boolean`\>

Resolves once the frame has been painted (always resolves to `true`).

## Remarks

Uses the same Konva pipeline as the video overlay renderer so the results
match what users see in the browser.
