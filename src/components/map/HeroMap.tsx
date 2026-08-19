import { useEffect, useMemo, useRef } from "react";
import { Map as MapLibreMap, NavigationControl, type GeoJSONSource } from "maplibre-gl";
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
  const styleRef = useRef<string>(LIGHT_STYLE);
  const firstThemeRun = useRef(true);
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
    // Read the live theme + direction straight from the DOM: the no-flash
    // script in __root already applied `.dark`, and the i18n loader set `dir`.
    // useTheme's value is "light" on the first render (SSR-safe), so relying on
    // it here would open the map in the light style even in dark mode.
    const initialDark = document.documentElement.classList.contains("dark");
    const isRtl = document.documentElement.dir === "rtl";
    // On phones the action card overlays the bottom of the map, so frame
    // Algeria in the band above it (extra bottom padding) — otherwise the
    // southern half sits hidden behind the card on first load.
    const isMobile = window.innerWidth < 768;
    const initialStyle = initialDark ? DARK_STYLE : LIGHT_STYLE;
    themeRef.current = initialDark ? "dark" : "light";
    styleRef.current = initialStyle;
    const map = new MapLibreMap({
      container: container.current,
      style: initialStyle,
      bounds: ALGERIA_BOUNDS,
      fitBoundsOptions: isMobile
        ? { padding: { top: 48, bottom: 300, left: 16, right: 16 } }
        : { padding: 24 },
      // Wide zoom range so users can pull back to the whole region or zoom
      // right down to a street; generous maxBounds so panning feels free
      // (the recenter control snaps back to Algeria).
      minZoom: 2.5,
      maxZoom: 18,
      maxBounds: [
        [-30, 4],
        [45, 48],
      ],
      attributionControl: { compact: true },
    });
    // Put the zoom + recenter controls on the side opposite the action card
    // (which sits at the inline-start corner) so they never overlap it — the
    // card is bottom-left in LTR and bottom-right in RTL.
    const controlSide = isRtl ? "bottom-left" : "bottom-right";
    map.addControl(new NavigationControl({ showCompass: false }), controlSide);
    map.addControl(new RecenterControl(), controlSide);

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
  useEffect(() => {
    // Skip the first run — the mount effect already opened the map with the
    // correct style (read from the DOM), so there is nothing to switch yet.
    if (firstThemeRun.current) {
      firstThemeRun.current = false;
      return;
    }
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
