import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { AppShell } from "@/components/AppShell";
import { FormShell } from "@/components/FormShell";
import { Button } from "@/components/ui/button";
import { ssrT, useI18n } from "@/i18n";
import { supabase } from "@/integrations/supabase/client";

const searchSchema = z.object({
  redirect: z
    .string()
    .regex(/^\/[a-zA-Z0-9/_-]*$/)
    .optional(),
  mode: z.enum(["signin", "signup"]).optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: ssrT("meta.authTitle") },
      { name: "description", content: ssrT("meta.authDesc") },
      { property: "og:title", content: ssrT("meta.authTitle") },
      { property: "og:description", content: ssrT("meta.authDesc") },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { t } = useI18n();
  const router = useRouter();
  const { redirect, mode: initialMode } = Route.useSearch();
  const target = redirect ?? "/";
  const [mode, setMode] = useState<"signin" | "signup">(initialMode ?? "signin");
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
        void router.navigate({ to: target });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success(t("info.auth.toastOk"));
        setMode("signin");
      }
    } catch {
      // Neutral on purpose (audit 2026-08-28): raw Supabase messages differ
      // between "already registered" and "wrong credentials" — revealing
      // which emails have accounts is an enumeration side channel.
      toast.error(t("info.auth.genericAuthError"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <FormShell
        title={mode === "signin" ? t("info.auth.titleSignin") : t("info.auth.titleSignup")}
        intro={t("info.auth.intro")}
        accent="plant"
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="eyebrow">{t("info.auth.email")}</span>
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
            <span className="eyebrow">{t("info.auth.password")}</span>
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
              ? t("info.auth.wait")
              : mode === "signin"
                ? t("info.auth.signin")
                : t("info.auth.signup")}
          </Button>
          <button
            type="button"
            className="w-full text-sm text-muted-foreground hover:text-foreground"
            onClick={() => setMode((m) => (m === "signin" ? "signup" : "signin"))}
          >
            {mode === "signin" ? t("info.auth.toggleSignup") : t("info.auth.toggleSignin")}
          </button>
        </form>
      </FormShell>
    </AppShell>
  );
}