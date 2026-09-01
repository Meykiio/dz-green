/**
 * Coarse geo hint from Vercel's IP-geolocation headers (free, per-request,
 * never stored). The server reads the headers (src/server.ts) and SSR
 * injects them as window.__GA_GEO__; forms use the hint to pre-select the
 * wilaya and center the picker. It is a suggestion only — the user can
 * change it, and the server derives the real wilaya from the pin anyway.
 * Absent off-Vercel (local dev): everything behaves as before.
 */
export interface GeoHint {
  lat: number;
  lng: number;
}

declare global {
  interface Window {
    __GA_GEO__?: GeoHint | null;
  }
}

export function getGeoHint(): GeoHint | null {
  if (typeof window !== "undefined") return window.__GA_GEO__ ?? null;
  return (globalThis as { __GA_GEO_SSR__?: GeoHint | null }).__GA_GEO_SSR__ ?? null;
}
