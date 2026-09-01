import { Navigation, Wind } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";
import { directionsUrl } from "@/lib/maps-link";
import type { Hotspot } from "@/lib/types";
import { wilayaCodeForPoint } from "@/lib/geo";
import { compass, pm25Band } from "@/lib/weather";
import { getAirQuality, getFireWeather } from "@/lib/weather.functions";
import { wilayaName } from "@/lib/wilayas";

/**
 * "Weather now" block for fire/hotspot panels: temp, humidity, wind — the
 * spread-danger context. On-demand per open panel; hidden when unavailable.
 */
export function FireWeatherBlock({ lat, lng }: { lat: number; lng: number }) {
  const { t } = useI18n();
  const weather = useQuery({
    queryKey: ["fire-weather", lat.toFixed(2), lng.toFixed(2)],
    queryFn: () => getFireWeather({ data: { lat, lng } }),
    staleTime: 600_000,
  });
  const air = useQuery({
    queryKey: ["air-quality", lat.toFixed(2), lng.toFixed(2)],
    queryFn: () => getAirQuality({ data: { lat, lng } }),
    staleTime: 600_000,
  });
  const w = weather.data;
  const a = air.data;
  if (!w && !a) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2.5">
      <p className="eyebrow flex items-center gap-1.5">
        <Wind className="size-3.5" />
        {t("home.detail.weather.title")}
      </p>
      {w && (
        <p className="mt-1 text-sm">
          <span className="font-medium tabular-nums">{w.temperatureC}°C</span>
          {" · "}
          {t("home.detail.weather.humidity", { pct: w.humidityPct })}
          {" · "}
          {t("home.detail.weather.wind", {
            speed: w.windSpeedKmh,
            dir: t(`home.detail.weather.dir.${compass(w.windDirectionDeg)}`),
            gusts: w.windGustsKmh,
          })}
        </p>
      )}
      {a && (
        <p className="mt-1 text-sm text-muted-foreground">
          {t("home.detail.weather.air", {
            pm: a.pm25,
            band: t(`home.detail.weather.band.${pm25Band(a.pm25)}`),
            dust: a.dust,
          })}
        </p>
      )}
    </div>
  );
}

/** Detail body for a satellite hotspot (NASA FIRMS) — display-only, honest copy. */
export function HotspotBody({ hotspot }: { hotspot: Hotspot }) {
  const { t, formatDateTime } = useI18n();
  const wilayaCode = wilayaCodeForPoint(hotspot.lat, hotspot.lng);
  return (
    <div className="mt-4 space-y-4">
      <dl className="grid grid-cols-2 gap-3 text-sm">
        {wilayaCode && <Field label={t("home.detail.field.wilaya")} value={wilayaName(wilayaCode)} />}
        <Field
          label={t("home.detail.hotspot.confidence")}
          value={t(`home.detail.hotspot.confidenceValue.${hotspot.confidence}`)}
        />
        <Field label={t("home.detail.hotspot.frp")} value={`${hotspot.frp} MW`} />
        <Field label={t("home.detail.hotspot.brightness")} value={`${hotspot.brightnessC}°C`} />
        <Field label={t("home.detail.hotspot.acquired")} value={formatDateTime(hotspot.acquiredAt)} />
        <Field
          label={t("home.detail.hotspot.satellite")}
          value={`${hotspot.satellite} · ${t(`home.detail.hotspot.daynight.${hotspot.daynight}`)}`}
        />
      </dl>
      <FireWeatherBlock lat={hotspot.lat} lng={hotspot.lng} />
      <p className="rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
        {t("home.detail.hotspot.disclaimer")}
      </p>
      <p className="text-xs text-muted-foreground">
        {t("home.detail.hotspot.attribution")}{" "}
        <a
          href="https://firms.modaps.eosdis.nasa.gov/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          NASA FIRMS
        </a>
      </p>
      <Button asChild variant="outline" className="w-full">
        <a href={directionsUrl(hotspot.lat, hotspot.lng)} target="_blank" rel="noopener noreferrer">
          <Navigation className="size-4" />
          {t("home.detail.fireDirections")}
        </a>
      </Button>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="eyebrow">{label}</dt>
      <dd className="mt-0.5 font-medium">{value}</dd>
    </div>
  );
}
