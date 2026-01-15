import { useEffect, useState } from "react";

const getMatch = (query: string) => {
  if (typeof window === "undefined" || !("matchMedia" in window)) {
    return false;
  }
  return window.matchMedia(query).matches;
};

const useMediaQuery = (query: string, defaultState = false) => {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined") return defaultState;
    return getMatch(query);
  });

  useEffect(() => {
    if (typeof window === "undefined" || !("matchMedia" in window)) {
      return;
    }

    const mediaQuery = window.matchMedia(query);
    const handleChange = () => setMatches(mediaQuery.matches);

    handleChange();

    if ("addEventListener" in mediaQuery) {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }

    const legacyMediaQuery = mediaQuery as MediaQueryList & {
      addListener: (listener: () => void) => void;
      removeListener: (listener: () => void) => void;
    };
    legacyMediaQuery.addListener(handleChange);
    return () => legacyMediaQuery.removeListener(handleChange);
  }, [query]);

  return matches;
};

export default useMediaQuery;
