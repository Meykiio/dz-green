import { Droplets } from "lucide-react";

import { needsWater, type CareLog, type Site } from "@/lib/types";
import { wilayaName } from "@/lib/wilayas";
import type { MapFeature } from "@/lib/types";

interface Props {
  sites: Site[];
  careLogs: CareLog[];
  onSelectFeature: (feature: MapFeature) => void;
}

/**
 * List view of recent approved plantings — the mobile fallback for visitors
 * the map frustrates (NNGroup: users reach for a list when a map gets hard).
 */
export function SiteList({ sites, careLogs, onSelectFeature }: Props) {
  const recent = [...sites]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 30);

  if (recent.length === 0) {
    return (
      <p className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
        Nothing planted yet — be the first.
      </p>
    );
  }

  return (
    <ul className="max-h-[70vh] space-y-2 overflow-y-auto rounded-xl border border-border bg-canvas p-2">
      {recent.map((site) => {
        const thirsty = needsWater(site, careLogs);
        return (
          <li key={site.id}>
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
          </li>
        );
      })}
    </ul>
  );
}
