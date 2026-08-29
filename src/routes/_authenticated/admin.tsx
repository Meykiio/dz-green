import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { HandHeart, LayoutDashboard, MessageSquareText, Users } from "lucide-react";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { AdminOverview } from "@/components/admin/AdminOverview";
import { AdminUsersPanel } from "@/components/admin/AdminUsersPanel";
import { FeedbackPanel } from "@/components/admin/FeedbackPanel";
import { VolunteerPanel } from "@/components/admin/VolunteerPanel";
import { SectionTabs } from "@/components/SectionTabs";
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="eyebrow">{t("moderation.adm.eyebrow")}</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              {t(`moderation.adm.tabs.${tab}`)}
            </h1>
          </div>
          <SectionTabs
            ariaLabel={t("moderation.adm.tabsAria")}
            active={tab}
            onSelect={setTab}
            tabs={[
              { id: "overview", label: t("moderation.adm.tabs.overview"), icon: LayoutDashboard },
              { id: "users", label: t("moderation.adm.tabs.users"), icon: Users },
              { id: "volunteers", label: t("moderation.adm.tabs.volunteers"), icon: HandHeart },
              { id: "feedback", label: t("moderation.adm.tabs.feedback"), icon: MessageSquareText },
            ]}
          />
        </div>

        <main className="mt-4">
          {tab === "overview" && <AdminOverview />}
          {tab === "users" && <AdminUsersPanel />}
          {tab === "volunteers" && (
            <>
              <p className="mt-2 text-sm text-muted-foreground">{t("moderation.adm.volunteersLead")}</p>
              <VolunteerPanel />
            </>
          )}
          {tab === "feedback" && (
            <>
              <p className="mt-2 text-sm text-muted-foreground">{t("moderation.adm.feedbackLead")}</p>
              <FeedbackPanel />
            </>
          )}
        </main>
      </div>
    </AppShell>
  );
}
