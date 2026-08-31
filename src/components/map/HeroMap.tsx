import { useEffect, useMemo, useRef, useState } from "react";
import {
  GPUInitializationError,
  Map as MapLibreMap,
  NavigationControl,
  type ErrorEvent,
  type GeoJSONSource,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import { useTheme } from "@/hooks/useTheme";
import { useI18n } from "@/i18n";
import type { CareLog, FireReport, MapFeature, Site } from "@/lib/types";
import type { FeatureCollection } from "geojson";
import { DARK_STYLE, LIGHT_STYLE, NORTH_BOUNDS, RecenterControl, colorsFor } from "./map-style";
import { featureCollection, onlyKind, withoutKind } from "./map-data";
import {
  addDataLayers,
  applyAlgeriaLabelFilter,
  applyLayerVisibility,
  startPulse,
  wireInteractions,
  type Layer,
} from "./map-layers";
import { addHotspotLayers, setHotspotsData } from "./hotspots-layer";
import { MapFailureOverlay, webgl2Available, type MapFailure } from "./map-failure";

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
  // The action card anchors to `start` (bottom-right in RTL, bottom-left in
  // LTR), so map controls must live in the opposite physical corner.
  const ctrlPosRef = useRef<"bottom-right" | "bottom-left">(isRtl ? "bottom-left" : "bottom-right");
  ctrlPosRef.current = isRtl ? "bottom-left" : "bottom-right";

  const refs = { dataRef, layersRef, themeRef, selectRef, sites, careLogs, fires };
  const hotspotsRef = useRef(hotspots);
  hotspotsRef.current = hotspots;

  // Mount once.
  useEffect(() => {
    if (!container.current || mapRef.current) return;
    // GPU failure modes (v6 is WebGL2-only): creation failure fires
    // "error" with GPUInitializationError *synchronously inside the Map
    // constructor*, before any map.on("error") can be attached — Evented
    // drops listener-less errors. So: probe first, and listen for
    // webglcontextcreationerror on the container (it bubbles) as backup.
    if (!webgl2Available()) {
      setFailure("webgl2");
      return;
    }
    let creationError: WebGLContextEvent | null = null;
    const onCreationError = (e: Event) => {
      creationError = e as WebGLContextEvent;
    };
    container.current.addEventListener("webglcontextcreationerror", onCreationError);
    // Per-instance cancellation: in StrictMode the first map's style.load can
    // fire after its cleanup; a shared flag would then gate off the second
    // map's init entirely (the no-layers bug).
    let cancelled = false;
    cancelledRef.current = false;
    const map = new MapLibreMap({
      container: container.current,
      style: theme === "dark" ? DARK_STYLE : LIGHT_STYLE,
      bounds: NORTH_BOUNDS,
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
    if (creationError) {
      map.remove();
      mapRef.current = null;
      setFailure("webgl2");
      return;
    }
    const pos = ctrlPosRef.current;
    map.addControl(new NavigationControl({ showCompass: false }), pos);
    map.addControl(new RecenterControl(), pos);

    const init = () => {
      if (cancelled) return;
      applyAlgeriaLabelFilter(map);
      addDataLayers(map, refs);
      wireInteractions(map, refs);
      addHotspotLayers(map, colorsFor(themeRef.current).hotspots, (f) =>
        selectRef.current(f),
      );
      setHotspotsData(map, hotspotsRef.current);
      startPulse(map, pulseRef, cancelledRef);
    };
    // "load" can stall forever when a sub-resource (sprite/glyphs) is
    // blocked; "style.load" fires as soon as the style JSON parses, which is
    // early enough to add our sources and layers.
    if (map.loaded()) init();
    else map.once("style.load", init);

    map.on("error", (e: ErrorEvent) => {
      if (e.error instanceof GPUInitializationError) setFailure("webgl2");
      else console.error("[map] non-fatal error:", e.error);
    });

    // Mid-session context loss (GPU process crash, memory pressure, driver
    // reset): the canvas goes blank. 6.4.0 recovers internally on restore;
    // we surface the state and only reload as a last resort.
    map.on("webglcontextlost", () => setFailure("lost"));
    map.on("webglcontextrestored", () => {
      setFailure(null);
      map.redraw();
    });

    mapRef.current = map;
    if (import.meta.env.DEV) (window as unknown as { __gaMap: typeof map }).__gaMap = map;

    const observer = new ResizeObserver(() => map.resize());
    observer.observe(container.current);

    return () => {
      cancelled = true;
      cancelledRef.current = true;
      cancelAnimationFrame(pulseRef.current);
      observer.disconnect();
      container.current?.removeEventListener("webglcontextcreationerror", onCreationError);
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

  // Data updates.
  useEffect(() => {
    const map = mapRef.current;
    const points = map?.getSource("ga-points") as GeoJSONSource | undefined;
    points?.setData(withoutKind(data, "fires"));
    const fires = map?.getSource("ga-fires") as GeoJSONSource | undefined;
    fires?.setData(onlyKind(data, "fires"));
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
