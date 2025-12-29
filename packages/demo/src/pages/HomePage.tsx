import ExampleFeatured from "@/components/ExampleFeatured";
import { Configurator } from "@maskin25/captions-configurator";

function HomePage() {
  return (
    <Configurator
      className="xl:h-[calc(100vh-9rem+2px)]"
      videoSrc="https://storage.googleapis.com/shorty-uploads/captions.js/rKpltaOMFdc.mp4"
    />
  );

  return (
    <div className="p-4 flex flex-col items-center gap-4">
      <ExampleFeatured
        videoSrc="https://storage.googleapis.com/shorty-uploads/captions.js/rKpltaOMFdc.mp4"
        captionsSrc="https://storage.googleapis.com/shorty-uploads/captions.js/rKpltaOMFdc-dg.json"
        presetName="From"
      />
      {/* <ExampleFeatured
        videoSrc="https://storage.googleapis.com/shorty-uploads/captions.js/Mf7HyLkuNS0.mp4"
        captionsSrc="https://storage.googleapis.com/shorty-uploads/captions.js/Mf7HyLkuNS0-dg.json"
        presetName="From"
      /> */}
      {/*   <ExampleFeatured
        videoSrc="https://storage.googleapis.com/shorty-uploads/captions.js/0DOMlNJ9sOk.mp4"
        captionsSrc="https://storage.googleapis.com/shorty-uploads/captions.js/0DOMlNJ9sOk-dg.json"
        presetName="From"
      /> */}
      {/*  <ExampleFeatured
        videoSrc="https://storage.googleapis.com/shorty-uploads/matthew.mp4"
        //captionsSrc="https://storage.googleapis.com/shorty-uploads/matthew-plain.json"
        captionsSrc="https://storage.googleapis.com/shorty-uploads/matthew-dg.json"
        presetName="From"
      /> */}
      {/*  <ExampleFeatured
        videoSrc="https://storage.googleapis.com/shorty-uploads/margo.mp4"
        //captionsSrc="https://storage.googleapis.com/shorty-uploads/margo-plain.json"
        captionsSrc="https://storage.googleapis.com/shorty-uploads/margo-dg.json"
        presetName="Lovly"
      /> */}
    </div>
  );
}

export default HomePage;
