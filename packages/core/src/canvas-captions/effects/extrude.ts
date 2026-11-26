import { colorOption } from "./color";
import { springAt } from "./spring";
import { DECORATION, numberOption, type Effect } from "./types";

/**
 * Hard Extrude: block letters with a solid 3D side, made of stepped copies of
 * each word offset down and to the right. The spoken word rises out of the
 * block on a spring: its face moves up and left while its side grows. Depth
 * and steps follow each word's font size.
 *
 * Options: `extrudeColor` (side color, default the preset's
 * `backgroundColor`), `extrudeDepth` (in em, 0.08), `extrudeLift` (extra
 * depth of the spoken word, in em, 0.06), `extrudeAngle` (degrees below the
 * horizontal, 50).
 */
export const extrude: Effect = {
  apply({ words, active, options, settings }) {
    const color = colorOption(options, "extrudeColor", settings.style.backgroundColor);
    const depthEm = numberOption(options, "extrudeDepth", 0.08);
    const liftEm = numberOption(options, "extrudeLift", 0.06);
    const angle = (numberOption(options, "extrudeAngle", 50) * Math.PI) / 180;
    const dirX = Math.cos(angle);
    const dirY = Math.sin(angle);

    for (const word of words) {
      const { text } = word;
      const size = text.fontSize();
      const isActive = word.index === active?.index;
      const lift = isActive ? Math.max(0, springAt(word.elapsed, 3.5, 0.5)) * liftEm * size : 0;
      const depth = depthEm * size + lift;
      if (depth <= 0) continue;

      // the face rises by the lift; the side fills the gap down to the base
      const baseX = text.x();
      const baseY = text.y();
      text.x(baseX - dirX * lift);
      text.y(baseY - dirY * lift);
      text.shadowOpacity(0);

      // one copy per ~0.6% of the font size: a solid side without visible steps
      const steps = Math.max(3, Math.min(40, Math.ceil(depth / Math.max(0.5, size * 0.006))));
      for (let i = steps; i >= 1; i--) {
        const k = (i / steps) * depth;
        const copy = text.clone({
          name: DECORATION,
          x: text.x() + dirX * k,
          y: text.y() + dirY * k,
          fill: color,
          stroke: color,
          strokeWidth: text.strokeWidth(),
          shadowOpacity: 0,
        });
        text.parent?.add(copy);
        copy.moveToBottom();
      }
    }
  },
};
