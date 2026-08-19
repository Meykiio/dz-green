import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Droplets, Flame, Sprout } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n";
import { format } from "@/i18n/format";
import { supabase } from "@/integrations/supabase/client";
import { myFireReports } from "@/lib/activity.functions";
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

const SITE_TONE: Record<string, string> = {
  pending: "text-amber-400",
  approved: "text-plant",
  rejected: "text-fire",
};

const FIRE_TONE: Record<string, string> = {
  active: "text-fire",
  resolved: "text-care",
  false_alarm: "text-muted-foreground",
};

function ActivityPage() {
  const { t, formatDate } = useI18n();
  const { user } = useAuth();
  const userId = user?.id;

  const siteStatusLabel: Record<string, string> = {
    pending: t.activity.siteStatusPending,
    approved: t.activity.siteStatusApproved,
    rejected: t.activity.siteStatusRejected,
  };
  const fireStatusLabel: Record<string, string> = {
    active: t.activity.fireStatusActive,
    resolved: t.activity.fireStatusResolved,
    false_alarm: t.activity.fireStatusFalseAlarm,
  };
  const careLabel: Record<string, string> = {
    watered: t.activity.careWatered,
    checked: t.activity.careChecked,
    needs_attention: t.activity.careNeedsAttention,
    other: t.activity.careOther,
  };

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
        <p className="eyebrow">{t.activity.eyebrow}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{t.activity.heading}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t.activity.subtitle}</p>

        {loading && (
          <div className="mt-8 space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-lg border border-border bg-card" />
            ))}
          </div>
        )}

        {failed && (
          <p className="mt-8 rounded-lg border border-fire/40 bg-fire/10 px-4 py-3 text-sm">
            {t.activity.failed}
          </p>
        )}

        {!loading && !failed && (
          <div className="mt-8 space-y-10">
            <section>
              <SectionHeader
                icon={<Sprout className="size-4 text-plant" />}
                title={t.activity.plantings}
                count={sites.data?.length ?? 0}
              />
              {(sites.data ?? []).length === 0 ? (
                <Empty
                  text={t.activity.emptyPlantings}
                  cta={{ to: "/plant", label: t.activity.ctaPlant }}
                />
              ) : (
                <ul className="mt-3 space-y-2">
                  {sites.data!.map((s) => {
                    const label = siteStatusLabel[s.status] ?? s.status;
                    const tone = SITE_TONE[s.status] ?? "";
                    return (
                      <li key={s.id} className="rounded-lg border border-border bg-card px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium">
                            {s.tree_count}{" "}
                            {s.tree_count > 1 ? t.activity.treePlural : t.activity.treeSingular}
                            {s.species ? ` · ${s.species}` : ""}{" "}
                            {format(t.activity.inWilaya, { wilaya: wilayaName(s.wilaya_code) })}
                          </p>
                          <span className={`text-xs font-semibold ${tone}`}>{label}</span>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {format(t.activity.plantedOn, { date: formatDate(s.planted_date) })}
                          {s.location_approximate ? ` · ${t.activity.wilayaLevel}` : ""}
                          {s.commune ? ` · ${s.commune}` : ""}
                        </p>
                        {s.status === "rejected" && s.moderator_notes && (
                          <p className="mt-1.5 text-xs text-muted-foreground">
                            {format(t.activity.moderatorNote, { note: s.moderator_notes })}
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
                title={t.activity.careLogs}
                count={care.data?.length ?? 0}
              />
              {(care.data ?? []).length === 0 ? (
                <Empty
                  text={t.activity.emptyCare}
                  cta={{ to: "/care", label: t.activity.ctaCare }}
                />
              ) : (
                <ul className="mt-3 space-y-2">
                  {care.data!.map((l) => (
                    <li key={l.id} className="rounded-lg border border-border bg-card px-4 py-3">
                      <p className="text-sm font-medium">{careLabel[l.action] ?? l.action}</p>
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
                title={t.activity.fireReports}
                count={fires.data?.length ?? 0}
              />
              {(fires.data ?? []).length === 0 ? (
                <Empty
                  text={t.activity.emptyFire}
                  cta={{ to: "/fire", label: t.activity.ctaFire }}
                />
              ) : (
                <ul className="mt-3 space-y-2">
                  {fires.data!.map((f) => {
                    const label = fireStatusLabel[f.status] ?? f.status;
                    const tone = FIRE_TONE[f.status] ?? "";
                    return (
                      <li key={f.id} className="rounded-lg border border-border bg-card px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium">
                            {wilayaName(f.wilaya_code)}
                            {f.severity ? ` · ${f.severity}` : ""}
                          </p>
                          <span className={`text-xs font-semibold ${tone}`}>{label}</span>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {format(t.activity.reportedOn, { date: formatDate(f.created_at) })}
                          {f.location_approximate ? ` · ${t.activity.wilayaLevel}` : ""}
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
