[**captions.js**](../README.md)

***

# Type Alias: CaptionsOptions

> **CaptionsOptions** = `object`

Defined in: [captions/Captions.ts:13](https://github.com/maskin25/captions.js/blob/b528ac4031c0134114f42f5ddcfe4e7c5829a65f/packages/core/src/captions/Captions.ts#L13)

Configuration passed to the captions runtime when binding to a video element.

## Properties

### autoEnable?

> `optional` **autoEnable**: `boolean`

Defined in: [captions/Captions.ts:23](https://github.com/maskin25/captions.js/blob/b528ac4031c0134114f42f5ddcfe4e7c5829a65f/packages/core/src/captions/Captions.ts#L23)

When false, caller must invoke [Captions.enable](../classes/Captions.md#enable) manually.

***

### captions?

> `optional` **captions**: [`Caption`](../interfaces/Caption.md)[] \| `null`

Defined in: [captions/Captions.ts:21](https://github.com/maskin25/captions.js/blob/b528ac4031c0134114f42f5ddcfe4e7c5829a65f/packages/core/src/captions/Captions.ts#L21)

Initial caption track.

***

### container?

> `optional` **container**: `HTMLDivElement`

Defined in: [captions/Captions.ts:17](https://github.com/maskin25/captions.js/blob/b528ac4031c0134114f42f5ddcfe4e7c5829a65f/packages/core/src/captions/Captions.ts#L17)

Optional custom container to host the Konva stage.

***

### preset

> **preset**: [`StylePreset`](../interfaces/StylePreset.md)

Defined in: [captions/Captions.ts:19](https://github.com/maskin25/captions.js/blob/b528ac4031c0134114f42f5ddcfe4e7c5829a65f/packages/core/src/captions/Captions.ts#L19)

Initial preset controlling font, colors, animations.

***

### video

> **video**: `HTMLVideoElement`

Defined in: [captions/Captions.ts:15](https://github.com/maskin25/captions.js/blob/b528ac4031c0134114f42f5ddcfe4e7c5829a65f/packages/core/src/captions/Captions.ts#L15)

Video element that should receive overlays.
