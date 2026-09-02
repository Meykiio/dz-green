import type {
  FilterSpecification,
  Map as MapLibreMap,
  MapLayerMouseEvent,
  SymbolLayerSpecification,
} from "maplibre-gl";
import type { FeatureCollection } from "geojson";
import type { MutableRefObject } from "react";

import { algeriaMultiPolygon, wilayaBoundariesGeoJSON, wilayaBounds, wilayaMaskGeoJSON } from "@/lib/wilaya-geo";
import type { CareLog, FireReport, MapFeature, Site } from "@/lib/types";
import { colorsFor } from "./map-style";
import { featureFor, onlyKind, withoutKind } from "./map-data";

export type Layer = "trees" | "care" | "fires" | "hotspots";

interface LayerRefs {
  dataRef: MutableRefObject<FeatureCollection>;
  layersRef: MutableRefObject<Record<Layer, boolean>>;
  themeRef: MutableRefObject<"light" | "dark">;
  selectRef: MutableRefObject<(feature: MapFeature) => void>;
  // BUG-01 (audit 2026-09-02): these were plain prop arrays, frozen at
  // mount — a dot added later (realtime insert, refetch) rendered but
  // crashed on click. Refs, like every other member: current at click time.
  sitesRef: MutableRefObject<Site[]>;
  careLogsRef: MutableRefObject<CareLog[]>;
  firesRef: MutableRefObject<FireReport[]>;
}

/**
 * Keep only Algeria-related place names: every basemap text label (cities,
 * villages, POIs, road names, water) gets a `within` filter against the
 * Algeria polygon. Style-agnostic — it scans whatever symbol layers the
 * active style has, so liberty and dark both work. Runs on every style
 * load, after the basemap layers exist.
 */
export function applyAlgeriaLabelFilter(map: MapLibreMap) {
  const algeria = algeriaMultiPolygon();
  for (const layer of map.getStyle().layers) {
    if (layer.type !== "symbol") continue;
    const textField = (layer as SymbolLayerSpecification).layout?.["text-field"];
    if (!textField) continue;
    const existing = (layer as { filter?: unknown[] }).filter;
    const filter = (
      existing ? ["all", existing, ["within", algeria]] : ["within", algeria]
    ) as unknown as FilterSpecification;
    map.setFilter(layer.id, filter);
  }
}

export function addDataLayers(map: MapLibreMap, refs: LayerRefs) {
  const colors = colorsFor(refs.themeRef.current);
  // Dim everything that is not Algeria, below every other custom layer.
  map.addSource("ga-mask", { type: "geojson", data: wilayaMaskGeoJSON() });
  map.addLayer({
    id: "ga-mask",
    type: "fill",
    source: "ga-mask",
    paint: { "fill-color": colors.mask, "fill-opacity": 0.55 },
  });
  map.addSource("ga-wilayas", { type: "geojson", data: wilayaBoundariesGeoJSON() });
  map.addLayer({
    id: "ga-wilaya-fill",
    type: "fill",
    source: "ga-wilayas",
    paint: { "fill-color": colors.wilayaFill, "fill-opacity": 0.05 },
  });
  map.addLayer({
    id: "ga-wilaya-line",
    type: "line",
    source: "ga-wilayas",
    paint: { "line-color": colors.wilayaLine, "line-opacity": 0.55, "line-width": 1.5 },
  });

  // No clustering anywhere: the product's purpose is a map that turns
  // green — every tree shows as its own dot at every zoom. (Revisit if a
  // kind ever passes ~10k live points.)
  map.addSource("ga-points", {
    type: "geojson",
    data: withoutKind(refs.dataRef.current, "fires"),
  });
  map.addSource("ga-fires", {
    type: "geojson",
    data: onlyKind(refs.dataRef.current, "fires"),
  });

  for (const kind of ["trees", "care"] as const) {
    const color = colors[kind];
    map.addLayer({
      id: `ga-${kind}-points`,
      type: "circle",
      source: "ga-points",
      filter: ["==", ["get", "kind"], kind],
      paint: {
        "circle-color": color,
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 4, 5, 10, 7, 14, 10],
        "circle-stroke-width": 1.5,
        "circle-stroke-color": "rgba(255,255,255,0.7)",
      },
    });
    // Pulse halo — animated by the rAF loop in startPulse.
    map.addLayer({
      id: `ga-${kind}-pulse`,
      type: "circle",
      source: "ga-points",
      filter: ["==", ["get", "kind"], kind],
      paint: {
        "circle-color": color,
        "circle-radius": 8,
        "circle-opacity": 0.4,
        "circle-stroke-width": 0,
      },
    });
  }

  // Fires: always individual, always pulsing.
  map.addLayer({
    id: "ga-fires-points",
    type: "circle",
    source: "ga-fires",
    paint: {
      "circle-color": colors.fires,
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 4, 6, 10, 8, 14, 11],
      "circle-stroke-width": 2,
      "circle-stroke-color": "rgba(255,255,255,0.85)",
    },
  });
  map.addLayer({
    id: "ga-fires-pulse",
    type: "circle",
    source: "ga-fires",
    paint: {
      "circle-color": colors.fires,
      "circle-radius": 8,
      "circle-opacity": 0.4,
      "circle-stroke-width": 0,
    },
  });
  applyLayerVisibility(map, refs.layersRef);
}

