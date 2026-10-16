import { useEffect, useRef, useState } from "react";

/** [justSaved, markSaved]: true for a few seconds after markSaved(), for the "Saved" confirmation. */
export function useJustSaved(ms = 2500) {
  const [justSaved, setJustSaved] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const markSaved = () => {
    setJustSaved(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setJustSaved(false), ms);
  };

  return [justSaved, markSaved] as const;
}
