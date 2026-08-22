import { ClientOnly } from "@tanstack/react-router";
import { Crosshair, Link2, Loader2 } from "lucide-react";
import { Suspense, lazy, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { wilayaCodeForPoint } from "@/lib/geo";
import { isShortMapsLink, parseGoogleMapsLink } from "@/lib/maps-link";
import { resolveMapsLink } from "@/lib/maps.functions";
import { WILAYAS } from "@/lib/wilayas";

const PrecisionPicker = lazy(() => import("./PrecisionPicker"));

interface Props {
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
  wilaya: string;
  commune: string;
  onLocation: (lat: number, lng: number, accuracy: number | null) => void;
  onClearLocation?: () => void;
  onWilaya: (code: string) => void;
  onCommune: (value: string) => void;
  showMapByDefault?: boolean;
}

function accuracyTone(accuracy: number): { label: string; tone: string } {
  if (accuracy < 50) return { label: "excellent", tone: "text-plant" };
  if (accuracy < 300) return { label: "good", tone: "text-foreground" };
  if (accuracy < 1000) return { label: "rough", tone: "text-care" };
  return { label: "poor", tone: "text-fire" };
}

/**
 * Wilaya-first location (Sprint 6): the dropdown is the primary control and
 * works without GPS. An exact pin is optional precision on top — GPS button
 * (gesture-gated, with a privacy line) or a draggable pin on the map picker.
 * With no pin, the submission is stored as wilaya-level (honest granularity).
 */
export function LocationField({
  lat,
  lng,
  accuracy,
  wilaya,
  commune,
  onLocation,
  onClearLocation,
  onWilaya,
  onCommune,
  showMapByDefault = false,
}: Props) {
  const [showMap, setShowMap] = useState(showMapByDefault);
  const [locating, setLocating] = useState(false);
  const [mapsLink, setMapsLink] = useState("");
  const [linkState, setLinkState] = useState<"idle" | "busy" | "ok" | "bad">("idle");
  const [wilayaTouched, setWilayaTouched] = useState(false);
  const [autoFilled, setAutoFilled] = useState(false);
  const wilayaRef = useRef(wilaya);
  wilayaRef.current = wilaya;

  function handleLocation(nextLat: number, nextLng: number, nextAccuracy: number | null) {
    onLocation(nextLat, nextLng, nextAccuracy);
    if (wilayaTouched) return;
    const code = wilayaCodeForPoint(nextLat, nextLng);
    if (code && code !== wilayaRef.current) {
      onWilaya(code);
      setAutoFilled(true);
    }
  }

  function useMyLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        handleLocation(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy ?? null);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }

  /** Paste-a-Maps-link fallback: GPS failed or the pin is wrong. */
  async function applyMapsLink(value: string) {
    setMapsLink(value);
    const direct = parseGoogleMapsLink(value);
    if (direct) {
      handleLocation(direct.lat, direct.lng, null);
      setLinkState("ok");
      return;
    }
    if (isShortMapsLink(value)) {
      setLinkState("busy");
      try {
        const resolved = await resolveMapsLink({ data: { url: value.trim() } });
        if (resolved) {
          handleLocation(resolved.lat, resolved.lng, null);
          setLinkState("ok");
        } else {
          setLinkState("bad");
        }
      } catch {
        setLinkState("bad");
      }
      return;
    }
    setLinkState(value.trim() ? "bad" : "idle");
  }

  const tone = accuracy != null ? accuracyTone(accuracy) : null;
  const hasPin = lat != null && lng != null;

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="eyebrow">Wilaya *</span>
          <select
            required
            value={wilaya}
            onChange={(e) => {
              setWilayaTouched(true);
              setAutoFilled(false);
              onWilaya(e.target.value);
            }}
            className="tap-target mt-1 w-full rounded-md border border-input bg-card px-3 py-2 text-base"
          >
            <option value="">Choose a wilaya</option>
            {WILAYAS.map((w) => (
              <option key={w.code} value={w.code}>
                {w.code} — {w.name}
              </option>
            ))}
          </select>
          {autoFilled && (
            <span className="mt-1 block text-xs text-muted-foreground">
              Detected from your pin — change it here if it's wrong.
            </span>
          )}
        </label>
        <label className="block">
          <span className="eyebrow">Commune (optional)</span>
          <input
            value={commune}
            maxLength={120}
            onChange={(e) => onCommune(e.target.value)}
            className="tap-target mt-1 w-full rounded-md border border-input bg-card px-3 py-2 text-base"
          />
        </label>
      </div>

      <div className="rounded-lg border border-border bg-card/50 p-3">
        <p className="text-sm font-medium">Exact location (optional)</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Used once, never stored. Skip it and the report is wilaya-level.
        </p>
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <Button type="button" variant="secondary" onClick={useMyLocation} className="tap-target">
            {locating ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Crosshair className="size-4" />
            )}
            Use my location
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setShowMap((v) => !v)}
            className="tap-target"
          >
            {showMap ? "Hide map" : "Adjust on map"}
          </Button>
          {hasPin && onClearLocation && (
            <Button type="button" variant="ghost" onClick={onClearLocation} className="tap-target">
              Remove pin
            </Button>
          )}
        </div>

        <div className="mt-2.5">
          <label className="flex items-center gap-2 rounded-md border border-input bg-card px-3 py-2 text-sm focus-within:ring-1 focus-within:ring-ring">
            <Link2 className="size-4 shrink-0 text-muted-foreground" />
            <input
              value={mapsLink}
              onChange={(e) => void applyMapsLink(e.target.value)}
              placeholder="Or paste a Google Maps link"
              inputMode="url"
              className="w-full bg-transparent outline-none placeholder:text-muted-foreground"
            />
            {linkState === "busy" && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
          </label>
          {linkState === "ok" && (
            <p className="mt-1 text-xs text-plant">Pin set from the link — adjust it below if needed.</p>
          )}
          {linkState === "bad" && (
            <p className="mt-1 text-xs text-fire">
              Couldn't read coordinates from that link. Open the place in Google Maps, copy the
              full URL from the address bar, and paste that.
            </p>
          )}
        </div>

        {hasPin && (
          <p className="mt-2.5 text-sm text-muted-foreground">
            Pin at {lat!.toFixed(5)}, {lng!.toFixed(5)}
            {tone && (
              <span className={tone.tone}>
                {" "}
                · accuracy ±{Math.round(accuracy ?? 0)} m ({tone.label})
                {tone.label !== "excellent" && tone.label !== "good" && (
                  <span className="text-muted-foreground"> — adjust the pin if needed</span>
                )}
              </span>
            )}
          </p>
        )}

        {showMap && (
          <div className="mt-2.5">
            <ClientOnly
              fallback={<div className="h-64 w-full animate-pulse rounded-xl bg-card" />}
            >
              <Suspense fallback={<div className="h-64 w-full animate-pulse rounded-xl bg-card" />}>
                <PrecisionPicker
                  lat={lat}
                  lng={lng}
                  accuracy={accuracy}
                  onChange={(nextLat, nextLng) => handleLocation(nextLat, nextLng, null)}
                />
              </Suspense>
            </ClientOnly>
          </div>
        )}
      </div>
    </div>
  );
}
