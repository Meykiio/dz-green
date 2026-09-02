import { useEffect, type RefObject } from "react";
import {
  GPUInitializationError,
  GeolocateControl,
  Map as MapLibreMap,
  NavigationControl,
  ScaleControl,
  type ErrorEvent,
} from "maplibre-gl";
import type { FeatureCollection, Feature, Geometry, GeoJsonProperties } from "geojson";

import type { CareLog, FireReport, MapFeature, Site } from "@/lib/types";
import { DARK_STYLE, LIGHT_STYLE, NORTH_BOUNDS, RecenterControl, colorsFor } from "./map-style";
import { applyAlgeriaLabelFilter, addDataLayers, wireInteractions, startPulse, type Layer } from "./map-layers";
import { addHotspotLayers, setHotspotsData } from "./hotspots-layer";
import { webgl2Available, type MapFailure } from "./map-failure";

export type MapFeatureCollection = FeatureCollection<Geometry, GeoJsonProperties>;

// BUG-04 (audit 2026-09-02): if the style-JSON fetch fails or hangs, the map
// area stays silently blank behind working UI chrome. 15s budget for the
// style JSON (43KB) — a fetch slower than that is a broken experience.
const STYLE_TIMEOUT_MS = 15_000;

interface MapRefs {
  dataRef: RefObject<MapFeatureCollection>;
  layersRef: RefObject<Record<Layer, boolean>>;
  themeRef: RefObject<"light" | "dark">;
  selectRef: RefObject<(feature: MapFeature) => void>;
  // Refs, not frozen arrays — see BUG-01 (audit 2026-09-02).
  sitesRef: RefObject<Site[]>;
  careLogsRef: RefObject<CareLog[]>;
  firesRef: RefObject<FireReport[]>;
}

/**
 * The HeroMap mount effect, extracted 2026-09-01 (250-line split): probes
 * WebGL2, creates the MapLibre map, wires controls + data layers, and
 * reloads on style.load — exactly one instance per container, cancelled-safe
 * under StrictMode.
 */
export function useHeroMapMount({
  containerRef,
  mapRef,
  pulseRef,
  cancelledRef,
  themeRef,
  refs,
  hotspotsRef,
  ctrlPos,
  controlsRef,
  onFailure,
}: {
  containerRef: RefObject<HTMLDivElement | null>;
  mapRef: RefObject<MapLibreMap | null>;
  pulseRef: RefObject<number>;
  cancelledRef: RefObject<boolean>;
  themeRef: RefObject<"light" | "dark">;
  refs: MapRefs;
  hotspotsRef: RefObject<MapFeatureCollection>;
  ctrlPos: "top-left" | "top-right";
  controlsRef: RefObject<{
    nav: NavigationControl;
    recenter: RecenterControl;
    geolocate: GeolocateControl;
    scale: ScaleControl;
  } | null>;
  onFailure: (failure: MapFailure | null) => void;
}) {
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    // GPU failure modes (v6 is WebGL2-only): creation failure fires
    // "error" with GPUInitializationError *synchronously inside the Map
    // constructor*, before any map.on("error") can be attached — Evented
    // drops listener-less errors. So: probe first, and listen for
    // webglcontextcreationerror on the container (it bubbles) as backup.
    if (!webgl2Available()) {
      onFailure("webgl2");
      return;
    }
    let creationError: WebGLContextEvent | null = null;
    const onCreationError = (e: Event) => {
      creationError = e as WebGLContextEvent;
    };
    containerRef.current.addEventListener("webglcontextcreationerror", onCreationError);
    // Per-instance cancellation: in StrictMode the first map's style.load can
    // fire after its cleanup; a shared flag would then gate off the second
    // map's init entirely (the no-layers bug).
    let cancelled = false;
    cancelledRef.current = false;
    const map = new MapLibreMap({
      container: containerRef.current,
      style: themeRef.current === "dark" ? DARK_STYLE : LIGHT_STYLE,
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
      onFailure("webgl2");
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
    map.addControl(nav, ctrlPos);
    map.addControl(recenter, ctrlPos);
    map.addControl(geolocate, ctrlPos);
    map.addControl(scale, ctrlPos === "top-left" ? "bottom-right" : "bottom-left");

    // BUG-04 belt: style.load must fire within STYLE_TIMEOUT_MS. The
    // fail-fast path below covers fetches that *error*; this catches the
    // ones that hang. A late style.load clears the overlay and continues.
    let styleLoaded = false;
    let styleTimer: ReturnType<typeof setTimeout> | null = null;
    const clearStyleTimer = () => {
      if (styleTimer !== null) {
        clearTimeout(styleTimer);
        styleTimer = null;
      }
    };

    const init = () => {
      if (cancelled) return;
      styleLoaded = true;
      clearStyleTimer();
      // A super-slow style can land after the timeout already surfaced the
      // failure — clear it and continue (same state the context-restore
      // path uses).
      onFailure(null);
      applyAlgeriaLabelFilter(map);
      addDataLayers(map, refs);
      wireInteractions(map, refs);
      addHotspotLayers(map, colorsFor(refs.themeRef.current).hotspots, (f) =>
        refs.selectRef.current(f),
      );
      setHotspotsData(map, hotspotsRef.current);
      startPulse(map, pulseRef, cancelledRef);
    };
    // "load" can stall forever when a sub-resource (sprite/glyphs) is
    // blocked; "style.load" fires as soon as the style JSON parses, which is
    // early enough to add our sources and layers.
    if (map.loaded()) init();
    else {
      map.once("style.load", init);
      styleTimer = setTimeout(() => {
        if (styleLoaded || cancelled) return;
        onFailure("lost");
      }, STYLE_TIMEOUT_MS);
    }

    map.on("error", (e: ErrorEvent) => {
      if (e.error instanceof GPUInitializationError) {
        onFailure("webgl2");
        return;
      }
      // BUG-04 fail-fast: an error before style.load is the style fetch
      // itself (tiles/glyphs come after) and MapLibre never retries it —
      // surface the overlay instead of a silent blank.
      if (!styleLoaded) {
        console.error("[map] style failed to load:", e.error);
        clearStyleTimer();
        if (!cancelled) onFailure("lost");
        return;
      }
      console.error("[map] non-fatal error:", e.error);
    });

    // Mid-session context loss (GPU process crash, memory pressure, driver
    // reset): the canvas goes blank. 6.4.0 recovers internally on restore;
    // we surface the state and only reload as a last resort.
    map.on("webglcontextlost", () => onFailure("lost"));
    map.on("webglcontextrestored", () => {
      onFailure(null);
      map.redraw();
    });

    mapRef.current = map;
    if (import.meta.env.DEV) (window as unknown as { __gaMap: typeof map }).__gaMap = map;

    const observer = new ResizeObserver(() => map.resize());
    observer.observe(containerRef.current);

    return () => {
      cancelled = true;
      cancelledRef.current = true;
      clearStyleTimer();
      cancelAnimationFrame(pulseRef.current);
      observer.disconnect();
      containerRef.current?.removeEventListener("webglcontextcreationerror", onCreationError);
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
