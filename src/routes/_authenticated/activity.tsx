import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/AppShell";
import { ActivitySections } from "@/components/activity/ActivitySections";
import { ssrT, useI18n } from "@/i18n";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { myFireReports } from "@/lib/activity.functions";
import type { CareLog, FireReport, Site } from "@/lib/types";

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

// Only the data fetching and the loading/error shell live here; the three
// sections moved to ActivitySections (2026-09-01, 250-line split).
function ActivityPage() {
  const { t } = useI18n();
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
          <ActivitySections sites={sites.data ?? []} care={care.data ?? []} fires={fires.data ?? []} />
        )}
      </div>
    </AppShell>
  );
}
