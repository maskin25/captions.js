[**captions.js**](../README.md)

***

# Class: Captions

Defined in: [captions/Captions.ts:31](https://github.com/maskin25/captions.js/blob/3bd5c8160fe7926aa760bd06fafac5f863c27219/packages/core/src/captions/Captions.ts#L31)

Imperative controller that owns the Konva stage lifecycle for a single video element.

## Constructors

### Constructor

> **new Captions**(`options`): `Captions`

Defined in: [captions/Captions.ts:64](https://github.com/maskin25/captions.js/blob/3bd5c8160fe7926aa760bd06fafac5f863c27219/packages/core/src/captions/Captions.ts#L64)

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

Defined in: [captions/Captions.ts:174](https://github.com/maskin25/captions.js/blob/3bd5c8160fe7926aa760bd06fafac5f863c27219/packages/core/src/captions/Captions.ts#L174)

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

Defined in: [captions/Captions.ts:151](https://github.com/maskin25/captions.js/blob/3bd5c8160fe7926aa760bd06fafac5f863c27219/packages/core/src/captions/Captions.ts#L151)

Alias for [disable()](#disable) to match typical imperative controller APIs.

#### Returns

`void`

***

### disable()

> **disable**(): `void`

Defined in: [captions/Captions.ts:121](https://github.com/maskin25/captions.js/blob/3bd5c8160fe7926aa760bd06fafac5f863c27219/packages/core/src/captions/Captions.ts#L121)

Tear down overlays, observers and animation loops to free resources.

#### Returns

`void`

***

### enable()

> **enable**(): `void`

Defined in: [captions/Captions.ts:82](https://github.com/maskin25/captions.js/blob/3bd5c8160fe7926aa760bd06fafac5f863c27219/packages/core/src/captions/Captions.ts#L82)

Mount caption overlays onto the configured video if they are not active yet.

#### Returns

`void`

***

### isEnabled()

> **isEnabled**(): `boolean`

Defined in: [captions/Captions.ts:188](https://github.com/maskin25/captions.js/blob/3bd5c8160fe7926aa760bd06fafac5f863c27219/packages/core/src/captions/Captions.ts#L188)

Whether the Konva overlay is currently attached to the video element.

#### Returns

`boolean`

`true` when the overlay is mounted on top of the video.

***

### preset()

> **preset**(`nextPreset`): `void`

Defined in: [captions/Captions.ts:160](https://github.com/maskin25/captions.js/blob/3bd5c8160fe7926aa760bd06fafac5f863c27219/packages/core/src/captions/Captions.ts#L160)

Swap the active preset and re-render with updated typography/colors.

#### Parameters

##### nextPreset

[`StylePreset`](../interfaces/StylePreset.md)

Preset that becomes the new render baseline.

#### Returns

`void`
