import { Droplets, Flame, Sprout } from "lucide-react";

import { formatDate, photoUrl } from "@/lib/data";
import { needsWater, type CareLog, type FireReport, type MapFeature, type Site } from "@/lib/types";
import { wilayaName } from "@/lib/wilayas";

const FIRE_STATUS: Record<FireReport["status"], string> = {
  active: "Active",
  resolved: "Resolved",
  false_alarm: "False alarm",
};

interface Props {
  sites: Site[];
  careLogs: CareLog[];
  fires: FireReport[];
  layers: { trees: boolean; fires: boolean };
  onSelectFeature: (feature: MapFeature) => void;
}

type Item =
  | { kind: "site"; date: string; site: Site }
  | { kind: "fire"; date: string; fire: FireReport };

/**
 * List view, rebuilt (2026-08-21): reports grouped by wilaya — section
 * headers with per-wilaya totals, photo-thumb rows inside. The map stays the
 * hero; this is the scannable fallback for visitors the map frustrates.
 */
export function SiteList({ sites, careLogs, fires, layers, onSelectFeature }: Props) {
  const items: Item[] = [
    ...(layers.trees
      ? sites.map((site) => ({ kind: "site" as const, date: site.created_at, site }))
      : []),
    ...(layers.fires
      ? fires.map((fire) => ({ kind: "fire" as const, date: fire.created_at, fire }))
      : []),
  ];

  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
        Nothing on the map yet — be the first.
      </p>
    );
  }

  // Group by wilaya; groups ordered by their most recent activity.
  const groups = new Map<string, Item[]>();
  for (const item of items.slice(0, 60)) {
    const code = item.kind === "site" ? item.site.wilaya_code : item.fire.wilaya_code;
    const list = groups.get(code) ?? [];
    list.push(item);
    groups.set(code, list);
  }
  const ordered = [...groups.entries()]
    .map(([code, list]) => ({
      code,
      list: list.sort((a, b) => b.date.localeCompare(a.date)),
    }))
    .sort((a, b) => b.list[0]!.date.localeCompare(a.list[0]!.date));

  return (
    <div className="space-y-4">
      {ordered.map(({ code, list }) => {
        const trees = list.reduce(
          (sum, item) => sum + (item.kind === "site" ? item.site.tree_count : 0),
          0,
        );
        const fireCount = list.filter((item) => item.kind === "fire").length;
        return (
          <section key={code} className="overflow-hidden rounded-xl border border-border bg-canvas">
            <header className="flex items-center justify-between border-b border-border bg-card px-4 py-2.5">
              <h2 className="text-sm font-semibold">{wilayaName(code)}</h2>
              <p className="text-xs text-muted-foreground">
                {trees > 0 && `${trees} ${trees === 1 ? "tree" : "trees"}`}
                {trees > 0 && fireCount > 0 && " · "}
                {fireCount > 0 && `${fireCount} ${fireCount === 1 ? "fire" : "fires"}`}
              </p>
            </header>
            <ul className="divide-y divide-border">
              {list.map((item) => (
                <li key={item.kind === "site" ? item.site.id : item.fire.id}>
                  {item.kind === "site" ? (
                    <SiteRow site={item.site} careLogs={careLogs} onSelectFeature={onSelectFeature} />
                  ) : (
                    <FireRow fire={item.fire} onSelectFeature={onSelectFeature} />
                  )}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
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
  const photo = photoUrl(site.photo_url);
  return (
    <button
      type="button"
      onClick={() => onSelectFeature({ kind: "site", site })}
      className="tap-target flex w-full items-center gap-3 bg-card px-4 py-3 text-left transition-colors hover:bg-plant/5"
    >
      {photo ? (
        <img
          src={photo}
          alt=""
          loading="lazy"
          className="size-12 shrink-0 rounded-lg object-cover"
        />
      ) : (
        <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-plant/15 text-plant">
          <Sprout className="size-5" />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">
          {site.tree_count} {site.tree_count === 1 ? "tree" : "trees"}
          {site.species ? ` · ${site.species}` : ""}
        </span>
        <span className="block text-xs text-muted-foreground">
          {site.commune ? `${site.commune} · ` : ""}planted {formatDate(site.planted_date)}
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
      className="tap-target flex w-full items-center gap-3 bg-card px-4 py-3 text-left transition-colors hover:bg-fire/5"
    >
      <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-fire/15 text-fire">
        <Flame className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">
          Fire{fire.severity ? ` · ${fire.severity}` : ""}
        </span>
        <span className="block text-xs text-muted-foreground">
          {fire.commune ? `${fire.commune} · ` : ""}reported {formatDate(fire.created_at)}
          {fire.location_approximate ? " · wilaya-level" : ""}
        </span>
      </span>
      <span
        className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-medium ${
          fire.status === "active" ? "bg-fire/15 text-fire" : "bg-muted text-muted-foreground"
        }`}
      >
        {FIRE_STATUS[fire.status]}
      </span>
    </button>
  );
}
