import type { ExpressionSpecification, Map as MapLibreMap, MapLayerMouseEvent } from "maplibre-gl";
import type { FeatureCollection } from "geojson";

import type { Hotspot, MapFeature } from "@/lib/types";

/**
 * Satellite hotspot layer (NASA FIRMS). Deliberately distinct from community
 * fires: amber hollow rings, no pulse — pulsing stays the community-fire
 * signature so the two sources never read as the same thing.
 */
export function addHotspotLayers(
  map: MapLibreMap,
  color: string,
  onSelect: (feature: MapFeature) => void,
) {
  map.addSource("ga-hotspots", {
    type: "geojson",
    data: { type: "FeatureCollection", features: [] },
  });
  // Radius = zoom base × FRP factor. "zoom" is only legal as the input of a
  // TOP-LEVEL interpolate/step, so the FRP factor nests inside the stops.
  const frpFactor: ExpressionSpecification = [
    "interpolate",
    ["linear"],
    ["get", "frp"],
    0,
    0.8,
    50,
    1.3,
  ];
  map.addLayer({
    id: "ga-hotspots-points",
    type: "circle",
    source: "ga-hotspots",
    paint: {
      "circle-color": color,
      "circle-opacity": 0.22,
      "circle-stroke-color": color,
      "circle-stroke-opacity": 0.95,
      "circle-stroke-width": 2,
      "circle-radius": [
        "interpolate",
        ["linear"],
        ["zoom"],
        4,
        ["*", 5, frpFactor],
        10,
        ["*", 7, frpFactor],
        14,
        ["*", 10, frpFactor],
      ],
    },
  });
  map.on("click", "ga-hotspots-points", (e: MapLayerMouseEvent) => {
    const props = e.features?.[0]?.properties;
    if (!props) return;
    onSelect({ kind: "hotspot", hotspot: props as unknown as Hotspot });
  });
  map.on("mouseenter", "ga-hotspots-points", () => {
    map.getCanvas().style.cursor = "pointer";
  });
  map.on("mouseleave", "ga-hotspots-points", () => {
    map.getCanvas().style.cursor = "";
  });
}

export function setHotspotsData(map: MapLibreMap, data: FeatureCollection) {
  const source = map.getSource("ga-hotspots");
  if (source && "setData" in source) {
    (source as { setData: (d: FeatureCollection) => void }).setData(data);
  }
}

export function applyHotspotVisibility(map: MapLibreMap, visible: boolean) {
  if (map.getLayer("ga-hotspots-points")) {
    map.setLayoutProperty("ga-hotspots-points", "visibility", visible ? "visible" : "none");
  }
}
