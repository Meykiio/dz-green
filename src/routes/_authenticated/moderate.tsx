import { createFileRoute } from "@tanstack/react-router";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { ContactsPanel } from "@/components/moderator/ContactsPanel";
import { FireTriage } from "@/components/moderator/FireTriage";
import { ModTabs, type Section } from "@/components/moderator/ModTabs";
import { PendingQueue } from "@/components/moderator/PendingQueue";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n";
import { useModerationStats } from "@/lib/moderation";

const TITLE = "Moderation — Green Algeria";
const DESCRIPTION = "Review pending plantings, triage fire reports and manage alert contacts.";

export const Route = createFileRoute("/_authenticated/moderate")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ModeratePage,
});

function ModeratePage() {
  const { t, formatNumber } = useI18n();
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
        <p className="p-8 text-muted-foreground">{t.staff.moderate.checkingAccess}</p>
      </AppShell>
    );
  }

  if (!isModerator) return null;

  const sectionTitles: Record<Section, string> = {
    queue: t.staff.moderate.sectionQueue,
    fires: t.staff.moderate.sectionFires,
    contacts: t.staff.moderate.sectionContacts,
  };

  const counts = {
    queue: stats.data?.pending ?? 0,
    fires: stats.data?.activeFires ?? 0,
    contacts: stats.data?.contacts ?? 0,
  };

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight">{sectionTitles[section]}</h1>
          <ModTabs section={section} onSelect={setSection} counts={counts} />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat
            label={t.staff.moderate.statPending}
            value={stats.data?.pending}
            tone="text-plant"
            fmt={formatNumber}
          />
          <Stat
            label={t.staff.moderate.statApprovedToday}
            value={stats.data?.approvedToday}
            fmt={formatNumber}
          />
          <Stat
            label={t.staff.moderate.statActiveFires}
            value={stats.data?.activeFires}
            tone="text-fire"
            fmt={formatNumber}
          />
          <Stat
            label={t.staff.moderate.statTotal}
            value={stats.data?.totalSubmissions}
            fmt={formatNumber}
          />
        </div>

        <main className="mt-6">
          {section === "queue" && <PendingQueue />}
          {section === "fires" && <FireTriage />}
          {section === "contacts" && <ContactsPanel />}
        </main>
      </div>
    </AppShell>
  );
}

function Stat({
  label,
  value,
  tone,
  fmt,
}: {
  label: string;
  value: number | undefined;
  tone?: string;
  fmt: (n: number) => string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <p className={`text-2xl font-semibold tabular-nums ${tone ?? ""}`}>
        {value === undefined ? "—" : fmt(value)}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
