import ExampleFeatured from "@/components/ExampleFeatured";
import {
  Configurator,
  type ConfiguratorHandle,
} from "@maskin25/captions-configurator";
import { useEffect, useRef } from "react";

function HomePage() {
  const configuratorRef = useRef<ConfiguratorHandle>(null);

  useEffect(() => {
    if (configuratorRef.current) {
      const settings = configuratorRef.current.getCaptionsSettings();
      console.log("Current captions settings:", settings);
    }
  }, []);

  return (
    <Configurator
      ref={configuratorRef}
      className="xl:h-[calc(100vh-9rem+2px)]"
      /* videoSrc="https://storage.googleapis.com/shorty-uploads/captions.js/rKpltaOMFdc.mp4" */
      carouselContentClassName="h-[calc(100vh-350px)]"
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
