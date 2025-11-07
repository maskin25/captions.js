[**captions.js**](../README.md)

***

# Class: Captions

Defined in: [captions/Captions.ts:33](https://github.com/maskin25/captions.js/blob/1fec33b360629c31031f61bbab6a686d60277c68/packages/core/src/captions/Captions.ts#L33)

Imperative controller that owns the Konva stage lifecycle for a single video element.

## Constructors

### Constructor

> **new Captions**(`options`): `Captions`

Defined in: [captions/Captions.ts:66](https://github.com/maskin25/captions.js/blob/1fec33b360629c31031f61bbab6a686d60277c68/packages/core/src/captions/Captions.ts#L66)

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

Defined in: [captions/Captions.ts:184](https://github.com/maskin25/captions.js/blob/1fec33b360629c31031f61bbab6a686d60277c68/packages/core/src/captions/Captions.ts#L184)

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

Defined in: [captions/Captions.ts:159](https://github.com/maskin25/captions.js/blob/1fec33b360629c31031f61bbab6a686d60277c68/packages/core/src/captions/Captions.ts#L159)

Alias for `disable()` to match typical imperative controller APIs.

#### Returns

`void`

***

### disable()

> **disable**(): `void`

Defined in: [captions/Captions.ts:127](https://github.com/maskin25/captions.js/blob/1fec33b360629c31031f61bbab6a686d60277c68/packages/core/src/captions/Captions.ts#L127)

Tear down overlays, observers and animation loops to free resources.

#### Returns

`void`

***

### enable()

> **enable**(): `void`

Defined in: [captions/Captions.ts:86](https://github.com/maskin25/captions.js/blob/1fec33b360629c31031f61bbab6a686d60277c68/packages/core/src/captions/Captions.ts#L86)

Mount caption overlays onto the configured video if they are not active yet.

#### Returns

`void`

***

### isEnabled()

> **isEnabled**(): `boolean`

Defined in: [captions/Captions.ts:198](https://github.com/maskin25/captions.js/blob/1fec33b360629c31031f61bbab6a686d60277c68/packages/core/src/captions/Captions.ts#L198)

Whether the Konva overlay is currently attached to the video element.

#### Returns

`boolean`

***

### preset()

> **preset**(`nextPreset`): `void`

Defined in: [captions/Captions.ts:169](https://github.com/maskin25/captions.js/blob/1fec33b360629c31031f61bbab6a686d60277c68/packages/core/src/captions/Captions.ts#L169)

Swap the active preset and re-render with updated typography/colors.

#### Parameters

##### nextPreset

[`StylePreset`](../interfaces/StylePreset.md)

Preset that becomes the new render baseline.

#### Returns

`void`
