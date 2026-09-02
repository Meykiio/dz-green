import { useEffect, useMemo, useRef, useState } from "react";
import {
  GPUInitializationError,
  GeolocateControl,
  Map as MapLibreMap,
  NavigationControl,
  ScaleControl,
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
      // 3.5 lets the whole country fit on screen (owner report 2026-09-01:
      // minZoom 4 cut the south off on desktop AND mobile). The dim mask
      // keeps the wider neighborhood clean; maxBounds still bounds panning.
      minZoom: 3.5,
      maxZoom: 16,
      // No maxBounds: any bounds wide enough to matter also clamps zoom-out
      // on wide screens (the full-country report, 2026-09-01). minZoom 3.5
      // is the real guardrail — you can never zoom out far enough to get
      // lost — and Recenter brings the camera home.
      // GPU pressure hardening (iOS kills WebGL2 contexts under memory
      // pressure, worst inside Instagram's in-app browser — user reports
      // 2026-09-01): cap tile memory at 20MB (default 50) and skip the
      // tile-fade animation work.
      maxTileCacheSize: 20,
      fadeDuration: 0,
      attributionControl: { compact: true },
    });
    if (creationError) {
      map.remove();
      mapRef.current = null;
      setFailure("webgl2");
      return;
    }
    // Controls live in the two corners that are always free: buttons at
    // top-start (legend is top-end, action card is bottom-start), the scale
    // at bottom-end. They follow locale switches (see the isRtl effect).
    const nav = new NavigationControl({ showCompass: false });
    const recenter = new RecenterControl();
    const geolocate = new GeolocateControl({ trackUserLocation: false });
    const scale = new ScaleControl({ maxWidth: 90, unit: "metric" });
    controlsRef.current = { nav, recenter, geolocate, scale };
    const pos = ctrlPosRef.current;
    map.addControl(nav, pos);
    map.addControl(recenter, pos);
    map.addControl(geolocate, pos);
    map.addControl(scale, pos === "top-left" ? "bottom-right" : "bottom-left");

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
