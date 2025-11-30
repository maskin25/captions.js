[**captions.js**](../README.md)

***

# Class: Captions

Defined in: [captions/Captions.ts:33](https://github.com/maskin25/captions.js/blob/5b711180c3152bda8f15a5bee82a3003106d29ad/packages/core/src/captions/Captions.ts#L33)

Imperative controller that owns the Konva stage lifecycle for a single video element.

## Constructors

### Constructor

> **new Captions**(`options`): `Captions`

Defined in: [captions/Captions.ts:67](https://github.com/maskin25/captions.js/blob/5b711180c3152bda8f15a5bee82a3003106d29ad/packages/core/src/captions/Captions.ts#L67)

Create a controller bound to the provided video element and preset.

#### Parameters

##### options

[`CaptionsOptions`](../type-aliases/CaptionsOptions.md)

Complete configuration for the controller.

#### Returns

`Captions`

## Methods

### captions()

> **captions**(`nextCaptions`): `void`

Defined in: [captions/Captions.ts:178](https://github.com/maskin25/captions.js/blob/5b711180c3152bda8f15a5bee82a3003106d29ad/packages/core/src/captions/Captions.ts#L178)

Replace the current caption track and repaint without reloading fonts.

#### Parameters

##### nextCaptions

Timed words that should drive the overlay.

[`Caption`](../interfaces/Caption.md)[] | `null`

#### Returns

`void`

***

### destroy()

> **destroy**(): `void`

Defined in: [captions/Captions.ts:155](https://github.com/maskin25/captions.js/blob/5b711180c3152bda8f15a5bee82a3003106d29ad/packages/core/src/captions/Captions.ts#L155)

Alias for [disable()](#disable) to match typical imperative controller APIs.

#### Returns

`void`

***

### disable()

> **disable**(): `void`

Defined in: [captions/Captions.ts:125](https://github.com/maskin25/captions.js/blob/5b711180c3152bda8f15a5bee82a3003106d29ad/packages/core/src/captions/Captions.ts#L125)

Tear down overlays, observers and animation loops to free resources.

#### Returns

`void`

***

### enable()

> **enable**(): `void`

Defined in: [captions/Captions.ts:86](https://github.com/maskin25/captions.js/blob/5b711180c3152bda8f15a5bee82a3003106d29ad/packages/core/src/captions/Captions.ts#L86)

Mount caption overlays onto the configured video if they are not active yet.

#### Returns

`void`

***

### isEnabled()

> **isEnabled**(): `boolean`

Defined in: [captions/Captions.ts:192](https://github.com/maskin25/captions.js/blob/5b711180c3152bda8f15a5bee82a3003106d29ad/packages/core/src/captions/Captions.ts#L192)

Whether the Konva overlay is currently attached to the video element.

#### Returns

`boolean`

`true` when the overlay is mounted on top of the video.

***

### preset()

> **preset**(`nextPreset`): `void`

Defined in: [captions/Captions.ts:164](https://github.com/maskin25/captions.js/blob/5b711180c3152bda8f15a5bee82a3003106d29ad/packages/core/src/captions/Captions.ts#L164)

Swap the active preset and re-render with updated typography/colors.

#### Parameters

##### nextPreset

[`StylePreset`](../interfaces/StylePreset.md)

Preset that becomes the new render baseline.

#### Returns

`void`
