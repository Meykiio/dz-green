import { useSyncExternalStore } from "react";

/**
 * Network hints from the browser (Chrome/Android only: navigator.connection;
 * elsewhere both stay false). `saveData` is the user's Data Saver switch;
 * `slow` is a 2G-class connection. Server render and first hydration see
 * false, so markup always matches.
 */
interface NetworkInformation extends EventTarget {
  saveData?: boolean;
  effectiveType?: string;
}

function connection(): NetworkInformation | undefined {
  if (typeof navigator === "undefined") return undefined;
  return (navigator as Navigator & { connection?: NetworkInformation }).connection;
}

function subscribe(onChange: () => void): () => void {
  const c = connection();
  c?.addEventListener("change", onChange);
  return () => c?.removeEventListener("change", onChange);
}

export function isDataLight(c = connection()): boolean {
  if (!c) return false;
  return c.saveData === true || c.effectiveType === "slow-2g" || c.effectiveType === "2g";
}

/** True when the visitor asked to save data or is on a 2G-class link. */
export function useDataLight(): boolean {
  return useSyncExternalStore(subscribe, () => isDataLight(), () => false);
}

function subscribeVisibility(onChange: () => void): () => void {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
}

/** True while the tab is visible (true on the server). */
export function usePageVisible(): boolean {
  return useSyncExternalStore(
    subscribeVisibility,
    () => document.visibilityState === "visible",
    () => true,
  );
}
