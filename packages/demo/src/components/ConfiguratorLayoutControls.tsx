import {
  Select,
  SelectItem,
  SelectValue,
  SelectContent,
  SelectTrigger,
} from "@/components/ui/select";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";

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
    label: "Product Demo (rKpltaOMFdc)",
    videoSrc:
      "https://storage.googleapis.com/shorty-uploads/captions.js/rKpltaOMFdc.mp4",
    captionsSrc:
      "https://storage.googleapis.com/shorty-uploads/captions.js/rKpltaOMFdc-dg.json",
  },
  {
    label: "Promo Clip (Mf7HyLkuNS0)",
    videoSrc:
      "https://storage.googleapis.com/shorty-uploads/captions.js/Mf7HyLkuNS0.mp4",
    captionsSrc:
      "https://storage.googleapis.com/shorty-uploads/captions.js/Mf7HyLkuNS0-dg.json",
  },
  {
    label: "Interview (0DOMlNJ9sOk)",
    videoSrc:
      "https://storage.googleapis.com/shorty-uploads/captions.js/0DOMlNJ9sOk.mp4",
    captionsSrc:
      "https://storage.googleapis.com/shorty-uploads/captions.js/0DOMlNJ9sOk-dg.json",
  },
  {
    label: "Elon Musk Interview (Rni7Fz7208c)",
    videoSrc:
      "https://storage.googleapis.com/shorty-uploads/captions.js/Rni7Fz7208c.mp4",
    captionsSrc:
      "https://storage.googleapis.com/shorty-uploads/captions.js/Rni7Fz7208c-dg.json",
  },
  {
    label: "Matthew Podcast",
    videoSrc: "https://storage.googleapis.com/shorty-uploads/matthew.mp4",
    captionsSrc:
      "https://storage.googleapis.com/shorty-uploads/matthew-dg.json",
  },
  {
    label: "Margo Interview",
    videoSrc: "https://storage.googleapis.com/shorty-uploads/margo.mp4",
    captionsSrc: "https://storage.googleapis.com/shorty-uploads/margo-dg.json",
  },
];

type VideoSelectProps = {
  value: string;
  onChange: (next: string) => void;
};

export const VideoOptionSelect = ({ value, onChange }: VideoSelectProps) => (
  <Field>
    <FieldLabel>Video Example</FieldLabel>
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
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
