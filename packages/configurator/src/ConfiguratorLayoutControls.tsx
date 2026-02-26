import {
  Select,
  SelectItem,
  SelectValue,
  SelectContent,
  SelectTrigger,
} from "./ui/select";
import { Field, FieldLabel, FieldDescription } from "./ui/field";

export type AspectRatio = {
  label: string;
  value: string;
  ratio: string;
};

export const aspectRatioOptions: AspectRatio[] = [
  { label: "16:9", value: "16:9", ratio: "16 / 9" },
  { label: "9:16", value: "9:16", ratio: "9 / 16" },
  { label: "1:1", value: "1:1", ratio: "1 / 1" },
  { label: "4:3", value: "4:3", ratio: "4 / 3" },
];

export type VideoOption = {
  label: string;
  videoSrc: string;
  captionsSrc: string;
};

export const videoOptions: VideoOption[] = [
  {
    label: "Confidence isn't loud, here's how to find your voice | Nimi Mehta",
    videoSrc: "https://cdn.shorty.plus/demo/examples/rKpltaOMFdc.mp4",
    captionsSrc:
      "https://cdn.shorty.plus/demo/examples/rKpltaOMFdc-audio-transcription.json",
  },
  {
    label: "Yanis Varoufakis on Mamdani, Tommy Robinson and resisting fascism",
    videoSrc: "https://cdn.shorty.plus/demo/examples/Mf7HyLkuNS0.mp4",
    captionsSrc:
      "https://cdn.shorty.plus/demo/examples/Mf7HyLkuNS0-audio-transcription.json",
  },
  {
    label: "London, how many languages do you speak?",
    videoSrc: "https://cdn.shorty.plus/demo/examples/0DOMlNJ9sOk.mp4",
    captionsSrc:
      "https://cdn.shorty.plus/demo/examples/0DOMlNJ9sOk-audio-transcription.json",
  },
  {
    label: "Elon Musk: A Different Conversation w/ Nikhil Kamath",
    videoSrc: "https://cdn.shorty.plus/demo/examples/Rni7Fz7208c.mp4",
    captionsSrc:
      "https://cdn.shorty.plus/demo/examples/Rni7Fz7208c-audio-transcription.json",
  },
  {
    label: "Matthew McConaughey | Blocks Podcast w/ Neal Brennan",
    videoSrc: "https://cdn.shorty.plus/demo/examples/Rsol0hQ3IV8.mp4",
    captionsSrc:
      "https://cdn.shorty.plus/demo/examples/Rsol0hQ3IV8-audio-transcription.json",
  },
  {
    label: "Margot Robbie Answers 73 Questions | Vogue",
    videoSrc: "https://cdn.shorty.plus/demo/examples/Bl5630CeYFs.mp4",
    captionsSrc:
      "https://cdn.shorty.plus/demo/examples/Bl5630CeYFs-audio-transcription.json",
  },
];

type VideoSelectProps = {
  value: string;
  onChange: (next: string) => void;
};

export const VideoOptionSelect = ({ value, onChange }: VideoSelectProps) => (
  <Field>
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="max-w-[320px] border-white/25 bg-black/35 text-white shadow-none backdrop-blur-sm hover:border-white/40 focus-visible:border-white/45 focus-visible:ring-white/25 data-[placeholder]:text-white/75">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {videoOptions.map((video) => (
          <SelectItem key={video.videoSrc} value={video.videoSrc}>
            {video.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </Field>
);
