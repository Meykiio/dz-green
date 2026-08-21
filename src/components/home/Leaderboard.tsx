import { Link } from "@tanstack/react-router";
import { Sprout, Trophy } from "lucide-react";
import { useMemo } from "react";

import type { Site } from "@/lib/types";
import { wilayaName } from "@/lib/wilayas";

/**
 * This month's wilaya race — approved plantings only, summed per wilaya,
 * reset on the 1st. No schema: computed from the already-loaded sites.
 */
export function Leaderboard({ sites }: { sites: Site[] }) {
  const ranked = useMemo(() => {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const totals = new Map<string, number>();
    for (const site of sites) {
      if (new Date(site.created_at) < monthStart) continue;
      totals.set(site.wilaya_code, (totals.get(site.wilaya_code) ?? 0) + site.tree_count);
    }
    return [...totals.entries()].sort((a, b) => b[1] - a[1]);
  }, [sites]);

  if (ranked.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <Trophy className="mx-auto size-8 text-muted-foreground" />
        <p className="mt-3 font-semibold">No plantings this month yet.</p>
        <p className="mt-1 text-sm text-muted-foreground">The first tree of the month could be yours.</p>
        <Link
          to="/plant"
          className="tap-target mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground transition-transform active:scale-[0.98]"
        >
          <Sprout className="size-5" /> I planted a tree
        </Link>
      </div>
    );
  }

  const [first, ...rest] = ranked;
  const total = ranked.reduce((sum, [, count]) => sum + count, 0);
  const max = first![1];

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="display-hero text-2xl">This month's race</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {total} {total === 1 ? "tree" : "trees"} across {ranked.length}{" "}
          {ranked.length === 1 ? "wilaya" : "wilayas"} — approved plantings only. Resets on the 1st.
        </p>
      </div>

      <div className="rounded-2xl border border-plant/40 bg-plant/10 p-5 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-plant">Leading</p>
        <p className="mt-1 text-xl font-bold">{wilayaName(first![0])}</p>
        <p className="text-3xl font-black tabular-nums text-plant">{first![1]}</p>
        <p className="text-xs text-muted-foreground">{first![1] === 1 ? "tree" : "trees"} this month</p>
      </div>

      {rest.length > 0 && (
        <ul className="space-y-2">
          {rest.map(([code, count], index) => (
            <li
              key={code}
              className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
            >
              <span className="w-6 shrink-0 text-center text-sm font-bold text-muted-foreground">
                {index + 2}
              </span>
              <span className="min-w-0 flex-1 truncate font-medium">{wilayaName(code)}</span>
              <span
                className="h-1.5 shrink-0 rounded-full bg-plant/60"
                style={{ width: `${Math.max(8, (count / max) * 80)}px` }}
              />
              <span className="shrink-0 text-sm font-semibold tabular-nums">{count}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
