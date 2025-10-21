export interface Crop {
  from: [number, number, number, number];
  to: [number, number, number, number];
  translate?: [number, number];
}

export enum LayoutType {
  'Fill' = 'fill',
  'Fit' = 'fit',
  'Split' = 'split',
  'Three' = 'three',
  'Four' = 'four',
  'ScreenShare' = 'screenShare',
}

export enum LayoutCropTypes {
  'Auto' = 'auto',
  'Manual' = 'manual',
}

export interface Layout {
  startTime: number;
  endTime: number;
  layoutType: LayoutType;
  crops: Crop[];
  bounds: number[][];
  layoutCropType: LayoutCropTypes;
  rightGap?: boolean;
  position?: {
    type: 'auto' | 'top' | 'middle' | 'bottom';
    positionTopOffset?: number;
  };
}

export type AspectRatioType = typeof aspectRatios[number];

export interface LayoutSettings {
  aspectRatio: AspectRatioType;
  aIAutoLayout: LayoutType[];
  fitLayoutCropAspectRatio: AspectRatioType;
}

export const aspectRatios = ['1:1', /*  '1.25:1', */ '9:16', '16:9'] as const;

export const layoutTypes: LayoutType[] = [
  LayoutType.Fill,
  LayoutType.Fit,
  LayoutType.Split,
  LayoutType.Three,
  LayoutType.Four,
  LayoutType.ScreenShare,
];

export const aspectRatioNamesMap = {
  '1:1': 'Instagram',
  /*   '1.25:1': 'Twitter', */
  '9:16': 'TikTok / Reels / Shorts',
  '16:9': 'YouTube',
};
