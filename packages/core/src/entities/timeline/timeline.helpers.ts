import {
  Crop,
  Layout,
  LayoutSettings,
  LayoutType,
} from '../layout/layout.types';
import { Timeline } from './timeline.types';

export const trimTimeLine = (
  timeline: Timeline,
  timeRange: [number, number]
) => {
  const [startTime, endTime] = timeRange;

  return {
    ...timeline,
    layouts: timeline.layouts.filter(layout => {
      return (
        (layout.startTime >= startTime && layout.endTime <= endTime) ||
        (layout.startTime <= startTime && layout.endTime >= startTime) ||
        (layout.startTime <= endTime && layout.endTime >= endTime) ||
        (layout.startTime <= startTime && layout.endTime >= endTime)
      );
    }),
  };
};

const normalizeCrop = (crop: Crop) => {
  const newCrop = {
    ...crop,
    to: [
      crop.to[0] + (crop.translate?.[0] ?? 0),
      crop.to[1] + (crop.translate?.[1] ?? 0),
      crop.to[2] + (crop.translate?.[0] ?? 0),
      crop.to[3] + (crop.translate?.[1] ?? 0),
    ],
  };

  delete newCrop['translate'];
  return newCrop;
};

export const normalizeTimelineCrops = (timeline: Timeline): Timeline => {
  return {
    ...timeline,
    layouts: timeline.layouts.map(layout => {
      return {
        ...layout,
        crops: layout.crops.map(normalizeCrop),
      } as Layout;
    }),
  };
};

export const getPriorityLayoutType = (
  layoutSettings: LayoutSettings,
  boundsLength: number
): any => {
  const preveredOrderedTypesOneCrop = [
    LayoutType.Fill,
    LayoutType.Fit,
    LayoutType.Split,
    LayoutType.ScreenShare,
    LayoutType.Three,
    LayoutType.Four,
  ];
  const preveredOrderedTypesTwoCrops = [
    LayoutType.Split,
    LayoutType.ScreenShare,
    LayoutType.Fill,
    LayoutType.Fit,
    LayoutType.Three,
    LayoutType.Four,
  ];
  const preveredOrderedTypesThreeCrops = [
    LayoutType.Three,
    LayoutType.Split,
    LayoutType.ScreenShare,
    LayoutType.Fill,
    LayoutType.Fit,
    LayoutType.Four,
  ];
  const preveredOrderedTypesFourCrops = [
    LayoutType.Four,
    LayoutType.Three,
    LayoutType.Split,
    LayoutType.ScreenShare,
    LayoutType.Fill,
    LayoutType.Fit,
  ];

  const getPriorityLayoutType = (
    preferredTypes: LayoutType[],
    availableTypes: LayoutType[]
  ) => {
    return preferredTypes.find(type => availableTypes.includes(type));
  };

  switch (boundsLength) {
    case 0:
      return LayoutType.Fit;
    case 1:
      return getPriorityLayoutType(
        preveredOrderedTypesOneCrop,
        layoutSettings.aIAutoLayout
      );
    case 2:
      return getPriorityLayoutType(
        preveredOrderedTypesTwoCrops,
        layoutSettings.aIAutoLayout
      );
    case 3:
      return getPriorityLayoutType(
        preveredOrderedTypesThreeCrops,
        layoutSettings.aIAutoLayout
      );
    case 4:
      return getPriorityLayoutType(
        preveredOrderedTypesFourCrops,
        layoutSettings.aIAutoLayout
      );
    default:
      return LayoutType.Fit;
  }
};
