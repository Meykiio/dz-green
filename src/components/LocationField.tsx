import { ClientOnly } from "@tanstack/react-router";
import { Crosshair, Loader2 } from "lucide-react";
import { Suspense, lazy, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { CommuneField } from "@/components/CommuneField";
import { useI18n } from "@/i18n";
import { wilayaCodeForPoint } from "@/lib/geo";
import { getGeoHint } from "@/lib/geo-hint";
import { GOOD_ENOUGH_M, useGpsWatch, WATCH_BUDGET_MS } from "@/components/location-gps";
import { MapsLinkField } from "@/components/location-maps-link";
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
  const [wilayaTouched, setWilayaTouched] = useState(false);
  const [autoFilled, setAutoFilled] = useState<"pin" | "ip" | null>(null);
  const wilayaRef = useRef(wilaya);
  wilayaRef.current = wilaya;

  function handleLocation(nextLat: number, nextLng: number, nextAccuracy: number | null) {
    onLocation(nextLat, nextLng, nextAccuracy);
    if (wilayaTouched) return;
    const code = wilayaCodeForPoint(nextLat, nextLng);
    if (code && code !== wilayaRef.current) {
      onWilaya(code);
      setAutoFilled("pin");
    }
  }

  // The GPS best-fix watch lives in location-gps.ts (extracted 2026-09-01).
  const gps = useGpsWatch((la, ln, acc) => handleLocation(la, ln, acc));

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
            onClick={gps.start}
            disabled={gps.locating}
            className="tap-target"
          >
            {gps.locating ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Crosshair className="size-4" />
            )}
            {gps.locating ? t("forms.location.improving") : t("forms.location.useLocation")}
          </Button>
          {gps.locating && (
            <Button
              type="button"
              variant="ghost"
              onClick={gps.finish}
              disabled={gps.bestAccuracy == null}
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
          {!gps.locating && (
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
        {gps.locating && (
          <p className="mt-1 text-xs text-muted-foreground" aria-live="polite">
            {gps.bestAccuracy != null
              ? t("forms.location.bestFix", {
                  m: Math.round(gps.bestAccuracy),
                  good: GOOD_ENOUGH_M,
                  s: WATCH_BUDGET_MS / 1000,
                })
              : t("forms.location.waitingFirstFix")}
            {gps.isAndroid && gps.bestAccuracy != null && gps.bestAccuracy > GOOD_ENOUGH_M && (
              <span className="block mt-0.5">{t("forms.location.wifiHint")}</span>
            )}
          </p>
        )}

        <MapsLinkField onLocation={(la, ln) => handleLocation(la, ln, null)} />

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
