[**captions.js**](../README.md)

***

# Interface: StylePreset

Defined in: [stylePresets/stylePresets.config.ts:12](https://github.com/maskin25/captions.js/blob/1fec33b360629c31031f61bbab6a686d60277c68/packages/core/src/stylePresets/stylePresets.config.ts#L12)

Shared schema describing how a preset styles captions + rough layout hints.

 StylePreset

## Properties

### captionsSettings

> **captionsSettings**: `object`

Defined in: [stylePresets/stylePresets.config.ts:14](https://github.com/maskin25/captions.js/blob/1fec33b360629c31031f61bbab6a686d60277c68/packages/core/src/stylePresets/stylePresets.config.ts#L14)

Visual configuration consumed by the renderer (font, background, timing).

#### animation

> **animation**: `string`

#### linesPerPage

> **linesPerPage**: `number`

#### position

> **position**: `string`

#### positionTopOffset?

> `optional` **positionTopOffset**: `number`

#### style

> **style**: `object`

##### style.aplifiedWordColor

> **aplifiedWordColor**: `string`

##### style.backgroundColor

> **backgroundColor**: `string`

##### style.font

> **font**: `object`

##### style.font.fontCapitalize

> **fontCapitalize**: `boolean`

##### style.font.fontColor

> **fontColor**: `string`

##### style.font.fontFamily

> **fontFamily**: `string`

##### style.font.fontSize

> **fontSize**: `number`

##### style.font.fontStrokeColor

> **fontStrokeColor**: `string`

##### style.font.fontStrokeWidth

> **fontStrokeWidth**: `number`

##### style.font.fontWeight

> **fontWeight**: `string`

##### style.font.italic

> **italic**: `boolean`

##### style.font.shadow?

> `optional` **shadow**: `object`

##### style.font.shadow.fontShadowBlur

> **fontShadowBlur**: `number`

##### style.font.shadow.fontShadowColor

> **fontShadowColor**: `string`

##### style.font.shadow.fontShadowOffsetX

> **fontShadowOffsetX**: `number`

##### style.font.shadow.fontShadowOffsetY

> **fontShadowOffsetY**: `number`

##### style.font.underline

> **underline**: `boolean`

##### style.name

> **name**: `string`

##### style.verticalCoverImg

> **verticalCoverImg**: `string`

***

### id

> **id**: `number`

Defined in: [stylePresets/stylePresets.config.ts:13](https://github.com/maskin25/captions.js/blob/1fec33b360629c31031f61bbab6a686d60277c68/packages/core/src/stylePresets/stylePresets.config.ts#L13)

Stable identifier used when selecting presets.

***

### layoutSettings

> **layoutSettings**: `object`

Defined in: [stylePresets/stylePresets.config.ts:43](https://github.com/maskin25/captions.js/blob/1fec33b360629c31031f61bbab6a686d60277c68/packages/core/src/stylePresets/stylePresets.config.ts#L43)

Optional helper metadata for surrounding UI layout engines.

#### aIAutoLayout

> **aIAutoLayout**: `string`[]

#### aspectRatio

> **aspectRatio**: `string`

#### fitLayoutAspectRatio

> **fitLayoutAspectRatio**: `string`
