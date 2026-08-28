import { useEffect, useRef } from "react";
import {
  GeolocateControl,
  Map as MapLibreMap,
  Marker,
  NavigationControl,
  type GeoJSONSource,
  type MapMouseEvent,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import { ALGERIA_CENTER } from "@/lib/geo";
import { useI18n } from "@/i18n";

interface Props {
  lat: number | null;
  lng: number | null;
  accuracy?: number | null;
  onChange: (lat: number, lng: number) => void;
}

const ACCURACY_LAYER = "pin-accuracy-layer";
const ACCURACY_SOURCE = "pin-accuracy";
const MAX_RADIUS_PX = 300;

function accuracyRadiusPx(accuracy: number, lat: number, zoom: number): number {
  const metersPerPixel = (156543.03392 * Math.cos((lat * Math.PI) / 180)) / Math.pow(2, zoom);
  return Math.min(MAX_RADIUS_PX, accuracy / metersPerPixel);
}

/**
 * The only real-world map in the app: MapLibre GL + OpenFreeMap vector tiles
 * (no API key, no rate-limit cliff). Used purely for dropping an accurate pin.
 */
export default function PrecisionPicker({ lat, lng, accuracy, onChange }: Props) {
  const { t } = useI18n();
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const onChangeRef = useRef(onChange);
  const accuracyRef = useRef(accuracy);
  onChangeRef.current = onChange;
  accuracyRef.current = accuracy;

  useEffect(() => {
    if (!container.current || mapRef.current) return;
    const start: [number, number] = [lng ?? ALGERIA_CENTER.lng, lat ?? ALGERIA_CENTER.lat];

    const map = new MapLibreMap({
      container: container.current,
      style: "https://tiles.openfreemap.org/styles/liberty",
      center: start,
      zoom: lat && lng ? 14 : 4.4,
      attributionControl: { compact: true },
    });
    map.addControl(new NavigationControl({ showCompass: false }), "top-right");
    map.addControl(new GeolocateControl({ trackUserLocation: false }), "top-right");

    const marker = new Marker({ color: "#4ade80", draggable: true })
      .setLngLat(start)
      .addTo(map);

    const updateAccuracy = () => {
      const acc = accuracyRef.current;
      const pos = marker.getLngLat();
      const source = map.getSource(ACCURACY_SOURCE) as GeoJSONSource | undefined;
      if (!source) return;
      source.setData({
        type: "Feature",
        properties: {},
        geometry: { type: "Point", coordinates: [pos.lng, pos.lat] },
      });
      if (acc == null) {
        map.setPaintProperty(ACCURACY_LAYER, "circle-radius", 0);
        map.setPaintProperty(ACCURACY_LAYER, "circle-opacity", 0);
        return;
      }
      map.setPaintProperty(
        ACCURACY_LAYER,
        "circle-radius",
        accuracyRadiusPx(acc, pos.lat, map.getZoom()),
      );
      map.setPaintProperty(ACCURACY_LAYER, "circle-opacity", 0.18);
    };

    map.on("load", () => {
      map.addSource(ACCURACY_SOURCE, {
        type: "geojson",
        data: { type: "Feature", properties: {}, geometry: { type: "Point", coordinates: start } },
      });
      map.addLayer({
        id: ACCURACY_LAYER,
        type: "circle",
        source: ACCURACY_SOURCE,
        paint: {
          "circle-radius": 0,
          "circle-color": "#f59e0b",
          "circle-opacity": 0,
          "circle-stroke-width": 1,
          "circle-stroke-color": "#f59e0b",
          "circle-stroke-opacity": 0.6,
        },
      });
      updateAccuracy();
    });
    map.on("zoom", updateAccuracy);
    map.on("move", updateAccuracy);
    marker.on("drag", updateAccuracy);
    marker.on("dragend", () => {
      const p = marker.getLngLat();
      onChangeRef.current(p.lat, p.lng);
    });
    map.on("click", (e: MapMouseEvent) => {
      marker.setLngLat(e.lngLat);
      onChangeRef.current(e.lngLat.lat, e.lngLat.lng);
    });

    mapRef.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (lat == null || lng == null || !markerRef.current || !mapRef.current) return;
    const current = markerRef.current.getLngLat();
    if (Math.abs(current.lat - lat) < 1e-7 && Math.abs(current.lng - lng) < 1e-7) return;
    markerRef.current.setLngLat([lng, lat]);
    mapRef.current.easeTo({ center: [lng, lat], zoom: Math.max(mapRef.current.getZoom(), 13) });
  }, [lat, lng]);

  return (
    <div
      ref={container}
      className="h-64 w-full overflow-hidden rounded-xl border border-border"
      aria-label={t("forms.location.pickerAria")}
    />
  );
}
