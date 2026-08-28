import { Link } from "@tanstack/react-router";
import { Copy } from "lucide-react";
import { useState } from "react";

import { useI18n } from "@/i18n";

/**
 * Receipt link shown once on a submission's success screen. The link is the
 * only way for an anonymous submitter to check their status later — there is
 * no account and no other lookup.
 */
export function ReceiptLink({ token }: { token: string }) {
  const { t, isRtl } = useI18n();
  const [copied, setCopied] = useState(false);
  const path = `/my/${token}`;
  const url = `${window.location.origin}${path}`;

  return (
    <div className={`rounded-lg border border-border bg-card p-4 ${isRtl ? "text-right" : "text-left"}`}>
      <p className="text-sm font-medium">{t("forms.receiptLink.heading")}</p>
      <p className="mt-1 text-sm text-muted-foreground">{t("forms.receiptLink.body")}</p>
      <div className="mt-3 flex items-center gap-2">
        <Link
          to="/my/$token"
          params={{ token }}
          className="min-w-0 flex-1 truncate rounded-md border border-border bg-background px-3 py-2 text-sm text-plant underline-offset-2 hover:underline"
        >
          {url}
        </Link>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard?.writeText(url).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            });
          }}
          className="tap-target grid size-10 shrink-0 place-items-center rounded-md border border-border text-muted-foreground hover:text-foreground"
          aria-label={t("forms.receiptLink.copy")}
        >
          <Copy className="size-4" />
        </button>
      </div>
      {copied && <p className="mt-1.5 text-xs text-plant">{t("forms.receiptLink.copied")}</p>}
    </div>
  );
}
