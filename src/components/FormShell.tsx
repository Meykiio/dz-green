import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

import { useI18n } from "@/i18n";

export function FormShell({
  title,
  intro,
  accent,
  children,
}: {
  title: string;
  intro: string;
  accent: "plant" | "care" | "fire";
  children: ReactNode;
}) {
  const { t, isRtl } = useI18n();
  const bar =
    accent === "plant" ? "bg-plant" : accent === "care" ? "bg-care" : "bg-fire";
  return (
    <div className="mx-auto w-full max-w-xl px-4 py-8">
      <Link
        to="/"
        className="tap-target inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        {isRtl ? <ArrowRight className="size-4" /> : <ArrowLeft className="size-4" />}{" "}
        {t("forms.backToMap")}
      </Link>
      <div className={`mt-4 h-1 w-16 rounded-full ${bar}`} />
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{intro}</p>
      <div className="mt-6 rounded-2xl border border-border bg-card p-4 md:p-6">
        {children}
      </div>
    </div>
  );
}

/** Hidden honeypot field — bots fill it, humans never see it. */
export function Honeypot({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
      <label>
        Website
        <input
          tabIndex={-1}
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
    </div>
  );
}