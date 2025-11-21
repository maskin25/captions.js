import React, { useRef } from "react";
import { useRemoteCaptions } from "@/hooks/useCaptions";

const TestPage: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const { captions, preset, setPreset } = useRemoteCaptions(
    videoRef,
    "https://storage.googleapis.com/shorty-uploads/matthew-dg.json",
    "From"
  );

  return (
    <div style={{ padding: "2rem" }}>
      <div>
        <video
          preload="metadata"
          ref={videoRef}
          src="https://storage.googleapis.com/shorty-uploads/matthew.mp4"
          controls
        />
      </div>
    </div>
  );
};

export default TestPage;
