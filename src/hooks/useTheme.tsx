import { useEffect, useState } from "react";

export type Theme = "light" | "dark";

const KEY = "ga-theme";

function storedTheme(): Theme {
  try {
    return window.localStorage.getItem(KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

/**
 * Shared theme store. Every useTheme() consumer sees the same value — a
 * per-component copy used to leave the map stuck on the old theme when the
 * toggle flipped (AppShell's state never reached HeroMap's).
 * First render is always "light" so SSR and client match (no hydration
 * mismatch); the stored choice syncs in an effect on mount, and the
 * no-flash script in __root already applied the .dark class at paint time.
 */
let current: Theme = "light";
const listeners = new Set<(t: Theme) => void>();

function setGlobalTheme(next: Theme) {
  current = next;
  document.documentElement.classList.toggle("dark", next === "dark");
  try {
    window.localStorage.setItem(KEY, next);
  } catch {
    /* storage blocked — the choice just doesn't persist */
  }
  for (const listener of listeners) listener(next);
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(current);

  useEffect(() => {
    // Register the listener BEFORE syncing so we still receive our own
    // notification when the sync flips the global theme. The else-branch
    // catches the case where another consumer already synced `current` before
    // this hook mounted — without it, a consumer that mounts after the sync
    // (e.g. the map, once it stopped being gated behind data loading) would
    // stay stuck on the SSR-safe "light" default and render a light map in
    // dark mode.
    const listener = (t: Theme) => setTheme(t);
    listeners.add(listener);
    const stored = storedTheme();
    if (stored !== current) setGlobalTheme(stored);
    else setTheme(current);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return { theme, toggle: () => setGlobalTheme(current === "dark" ? "light" : "dark") };
}
