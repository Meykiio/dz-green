import {
  setRTLTextPlugin,
  setWorkerUrl,
  type Map as MapLibreMap,
} from "maplibre-gl";
import maplibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";

export const ALGERIA_BOUNDS: [[number, number], [number, number]] = [
  [-8.7, 18.9],
  [12.1, 38.0],
];

// Initial view: the populated north, not the whole country — the Tell is
// where the overwhelming majority of people (and plantings) are. The rest of
// the country is a scroll away inside maxBounds.
export const NORTH_BOUNDS: [[number, number], [number, number]] = [
  [-2.6, 33.2],
  [10.2, 37.4],
];

export const LIGHT_STYLE = "https://tiles.openfreemap.org/styles/liberty";
export const DARK_STYLE = "https://tiles.openfreemap.org/styles/dark";

export interface ThemeColors {
  trees: string;
  care: string;
  fires: string;
  wilayaLine: string;
  wilayaFill: string;
  mask: string;
}

export function colorsFor(theme: "light" | "dark"): ThemeColors {
  return theme === "dark"
    ? {
        trees: "#4ade80",
        care: "#38c8ff",
        fires: "#ff6b6b",
        wilayaLine: "#7ee2a8",
        wilayaFill: "#4ade80",
        mask: "#0e0f0c",
      }
    : {
        trees: "#2ead4b",
        care: "#1d9fe0",
        fires: "#d03238",
        wilayaLine: "#2ead4b",
        wilayaFill: "#2ead4b",
        mask: "#e8ebe6",
      };
}

// v6 resolves its worker via import.meta.url, which bundlers rewrite to
// nothing — the worker 404s in production and every GeoJSON source (wilaya
// borders, dots) silently never renders. ?worker&url bundles the worker and
// its maplibre-gl-shared.mjs sibling into one self-contained asset.
// MUST run before setRTLTextPlugin below: registering the RTL plugin
// instantiates an internal throwaway map, which acquires the (singleton)
// worker pool using whatever WORKER_URL is set at that moment.
setWorkerUrl(maplibreWorkerUrl);

// Arabic labels need the RTL shaping plugin or they render reversed and
// detached. Browser-only (SSR has no document); module scope so maplibre's
// "cannot be called multiple times" can't trip on StrictMode remounts.
if (typeof document !== "undefined") {
  setRTLTextPlugin(
    "https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.3.0/dist/mapbox-gl-rtl-text.js",
    true,
  );
}

/** "Back to Algeria" control — recenters the camera when the user gets lost. */
export class RecenterControl {
  private container?: HTMLElement;
  constructor(private map?: MapLibreMap) {}
  onAdd(map: MapLibreMap) {
    this.map = map;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "maplibregl-ctrl-icon";
    button.title = "Back to Algeria";
    button.setAttribute("aria-label", "Back to Algeria");
    button.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="7"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/></svg>';
    button.addEventListener("click", () => {
      this.map?.fitBounds(NORTH_BOUNDS, { padding: 24, duration: 500 });
    });
    const group = document.createElement("div");
    group.className = "maplibregl-ctrl maplibregl-ctrl-group";
    group.appendChild(button);
    this.container = group;
    return group;
  }
  onRemove() {
    this.container?.remove();
    this.map = undefined;
  }
}
