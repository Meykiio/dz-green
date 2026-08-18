import { createFileRoute } from "@tanstack/react-router";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { ContactsPanel } from "@/components/moderator/ContactsPanel";
import { FireTriage } from "@/components/moderator/FireTriage";
import { ModTabs, type Section } from "@/components/moderator/ModTabs";
import { PendingQueue } from "@/components/moderator/PendingQueue";
import { useAuth } from "@/hooks/useAuth";
import { useModerationStats } from "@/lib/moderation";

const TITLE = "Moderation — Green Algeria";
const DESCRIPTION =
  "Review pending plantings, triage fire reports and manage alert contacts.";

const SECTION_TITLES: Record<Section, string> = {
  queue: "Pending plantings",
  fires: "Fire reports",
  contacts: "Alert contacts",
};

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
        <p className="p-8 text-muted-foreground">Checking your access…</p>
      </AppShell>
    );
  }

  if (!isModerator) return null;

  const counts = {
    queue: stats.data?.pending ?? 0,
    fires: stats.data?.activeFires ?? 0,
    contacts: stats.data?.contacts ?? 0,
  };

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight">
            {SECTION_TITLES[section]}
          </h1>
          <ModTabs section={section} onSelect={setSection} counts={counts} />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Pending" value={stats.data?.pending} tone="text-plant" />
          <Stat label="Approved today" value={stats.data?.approvedToday} />
          <Stat label="Active fires" value={stats.data?.activeFires} tone="text-fire" />
          <Stat label="Total submissions" value={stats.data?.totalSubmissions} />
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
