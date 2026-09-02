import { useEffect, useRef, useState } from "react";

import { medianFix, type GpsFix } from "@/lib/gps";

/**
 * The GPS best-fix watch (extracted from LocationField, 2026-09-01): the
 * first answer is usually a coarse network fix (±50–500 m); the phone
 * refines toward true GPS over the next seconds. Watch for up to 12 s, keep
 * the readings, finish with the median of the last good ones (a single
 * "best" reading can be a lucky outlier — see lib/gps.ts). Stops early at
 * ±15 m, and exposes "use this now" via finish().
 */
export const GOOD_ENOUGH_M = 15;
export const WATCH_BUDGET_MS = 12000;

export function useGpsWatch(onFix: (lat: number, lng: number, accuracy: number) => void) {
  const [locating, setLocating] = useState(false);
  const [bestAccuracy, setBestAccuracy] = useState<number | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const watchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bestFixRef = useRef<GpsFix | null>(null);
  const fixesRef = useRef<GpsFix[]>([]);
  const onFixRef = useRef(onFix);
  onFixRef.current = onFix;

  function stopWatch() {
    if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
    watchIdRef.current = null;
    if (watchTimeoutRef.current) clearTimeout(watchTimeoutRef.current);
    watchTimeoutRef.current = null;
  }

  useEffect(() => () => stopWatch(), []);

  function finish() {
    stopWatch();
    const final = medianFix(fixesRef.current) ?? bestFixRef.current;
    if (final) onFixRef.current(final.lat, final.lng, final.accuracy);
    bestFixRef.current = null;
    fixesRef.current = [];
    setLocating(false);
    setBestAccuracy(null);
  }

  function start() {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    setLocating(true);
    setBestAccuracy(null);
    bestFixRef.current = null;
    fixesRef.current = [];
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const acc = pos.coords.accuracy ?? Infinity;
        const fix = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: acc };
        if (fixesRef.current.length >= 10) fixesRef.current.shift();
        fixesRef.current.push(fix);
        if (!bestFixRef.current || acc < bestFixRef.current.accuracy) {
          bestFixRef.current = fix;
          setBestAccuracy(acc);
        }
        if (acc <= GOOD_ENOUGH_M) finish();
      },
      () => finish(),
      { enableHighAccuracy: true, maximumAge: 0 },
    );
    watchTimeoutRef.current = setTimeout(finish, WATCH_BUDGET_MS);
  }

  const isAndroid =
    typeof navigator !== "undefined" && /android/i.test(navigator.userAgent);

  return { locating, bestAccuracy, isAndroid, start, finish };
}
