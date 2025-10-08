import React, { useEffect, useRef } from "react";
import { renderCaptions } from "captions.js";

export default { title: "Captions/Basic" };

export const Basic = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (ref.current) {
      const ctx = ref.current.getContext("2d")!;
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, 640, 360);
      renderCaptions(ctx, "Storybook caption example");
    }
  }, []);
  return <canvas ref={ref} width={640} height={360} />;
};
