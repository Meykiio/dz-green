import { Navigation } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";
import { directionsUrl } from "@/lib/maps-link";
import type { Hotspot } from "@/lib/types";
import { wilayaCodeForPoint } from "@/lib/geo";
import { wilayaName } from "@/lib/wilayas";

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
