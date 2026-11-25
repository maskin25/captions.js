// A server component: the page is rendered on the server, the player and
// its captions hydrate on the client.
import { toCaptions } from "captions.js";
import { Player } from "./Player";

const words = toCaptions(
  "Captions follow the video frame by frame, in React and on the server"
    .split(" ")
    .map((word, i) => ({ word, start: 0.3 + i * 0.42, end: 0.3 + i * 0.42 + 0.38 })),
);

export default function Page() {
  return (
    <main>
      <h1>captions.js in the App Router</h1>
      <Player src="/sample.webm" words={words} />
    </main>
  );
}
