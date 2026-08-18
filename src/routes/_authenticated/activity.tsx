import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Droplets, Flame, Sprout } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { myFireReports } from "@/lib/activity.functions";
import { formatDate } from "@/lib/data";
import type { CareLog, FireReport, Site } from "@/lib/types";
import { wilayaName } from "@/lib/wilayas";

const TITLE = "My activity — Green Algeria";

export const Route = createFileRoute("/_authenticated/activity")({
  head: () => ({
    meta: [
      { title: TITLE },
      { property: "og:title", content: TITLE },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ActivityPage,
});

const SITE_STATUS: Record<string, { label: string; tone: string }> = {
  pending: { label: "Under review", tone: "text-amber-400" },
  approved: { label: "On the map", tone: "text-plant" },
  rejected: { label: "Not approved", tone: "text-fire" },
};

const FIRE_STATUS: Record<string, { label: string; tone: string }> = {
  active: { label: "Active", tone: "text-fire" },
  resolved: { label: "Resolved", tone: "text-care" },
  false_alarm: { label: "False alarm", tone: "text-muted-foreground" },
};

const CARE_LABEL: Record<string, string> = {
  watered: "Watered",
  checked: "Checked on it",
  needs_attention: "Reported needs attention",
  other: "Update",
};

function ActivityPage() {
  const { user } = useAuth();
  const userId = user?.id;

  const sites = useQuery({
    queryKey: ["activity", "sites", userId],
    enabled: !!userId,
    queryFn: async (): Promise<Site[]> => {
      const { data, error } = await supabase
        .from("sites")
        .select(
          "id,lat,lng,wilaya_code,location_approximate,commune,photo_url,species,tree_count,planted_date,notes,planter_display_name,status,created_at,moderator_notes",
        )
        .eq("user_id", userId!)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as Site[];
    },
  });

  const care = useQuery({
    queryKey: ["activity", "care", userId],
    enabled: !!userId,
    queryFn: async (): Promise<CareLog[]> => {
      const { data, error } = await supabase
        .from("care_logs")
        .select("id,site_id,action,submitter_name,photo_url,notes,logged_date,created_at")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as CareLog[];
    },
  });

  const fires = useQuery({
    queryKey: ["activity", "fires", userId],
    enabled: !!userId,
    // Server function: fire_reports.user_id is not column-granted to clients
    // (PII protection), so the server filters by the caller's token instead.
    queryFn: async (): Promise<FireReport[]> => (await myFireReports()) as FireReport[],
  });

  const loading = sites.isLoading || care.isLoading || fires.isLoading;
  const failed = sites.isError || care.isError || fires.isError;

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-3xl px-4 py-8">
        <p className="eyebrow">My activity</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Everything you've added to the map
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your plantings, care logs and fire reports — including the ones still in review.
        </p>

        {loading && (
          <div className="mt-8 space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-lg border border-border bg-card" />
            ))}
          </div>
        )}

        {failed && (
          <p className="mt-8 rounded-lg border border-fire/40 bg-fire/10 px-4 py-3 text-sm">
            Couldn't load your activity — check your connection and refresh.
          </p>
        )}

        {!loading && !failed && (
          <div className="mt-8 space-y-10">
            <section>
              <SectionHeader
                icon={<Sprout className="size-4 text-plant" />}
                title="Plantings"
                count={sites.data?.length ?? 0}
              />
              {(sites.data ?? []).length === 0 ? (
                <Empty text="No plantings yet." cta={{ to: "/plant", label: "Plant your first tree" }} />
              ) : (
                <ul className="mt-3 space-y-2">
                  {sites.data!.map((s) => {
                    const st = SITE_STATUS[s.status] ?? { label: s.status, tone: "" };
                    return (
                      <li key={s.id} className="rounded-lg border border-border bg-card px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium">
                            {s.tree_count} {s.tree_count > 1 ? "trees" : "tree"}
                            {s.species ? ` · ${s.species}` : ""} in {wilayaName(s.wilaya_code)}
                          </p>
                          <span className={`text-xs font-semibold ${st.tone}`}>{st.label}</span>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          planted {formatDate(s.planted_date)}
                          {s.location_approximate ? " · wilaya-level" : ""}
                          {s.commune ? ` · ${s.commune}` : ""}
                        </p>
                        {s.status === "rejected" && s.moderator_notes && (
                          <p className="mt-1.5 text-xs text-muted-foreground">
                            Moderator note: {s.moderator_notes}
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section>
              <SectionHeader
                icon={<Droplets className="size-4 text-care" />}
                title="Care logs"
                count={care.data?.length ?? 0}
              />
              {(care.data ?? []).length === 0 ? (
                <Empty text="No care logged yet." cta={{ to: "/care", label: "Log care for a site" }} />
              ) : (
                <ul className="mt-3 space-y-2">
                  {care.data!.map((l) => (
                    <li key={l.id} className="rounded-lg border border-border bg-card px-4 py-3">
                      <p className="text-sm font-medium">{CARE_LABEL[l.action] ?? l.action}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatDate(l.logged_date)}
                        {l.notes ? ` · ${l.notes}` : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <SectionHeader
                icon={<Flame className="size-4 text-fire" />}
                title="Fire reports"
                count={fires.data?.length ?? 0}
              />
              {(fires.data ?? []).length === 0 ? (
                <Empty text="No fire reports." cta={{ to: "/fire", label: "Report a fire" }} />
              ) : (
                <ul className="mt-3 space-y-2">
                  {fires.data!.map((f) => {
                    const st = FIRE_STATUS[f.status] ?? { label: f.status, tone: "" };
                    return (
                      <li key={f.id} className="rounded-lg border border-border bg-card px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium">
                            {wilayaName(f.wilaya_code)}
                            {f.severity ? ` · ${f.severity}` : ""}
                          </p>
                          <span className={`text-xs font-semibold ${st.tone}`}>{st.label}</span>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          reported {formatDate(f.created_at)}
                          {f.location_approximate ? " · wilaya-level" : ""}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function SectionHeader({
  icon,
  title,
  count,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
}) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <h2 className="text-lg font-semibold">{title}</h2>
      <span className="text-sm text-muted-foreground">({count})</span>
    </div>
  );
}

function Empty({ text, cta }: { text: string; cta: { to: string; label: string } }) {
  return (
    <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-dashed border-border px-4 py-4">
      <p className="text-sm text-muted-foreground">{text}</p>
      <Link to={cta.to}>
        <Button size="sm" variant="secondary">
          {cta.label}
        </Button>
      </Link>
    </div>
  );
}
