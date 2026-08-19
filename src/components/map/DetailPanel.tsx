import { Droplets, Flame, Navigation, Sprout, X } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { formatDate, photoUrl } from "@/lib/data";
import { directionsUrl } from "@/lib/maps-link";
import { needsWater, type CareLog } from "@/lib/types";
import { wilayaName } from "@/lib/wilayas";

import type { MapFeature } from "@/lib/types";

const ACTION_LABEL: Record<CareLog["action"], string> = {
  watered: "Watered",
  checked: "Checked",
  needs_attention: "Needs attention",
  other: "Update",
};

export function DetailPanel({
  feature,
  careLogs,
  onClose,
}: {
  feature: MapFeature;
  careLogs: CareLog[];
  onClose: () => void;
}) {
  const site = feature.kind === "fire" ? null : feature.site ?? null;
  const logs = site ? careLogs.filter((l) => l.site_id === site.id) : [];

  return (
    <aside
      className="glass-panel fixed inset-x-0 bottom-0 z-40 max-h-[72vh] overflow-y-auto overflow-x-hidden rounded-t-xl p-5 md:inset-auto md:top-24 md:end-6 md:max-h-[76vh] md:w-[400px] md:rounded-xl"
      aria-label="Details"
    >
      <div className="flex items-start justify-between gap-3">
        <Header feature={feature} />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close details"
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
                alt={`Planting in ${wilayaName(site.wilaya_code)}`}
                loading="lazy"
                className="max-h-44 w-full rounded-xl object-cover md:max-h-52"
              />
            )}
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <Field label="Wilaya" value={wilayaName(site.wilaya_code)} />
              {site.commune && <Field label="Commune" value={site.commune} />}
              <Field label="Trees" value={String(site.tree_count)} />
              <Field label="Planted" value={formatDate(site.planted_date)} />
              {site.species && <Field label="Species" value={site.species} />}
              {site.planter_display_name && <Field label="By" value={site.planter_display_name} />}
            </dl>
            {site.location_approximate && (
              <p className="rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
                Wilaya-level location — the reporter didn't drop an exact pin, so the marker sits
                at the wilaya's centre, not the real spot.
              </p>
            )}
            {site.notes && <p className="text-sm text-muted-foreground">{site.notes}</p>}

            {needsWater(site, careLogs) && (
              <p className="rounded-lg border border-care/40 bg-care/10 px-3 py-2 text-sm text-care">
                No care logged in the last 14 days — this site may need water.
              </p>
            )}

            <div>
              <p className="eyebrow">Care timeline</p>
              <ol className="mt-2 space-y-2">
                <li className="flex items-center gap-2 text-sm">
                  <Sprout className="size-4 text-plant" />
                  <span>Planted · {formatDate(site.planted_date)}</span>
                </li>
                {logs.map((log) => (
                  <li key={log.id} className="flex items-center gap-2 text-sm">
                    <Droplets className="size-4 text-care" />
                    <span>
                      {ACTION_LABEL[log.action]} · {formatDate(log.logged_date)}
                      {log.submitter_name ? ` · ${log.submitter_name}` : ""}
                    </span>
                  </li>
                ))}
                {logs.length === 0 && (
                  <li className="text-sm text-muted-foreground">No care logged yet.</li>
                )}
              </ol>
            </div>

            <div className="flex gap-2">
              <Button asChild variant="secondary" size="sm" className="min-w-0 flex-1 whitespace-normal text-center leading-tight">
                <Link to="/care" search={{ site: site.id }}>
                  Log care for this site
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="min-w-0 flex-1 whitespace-normal text-center leading-tight">
                <a
                  href={directionsUrl(site.lat, site.lng)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Navigation className="size-4" />
                  Directions
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
  if (feature.kind === "fire") {
    return (
      <div className="flex items-center gap-2">
        <Flame className="size-5 text-fire" />
        <div>
          <p className="eyebrow">Fire report</p>
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
        <p className="eyebrow">{feature.kind === "care" ? "Care update" : "Planting site"}</p>
        <h2 className="text-lg font-semibold">{wilayaName(site.wilaya_code)}</h2>
      </div>
    </div>
  );
}

function FireBody({ feature }: { feature: Extract<MapFeature, { kind: "fire" }> }) {
  const fire = feature.fire;
  return (
    <div className="mt-4 space-y-4">
      {photoUrl(fire.photo_url) && (
        <img
          src={photoUrl(fire.photo_url)!}
          alt="Reported fire"
          loading="lazy"
          className="max-h-44 w-full rounded-xl object-cover md:max-h-52"
        />
      )}
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <Field label="Status" value={fire.status.replace("_", " ")} />
        <Field label="Reported" value={formatDate(fire.created_at)} />
        {fire.severity && <Field label="Severity" value={fire.severity} />}
        {fire.commune && <Field label="Commune" value={fire.commune} />}
      </dl>
      {fire.location_approximate && (
        <p className="rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
          Wilaya-level location — no exact pin was dropped, so the marker sits at the wilaya's
          centre.
        </p>
      )}
      {fire.description && <p className="text-sm text-muted-foreground">{fire.description}</p>}
      <p className="rounded-lg border border-fire/40 bg-fire/10 px-3 py-2 text-sm">
        Community report — not an emergency service. For immediate danger call Protection Civile
        (14) or 1021.
      </p>
      <Button asChild variant="outline" className="w-full">
        <a
          href={directionsUrl(fire.lat, fire.lng)}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Navigation className="size-4" />
          Directions to this report
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