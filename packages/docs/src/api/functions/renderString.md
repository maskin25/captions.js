[**captions.js**](../README.md)

***

# Function: renderString()

> **renderString**(`canvas`, `text`, `options`): `Promise`\<`boolean`\>

Defined in: [render/renderString.ts:18](https://github.com/maskin25/captions.js/blob/1fec33b360629c31031f61bbab6a686d60277c68/packages/core/src/render/renderString.ts#L18)

Server/worker-friendly helper that paints a text string onto a provided canvas
using the same Konva pipeline as the video overlay renderer.

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

Resolves once the frame has been painted (always resolves to true).
