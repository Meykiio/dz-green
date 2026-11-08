import type { Map as MapLibreMap } from "maplibre-gl";
import type { FeatureCollection } from "geojson";

import { riskGeoJSON } from "@/lib/risk";
import { colorsFor } from "./map-style";
import { addDataLayers, applyAlgeriaLabelFilter, applyLayerVisibility, type LayerRefs } from "./map-layers";
import { wireInteractions } from "./map-interactions";
import { addHotspotLayers, setHotspotsData } from "./hotspots-layer";
import { addRiskLayers, setRiskData } from "./risk-layer";

/** Maps whose layer-id click/hover handlers are already attached. */
const wiredMaps = new WeakSet<MapLibreMap>();

/**
 * Adds every app layer to a freshly loaded style. Shared by the first mount
 * and the theme switch (setStyle wipes custom layers). Two bugs this fixes:
 * visibility used to be applied before the hotspot/risk layers existed, so
 * the risk layer showed on load with its toggle OFF; and the theme switch
 * never re-added the risk layer and re-attached every handler (stacking
 * duplicates). Handlers are attached once per map; visibility runs last.
 */
export function installLayers(map: MapLibreMap, refs: LayerRefs, hotspots: FeatureCollection): void {
  const wire = !wiredMaps.has(map);
  wiredMaps.add(map);
  const onSelect = (f: Parameters<LayerRefs["selectRef"]["current"]>[0]) => refs.selectRef.current(f);
  applyAlgeriaLabelFilter(map);
  addDataLayers(map, refs);
  if (wire) wireInteractions(map, refs);
  addHotspotLayers(map, colorsFor(refs.themeRef.current).hotspots, onSelect, wire);
  setHotspotsData(map, hotspots);
  addRiskLayers(map, onSelect, wire);
  setRiskData(map, riskGeoJSON());
  applyLayerVisibility(map, refs.layersRef);
}
