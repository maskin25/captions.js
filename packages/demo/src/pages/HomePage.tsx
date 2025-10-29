import ExampleFeatured from "@/components/ExampleFeatured";

function HomePage() {
  return (
    <div className="p-4 flex flex-col items-center gap-4">
      <ExampleFeatured
        videoSrc="https://storage.googleapis.com/shorty-uploads/matthew.mp4"
        //captionsSrc="https://storage.googleapis.com/shorty-uploads/matthew-plain.json"
        captionsSrc="https://storage.googleapis.com/shorty-uploads/matthew-dg.json"
        presetName="From"
      />
      <ExampleFeatured
        videoSrc="https://storage.googleapis.com/shorty-uploads/margo.mp4"
        //captionsSrc="https://storage.googleapis.com/shorty-uploads/margo-plain.json"
        captionsSrc="https://storage.googleapis.com/shorty-uploads/margo-dg.json"
        presetName="Lovly"
      />
    </div>
  );
}

export default HomePage;
