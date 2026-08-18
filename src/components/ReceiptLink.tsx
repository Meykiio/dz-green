import { Link } from "@tanstack/react-router";
import { Copy } from "lucide-react";
import { useState } from "react";

/**
 * Receipt link shown once on a submission's success screen. The link is the
 * only way for an anonymous submitter to check their status later — there is
 * no account and no other lookup.
 */
export function ReceiptLink({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);
  const path = `/my/${token}`;
  const url = `${window.location.origin}${path}`;

  return (
    <div className="rounded-lg border border-border bg-card p-4 text-left">
      <p className="text-sm font-medium">Save your receipt link</p>
      <p className="mt-1 text-sm text-muted-foreground">
        No account, no email — this private link is the only way to check your submission's status
        later. Bookmark it or copy it somewhere safe.
      </p>
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
          aria-label="Copy receipt link"
        >
          <Copy className="size-4" />
        </button>
      </div>
      {copied && <p className="mt-1.5 text-xs text-plant">Copied.</p>}
    </div>
  );
}
