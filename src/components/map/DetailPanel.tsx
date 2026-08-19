import { Droplets, Flame, Navigation, Sprout, X } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";
import { format } from "@/i18n/format";
import { photoUrl } from "@/lib/data";
import { directionsUrl } from "@/lib/maps-link";
import { needsWater, type CareLog } from "@/lib/types";
import { wilayaName } from "@/lib/wilayas";

import type { MapFeature } from "@/lib/types";

export function DetailPanel({
  feature,
  careLogs,
  onClose,
}: {
  feature: MapFeature;
  careLogs: CareLog[];
  onClose: () => void;
}) {
  const { t, formatDate } = useI18n();
  const site = feature.kind === "fire" ? null : (feature.site ?? null);
  const logs = site ? careLogs.filter((l) => l.site_id === site.id) : [];

  const actionLabel: Record<CareLog["action"], string> = {
    watered: t.detail.actionWatered,
    checked: t.detail.actionChecked,
    needs_attention: t.detail.actionNeedsAttention,
    other: t.detail.actionOther,
  };

  return (
    <aside
      className="glass-panel fixed inset-x-0 bottom-0 z-40 max-h-[72vh] overflow-y-auto overflow-x-hidden rounded-t-xl p-5 md:inset-auto md:top-24 md:end-6 md:max-h-[76vh] md:w-[360px] md:rounded-xl"
      aria-label={t.detail.title}
    >
      <div className="flex items-start justify-between gap-3">
        <Header feature={feature} />
        <button
          type="button"
          onClick={onClose}
          aria-label={t.detail.close}
          className="tap-target -me-2 -mt-2 grid place-items-center rounded-full text-muted-foreground hover:text-foreground"
        >
          <X className="size-5" />
        </button>
      </div>

      {feature.kind === "fire" ? (
        <FireBody feature={feature} />
      ) : (
        site && (
          <div className="mt-4 space-y-4">
            {photoUrl(site.photo_url) && (
              <img
                src={photoUrl(site.photo_url)!}
                alt={format(t.detail.photoAltPlanting, { wilaya: wilayaName(site.wilaya_code) })}
                loading="lazy"
                className="max-h-44 w-full rounded-xl object-cover md:max-h-52"
              />
            )}
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <Field label={t.detail.wilaya} value={wilayaName(site.wilaya_code)} />
              {site.commune && <Field label={t.detail.commune} value={site.commune} />}
              <Field label={t.detail.trees} value={String(site.tree_count)} />
              <Field label={t.detail.planted} value={formatDate(site.planted_date)} />
              {site.species && <Field label={t.detail.species} value={site.species} />}
              {site.planter_display_name && (
                <Field label={t.detail.by} value={site.planter_display_name} />
              )}
            </dl>
            {site.location_approximate && (
              <p className="rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
                {t.detail.wilayaLevelSite}
              </p>
            )}
            {site.notes && <p className="text-sm text-muted-foreground">{site.notes}</p>}

            {needsWater(site, careLogs) && (
              <p className="rounded-lg border border-care/40 bg-care/10 px-3 py-2 text-sm text-care">
                {t.detail.needsWaterNote}
              </p>
            )}

            <div>
              <p className="eyebrow">{t.detail.careTimeline}</p>
              <ol className="mt-2 space-y-2">
                <li className="flex items-center gap-2 text-sm">
                  <Sprout className="size-4 text-plant" />
                  <span>
                    {t.detail.plantedLabel} · {formatDate(site.planted_date)}
                  </span>
                </li>
                {logs.map((log) => (
                  <li key={log.id} className="flex items-center gap-2 text-sm">
                    <Droplets className="size-4 text-care" />
                    <span>
                      {actionLabel[log.action]} · {formatDate(log.logged_date)}
                      {log.submitter_name ? ` · ${log.submitter_name}` : ""}
                    </span>
                  </li>
                ))}
                {logs.length === 0 && (
                  <li className="text-sm text-muted-foreground">{t.detail.noCareYet}</li>
                )}
              </ol>
            </div>

            <div className="flex gap-2">
              <Button asChild variant="secondary" className="flex-1">
                <Link to="/care" search={{ site: site.id }}>
                  {t.detail.logCareForSite}
                </Link>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <a
                  href={directionsUrl(site.lat, site.lng)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Navigation className="size-4" />
                  {t.detail.directions}
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
  if (feature.kind === "fire") {
    return (
      <div className="flex items-center gap-2">
        <Flame className="size-5 text-fire" />
        <div>
          <p className="eyebrow">{t.detail.fireReport}</p>
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
          {feature.kind === "care" ? t.detail.careUpdate : t.detail.plantingSite}
        </p>
        <h2 className="text-lg font-semibold">{wilayaName(site.wilaya_code)}</h2>
      </div>
    </div>
  );
}

function FireBody({ feature }: { feature: Extract<MapFeature, { kind: "fire" }> }) {
  const { t, formatDate } = useI18n();
  const fire = feature.fire;
  const statusLabel: Record<string, string> = {
    active: t.receipt.statusActive,
    resolved: t.receipt.statusResolved,
    false_alarm: t.receipt.statusFalseAlarm,
  };
  const severityLabel: Record<string, string> = {
    small: t.detail.severitySmall,
    large: t.detail.severityLarge,
  };
  return (
    <div className="mt-4 space-y-4">
      {photoUrl(fire.photo_url) && (
        <img
          src={photoUrl(fire.photo_url)!}
          alt={t.detail.photoAltFire}
          loading="lazy"
          className="max-h-44 w-full rounded-xl object-cover md:max-h-52"
        />
      )}
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <Field label={t.detail.status} value={statusLabel[fire.status] ?? fire.status} />
        <Field label={t.detail.reported} value={formatDate(fire.created_at)} />
        {fire.severity && (
          <Field label={t.detail.severity} value={severityLabel[fire.severity] ?? fire.severity} />
        )}
        {fire.commune && <Field label={t.detail.commune} value={fire.commune} />}
      </dl>
      {fire.location_approximate && (
        <p className="rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
          {t.detail.wilayaLevelFire}
        </p>
      )}
      {fire.description && <p className="text-sm text-muted-foreground">{fire.description}</p>}
      <p className="rounded-lg border border-fire/40 bg-fire/10 px-3 py-2 text-sm">
        {t.detail.communityReport}
      </p>
      <Button asChild variant="outline" className="w-full">
        <a href={directionsUrl(fire.lat, fire.lng)} target="_blank" rel="noopener noreferrer">
          <Navigation className="size-4" />
          {t.detail.directionsToReport}
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
