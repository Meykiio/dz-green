/** Registers the PWA service worker (production only — dev has no SW). */
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD) return;
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("/sw.js").catch((error) => {
    console.warn("[pwa] service worker registration failed:", error);
  });
}