export function applyLayerVisibility(
  map: MapLibreMap,
  layersRef: MutableRefObject<Record<Layer, boolean>>,
) {
  for (const kind of ["trees", "care", "fires"] as const) {
    const visible = layersRef.current[kind] ? "visible" : "none";
    for (const suffix of ["points", "pulse"]) {
      const id = `ga-${kind}-${suffix}`;
      if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", visible);
    }
  }
  // Hotspots have no pulse layer by design (community-fire signature).
  if (map.getLayer("ga-hotspots-points")) {
    map.setLayoutProperty(
      "ga-hotspots-points",
      "visibility",
      layersRef.current.hotspots ? "visible" : "none",
    );
  }
}

/** True on iOS devices and inside in-app browsers (Instagram/Facebook/TikTok)
 *  — environments where the GPU context is reclaimed aggressively, so the
 *  decorative per-frame GPU work (the pulse) is skipped. */
export function isConstrainedGpu(): boolean {
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/.test(ua) || /Instagram|FBAN|FBAV|TikTok/.test(ua);
}

/** Expanding-ring pulse on points, so they read at a glance. */
export function startPulse(
  map: MapLibreMap,
  pulseRef: MutableRefObject<number>,
  cancelledRef: MutableRefObject<boolean>,
) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (isConstrainedGpu()) return;
  const start = performance.now();
  const tick = (now: number) => {
    if (cancelledRef.current) return;
    const t = ((now - start) % 1800) / 1800;
    const radius = 8 + t * 22;
    const opacity = 0.45 * (1 - t);
    for (const kind of ["trees", "care", "fires"] as const) {
      const id = `ga-${kind}-pulse`;
      if (map.getLayer(id)) {
        map.setPaintProperty(id, "circle-radius", radius);
        map.setPaintProperty(id, "circle-opacity", opacity);
      }
    }
    pulseRef.current = requestAnimationFrame(tick);
  };
  pulseRef.current = requestAnimationFrame(tick);
}

export function wireInteractions(map: MapLibreMap, refs: LayerRefs) {
  map.on("click", "ga-wilaya-fill", (e: MapLayerMouseEvent) => {
    const code = e.features?.[0]?.properties?.["code"] as string | undefined;
    const bounds = code ? wilayaBounds(code) : null;
    if (bounds) map.fitBounds(bounds, { padding: 60, duration: 500 });
  });

  for (const kind of ["trees", "care"] as const) {
    map.on("click", `ga-${kind}-points`, (e: MapLayerMouseEvent) => {
      const props = e.features?.[0]?.properties;
      if (!props) return;
      const feature = featureFor(
        kind,
        props["id"] as string,
        refs.sitesRef.current,
        refs.careLogsRef.current,
        refs.firesRef.current,
      );
      // Gone between render and click (refetch swap, fire resolved) —
      // a quiet no-op, never a crash.
      if (!feature) return;
      refs.selectRef.current(feature);
    });
    map.on("mouseenter", `ga-${kind}-points`, () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", `ga-${kind}-points`, () => {
      map.getCanvas().style.cursor = "";
    });
  }

  map.on("click", "ga-fires-points", (e: MapLayerMouseEvent) => {
    const props = e.features?.[0]?.properties;
    if (!props) return;
    const feature = featureFor(
      "fires",
      props["id"] as string,
      refs.sitesRef.current,
      refs.careLogsRef.current,
      refs.firesRef.current,
    );
    if (!feature) return;
    refs.selectRef.current(feature);
  });
  map.on("mouseenter", "ga-fires-points", () => {
    map.getCanvas().style.cursor = "pointer";
  });
  map.on("mouseleave", "ga-fires-points", () => {
    map.getCanvas().style.cursor = "";
  });
}
