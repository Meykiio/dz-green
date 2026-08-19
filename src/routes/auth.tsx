import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
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

function AuthPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin") {
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

  return (
    <AppShell>
      <FormShell
        title={mode === "signin" ? t.auth.signInTitle : t.auth.signUpTitle}
        intro={t.auth.intro}
        accent="plant"
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
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
          <label className="block">
            <span className="eyebrow">{t.auth.password}</span>
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
            {busy ? t.common.pleaseWait : mode === "signin" ? t.auth.signInBtn : t.auth.createBtn}
          </Button>
          <button
            type="button"
            className="w-full text-sm text-muted-foreground hover:text-foreground"
            onClick={() => setMode((m) => (m === "signin" ? "signup" : "signin"))}
          >
            {mode === "signin" ? t.auth.toSignUp : t.auth.toSignIn}
          </button>
        </form>
      </FormShell>
    </AppShell>
  );
}
