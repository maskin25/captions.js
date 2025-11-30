[**captions.js**](../README.md)

***

# Interface: StylePreset

Defined in: [stylePresets/stylePresets.config.ts:6](https://github.com/maskin25/captions.js/blob/5b711180c3152bda8f15a5bee82a3003106d29ad/packages/core/src/stylePresets/stylePresets.config.ts#L6)

Shared schema describing how a preset styles captions plus rough layout hints.

## Properties

### captionsSettings

> **captionsSettings**: `object`

Defined in: [stylePresets/stylePresets.config.ts:8](https://github.com/maskin25/captions.js/blob/5b711180c3152bda8f15a5bee82a3003106d29ad/packages/core/src/stylePresets/stylePresets.config.ts#L8)

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

Defined in: [stylePresets/stylePresets.config.ts:7](https://github.com/maskin25/captions.js/blob/5b711180c3152bda8f15a5bee82a3003106d29ad/packages/core/src/stylePresets/stylePresets.config.ts#L7)

***

### layoutSettings

> **layoutSettings**: `object`

Defined in: [stylePresets/stylePresets.config.ts:37](https://github.com/maskin25/captions.js/blob/5b711180c3152bda8f15a5bee82a3003106d29ad/packages/core/src/stylePresets/stylePresets.config.ts#L37)

#### aIAutoLayout

> **aIAutoLayout**: `string`[]

#### aspectRatio

> **aspectRatio**: `string`

#### fitLayoutAspectRatio

> **fitLayoutAspectRatio**: `string`
