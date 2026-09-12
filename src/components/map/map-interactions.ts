import type { Map as MapLibreMap, MapLayerMouseEvent } from "maplibre-gl";

import { wilayaBounds } from "@/lib/wilaya-geo";
import { featureFor } from "./map-data";
import type { LayerRefs } from "./map-layers";

/**
 * Click + hover wiring for every map feature (wilaya zoom, tree/care/fire
 * dots). Extracted from map-layers 2026-09-12 (250-line split). The row
 * arrays travel behind refs — BUG-01 (audit 2026-09-02): current at click
 * time, always.
 */
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
