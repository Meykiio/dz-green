import { ClientOnly } from "@tanstack/react-router";
import { Crosshair, Link2, Loader2 } from "lucide-react";
import { Suspense, lazy, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { CommuneField } from "@/components/CommuneField";
import { useI18n } from "@/i18n";
import { wilayaCodeForPoint } from "@/lib/geo";
import { getGeoHint } from "@/lib/geo-hint";
import { medianFix, type GpsFix } from "@/lib/gps";
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

function accuracyTone(accuracy: number): { key: "excellent" | "good" | "rough" | "poor"; tone: string } {
  if (accuracy < 50) return { key: "excellent", tone: "text-plant" };
  if (accuracy < 300) return { key: "good", tone: "text-foreground" };
  if (accuracy < 1000) return { key: "rough", tone: "text-care" };
  return { key: "poor", tone: "text-fire" };
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
  const { t, locale } = useI18n();
  const [showMap, setShowMap] = useState(showMapByDefault);
  const [locating, setLocating] = useState(false);
  const [bestAccuracy, setBestAccuracy] = useState<number | null>(null);
  const [mapsLink, setMapsLink] = useState("");
  const [linkState, setLinkState] = useState<"idle" | "busy" | "ok" | "bad">("idle");
  const [wilayaTouched, setWilayaTouched] = useState(false);
  const [autoFilled, setAutoFilled] = useState<"pin" | "ip" | null>(null);
  const wilayaRef = useRef(wilaya);
  wilayaRef.current = wilaya;
  const watchIdRef = useRef<number | null>(null);
  const watchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bestFixRef = useRef<{ lat: number; lng: number; accuracy: number } | null>(null);
  const fixesRef = useRef<GpsFix[]>([]);

  // GPS best-fix watch: the first answer is usually a coarse network fix
  // (±50–500 m); the phone refines toward true GPS over the next seconds.
  // Watch for up to 12 s, keep the best reading, stop early at ±15 m.
  const GOOD_ENOUGH_M = 15;
  const WATCH_BUDGET_MS = 12000;

  function stopWatch() {
    if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
    watchIdRef.current = null;
    if (watchTimeoutRef.current) clearTimeout(watchTimeoutRef.current);
    watchTimeoutRef.current = null;
  }

  useEffect(() => () => stopWatch(), []);

  // IP geo hint (Vercel headers, coarse, never stored): pre-select the
  // wilaya and center the picker on the visitor's city. A suggestion only —
  // the user can change it; the server derives the real wilaya from the pin.
  const geoHint = useState(() => getGeoHint())[0];
  useEffect(() => {
    if (!geoHint || wilayaRef.current || wilayaTouched) return;
    const code = wilayaCodeForPoint(geoHint.lat, geoHint.lng);
    if (code) {
      onWilaya(code);
      setAutoFilled("ip");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function finishWatch() {
    stopWatch();
    // Median of the last good fixes — a single "best" reading can be a
    // lucky outlier tens of meters off (see lib/gps.ts).
    const final = medianFix(fixesRef.current) ?? bestFixRef.current;
    if (final) handleLocation(final.lat, final.lng, final.accuracy);
    bestFixRef.current = null;
    fixesRef.current = [];
    setLocating(false);
    setBestAccuracy(null);
  }

  function handleLocation(nextLat: number, nextLng: number, nextAccuracy: number | null) {
    onLocation(nextLat, nextLng, nextAccuracy);
    if (wilayaTouched) return;
    const code = wilayaCodeForPoint(nextLat, nextLng);
    if (code && code !== wilayaRef.current) {
      onWilaya(code);
      setAutoFilled("pin");
    }
  }

  const isAndroid =
    typeof navigator !== "undefined" && /android/i.test(navigator.userAgent);

  function useMyLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    setLocating(true);
    setBestAccuracy(null);
    bestFixRef.current = null;
    fixesRef.current = [];
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const acc = pos.coords.accuracy ?? Infinity;
        const fix = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: acc,
        };
        if (fixesRef.current.length >= 10) fixesRef.current.shift();
        fixesRef.current.push(fix);
        if (!bestFixRef.current || acc < bestFixRef.current.accuracy) {
          bestFixRef.current = fix;
          setBestAccuracy(acc);
        }
        if (acc <= GOOD_ENOUGH_M) finishWatch();
      },
      () => finishWatch(),
      { enableHighAccuracy: true, maximumAge: 0 },
    );
    watchTimeoutRef.current = setTimeout(finishWatch, WATCH_BUDGET_MS);
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
          <span className="eyebrow">{t("forms.location.wilaya")}</span>
          <select
            required
            value={wilaya}
            onChange={(e) => {
              setWilayaTouched(true);
              setAutoFilled(null);
              onWilaya(e.target.value);
            }}
            className="tap-target mt-1 w-full rounded-md border border-input bg-card px-3 py-2 text-base"
          >
            <option value="">{t("forms.location.chooseWilaya")}</option>
            {WILAYAS.map((w) => (
              <option key={w.code} value={w.code}>
                {w.code} — {locale === "ar" ? w.nameAr : w.name}
              </option>
            ))}
          </select>
          {autoFilled && (
            <span className="mt-1 block text-xs text-muted-foreground">
              {autoFilled === "ip" ? t("forms.location.detectedIp") : t("forms.location.detected")}
            </span>
          )}
        </label>
        <CommuneField wilaya={wilaya} value={commune} onChange={onCommune} />
      </div>

      <div className="rounded-lg border border-border bg-card/50 p-3">
        <p className="text-sm font-medium">{t("forms.location.exact")}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{t("forms.location.helper")}</p>
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={useMyLocation}
            disabled={locating}
            className="tap-target"
          >
            {locating ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Crosshair className="size-4" />
            )}
            {locating ? t("forms.location.improving") : t("forms.location.useLocation")}
          </Button>
          {locating && (
            <Button
              type="button"
              variant="ghost"
              onClick={finishWatch}
              disabled={bestAccuracy == null}
              className="tap-target"
            >
              {t("forms.location.useNow")}
            </Button>
          )}
          {hasPin && !locating && onClearLocation && (
            <Button type="button" variant="ghost" onClick={onClearLocation} className="tap-target">
              {t("forms.location.removePin")}
            </Button>
          )}
          {!locating && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowMap((v) => !v)}
              className="tap-target"
            >
              {showMap ? t("forms.location.hideMap") : t("forms.location.adjust")}
            </Button>
          )}
        </div>
        {locating && (
          <p className="mt-1 text-xs text-muted-foreground" aria-live="polite">
            {bestAccuracy != null
              ? t("forms.location.bestFix", {
                  m: Math.round(bestAccuracy),
                  good: GOOD_ENOUGH_M,
                  s: WATCH_BUDGET_MS / 1000,
                })
              : t("forms.location.waitingFirstFix")}
            {isAndroid && bestAccuracy != null && bestAccuracy > GOOD_ENOUGH_M && (
              <span className="block mt-0.5">{t("forms.location.wifiHint")}</span>
            )}
          </p>
        )}

        <div className="mt-2.5">
          <label className="flex items-center gap-2 rounded-md border border-input bg-card px-3 py-2 text-sm focus-within:ring-1 focus-within:ring-ring">
            <Link2 className="size-4 shrink-0 text-muted-foreground" />
            <input
              value={mapsLink}
              onChange={(e) => void applyMapsLink(e.target.value)}
              placeholder={t("forms.location.pasteLink")}
              inputMode="url"
              className="w-full bg-transparent outline-none placeholder:text-muted-foreground"
            />
            {linkState === "busy" && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
          </label>
          {linkState === "ok" && (
            <p className="mt-1 text-xs text-plant">{t("forms.location.linkOk")}</p>
          )}
          {linkState === "bad" && <p className="mt-1 text-xs text-fire">{t("forms.location.linkError")}</p>}
        </div>

        {hasPin && (
          <p className="mt-2.5 text-sm text-muted-foreground">
            {t("forms.location.pinAt", {
              lat: lat!.toFixed(5),
              lng: lng!.toFixed(5),
            })}
            {tone && (
              <span className={tone.tone}>
                {" "}
                {t("forms.location.accuracy", {
                  m: Math.round(accuracy ?? 0),
                  tone: t(`forms.location.tone.${tone.key}`),
                })}
                {tone.key !== "excellent" && tone.key !== "good" && (
                  <span className="text-muted-foreground"> {t("forms.location.adjustSuffix")}</span>
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
                  hint={hasPin ? null : geoHint}
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
