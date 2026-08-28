import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Droplets, Flame, Sprout } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { ssrT, useI18n } from "@/i18n";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { myFireReports } from "@/lib/activity.functions";
import { formatDate } from "@/lib/data";
import type { CareLog, FireReport, Site } from "@/lib/types";
import { wilayaName } from "@/lib/wilayas";

export const Route = createFileRoute("/_authenticated/activity")({
  head: () => ({
    meta: [
      { title: ssrT("meta.activityTitle") },
      { property: "og:title", content: ssrT("meta.activityTitle") },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ActivityPage,
});

const SITE_STATUS_KEY: Record<string, "pending" | "approved" | "rejected"> = {
  pending: "pending",
  approved: "approved",
  rejected: "rejected",
};

const STATUTS_TONE: Record<string, string> = {
  pending: "text-amber-400",
  approved: "text-plant",
  rejected: "text-fire",
  active: "text-fire",
  resolved: "text-care",
  false_alarm: "text-muted-foreground",
};

const CARE_ACTION_KEY: Record<string, "watered" | "checked" | "needsAttention" | "update"> = {
  watered: "watered",
  checked: "checked",
  needs_attention: "needsAttention",
  other: "update",
};

function ActivityPage() {
  const { t, count, formatDateShort } = useI18n();
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
        <p className="eyebrow">{t("moderation.act.eyebrow")}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          {t("moderation.act.heading")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("moderation.act.intro")}</p>

        {loading && (
          <div className="mt-8 space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-lg border border-border bg-card" />
            ))}
          </div>
        )}

        {failed && (
          <p className="mt-8 rounded-lg border border-fire/40 bg-fire/10 px-4 py-3 text-sm">
            {t("moderation.act.error")}
          </p>
        )}

        {!loading && !failed && (
          <div className="mt-8 space-y-10">
            <section>
              <SectionHeader
                icon={<Sprout className="size-4 text-plant" />}
                title={t("moderation.act.section.plantings")}
                count={sites.data?.length ?? 0}
              />
              {(sites.data ?? []).length === 0 ? (
                <Empty
                  text={t("moderation.act.empty.plantings")}
                  cta={{ to: "/plant", label: t("moderation.act.cta.plant") }}
                />
              ) : (
                <ul className="mt-3 space-y-2">
                  {sites.data!.map((s) => {
                    const stKey = SITE_STATUS_KEY[s.status] ?? s.status;
                    const stLabel = stKey
                      ? t(`moderation.act.status.${stKey}`) || s.status
                      : s.status;
                    return (
                      <li key={s.id} className="rounded-lg border border-border bg-card px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium">
                            {count(s.tree_count, "tree")}
                            {s.species ? ` · ${s.species}` : ""} ·{" "}
                            {t("moderation.act.inWilaya", { wilaya: wilayaName(s.wilaya_code) })}
                          </p>
                          <span className={`text-xs font-semibold ${STATUTS_TONE[s.status] ?? ""}`}>
                            {stLabel}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {t("home.list.planted", { date: formatDateShort(s.planted_date) })}
                          {s.location_approximate ? ` · ${t("home.list.wilayaLevel")}` : ""}
                          {s.commune ? ` · ${s.commune}` : ""}
                        </p>
                        {s.status === "rejected" && s.moderator_notes && (
                          <p className="mt-1.5 text-xs text-muted-foreground">
                            {t("moderation.act.note", { note: s.moderator_notes })}
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
                title={t("moderation.act.section.care")}
                count={care.data?.length ?? 0}
              />
              {(care.data ?? []).length === 0 ? (
                <Empty
                  text={t("moderation.act.empty.care")}
                  cta={{ to: "/care", label: t("moderation.act.cta.care") }}
                />
              ) : (
                <ul className="mt-3 space-y-2">
                  {care.data!.map((l) => (
                    <li key={l.id} className="rounded-lg border border-border bg-card px-4 py-3">
                      <p className="text-sm font-medium">
                        {t(`moderation.act.care.${CARE_ACTION_KEY[l.action] ?? "other"}`)}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatDateShort(l.logged_date)}
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
                title={t("moderation.act.section.fires")}
                count={fires.data?.length ?? 0}
              />
              {(fires.data ?? []).length === 0 ? (
                <Empty
                  text={t("moderation.act.empty.fires")}
                  cta={{ to: "/fire", label: t("moderation.act.cta.fire") }}
                />
              ) : (
                <ul className="mt-3 space-y-2">
                  {fires.data!.map((f) => {
                    return (
                      <li key={f.id} className="rounded-lg border border-border bg-card px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium">
                            {wilayaName(f.wilaya_code)}
                            {f.severity
                              ? ` · ${f.severity === "large" ? t("moderation.triage.large") : t("moderation.triage.small")}`
                              : ""}
                          </p>
                          <span className={`text-xs font-semibold ${STATUTS_TONE[f.status] ?? ""}`}>
                            {t(`moderation.triage.badge.${f.status === "false_alarm" ? "falseAlarm" : f.status}`)}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {t("home.list.reported", { date: formatDateShort(f.created_at) })}
                          {f.location_approximate ? ` · ${t("home.list.wilayaLevel")}` : ""}
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
