import { useState } from "react";

export type Theme = "light" | "dark";

// The theme is a per-browser convenience; storage can be unavailable, so it falls back to light.
function storedTheme(key: string): Theme {
  try {
    return localStorage.getItem(key) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

/** Light/dark switch for the sidebar areas (coordinator, logistics), remembered per browser under `key`. */
export function useStoredTheme(key: string) {
  const [theme, setTheme] = useState<Theme>(() => storedTheme(key));

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    try {
      localStorage.setItem(key, next);
    } catch {
      // Not remembered, but the switch still applies for this visit.
    }
  };

  return { theme, toggleTheme };
}
