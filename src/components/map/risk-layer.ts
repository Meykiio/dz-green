import type { ExpressionSpecification, Map as MapLibreMap, MapLayerMouseEvent } from "maplibre-gl";
import type { FeatureCollection } from "geojson";

import type { MapFeature } from "@/lib/types";

/**
 * Fire-risk layer (national priority map, relative rank). Distinct from
 * everything else on the map: a soft fill of small circles colored by risk
 * (yellow -> orange -> dark red), no pulse — the pulsing stays the
 * community-fire signature, and the ramp must never read as a live fire.
 */
export function addRiskLayers(
  map: MapLibreMap,
  colors: { riskHigh: string; riskMedium: string },
  onSelect: (feature: MapFeature) => void,
  /** Attach click/hover handlers. False on re-adds after a style swap:
   *  layer-id handlers survive setStyle, re-adding stacks duplicates. */
  wire = true,
) {
  map.addSource("ga-risk", {
    type: "geojson",
    data: { type: "FeatureCollection", features: [] },
  });
  // Two bands only (only the riskiest 30% of land is published, see
  // src/lib/risk.ts): Medium = orange, High = red. A step, not a ramp, so the
  // legend's two colours (RiskLegend) mean exactly what the panel says. Both read on the
  // light and the dark basemap; amber-orange stays distinct from the pulsing
  // community-fire dots and the hollow hotspot rings.
  const riskColor: ExpressionSpecification = ["step", ["get", "risk"], colors.riskMedium, 0.9, colors.riskHigh];
  map.addLayer({
    id: "ga-risk-points",
    type: "circle",
    source: "ga-risk",
    paint: {
      "circle-color": riskColor,
      "circle-opacity": 0.6,
      "circle-stroke-width": 0,
      // Cells are 2 km apart: grow with the map (exponential) so each dot
      // stays close to its real footprint instead of piling up at low zoom.
      "circle-radius": ["interpolate", ["exponential", 2], ["zoom"], 4, 1, 6, 1.6, 8, 3, 11, 18, 13, 70],
    },
  });
  if (!wire) return;
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

