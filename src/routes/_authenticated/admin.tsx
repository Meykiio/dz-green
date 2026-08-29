import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { AdminOverview } from "@/components/admin/AdminOverview";
import { AdminUsersPanel } from "@/components/admin/AdminUsersPanel";
import { FeedbackPanel } from "@/components/admin/FeedbackPanel";
import { VolunteerPanel } from "@/components/admin/VolunteerPanel";
import { cn } from "@/lib/utils";
import { ssrT, useI18n } from "@/i18n";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: ssrT("meta.adminTitle") },
      { property: "og:title", content: ssrT("meta.adminTitle") },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

type AdminTab = "overview" | "users" | "volunteers" | "feedback";
const TABS: { id: AdminTab; key: "overview" | "users" | "volunteers" | "feedback" }[] = [
  { id: "overview", key: "overview" },
  { id: "users", key: "users" },
  { id: "volunteers", key: "volunteers" },
  { id: "feedback", key: "feedback" },
];

function AdminPage() {
  const { t } = useI18n();
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<AdminTab>("overview");

  useEffect(() => {
    if (!loading && !isAdmin) void navigate({ to: "/" });
  }, [loading, isAdmin, navigate]);

  if (loading) {
    return (
      <AppShell>
        <p className="p-8 text-muted-foreground">{t("moderation.adm.checking")}</p>
      </AppShell>
    );
  }

  if (!isAdmin) return null;

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-5xl px-4 py-8">
        <p className="eyebrow">{t("moderation.adm.eyebrow")}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{t("moderation.adm.overview")}</h1>

        {/* Section tabs — no more endless single page (audit 2026-08-28). */}
        <div
          role="tablist"
          aria-label={t("moderation.adm.tabsAria")}
          className="mt-5 inline-flex max-w-full gap-1 overflow-x-auto rounded-full border border-border bg-card p-1"
        >
          {TABS.map(({ id, key }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(id)}
                className={cn(
                  "tap-target inline-flex shrink-0 items-center rounded-full px-4 py-2 text-sm font-medium transition-all active:scale-[0.98]",
                  active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t(`moderation.adm.tabs.${key}`)}
              </button>
            );
          })}
        </div>

        <main className="mt-4">
          {tab === "overview" && <AdminOverview />}
          {tab === "users" && <AdminUsersPanel />}
          {tab === "volunteers" && (
            <>
              <h2 className="mt-4 text-xl font-semibold tracking-tight">{t("moderation.adm.volunteers")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("moderation.adm.volunteersLead")}</p>
              <VolunteerPanel />
            </>
          )}
          {tab === "feedback" && (
            <>
              <h2 className="mt-4 text-xl font-semibold tracking-tight">{t("moderation.adm.feedback")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("moderation.adm.feedbackLead")}</p>
              <FeedbackPanel />
            </>
          )}
        </main>
      </div>
    </AppShell>
  );
}
