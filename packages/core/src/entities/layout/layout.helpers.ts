import { getPriorityLayoutType } from '../timeline/timeline.helpers';
import { Timeline } from '../timeline/timeline.types';
import {
  Crop,
  Layout,
  LayoutSettings,
  LayoutType,
  aspectRatios,
} from './layout.types';

const cropsArrangementByLayoutTypeAndAspectRatio: {
  [aspectRatio: string]: {
    [layoutType: string]: string[];
  };
} = {
  '9:16': {
    [LayoutType.Fill]: ['0:0:w:h'],
    [LayoutType.Fit]: ['0:0:w:h'],
    [LayoutType.Split]: ['0:0:w:h/2', '0:h/2:w:h/2'],
    [LayoutType.ScreenShare]: ['0:0:w:h/2', '0:h/2:w:h/2'],
    [LayoutType.Three]: ['0:0:w:h/2', '0:h/2:w/2:h/2', 'w/2:h/2:w/2:h/2'],
    [LayoutType.Four]: [
      '0:0:w/2:h/2',
      'w/2:0:w/2:h/2',
      '0:h/2:w/2:h/2',
      'w/2:h/2:w/2:h/2',
    ],
  },

  '1:1': {
    [LayoutType.Fill]: ['0:0:w:h'],
    [LayoutType.Fit]: ['0:0:w:h'],
    [LayoutType.Split]: ['0:0:w/2:h', 'w/2:0:w/2:h'],
    [LayoutType.ScreenShare]: ['0:0:w/2:h', 'w/2:0:w/2:h'],
    [LayoutType.Three]: ['0:0:w:h/2', '0:h/2:w/2:h/2', 'w/2:h/2:w/2:h/2'],
    [LayoutType.Four]: [
      '0:0:w/2:h/2',
      'w/2:0:w/2:h/2',
      '0:h/2:w/2:h/2',
      'w/2:h/2:w/2:h/2',
    ],
  },
  '16:9': {
    [LayoutType.Fill]: ['0:0:w:h'],
    [LayoutType.Fit]: ['0:0:w:h'],
    [LayoutType.Split]: ['0:0:w/2:h', 'w/2:0:w/2:h'],
    [LayoutType.ScreenShare]: ['0:0:w/2:h', 'w/2:0:w/2:h'],
    [LayoutType.Three]: ['0:0:w/3:h', 'w/3:0:w/3:h', 'w/1.5:0:w/3:h'],
    [LayoutType.Four]: [
      '0:0:w/2:h/2',
      'w/2:0:w/2:h/2',
      '0:h/2:w/2:h/2',
      'w/2:h/2:w/2:h/2',
    ],
  },
};

export const getClosestRatio = (width: number, height: number) => {
  return aspectRatios.reduce((memo, current) => {
    const [curentW, currentH] = current.split(':').map(Number);
    const currentRatio = curentW / currentH;

    const [memoW, memoH] = memo.split(':').map(Number);
    const memoRatio = memoW / memoH;

    const ratio = width / height;

    return Math.abs(currentRatio - ratio) < Math.abs(memoRatio - ratio)
      ? current
      : memo;
  });
};

export const getLayoutName = (layoutType: Layout['layoutType']) => {
  switch (layoutType) {
    case 'fill':
      return 'Fill';
    case 'fit':
      return 'Fit';
    case 'split':
      return 'Split';
    case 'three':
      return 'Three';
    case 'four':
      return 'Four';
    case 'screenShare':
      return 'Screen Share';
    default:
      return 'Unknown';
  }
};

export const enrichWithCrops = (
  timeline: Timeline,
  sourceSize: [number, number],
  targetSize: [number, number]
) => {
  return {
    ...timeline,
    layouts: timeline.layouts.map(layout => {
      return layout.crops
        ? layout
        : {
            ...layout,
            crops: generateCrops(
              layout.layoutType,
              sourceSize[0],
              sourceSize[1],
              targetSize[0],
              targetSize[1]
            ),
          };
    }),
  };
};

