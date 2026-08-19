import { Droplets, Flame } from "lucide-react";

import { formatDate } from "@/lib/data";
import { needsWater, type CareLog, type FireReport, type MapFeature, type Site } from "@/lib/types";
import { wilayaName } from "@/lib/wilayas";

const FIRE_STATUS: Record<FireReport["status"], string> = {
  active: "Active",
  resolved: "Resolved",
  false_alarm: "False alarm",
};

const SEVERITY: Record<NonNullable<FireReport["severity"]>, string> = {
  small: "Small",
  large: "Large",
};

interface Props {
  sites: Site[];
  careLogs: CareLog[];
  fires: FireReport[];
  layers: { trees: boolean; fires: boolean };
  onSelectFeature: (feature: MapFeature) => void;
}

type ListItem =
  | { kind: "site"; date: string; site: Site }
  | { kind: "fire"; date: string; fire: FireReport };

/**
 * List view of the recent reports — the mobile fallback for visitors the map
 * frustrates (NNGroup: users reach for a list when a map gets hard). Shows
 * plantings and fire reports, filtered by the same layer toggles as the map.
 */
export function SiteList({ sites, careLogs, fires, layers, onSelectFeature }: Props) {
  const items: ListItem[] = [
    ...(layers.trees
      ? sites.map((site) => ({ kind: "site" as const, date: site.created_at, site }))
      : []),
    ...(layers.fires
      ? fires.map((fire) => ({ kind: "fire" as const, date: fire.created_at, fire }))
      : []),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 30);

  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
        Nothing on the map yet — be the first.
      </p>
    );
  }

  return (
    <ul className="max-h-[70vh] space-y-2 overflow-y-auto rounded-xl border border-border bg-canvas p-2">
      {items.map((item) => (
        <li key={item.kind === "site" ? item.site.id : item.fire.id}>
          {item.kind === "site" ? (
            <SiteRow site={item.site} careLogs={careLogs} onSelectFeature={onSelectFeature} />
          ) : (
            <FireRow fire={item.fire} onSelectFeature={onSelectFeature} />
          )}
        </li>
      ))}
    </ul>
  );
}

function SiteRow({
  site,
  careLogs,
  onSelectFeature,
}: {
  site: Site;
  careLogs: CareLog[];
  onSelectFeature: (feature: MapFeature) => void;
}) {
  const thirsty = needsWater(site, careLogs);
  return (
    <button
      type="button"
      onClick={() => onSelectFeature({ kind: "site", site })}
      className="tap-target flex w-full items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-left hover:border-plant/40"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-plant/15 text-sm font-semibold text-plant">
        {site.tree_count}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">
          {site.species || "Trees"} in {wilayaName(site.wilaya_code)}
        </span>
        <span className="block text-xs text-muted-foreground">
          {site.commune ? `${site.commune} · ` : ""}planted {site.planted_date}
          {site.location_approximate ? " · wilaya-level" : ""}
        </span>
      </span>
      {thirsty && (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-care/15 px-2.5 py-1 text-xs font-medium text-care">
          <Droplets className="size-3.5" /> Needs water
        </span>
      )}
    </button>
  );
}

function FireRow({
  fire,
  onSelectFeature,
}: {
  fire: FireReport;
  onSelectFeature: (feature: MapFeature) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelectFeature({ kind: "fire", fire })}
      className="tap-target flex w-full items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-left hover:border-fire/40"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-fire/15 text-fire">
        <Flame className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">
          Fire in {wilayaName(fire.wilaya_code)}
        </span>
        <span className="block text-xs text-muted-foreground">
          {fire.commune ? `${fire.commune} · ` : ""}reported {formatDate(fire.created_at)}
          {fire.location_approximate ? " · wilaya-level" : ""}
        </span>
      </span>
      <span
        className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
          fire.status === "active"
            ? "bg-fire/15 text-fire"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {FIRE_STATUS[fire.status]}
        {fire.severity ? ` · ${SEVERITY[fire.severity]}` : ""}
      </span>
    </button>
  );
}