import { Droplets, Flame, Navigation, Satellite, Sprout, X } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";
import { photoUrl } from "@/lib/data";
import { directionsUrl } from "@/lib/maps-link";
import { needsWater, type CareLog } from "@/lib/types";
import { wilayaName } from "@/lib/wilayas";
import { FireWeatherBlock, HotspotBody } from "./detail-bodies";

import type { MapFeature } from "@/lib/types";

const ACTION_KEY: Record<CareLog["action"], "watered" | "checked" | "needsAttention" | "update"> = {
  watered: "watered",
  checked: "checked",
  needs_attention: "needsAttention",
  other: "update",
};

export function DetailPanel({
  feature,
  careLogs,
  rainBySiteId,
  onClose,
}: {
  feature: MapFeature;
  careLogs: CareLog[];
  rainBySiteId?: Record<string, number>;
  onClose: () => void;
}) {
  const { t, formatDate } = useI18n();
  const site = feature.kind === "site" || feature.kind === "care" ? feature.site : null;
  const logs = site ? careLogs.filter((l) => l.site_id === site.id) : [];

  return (
    <aside
      className="glass-panel fixed inset-x-0 bottom-0 z-40 max-h-[72vh] overflow-y-auto overflow-x-hidden rounded-t-xl p-5 md:inset-auto md:top-24 md:end-6 md:max-h-[76vh] md:w-[400px] md:rounded-xl"
      aria-label={t("home.detail.aria")}
    >
      <div className="flex items-start justify-between gap-3">
        <Header feature={feature} />
        <button
          type="button"
          onClick={onClose}
          aria-label={t("home.detail.close")}
          className="tap-target -me-2 -mt-2 grid place-items-center rounded-full text-muted-foreground hover:text-foreground"
        >
          <X className="size-5" />
        </button>
      </div>

      {feature.kind === "fire" ? (
        <FireBody feature={feature} />
      ) : feature.kind === "hotspot" ? (
        <HotspotBody hotspot={feature.hotspot} />
      ) : (
        site && (
          <div className="mt-4 space-y-4">
            {photoUrl(site.photo_url) && (
              <img
                src={photoUrl(site.photo_url)!}
                alt={t("home.detail.altPlanting", { wilaya: wilayaName(site.wilaya_code) })}
                loading="lazy"
                className="max-h-44 w-full rounded-xl object-cover md:max-h-52"
              />
            )}
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <Field label={t("home.detail.field.wilaya")} value={wilayaName(site.wilaya_code)} />
              {site.commune && (
                <Field label={t("home.detail.field.commune")} value={site.commune} />
              )}
              <Field label={t("home.detail.field.trees")} value={String(site.tree_count)} />
              <Field
                label={t("home.detail.field.planted")}
                value={formatDate(site.planted_date)}
              />
              {site.species && (
                <Field label={t("home.detail.field.species")} value={site.species} />
              )}
              {site.planter_display_name && (
                <Field label={t("home.detail.field.by")} value={site.planter_display_name} />
              )}
            </dl>
            {site.location_approximate && (
              <p className="rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
                {t("home.detail.approxNotice")}
              </p>
            )}
            {site.notes && <p className="text-sm text-muted-foreground">{site.notes}</p>}

            {needsWater(site, careLogs, rainBySiteId?.[site.id]) && (
              <p className="rounded-lg border border-care/40 bg-care/10 px-3 py-2 text-sm text-care">
                {t("home.detail.thirsty")}
              </p>
            )}

            <div>
              <p className="eyebrow">{t("home.detail.timeline")}</p>
              <ol className="mt-2 space-y-2">
                <li className="flex items-center gap-2 text-sm">
                  <Sprout className="size-4 text-plant" />
                  <span>
                    {t("home.detail.timelinePlanted", { date: formatDate(site.planted_date) })}
                  </span>
                </li>
                {logs.map((log) => (
                  <li key={log.id} className="flex items-center gap-2 text-sm">
                    <Droplets className="size-4 text-care" />
                    <span>
                      {t(`home.actions.${ACTION_KEY[log.action]}`)} · {formatDate(log.logged_date)}
                      {log.submitter_name ? ` · ${log.submitter_name}` : ""}
                    </span>
                  </li>
                ))}
                {logs.length === 0 && (
                  <li className="text-sm text-muted-foreground">{t("home.detail.timelineEmpty")}</li>
                )}
              </ol>
            </div>

            <div className="flex gap-2">
              <Button asChild variant="secondary" size="sm" className="min-w-0 flex-1 whitespace-normal text-center leading-tight">
                <Link to="/care" search={{ site: site.id }}>
                  {t("home.detail.careCta")}
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="min-w-0 flex-1 whitespace-normal text-center leading-tight">
                <a
                  href={directionsUrl(site.lat, site.lng)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Navigation className="size-4" />
                  {t("home.detail.directions")}
                </a>
              </Button>
            </div>
          </div>
        )
      )}
    </aside>
  );
}

function Header({ feature }: { feature: MapFeature }) {
  const { t } = useI18n();
  if (feature.kind === "hotspot") {
    return (
      <div className="flex items-center gap-2">
        <Satellite className="size-5 text-amber-500" />
        <div>
          <p className="eyebrow">{t("home.detail.eyebrow.hotspot")}</p>
          <h2 className="text-lg font-semibold">{t("home.detail.hotspot.title")}</h2>
        </div>
      </div>
    );
  }
  if (feature.kind === "fire") {
    return (
      <div className="flex items-center gap-2">
        <Flame className="size-5 text-fire" />
        <div>
          <p className="eyebrow">{t("home.detail.eyebrow.fire")}</p>
          <h2 className="text-lg font-semibold">{wilayaName(feature.fire.wilaya_code)}</h2>
        </div>
      </div>
    );
  }
  const site = feature.site;
  return (
    <div className="flex items-center gap-2">
      {feature.kind === "care" ? (
        <Droplets className="size-5 text-care" />
      ) : (
        <Sprout className="size-5 text-plant" />
      )}
      <div>
        <p className="eyebrow">
          {feature.kind === "care" ? t("home.detail.eyebrow.care") : t("home.detail.eyebrow.site")}
        </p>
        <h2 className="text-lg font-semibold">{wilayaName(site.wilaya_code)}</h2>
      </div>
    </div>
  );
}

function FireBody({ feature }: { feature: Extract<MapFeature, { kind: "fire" }> }) {
  const { t, formatDate } = useI18n();
  const fire = feature.fire;
  return (
    <div className="mt-4 space-y-4">
      {photoUrl(fire.photo_url) && (
        <img
          src={photoUrl(fire.photo_url)!}
          alt={t("home.detail.altFire")}
          loading="lazy"
          className="max-h-44 w-full rounded-xl object-cover md:max-h-52"
        />
      )}
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <Field
          label={t("home.detail.field.status")}
          value={t(
            `home.detail.status.${fire.status.replace("_", "") === "falsealarm" ? "falseAlarm" : fire.status}`,
          )}
        />
        <Field label={t("home.detail.field.reported")} value={formatDate(fire.created_at)} />
        {fire.severity && (
          <Field
            label={t("home.detail.field.severity")}
            value={t(`home.detail.severity.${fire.severity}`)}
          />
        )}
        {fire.commune && (
          <Field label={t("home.detail.field.commune")} value={fire.commune} />
        )}
      </dl>
      {fire.location_approximate && (
        <p className="rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
          {t("home.detail.fireApproxNotice")}
        </p>
      )}
      {fire.description && <p className="text-sm text-muted-foreground">{fire.description}</p>}
      <FireWeatherBlock lat={fire.lat} lng={fire.lng} />
      <p className="rounded-lg border border-fire/40 bg-fire/10 px-3 py-2 text-sm">
        {t("home.detail.fireDisclaimer")}
      </p>
      <Button asChild variant="outline" className="w-full">
        <a
          href={directionsUrl(fire.lat, fire.lng)}
          target="_blank"
          rel="noopener noreferrer"
        >
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
      <dd className="mt-0.5 font-medium capitalize">{value}</dd>
    </div>
  );
}
