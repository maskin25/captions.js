import { useRef, useState } from "react";
import { Captions } from "@captionsjs/react";
import { presetNames, toCaptions } from "captions.js";

// Word timings as a transcription service returns them; toCaptions() also
// reads Deepgram, Whisper, SRT, VTT and more.
const words = toCaptions(
  "Captions follow the video frame by frame, in React and on the server"
    .split(" ")
    .map((word, i) => ({ word, start: 0.3 + i * 0.42, end: 0.3 + i * 0.42 + 0.38 })),
);

export function App() {
  const video = useRef<HTMLVideoElement>(null);
  const [preset, setPreset] = useState("Karaoke");
  const [shown, setShown] = useState(true);

  return (
    <main style={{ fontFamily: "system-ui", padding: 24 }}>
      <div style={{ width: 360, height: 640 }}>
        <video ref={video} src="/sample.webm" controls muted playsInline loop width={360} height={640} />
        {shown && <Captions video={video} captions={words} preset={preset} />}
      </div>
      <p>
        <select aria-label="Style" value={preset} onChange={(e) => setPreset(e.target.value)}>
          {presetNames.map((name) => (
            <option key={name}>{name}</option>
          ))}
        </select>{" "}
        <button onClick={() => setShown((s) => !s)}>{shown ? "Hide" : "Show"} captions</button>
      </p>
    </main>
  );
}
