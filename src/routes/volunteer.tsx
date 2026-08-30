import { createFileRoute, Link } from "@tanstack/react-router";
import { HandHeart } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { VolunteerForm } from "@/components/volunteer/VolunteerForm";
import { useAuth } from "@/hooks/useAuth";
import { ssrT, useI18n } from "@/i18n";

export const Route = createFileRoute("/volunteer")({
  head: () => ({
    meta: [
      { title: ssrT("meta.volunteerTitle") },
      { name: "description", content: ssrT("meta.volunteerDesc") },
      { property: "og:title", content: ssrT("meta.volunteerTitle") },
      { property: "og:description", content: ssrT("meta.volunteerDesc") },
    ],
  }),
  component: VolunteerPage,
});

function VolunteerPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  return (
    <AppShell>
      <article className="mx-auto w-full max-w-2xl px-4 py-10">
        <p className="text-xs text-muted-foreground">{t("info.volunteer.eyebrow")}</p>
        <h1 className="display-hero mt-2 text-3xl sm:text-4xl">{t("info.volunteer.hero")}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{t("info.volunteer.lead")}</p>

        <div className="mt-8 rounded-2xl border border-border bg-card p-5">
          <p className="font-semibold">{t("info.volunteer.whatTitle")}</p>
          <ul className="mt-2 list-disc space-y-1.5 ps-5 text-sm text-muted-foreground">
            <li>
              <span className="font-medium text-foreground">{t("info.volunteer.what.reviewTitle")}</span>
              {t("info.volunteer.what.reviewBody")}
            </li>
            <li>
              <span className="font-medium text-foreground">{t("info.volunteer.what.triageTitle")}</span>
              {t("info.volunteer.what.triageBody")}
            </li>
            <li>
              <span className="font-medium text-foreground">{t("info.volunteer.what.rallyTitle")}</span>
              {t("info.volunteer.what.rallyBody")}
            </li>
          </ul>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="font-semibold">{t("info.volunteer.askTitle")}</p>
            <p className="mt-1.5 text-sm text-muted-foreground">{t("info.volunteer.askBody")}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="font-semibold">{t("info.volunteer.neverTitle")}</p>
            <p className="mt-1.5 text-sm text-muted-foreground">{t("info.volunteer.neverBody")}</p>
          </div>
        </div>

        <div className="mt-10">
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <HandHeart className="size-5 text-plant" /> {t("info.volunteer.formTitle")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("info.volunteer.formLead")}</p>
          <p className="mt-1 text-sm font-medium text-plant">{t("info.volunteer.review24")}</p>
          <div className="mt-4">
            {user ? (
              <>
                <p className="mb-3 rounded-lg border border-plant/40 bg-plant/10 px-3 py-2 text-sm text-plant">
                  {t("info.volunteer.accountSignedIn", { email: user.email ?? "" })}
                </p>
                <VolunteerForm defaultEmail={user.email ?? ""} />
              </>
            ) : (
              <SignInToVolunteerCard />
            )}
          </div>
        </div>
      </article>
    </AppShell>
  );
}

/**
 * Simple account-first flow (2026-08-30): no auth-dependent spinner — the
 * button shows instantly for everyone. After sign-in/up, /auth sends the
 * visitor back here (?redirect=/volunteer) and the form appears.
 */
function SignInToVolunteerCard() {
  const { t } = useI18n();
  return (
    <div className="rounded-2xl border border-border bg-card p-5 text-center">
      <p className="font-semibold">{t("info.volunteer.signinTitle")}</p>
      <p className="mt-1.5 text-sm text-muted-foreground">{t("info.volunteer.signinBody")}</p>
      <Button asChild size="lg" className="mt-4 w-full">
        <Link to="/auth" search={{ redirect: "/volunteer", mode: "signup" }}>
          {t("info.volunteer.signinCta")}
        </Link>
      </Button>
    </div>
  );
}
