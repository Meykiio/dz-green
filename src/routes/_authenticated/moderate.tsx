import { createFileRoute } from "@tanstack/react-router";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { FireTriage } from "@/components/moderator/FireTriage";
import { ModTabs, type Section } from "@/components/moderator/ModTabs";
import { PendingQueue } from "@/components/moderator/PendingQueue";
import { RejectedQueue } from "@/components/moderator/RejectedQueue";
import { ssrT, useI18n } from "@/i18n";
import { useAuth } from "@/hooks/useAuth";
import { useModerationStats } from "@/lib/moderation";

const SECTION_KEY: Record<Section, string> = {
  queue: "moderation.mod.headingQueue",
  fires: "moderation.mod.headingFires",
  rejected: "moderation.mod.headingRejected",
};

export const Route = createFileRoute("/_authenticated/moderate")({
  head: () => ({
    meta: [
      { title: ssrT("meta.moderationTitle") },
      { name: "description", content: ssrT("meta.moderationDesc") },
      { property: "og:title", content: ssrT("meta.moderationTitle") },
      { property: "og:description", content: ssrT("meta.moderationDesc") },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ModeratePage,
});

function ModeratePage() {
  const { t } = useI18n();
  const { isModerator, loading } = useAuth();
  const navigate = useNavigate();
  const stats = useModerationStats(isModerator);
  const [section, setSection] = useState<Section>("queue");

  useEffect(() => {
    if (!loading && !isModerator) void navigate({ to: "/" });
  }, [loading, isModerator, navigate]);

  if (loading) {
    return (
      <AppShell>
        <p className="p-8 text-muted-foreground">{t("mod.mod.checking")}</p>
      </AppShell>
    );
  }

  if (!isModerator) return null;

  const counts = {
    queue: stats.data?.pending ?? 0,
    fires: stats.data?.activeFires ?? 0,
    rejected: stats.data?.rejected ?? 0,
  };

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight">{t(SECTION_KEY[section])}</h1>
          <ModTabs section={section} onSelect={setSection} counts={counts} />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label={t("moderation.mod.statPending")} value={stats.data?.pending} tone="text-plant" />
          <Stat label={t("moderation.mod.statApprovedToday")} value={stats.data?.approvedToday} />
          <Stat label={t("moderation.mod.statActiveFires")} value={stats.data?.activeFires} tone="text-fire" />
          <Stat label={t("moderation.mod.statTotal")} value={stats.data?.totalSubmissions} />
        </div>

        <main className="mt-6">
          {section === "queue" && <PendingQueue />}
          {section === "fires" && <FireTriage />}
          {section === "rejected" && <RejectedQueue />}
        </main>
      </div>
    </AppShell>
  );
}

function Stat({ label, value, tone }: { label: string; value: number | undefined; tone?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <p className={`text-2xl font-semibold tabular-nums ${tone ?? ""}`}>
        {value === undefined ? "—" : value.toLocaleString()}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
