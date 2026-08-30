import { createFileRoute, Link } from "@tanstack/react-router";
import { HandHeart, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { VolunteerForm } from "@/components/volunteer/VolunteerForm";
import { useAuth } from "@/hooks/useAuth";
import { ssrT, useI18n } from "@/i18n";
import { supabase } from "@/integrations/supabase/client";

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
  const { user, loading } = useAuth();
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
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : user ? (
              <>
                <p className="mb-3 rounded-lg border border-plant/40 bg-plant/10 px-3 py-2 text-sm text-plant">
                  {t("info.volunteer.accountSignedIn", { email: user.email ?? "" })}
                </p>
                <VolunteerForm defaultEmail={user.email ?? ""} />
              </>
            ) : (
              <AccountFirstCard />
            )}
          </div>
        </div>
      </article>
    </AppShell>
  );
}

/**
 * Account-first card (2026-08-29): volunteers sign up here, then the
 * application form appears with their email locked. Reviewed within 24h max;
 * if accepted they log in with THIS account as a moderator.
 */
function AccountFirstCard() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) throw error;
      setCreated(true);
    } catch {
      toast.error(t("info.auth.genericAuthError"));
    } finally {
      setBusy(false);
    }
  }

  if (created) {
    return (
      <div className="rounded-2xl border border-plant/40 bg-plant/10 p-5">
        <p className="font-semibold text-plant">{t("info.volunteer.accountCreated")}</p>
        <p className="mt-1 text-sm text-muted-foreground">{t("info.volunteer.accountCreatedBody")}</p>
        <div className="mt-4">
          <VolunteerForm defaultEmail={email} />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="font-semibold">{t("info.volunteer.accountTitle")}</p>
      <p className="mt-1.5 text-sm text-muted-foreground">{t("info.volunteer.accountBody")}</p>
      <form className="mt-4 space-y-3" onSubmit={handleSignup}>
        <label className="block">
          <span className="eyebrow">{t("info.auth.email")}</span>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="tap-target mt-1 w-full rounded-md border border-input bg-card px-3 py-2 text-base"
          />
        </label>
        <label className="block">
          <span className="eyebrow">{t("info.auth.password")}</span>
          <input
            required
            minLength={8}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="tap-target mt-1 w-full rounded-md border border-input bg-card px-3 py-2 text-base"
          />
        </label>
        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy ? t("info.auth.wait") : t("info.volunteer.accountCta")}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          <Link to="/auth" className="underline">
            {t("info.volunteer.accountHave")}
          </Link>
        </p>
      </form>
    </div>
  );
}
