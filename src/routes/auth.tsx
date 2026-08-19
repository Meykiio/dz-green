import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { FormShell } from "@/components/FormShell";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";
import { supabase } from "@/integrations/supabase/client";

const TITLE = "Moderator sign in — Green Algeria";
const DESCRIPTION =
  "Sign in to review planting submissions for Green Algeria. Contributing to the map never requires an account.";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup" | "recovery";

function AuthPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  // Arriving from a password-reset email fires PASSWORD_RECOVERY with a
  // temporary session; switch to the set-new-password form.
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setMode("recovery");
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function forgotPassword() {
    if (!email) {
      toast.error(t.auth.resetError);
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });
      if (error) throw error;
      toast.success(t.auth.resetSent);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t.auth.resetError);
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "recovery") {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        toast.success(t.auth.passwordUpdated);
        void router.navigate({ to: "/" });
      } else if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        void router.navigate({ to: "/" });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success(t.auth.created);
        setMode("signin");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t.auth.error);
    } finally {
      setBusy(false);
    }
  }

  const title =
    mode === "recovery"
      ? t.auth.recoveryHeading
      : mode === "signin"
        ? t.auth.signInTitle
        : t.auth.signUpTitle;
  const intro = mode === "recovery" ? t.auth.recoveryIntro : t.auth.intro;

  return (
    <AppShell>
      <FormShell title={title} intro={intro} accent="plant">
        <form className="space-y-4" onSubmit={handleSubmit}>
          {mode !== "recovery" && (
            <label className="block">
              <span className="eyebrow">{t.auth.email}</span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="tap-target mt-1 w-full rounded-md border border-input bg-card px-3 py-2 text-base"
              />
            </label>
          )}
          <label className="block">
            <span className="eyebrow">
              {mode === "recovery" ? t.auth.newPassword : t.auth.password}
            </span>
            <input
              type="password"
              required
              minLength={8}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="tap-target mt-1 w-full rounded-md border border-input bg-card px-3 py-2 text-base"
            />
          </label>
          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {busy
              ? t.common.pleaseWait
              : mode === "recovery"
                ? t.auth.updatePassword
                : mode === "signin"
                  ? t.auth.signInBtn
                  : t.auth.createBtn}
          </Button>

          {mode === "signin" && (
            <button
              type="button"
              className="w-full text-sm text-muted-foreground hover:text-foreground"
              onClick={() => void forgotPassword()}
              disabled={busy}
            >
              {t.auth.forgotPassword}
            </button>
          )}

          {mode !== "recovery" && (
            <button
              type="button"
              className="w-full text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setMode((m) => (m === "signin" ? "signup" : "signin"))}
            >
              {mode === "signin" ? t.auth.toSignUp : t.auth.toSignIn}
            </button>
          )}
        </form>
      </FormShell>
    </AppShell>
  );
}
