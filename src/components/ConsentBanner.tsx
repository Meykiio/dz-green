import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";
import { getAiConsent, setAiConsent, shouldShowConsent } from "@/lib/ai-consent";

/**
 * First-visit AI-training consent banner (Phase F). A small, honest banner
 * pinned to the bottom of the viewport — not a blocking modal. One tap to
 * accept or decline; both choices are respected and stored in localStorage
 * (no account needed). The privacy page carries the full AI-training line.
 */
export function ConsentBanner() {
  const { t } = useI18n();
  const [visible, setVisible] = useState(shouldShowConsent);
  const [choice, setChoice] = useState<"accepted" | "declined" | null>(getAiConsent());

  if (!visible) return null;

  const decide = (value: "accepted" | "declined") => {
    setAiConsent(value);
    setChoice(value);
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-label={t("consent.aria")}
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-lg rounded-2xl border border-border bg-card/95 p-4 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.2)] backdrop-blur md:inset-x-auto md:bottom-6 md:end-6"
    >
      <div className="flex items-start gap-3">
        <Sparkles className="mt-0.5 size-5 shrink-0 text-plant" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{t("consent.title")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("consent.body")}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            <Link to="/privacy" className="underline">
              {t("consent.privacyLink")}
            </Link>
          </p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={() => decide("accepted")} className="flex-1">
              {t("consent.accept")}
            </Button>
            <Button size="sm" variant="outline" onClick={() => decide("declined")} className="flex-1">
              {t("consent.decline")}
            </Button>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setVisible(false)}
          aria-label={t("consent.dismiss")}
          className="tap-target -me-1 -mt-1 grid shrink-0 place-items-center rounded-full text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
