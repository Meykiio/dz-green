import { useEffect, useMemo, useRef, useState } from "react";
import {
  GeolocateControl,
  Map as MapLibreMap,
  type GeoJSONSource,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import { useTheme } from "@/hooks/useTheme";
import { useIsMobile } from "@/hooks/use-mobile";
import { useI18n } from "@/i18n";
import type { CareLog, FireReport, MapFeature, Site } from "@/lib/types";
import type { FeatureCollection } from "geojson";
import { DARK_STYLE, LIGHT_STYLE } from "./map-style";
import { featureCollection, onlyKind, withoutKind } from "./map-data";
import { applyLayerVisibility, type Layer } from "./map-layers";
import { installLayers } from "./map-setup";
import { useHeroMapMount } from "./useHeroMapMount";
import { setHotspotsData } from "./hotspots-layer";
import { setRiskData } from "./risk-layer";
import { MapFailureOverlay, type MapFailure } from "./map-failure";

export type { Layer };

interface Props {
  sites: Site[];
  careLogs: CareLog[];
  fires: FireReport[];
  hotspots: FeatureCollection;
  /** National risk map; empty until the risk layer is first turned on. */
  risk: FeatureCollection;
  layers: Record<Layer, boolean>;
  onSelectFeature: (feature: MapFeature) => void;
}

/**
 * The hero map: MapLibre GL + OpenFreeMap vector tiles (open-source, no API
 * key). WebGL-smooth pan/zoom, wilaya boundaries, individual dots for every
 * tree/care/fire, and real geography underneath. Light/dark via OpenFreeMap
 * styles.
 */
export function HeroMap({ sites, careLogs, fires, hotspots, risk, layers, onSelectFeature }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const pulseRef = useRef(0);
  const cancelledRef = useRef(false);
  const [failure, setFailure] = useState<MapFailure | null>(null);
  const { t, isRtl } = useI18n();
  const { theme } = useTheme();
  const isMobile = useIsMobile();
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
  // The action card anchors to `start` and the legend to `end` (top); the
  // single geolocate control lives bottom-end. Kept in a ref so locale
  // switches can reposition it.
  const ctrlPosRef = useRef<"top-left" | "top-right">(isRtl ? "top-right" : "top-left");
  ctrlPosRef.current = isRtl ? "top-right" : "top-left";
  const controlsRef = useRef<{ geolocate: GeolocateControl } | null>(null);

  const refs = { dataRef, layersRef, themeRef, selectRef, sitesRef, careLogsRef, firesRef };
  const hotspotsRef = useRef(hotspots);
  hotspotsRef.current = hotspots;
  const riskRef = useRef(risk);
  riskRef.current = risk;

  useHeroMapMount({
    containerRef: container,
    mapRef,
    pulseRef,
    cancelledRef,
    themeRef,
    refs,
    hotspotsRef,
    riskRef,
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
    const once = () => installLayers(map, refs, hotspotsRef.current, riskRef.current);
    map.once("style.load", once);
    map.setStyle(style);
  }, [theme]);

  // Locale switch + viewport flips: the geolocate control repositions —
  // top-end on phones (the card owns the bottom), bottom-end on desktop,
  // mirrored for RTL. The mount effect set the correct initial corner.
  useEffect(() => {
    const map = mapRef.current;
    const controls = controlsRef.current;
    if (!map || !controls) return;
    const geoPos = isMobile
      ? isRtl ? "top-left" : "top-right"
      : isRtl ? "bottom-left" : "bottom-right";
    map.removeControl(controls.geolocate);
    map.addControl(controls.geolocate, geoPos);
  }, [isRtl, isMobile]);

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

  // Risk map arrives lazily (first time the layer is turned on).
  useEffect(() => {
    const map = mapRef.current;
    if (map) setRiskData(map, risk);
  }, [risk]);

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