export const enrichWithRightGaps = (timeline: Timeline) => {
  return {
    ...timeline,
    layouts: timeline.layouts.map((layout, index) => {
      const nextLayout = timeline.layouts[index + 1];
      return {
        ...layout,
        rightGap: nextLayout?.startTime > layout.endTime,
      };
    }),
  };
};

export const generateCrops = (
  layoutType: LayoutType,
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number
): Crop[] => {
  const originalAspectRatio = sourceWidth / sourceHeight;
  const targetAspectRatio = targetWidth / targetHeight;

  function getVideoPreviewSize(ratio: string) {
    const [left, top, width, height] = ratio.split(':').map(token => {
      if (token.startsWith('w')) {
        const [, divider = '1'] = token.split('/');
        return targetWidth / Number(divider);
      }
      if (token.startsWith('h')) {
        const [, divider = '1'] = token.split('/');
        return targetHeight / Number(divider);
      }

      return Number(token);
    });

    let from: [number, number, number, number];
    const cropAspectRatio = width / height;
    if (originalAspectRatio >= cropAspectRatio) {
      const width = sourceHeight * cropAspectRatio;
      from = [
        (sourceWidth - width) / 2,
        0,
        (sourceWidth + width) / 2,
        sourceHeight,
      ];
    } else {
      const height = sourceWidth / cropAspectRatio;
      from = [
        0,
        (sourceHeight - height) / 2,
        sourceWidth,
        (sourceHeight + height) / 2,
      ];
    }

    return {
      from,
      to: [left, top, left + width, top + height],
    } as Crop;
  }

  switch (layoutType) {
    case LayoutType.Fill:
      if (originalAspectRatio >= targetAspectRatio) {
        const width = sourceHeight * targetAspectRatio;
        return [
          {
            from: [
              (sourceWidth - width) / 2,
              0,
              (sourceWidth + width) / 2,
              sourceHeight,
            ],
            to: [0, 0, targetWidth, targetHeight],
          },
        ];
      } else {
        const height = sourceWidth / targetAspectRatio;
        return [
          {
            from: [
              0,
              (sourceHeight - height) / 2,
              sourceWidth,
              (sourceHeight + height) / 2,
            ],
            to: [0, 0, targetWidth, targetHeight],
          },
        ];
      }

    case LayoutType.Split:
    case LayoutType.ScreenShare:
    case LayoutType.Three:
    case LayoutType.Four:
      return cropsArrangementByLayoutTypeAndAspectRatio[
        getClosestRatio(targetWidth, targetHeight)
      ][layoutType].map(getVideoPreviewSize);

    case LayoutType.Fit:
    default:
      if (originalAspectRatio >= targetAspectRatio) {
        const width = targetWidth;
        const height = width / originalAspectRatio;
        return [
          {
            from: [0, 0, sourceWidth, sourceHeight],
            to: [
              0,
              (targetHeight - height) / 2,
              targetWidth,
              (targetHeight + height) / 2,
            ],
          },
        ];
      } else {
        const height = targetHeight;
        const width = height * originalAspectRatio;
        return [
          {
            from: [0, 0, sourceWidth, sourceHeight],
            to: [
              (targetWidth - width) / 2,
              0,
              (targetWidth + width) / 2,
              targetHeight,
            ],
          },
        ];
      }
  }
};

