import Konva from 'konva';

import { Caption, CaptionsSettings } from '../entities/captions/captions.types';
import { LayoutSettings } from '../entities/layout/layout.types';
import { Timeline } from '../entities/timeline/timeline.types';

export type RenderFrameFn = (
  captionsSettings: CaptionsSettings,
  layoutSettings: LayoutSettings,
  captions: Caption[],
  currentTime: number,
  targetSize: [number, number],
  layer: Konva.Layer,
  toCoef?: number,
  position?: {
    type: 'auto' | 'top' | 'middle' | 'bottom';
    positionTopOffset?: number;
  }
) => void;

export type TrimLayoutsCaptionsFn = (
  timeline: Timeline,
  captions: Caption[]
) => Caption[];
