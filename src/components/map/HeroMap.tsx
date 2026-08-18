import { useEffect, useMemo, useRef } from "react";
import {
  Map as MapLibreMap,
  NavigationControl,
  type GeoJSONSource,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import { useTheme } from "@/hooks/useTheme";
import type { CareLog, FireReport, MapFeature, Site } from "@/lib/types";
import { ALGERIA_BOUNDS, DARK_STYLE, LIGHT_STYLE, RecenterControl } from "./map-style";
import { featureCollection, onlyKind, withoutKind } from "./map-data";
import {
  addDataLayers,
  applyLayerVisibility,
  startPulse,
  wireInteractions,
  type Layer,
} from "./map-layers";

export type { Layer };

interface Props {
  sites: Site[];
  careLogs: CareLog[];
  fires: FireReport[];
  layers: Record<Layer, boolean>;
  onSelectFeature: (feature: MapFeature) => void;
}

/**
 * The hero map: MapLibre GL + OpenFreeMap vector tiles (open-source, no API
 * key). WebGL-smooth pan/zoom, wilaya boundaries, individual dots for every
 * tree/care/fire, and real geography underneath. Light/dark via OpenFreeMap
 * styles.
 */
export function HeroMap({ sites, careLogs, fires, layers, onSelectFeature }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const pulseRef = useRef(0);
  const cancelledRef = useRef(false);
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

  const refs = { dataRef, layersRef, themeRef, selectRef, sites, careLogs, fires };

  // Mount once.
  useEffect(() => {
    if (!container.current || mapRef.current) return;
    // Per-instance cancellation: in StrictMode the first map's style.load can
    // fire after its cleanup; a shared flag would then gate off the second
    // map's init entirely (the no-layers bug).
    let cancelled = false;
    cancelledRef.current = false;
    const map = new MapLibreMap({
      container: container.current,
      style: theme === "dark" ? DARK_STYLE : LIGHT_STYLE,
      bounds: ALGERIA_BOUNDS,
      fitBoundsOptions: { padding: 24 },
      minZoom: 4,
      maxZoom: 16,
      // Keep Algeria framed — no getting lost in the whole globe.
      maxBounds: [
        [-14, 14],
        [17, 42],
      ],
      attributionControl: { compact: true },
    });
    map.addControl(new NavigationControl({ showCompass: false }), "bottom-right");
    map.addControl(new RecenterControl(), "bottom-right");

    const init = () => {
      if (cancelled) return;
      addDataLayers(map, refs);
      wireInteractions(map, refs);
      startPulse(map, pulseRef, cancelledRef);
    };
    // "load" can stall forever when a sub-resource (sprite/glyphs) is
    // blocked; "style.load" fires as soon as the style JSON parses, which is
    // early enough to add our sources and layers.
    if (map.loaded()) init();
    else map.once("style.load", init);

    mapRef.current = map;
    if (import.meta.env.DEV) (window as unknown as { __gaMap: typeof map }).__gaMap = map;

    const observer = new ResizeObserver(() => map.resize());
    observer.observe(container.current);

    return () => {
      cancelled = true;
      cancelledRef.current = true;
      cancelAnimationFrame(pulseRef.current);
      observer.disconnect();
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      addDataLayers(map, refs);
      wireInteractions(map, refs);
    };
    map.once("style.load", once);
    map.setStyle(style);
  }, [theme]);

  // Data updates.
  useEffect(() => {
    const map = mapRef.current;
    const points = map?.getSource("ga-points") as GeoJSONSource | undefined;
    points?.setData(withoutKind(data, "fires"));
    const fires = map?.getSource("ga-fires") as GeoJSONSource | undefined;
    fires?.setData(onlyKind(data, "fires"));
  }, [data]);

  // Layer toggles.
  useEffect(() => {
    const map = mapRef.current;
    if (map) applyLayerVisibility(map, layersRef);
  }, [layers]);

  return (
    <div
      ref={container}
      className="h-full w-full"
      role="img"
      aria-label="Interactive map of Algeria showing tree plantings, care updates and fire reports"
    />
  );
}
