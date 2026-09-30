import { useEffect, useState } from "react";
import { getPreset, renderStylePreset } from "captions.js";

export default { title: "Captions/Basic" };

export const Basic = () => {
  const [src, setSrc] = useState<string>();
  useEffect(() => {
    renderStylePreset(getPreset("Karaoke"), [640, 360], [1.1], "Storybook captions").then(
      ([image]) => setSrc(image),
    );
  }, []);
  return (
    <div style={{ background: "black", width: 640, height: 360 }}>
      {src && <img src={src} width={640} height={360} alt="Karaoke preset" />}
    </div>
  );
};
