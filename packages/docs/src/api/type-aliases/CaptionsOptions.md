[**captions.js**](../README.md)

***

# Type Alias: CaptionsOptions

> **CaptionsOptions** = `object`

Defined in: [captions/Captions.ts:19](https://github.com/maskin25/captions.js/blob/1fec33b360629c31031f61bbab6a686d60277c68/packages/core/src/captions/Captions.ts#L19)

Configuration passed to the captions runtime when binding to a video element.

## Properties

### autoEnable?

> `optional` **autoEnable**: `boolean`

Defined in: [captions/Captions.ts:24](https://github.com/maskin25/captions.js/blob/1fec33b360629c31031f61bbab6a686d60277c68/packages/core/src/captions/Captions.ts#L24)

When false, caller must invoke `enable()` manually.

***

### captions?

> `optional` **captions**: [`Caption`](../interfaces/Caption.md)[] \| `null`

Defined in: [captions/Captions.ts:23](https://github.com/maskin25/captions.js/blob/1fec33b360629c31031f61bbab6a686d60277c68/packages/core/src/captions/Captions.ts#L23)

Initial caption track.

***

### container?

> `optional` **container**: `HTMLDivElement`

Defined in: [captions/Captions.ts:21](https://github.com/maskin25/captions.js/blob/1fec33b360629c31031f61bbab6a686d60277c68/packages/core/src/captions/Captions.ts#L21)

Optional custom container to host the Konva stage.

***

### preset

> **preset**: [`StylePreset`](../interfaces/StylePreset.md)

Defined in: [captions/Captions.ts:22](https://github.com/maskin25/captions.js/blob/1fec33b360629c31031f61bbab6a686d60277c68/packages/core/src/captions/Captions.ts#L22)

Initial preset controlling font, colors, animations.

***

### video

> **video**: `HTMLVideoElement`

Defined in: [captions/Captions.ts:20](https://github.com/maskin25/captions.js/blob/1fec33b360629c31031f61bbab6a686d60277c68/packages/core/src/captions/Captions.ts#L20)

Video element that should receive overlays.
