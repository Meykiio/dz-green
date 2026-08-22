import { useEffect, useMemo, useRef, useState } from "react";
import {
  GPUInitializationError,
  Map as MapLibreMap,
  NavigationControl,
  type ErrorEvent,
  type GeoJSONSource,
  type StyleSpecification,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import { useTheme } from "@/hooks/useTheme";
import { WILAYA_SHAPES } from "@/data/algeria-wilayas";
import { unprojectToLatLng } from "@/lib/geo";
import type { CareLog, FireReport, MapFeature, Site } from "@/lib/types";
import { MapFailureOverlay, webgl2Available, type Layer } from "./HeroMap";
import { featureCollection, onlyKind, withoutKind } from "./map-data";
import {
  addDataLayers,
  applyLayerVisibility,
  startPulse,
  wireInteractions,
} from "./map-layers";
import { NORTH_BOUNDS, RecenterControl } from "./map-style";

interface Props {
  sites: Site[];
  careLogs: CareLog[];
  fires: FireReport[];
  layers: Record<Layer, boolean>;
  onSelectFeature: (feature: MapFeature) => void;
}

type MapFailure = "webgl2" | "lost";

/** Theme surfaces for the schematic — Algeria pops against a dimmed outside. */
const SURFACES = {
  light: { background: "#f1f4ee", outside: "#dfe5da", label: "#5b6b5c" },
  dark: { background: "#0e0f0c", outside: "#050605", label: "#8fa593" },
} as const;

function styleFor(theme: "light" | "dark"): StyleSpecification {
  const s = SURFACES[theme];
  return {
    version: 8,
    glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
    sources: {},
    layers: [
      { id: "background", type: "background", paint: { "background-color": s.background } },
    ],
  };
}

/** Wilaya name labels at the shape centres (Latin names for the preview). */
function wilayaLabelPoints() {
  return {
    type: "FeatureCollection" as const,
    features: WILAYA_SHAPES.map((shape) => {
      const { lat, lng } = unprojectToLatLng(shape.cx, shape.cy);
      return {
        type: "Feature" as const,
        properties: { code: shape.code, name: shape.name },
        geometry: { type: "Point" as const, coordinates: [lng, lat] },
      };
    }),
  };
}

function addWilayaLabels(map: MapLibreMap, theme: "light" | "dark") {
  map.addSource("ga-wilaya-labels", { type: "geojson", data: wilayaLabelPoints() });
  map.addLayer({
    id: "ga-wilaya-labels",
    type: "symbol",
    source: "ga-wilaya-labels",
    layout: {
      "text-field": ["get", "name"],
      "text-size": 11,
      "text-font": ["Noto Sans Regular"],
      "text-transform": "uppercase",
      "text-letter-spacing": 0.08,
    },
    paint: {
      "text-color": SURFACES[theme].label,
      "text-halo-color": SURFACES[theme].background,
      "text-halo-width": 1.2,
    },
  });
}

/**
 * The tile-free home map (preview): no basemap at all — just our own Algeria
 * outline, wilaya borders and names, and the tree/care/fire dots on a themed
 * canvas. Zero tile downloads; the dim mask still fades the outside world.
 */
export function SchematicMap({ sites, careLogs, fires, layers, onSelectFeature }: Props) {
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

  useEffect(() => {
    if (!container.current || mapRef.current) return;
    if (!webgl2Available()) {
      setFailure("webgl2");
      return;
    }
    let creationError: ErrorEvent["error"] | null = null;
    const onCreationError = (e: Event) => {
      creationError = (e as unknown as ErrorEvent).error;
    };
    container.current.addEventListener("webglcontextcreationerror", onCreationError);
    let cancelled = false;
    cancelledRef.current = false;
    const map = new MapLibreMap({
      container: container.current,
      style: styleFor(themeRef.current),
      bounds: NORTH_BOUNDS,
      fitBoundsOptions: { padding: 24 },
      minZoom: 4,
      maxZoom: 16,
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
      // The mask color was tuned to blend with the basemap; on the schematic
      // it must contrast with our own canvas instead.
      map.setPaintProperty("ga-mask", "fill-color", SURFACES[themeRef.current].outside);
      addWilayaLabels(map, themeRef.current);
      wireInteractions(map, refs);
      startPulse(map, pulseRef, cancelledRef);
    };
    if (map.loaded()) init();
    else map.once("style.load", init);

    map.on("error", (e: ErrorEvent) => {
      if (e.error instanceof GPUInitializationError) setFailure("webgl2");
      else console.error("[schematic-map] non-fatal error:", e.error);
    });
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

  // Theme switch: rebuild the minimal style and re-add everything.
  const styleRef = useRef(theme);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || theme === styleRef.current) return;
    styleRef.current = theme;
    const once = () => {
      addDataLayers(map, refs);
      map.setPaintProperty("ga-mask", "fill-color", SURFACES[themeRef.current].outside);
      addWilayaLabels(map, themeRef.current);
      wireInteractions(map, refs);
    };
    map.once("style.load", once);
    map.setStyle(styleFor(theme));
  }, [theme]);

  useEffect(() => {
    const map = mapRef.current;
    const points = map?.getSource("ga-points") as GeoJSONSource | undefined;
    points?.setData(withoutKind(data, "fires"));
    const firesSrc = map?.getSource("ga-fires") as GeoJSONSource | undefined;
    firesSrc?.setData(onlyKind(data, "fires"));
  }, [data]);

  useEffect(() => {
    const map = mapRef.current;
    if (map) applyLayerVisibility(map, layersRef);
  }, [layers]);

  return (
    <div
      ref={container}
      className="relative h-full w-full"
      role="img"
      aria-label="Schematic map of Algeria showing tree plantings, care updates and fire reports"
    >
      {failure ? <MapFailureOverlay kind={failure} /> : null}
    </div>
  );
}
