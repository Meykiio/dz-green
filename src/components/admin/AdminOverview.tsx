import { useQuery } from "@tanstack/react-query";

import { adminStats } from "@/lib/admin.functions";
import { wilayaName } from "@/lib/wilayas";

/** Platform-wide stats + per-wilaya moderation load for the admin dashboard. */
export function AdminOverview() {
  const stats = useQuery({ queryKey: ["admin", "stats"], queryFn: () => adminStats() });

  if (stats.isLoading) {
    return <p className="text-muted-foreground">Loading platform stats…</p>;
  }
  if (stats.isError || !stats.data) {
    return (
      <p className="rounded-lg border border-fire/40 bg-fire/10 px-4 py-3 text-sm">
        Couldn't load platform stats — refresh to try again.
      </p>
    );
  }
  const s = stats.data;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Users" value={s.users} />
        <Stat label="Pending" value={s.sites.pending} tone="text-amber-400" />
        <Stat label="Approved" value={s.sites.approved} tone="text-plant" />
        <Stat label="Active fires" value={s.fires.active} tone="text-fire" />
        <Stat label="Care logs" value={s.careLogs} tone="text-care" />
        <Stat label="Submissions (24h)" value={s.submissionsToday} />
      </div>

      <div>
        <p className="eyebrow">Wilaya oversight</p>
        {s.wilayas.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Nothing pending anywhere — every queue is clear.
          </p>
        ) : (
          <ul className="mt-2 space-y-1.5">
            {s.wilayas.map((w) => (
              <li
                key={w.code}
                className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-2.5 text-sm"
              >
                <span className="font-medium">{wilayaName(w.code)}</span>
                <span className="text-muted-foreground">
                  {w.pending > 0 && <span className="text-amber-400">{w.pending} pending</span>}
                  {w.pending > 0 && w.activeFires > 0 && " · "}
                  {w.activeFires > 0 && <span className="text-fire">{w.activeFires} active fire{w.activeFires > 1 ? "s" : ""}</span>}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <p className={`text-2xl font-semibold tabular-nums ${tone ?? ""}`}>
        {value.toLocaleString()}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