export const generateAICrops = (
  layoutSettings: LayoutSettings,
  bounds: number[][],
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
  manualLayoutType?: LayoutType
): { crops: Crop[]; layoutType: LayoutType } => {
  const originalAspectRatio = sourceWidth / sourceHeight;
  const targetAspectRatio = targetWidth / targetHeight;
  const layoutType =
    manualLayoutType ??
    getPriorityLayoutType(layoutSettings, bounds.length) ??
    LayoutType.Fit;

  const scaleByCenter = (bs: number[], scale?: number) => {
    const targetScale = scale ?? 2;
    const xc = (bs[0] + bs[2]) / 2;
    const yc = (bs[1] + bs[3]) / 2;
    const newX1 = xc + targetScale * (bs[0] - xc);
    const newY1 = yc + targetScale * (bs[1] - yc);
    const newX2 = xc + targetScale * (bs[2] - xc);
    const newY2 = yc + targetScale * (bs[3] - yc);

    return [newX1, newY1, newX2, newY2];
  };

  /*
   * Get crop item based on bound, target AspectRatio, scale of deteacted face (object)
   */
  const getCropFrom = (
    bs: number[],
    cropAspectRatio: number,
    startedScale?: number,
    layoutType?: LayoutType
  ): [number, number, number, number] => {
    const scale = startedScale ?? (cropAspectRatio < 1 ? 4.5 : 5.5);
    // scale image bound from xCenter, yCenter in scale time
    const rect = scaleByCenter(bs, scale);

    // get new bound with target cropAspectRatio
    const max = Math.max(rect[2] - rect[0], rect[3] - rect[1]);
    const withAspect = (rect[0] + max - rect[0]) * cropAspectRatio;
    let x2 = withAspect + rect[0];
    let y2 = rect[1] + max;
    // correct bound after AspectRatio
    if (cropAspectRatio < 1) {
      const offsetX = (x2 - rect[0]) / 4;
      x2 = x2 + offsetX;
      rect[0] = rect[0] + offsetX;
    }

    // correct bound if has out of image
    /* if (rect[0] < 0) {
      x2 += -rect[0];
      rect[0] = 0;
    }
    if (rect[1] < 0) {
      y2 += -rect[1];
      rect[1] = 0;
    }
    if (x2 > sourceWidth) {
      rect[0] -= x2 - sourceWidth;
      x2 = sourceWidth;
    }
    if (y2 > sourceHeight) {
      rect[1] -= y2 - sourceHeight;
      y2 = sourceHeight;
    }*/

    const from = [rect[0], rect[1], x2, y2];
    // if some bound coor < 0, change the step of the scale to remove outside black area
    if (
      from.findIndex(x => x < 0) !== -1 ||
      from[2] > sourceWidth ||
      from[3] > sourceHeight
    ) {
      return getCropFrom(bs, cropAspectRatio, scale - 0.08, layoutType);
    }

    // increase size to full height
    if (layoutType === LayoutType.Fill) {
      const increaseW = sourceWidth - from[2] - 5;
      const increaseH = sourceHeight - from[3] - 5;
      const increase = Math.min(increaseH, increaseW);
      from[0] = from[0] - (increase * cropAspectRatio) / 2;
      from[2] = from[2] + (increase * cropAspectRatio) / 2;
      from[3] = from[3] + increase;
    }

    // align the centers of the box and from
    const fromCenter = (from[2] + from[0]) / 2;
    const boxCenter = (bs[2] + bs[0]) / 2;
    const correctXbyCenterDiff = boxCenter - fromCenter;
    from[0] += correctXbyCenterDiff;
    from[2] += correctXbyCenterDiff;

    return from as [number, number, number, number];
  };

  function getVideoPreviewSize(ratio: string, bound: number[]) {
    const [left, top, width, height] = ratio.split(':').map(token => {
      if (token.startsWith('w')) {
        const [, divider = '1'] = token.split('/');
        console.log('divider', divider, Number(divider));
        return targetWidth / Number(divider);
      }
      if (token.startsWith('h')) {
        const [, divider = '1'] = token.split('/');
        return targetHeight / Number(divider);
      }

      return Number(token);
    });

    let from: [number, number, number, number];
    const cropAspectRatio = width / height;
    if (originalAspectRatio >= cropAspectRatio) {
      from = getCropFrom(bound, cropAspectRatio, undefined, layoutType) as [
        number,
        number,
        number,
        number
      ];
    } else {
      const height = sourceWidth / cropAspectRatio;
      from = [
        0,
        (sourceHeight - height) / 2,
        sourceWidth,
        (sourceHeight + height) / 2,
      ];
    }

    return {
      from,
      to: [left, top, left + width, top + height],
    } as Crop;
  }

  switch (layoutType) {
    case LayoutType.Fill:
    case LayoutType.Split:
    case LayoutType.ScreenShare:
    case LayoutType.Three:
    case LayoutType.Four:
      const cropsArr =
        cropsArrangementByLayoutTypeAndAspectRatio[
          getClosestRatio(targetWidth, targetHeight)
        ][layoutType];

      console.log(
        'cropsArr',
        getClosestRatio(targetWidth, targetHeight),
        layoutType,
        cropsArr
      );

      return {
        crops: cropsArr.map((x, i) =>
          getVideoPreviewSize(x, bounds[i] ?? bounds[0])
        ),
        layoutType,
      };

    case LayoutType.Fit:
    default:
      if (originalAspectRatio >= targetAspectRatio) {
        const width = targetWidth;
        const height = width / originalAspectRatio;
        return {
          crops: [
            {
              from: [0, 0, sourceWidth, sourceHeight],
              to: [
                0,
                (targetHeight - height) / 2,
                targetWidth,
                (targetHeight + height) / 2,
              ],
            },
          ],
          layoutType,
        };
      } else {
        const height = targetHeight;
        const width = height * originalAspectRatio;
        return {
          crops: [
            {
              from: [0, 0, sourceWidth, sourceHeight],
              to: [
                (targetWidth - width) / 2,
                0,
                (targetWidth + width) / 2,
                targetHeight,
              ],
            },
          ],
          layoutType,
        };
      }
  }
};

