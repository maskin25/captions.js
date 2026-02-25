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
      carouselContentClassName="h-[calc(100vh-320px)]"
      debug={import.meta.env.DEV}
      captionsReadonly={true}
    />
  );
}

export default HomePage;
