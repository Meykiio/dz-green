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

type MapFailure = "webgl2" | "lost";

/** Same probe the browser uses for any WebGL canvas — cheap and side-effect free. */
function webgl2Available(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2");
    const ok = gl !== null;
    if (gl && "getExtension" in gl) gl.getExtension("WEBGL_lose_context")?.loseContext();
    return ok;
  } catch {
    return false;
  }
}

function MapFailureOverlay({ kind }: { kind: MapFailure }) {
  return (
    <div
      role="alert"
      className="absolute inset-0 z-10 flex items-center justify-center bg-card/95 p-4 text-center"
    >
      <div className="max-w-sm">
        <p className="text-base font-semibold">
          {kind === "webgl2" ? "This browser can't draw the map" : "The map lost its connection"}
        </p>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {kind === "webgl2"
            ? "The map needs WebGL2 (3D graphics), which this browser or device doesn't provide. Try updating your browser or enabling hardware acceleration."
            : "The graphics connection dropped. If it doesn't come back, reload the page."}
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-3 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-semibold text-foreground transition-transform active:scale-[0.97]"
        >
          Reload map
        </button>
      </div>
    </div>
  );
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
  const [failure, setFailure] = useState<MapFailure | null>(null);
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
    if (creationError) {
      map.remove();
      mapRef.current = null;
      setFailure("webgl2");
      return;
    }
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
      className="relative h-full w-full"
      role="img"
      aria-label="Interactive map of Algeria showing tree plantings, care updates and fire reports"
    >
      {failure ? <MapFailureOverlay kind={failure} /> : null}
    </div>
  );
}