export const fitAndCenter = (
  aspectRatio: number,
  outer: [number, number, number, number]
): [number, number, number, number] => {
  const outerW = outer[2] - outer[0];
  const outererH = outer[3] - outer[1];

  const outerAspectRatio = outerW / outererH;

  if (aspectRatio >= outerAspectRatio) {
    const width = outerW;
    const height = outerW / aspectRatio;
    return [
      outer[0],
      outer[1] + (outererH - height) / 2,
      outer[0] + width,
      outer[1] + (outererH - height) / 2 + height,
    ];
  } else {
    const height = outererH;
    const width = outererH * aspectRatio;
    return [
      outer[0] + (outerW - width) / 2,
      outer[1],
      outer[0] + (outerW - width) / 2 + width,
      outer[1] + height,
    ];
  }
};

export const getCropTargetBounds = (
  layoutType: LayoutType,
  cropIndex: number,
  targetSize: [number, number]
): [number, number, number, number] => {
  function getTo(ratio: string) {
    const [left, top, width, height] = ratio.split(':').map(token => {
      if (token.startsWith('w')) {
        const [, divider = '1'] = token.split('/');
        return targetSize[0] / Number(divider);
      }
      if (token.startsWith('h')) {
        const [, divider = '1'] = token.split('/');
        return targetSize[1] / Number(divider);
      }

      return Number(token);
    });

    return [left, top, left + width, top + height];
  }

  switch (layoutType) {
    case LayoutType.Fill:
    case LayoutType.Fit:
    case LayoutType.Split:
    case LayoutType.ScreenShare:
    case LayoutType.Three:
    case LayoutType.Four:
      const cropsArr =
        cropsArrangementByLayoutTypeAndAspectRatio[
          getClosestRatio(targetSize[0], targetSize[1])
        ][layoutType];
      return getTo(cropsArr[cropIndex]) as [number, number, number, number];
  }
};

export const getTargetSize = (aspectRatio: string): [number, number] => {
  switch (aspectRatio) {
    case '16:9':
      return [480, 270];
    case '9:16':
      return [270, 480];
    case '1:1':
      return [480, 480];
    default:
      return [270, 480];
  }
};
