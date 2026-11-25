"use client";

import { useRef, useState } from "react";
import { Captions } from "@captionsjs/react";
import { presetNames, type Caption } from "captions.js";

export function Player({ src, words }: { src: string; words: Caption[] }) {
  const video = useRef<HTMLVideoElement>(null);
  const [preset, setPreset] = useState("Karaoke");

  return (
    <>
      <div style={{ width: 360, height: 640 }}>
        <video ref={video} src={src} controls muted playsInline loop width={360} height={640} />
        <Captions video={video} captions={words} preset={preset} />
      </div>
      <p>
        <select aria-label="Style" value={preset} onChange={(e) => setPreset(e.target.value)}>
          {presetNames.map((name) => (
            <option key={name}>{name}</option>
          ))}
        </select>
      </p>
    </>
  );
}
