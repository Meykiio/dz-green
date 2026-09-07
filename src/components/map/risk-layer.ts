import type { ExpressionSpecification, Map as MapLibreMap, MapLayerMouseEvent } from "maplibre-gl";
import type { FeatureCollection } from "geojson";

import type { MapFeature } from "@/lib/types";

/**
 * Fire-risk layer (Kabylie model, climatological estimate). Distinct from
 * everything else on the map: a soft fill of small circles colored by risk
 * (yellow -> orange -> dark red), no pulse — the pulsing stays the
 * community-fire signature, and the ramp must never read as a live fire.
 */
export function addRiskLayers(
  map: MapLibreMap,
  onSelect: (feature: MapFeature) => void,
) {
  map.addSource("ga-risk", {
    type: "geojson",
    data: { type: "FeatureCollection", features: [] },
  });
  const riskColor: ExpressionSpecification = [
    "interpolate",
    ["linear"],
    ["get", "risk"],
    0, "#1a9850",
    0.3, "#fee08b",
    0.6, "#f46d43",
    0.85, "#a50026",
  ];
  map.addLayer({
    id: "ga-risk-points",
    type: "circle",
    source: "ga-risk",
    paint: {
      "circle-color": riskColor,
      "circle-opacity": 0.55,
      "circle-stroke-width": 0,
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 4, 3, 10, 5, 14, 8],
    },
  });
  map.on("click", "ga-risk-points", (e: MapLayerMouseEvent) => {
    const props = e.features?.[0]?.properties;
    if (!props) return;
    const coords = (e.features?.[0]?.geometry as { coordinates?: [number, number] } | undefined)?.coordinates;
    onSelect({
      kind: "risk",
      risk: {
        id: props["id"] as string,
        lat: coords?.[1] ?? 0,
        lng: coords?.[0] ?? 0,
        risk: props["risk"] as number,
      },
    });
  });
  map.on("mouseenter", "ga-risk-points", () => {
    map.getCanvas().style.cursor = "pointer";
  });
  map.on("mouseleave", "ga-risk-points", () => {
    map.getCanvas().style.cursor = "";
  });
}

export function setRiskData(map: MapLibreMap, data: FeatureCollection) {
  const source = map.getSource("ga-risk");
  if (source && "setData" in source) {
    (source as { setData: (d: FeatureCollection) => void }).setData(data);
  }
}

export function applyRiskVisibility(map: MapLibreMap, visible: boolean) {
  if (map.getLayer("ga-risk-points")) {
    map.setLayoutProperty("ga-risk-points", "visibility", visible ? "visible" : "none");
  }
}
