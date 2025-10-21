import Konva from 'konva';
import { Caption, CaptionsSettings } from '../entities/captions/captions.types';
import { Ease, mapEaseToFn } from './easing';

export const animate = (
  captionsSettings: CaptionsSettings,
  progress: number,
  chunk: {
    group: Konva.Group;
    width: number;
    height: number;
  },
  current?: {
    caption: Caption;
    text: Konva.Text;
    progress: number;
    textTrim?: Konva.Text | null;
  }
) => {
  const easeFn = mapEaseToFn[Ease.inQuint];
  const slideOffset = 7;
  switch (captionsSettings.animation) {
    case 'bounce':
      if (current) {
        current.text.offsetX(current.text.width() / 2);
        current.text.offsetY(current.text.height() / 2);
        current.text.x(current.text.x() + current.text.width() / 2);
        current.text.y(current.text.y() + current.text.height() / 2);
        current.text.scale({
          x: 1 + 0.3 * easeFn(1),
          y: 1 + 0.3 * easeFn(1),
        });

        const offsetModule = captionsSettings.style.font.fontSize * 0.3;
        const curreentChildIndex =
          current.text.parent?.children.indexOf(current.text) || 0;
        current.text.parent?.children.forEach((child, index) => {
          if (index !== curreentChildIndex) {
            const offset =
              index < curreentChildIndex ? -offsetModule : offsetModule;
            child.x(child.x() + offset * easeFn(1));
          }
        });
      }
      break;
    case 'underline':
      if (current) {
        const underline = new Konva.Line({
          points: [
            current.text.x(),
            current.text.height(),
            current.text.x() + current.text.width() * easeFn(1),
            current.text.height(),
          ],
          lineCap: 'round',
          stroke: current.caption.highlightColor
            ? current.caption.highlightColor
            : captionsSettings.style.aplifiedWordColor,
          strokeWidth: 5,
          //opacity: easeFn(current.progress),
        });
        current.text.parent?.add(underline);
      }
      break;
    case 'box':
      const xOffset = 12;
      const yOffset = 5;
      const cornerRadius = 6;
      const box = new Konva.Rect({
        x: -xOffset,
        y: -yOffset - 2,
        width: chunk.width + 2 * xOffset,
        height: chunk.height + 2 * yOffset + 2,
        fill: captionsSettings.style.backgroundColor,
        cornerRadius,
      });
      chunk.group.add(box);
      box.moveToBottom();
      break;
    case 'box-word':
      if (current) {
        const underline = new Konva.Line({
          id: 'box-word',
          points: [
            current.text!.x() + 6,
            current.text!.height() - current.text!.height() / 2,
            current.text!.x() + (current.textTrim!.width() - 6) * easeFn(1),
            current.text!.height() - current.text!.height() / 2,
          ],
          lineCap: 'round',
          stroke: captionsSettings.style.backgroundColor,
          strokeWidth: current.textTrim!.height() + 2,
        });
        underline.zIndex(4);
        current.text?.parent?.add(underline);
      }
      break;
    case 'pop':
      const scaleFactor = 0.5 + 0.5 * mapEaseToFn[Ease.outBack](progress);
      chunk.group.scale({
        x: scaleFactor,
        y: scaleFactor,
      });
      break;
    case 'scale':
      const scaleFactor2 = 0.4 + 0.6 * mapEaseToFn[Ease.linear](progress);
      chunk.group.scale({
        x: scaleFactor2,
        y: scaleFactor2,
      });
      break;

    case 'slide-down':
      chunk.group.y(
        chunk.group.y() -
          slideOffset +
          slideOffset * mapEaseToFn[Ease.linear](progress)
      );
      break;

    case 'slide-up':
      chunk.group.y(
        chunk.group.y() +
          slideOffset -
          slideOffset * mapEaseToFn[Ease.linear](progress)
      );
      break;
    case 'slide-left':
      chunk.group.x(
        chunk.group.x() +
          slideOffset -
          slideOffset * mapEaseToFn[Ease.linear](progress)
      );
      break;

    default:
      break;
  }
};
