import { useEffect, useMemo, useRef, useState } from "react";
import {
  GeolocateControl,
  Map as MapLibreMap,
  NavigationControl,
  ScaleControl,
  type GeoJSONSource,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import { useTheme } from "@/hooks/useTheme";
import { useI18n } from "@/i18n";
import type { CareLog, FireReport, MapFeature, Site } from "@/lib/types";
import type { FeatureCollection } from "geojson";
import { DARK_STYLE, LIGHT_STYLE, RecenterControl, colorsFor } from "./map-style";
import { featureCollection, onlyKind, withoutKind } from "./map-data";
import { applyAlgeriaLabelFilter, addDataLayers, wireInteractions, applyLayerVisibility, type Layer } from "./map-layers";
import { useHeroMapMount } from "./useHeroMapMount";
import { addHotspotLayers, setHotspotsData } from "./hotspots-layer";
import { MapFailureOverlay, type MapFailure } from "./map-failure";

export type { Layer };

interface Props {
  sites: Site[];
  careLogs: CareLog[];
  fires: FireReport[];
  hotspots: FeatureCollection;
  layers: Record<Layer, boolean>;
  onSelectFeature: (feature: MapFeature) => void;
}

/**
 * The hero map: MapLibre GL + OpenFreeMap vector tiles (open-source, no API
 * key). WebGL-smooth pan/zoom, wilaya boundaries, individual dots for every
 * tree/care/fire, and real geography underneath. Light/dark via OpenFreeMap
 * styles.
 */
export function HeroMap({ sites, careLogs, fires, hotspots, layers, onSelectFeature }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const pulseRef = useRef(0);
  const cancelledRef = useRef(false);
  const [failure, setFailure] = useState<MapFailure | null>(null);
  const { t, isRtl } = useI18n();
  const { theme } = useTheme();
  const themeRef = useRef(theme);
  themeRef.current = theme;
  const data = useMemo(() => featureCollection(sites, careLogs, fires), [sites, careLogs, fires]);
  const dataRef = useRef(data);
  dataRef.current = data;
  const layersRef = useRef(layers);
  layersRef.current = layers;
  const selectRef = useRef(onSelectFeature);
  selectRef.current = onSelectFeature;
  // BUG-01 (audit 2026-09-02): the row arrays used to travel as plain props
  // frozen at mount — dots added later (realtime/refetch) crashed on click.
  // Same ref pattern as dataRef: current at click time, always.
  const sitesRef = useRef(sites);
  sitesRef.current = sites;
  const careLogsRef = useRef(careLogs);
  careLogsRef.current = careLogs;
  const firesRef = useRef(fires);
  firesRef.current = fires;
  // The action card anchors to `start` and the legend to `end` (top), so
  // control buttons go to top-start and the scale to bottom-end — always
  // free in both locales. Kept in a ref so locale switches can reposition.
  const ctrlPosRef = useRef<"top-left" | "top-right">(isRtl ? "top-right" : "top-left");
  ctrlPosRef.current = isRtl ? "top-right" : "top-left";
  const controlsRef = useRef<{
    nav: NavigationControl;
    recenter: RecenterControl;
    geolocate: GeolocateControl;
    scale: ScaleControl;
  } | null>(null);

  const refs = { dataRef, layersRef, themeRef, selectRef, sitesRef, careLogsRef, firesRef };
  const hotspotsRef = useRef(hotspots);
  hotspotsRef.current = hotspots;

  useHeroMapMount({
    containerRef: container,
    mapRef,
    pulseRef,
    cancelledRef,
    themeRef,
    refs,
    hotspotsRef,
    ctrlPos: ctrlPosRef.current,
    controlsRef,
    onFailure: setFailure,
  });

  // Theme switch: setStyle wipes custom layers, so re-add on style load.
  // Skip the first run — the mount effect already set the right style.
  const styleRef = useRef(theme === "dark" ? DARK_STYLE : LIGHT_STYLE);
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const style = theme === "dark" ? DARK_STYLE : LIGHT_STYLE;
    if (style === styleRef.current) return;
    styleRef.current = style;
    const once = () => {
      applyAlgeriaLabelFilter(map);
      addDataLayers(map, refs);
      wireInteractions(map, refs);
      addHotspotLayers(map, colorsFor(themeRef.current).hotspots, (f) =>
        selectRef.current(f),
      );
      setHotspotsData(map, hotspotsRef.current);
    };
    map.once("style.load", once);
    map.setStyle(style);
  }, [theme]);

  // Locale switch: controls were added at mount with the mount-time locale —
  // reposition them when it flips (the stale-corner bug in the owner report).
  useEffect(() => {
    const map = mapRef.current;
    const controls = controlsRef.current;
    if (!map || !controls) return;
    const pos = ctrlPosRef.current;
    const scalePos = pos === "top-left" ? "bottom-right" : "bottom-left";
    for (const c of [controls.nav, controls.recenter, controls.geolocate]) {
      map.removeControl(c);
      map.addControl(c, pos);
    }
    map.removeControl(controls.scale);
    map.addControl(controls.scale, scalePos);
  }, [isRtl]);

  // Data updates.
  useEffect(() => {
    const map = mapRef.current;
    const points = map?.getSource("ga-points") as GeoJSONSource | undefined;
    points?.setData(withoutKind(data, "fires"));
    const firesSrc = map?.getSource("ga-fires") as GeoJSONSource | undefined;
    firesSrc?.setData(onlyKind(data, "fires"));
  }, [data]);

  // Hotspot updates (own source — never mixed into the community collection).
  useEffect(() => {
    const map = mapRef.current;
    if (map) setHotspotsData(map, hotspots);
  }, [hotspots]);

  // Layer toggles.
  useEffect(() => {
    const map = mapRef.current;
    if (map) applyLayerVisibility(map, layersRef);
  }, [layers]);

  return (
    <div
      ref={container}
      className="relative h-full w-full"
      role="img"
      aria-label={t("home.aria.map")}
    >
      {failure ? <MapFailureOverlay kind={failure} /> : null}
    </div>
  );
}
