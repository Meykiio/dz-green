import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Check, HelpCircle, ThumbsDown, ThumbsUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";
import { getDeviceSecret } from "@/lib/device";
import { getFireCounts, getMyVote, submitFireVote } from "@/lib/confirmations.functions";
import type { Verdict } from "@/lib/confirmations.server";

/**
 * Community confirmation on a fire report (Phase E): "I see it / I don't /
 * Not sure" vote buttons, live counts, and a community-verified badge when
 * 3+ yes votes and >70% yes ratio. One vote per device per report (re-vote
 * replaces). Distance and trust weighting are server-side follow-ups.
 */
export function FireConfirmations({ fireReportId }: { fireReportId: string }) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [pending, setPending] = useState<Verdict | null>(null);

  const counts = useQuery({
    queryKey: ["fire-counts", fireReportId],
    queryFn: () => getFireCounts({ data: { fireReportId } }),
    staleTime: 15_000,
  });

  const myVote = useQuery({
    queryKey: ["my-vote", fireReportId],
    queryFn: () => getMyVote({ data: { fireReportId, deviceSecret: getDeviceSecret() } }),
    staleTime: 15_000,
  });

  const vote = async (verdict: Verdict) => {
    setPending(verdict);
    try {
      await submitFireVote({ data: { fireReportId, verdict, deviceSecret: getDeviceSecret() } });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["fire-counts", fireReportId] }),
        queryClient.invalidateQueries({ queryKey: ["my-vote", fireReportId] }),
      ]);
    } finally {
      setPending(null);
    }
  };

  const c = counts.data;
  const verified = c?.community_verified ?? false;
  const current = myVote.data ?? null;

  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <p className="eyebrow flex items-center gap-1.5">
          <BadgeCheck className="size-3.5 text-plant" />
          {t("confirm.title")}
        </p>
        {verified && (
          <span className="inline-flex items-center gap-1 rounded-full border border-plant/40 bg-plant/10 px-2 py-0.5 text-xs font-semibold text-plant">
            <BadgeCheck className="size-3" />
            {t("confirm.verified")}
          </span>
        )}
      </div>

      <div className="mt-2 grid grid-cols-3 gap-2">
        <VoteButton
          icon={<ThumbsUp className="size-4" />}
          label={t("confirm.yes")}
          active={current === "yes"}
          busy={pending === "yes"}
          onClick={() => void vote("yes")}
        />
        <VoteButton
          icon={<ThumbsDown className="size-4" />}
          label={t("confirm.no")}
          active={current === "no"}
          busy={pending === "no"}
          onClick={() => void vote("no")}
        />
        <VoteButton
          icon={<HelpCircle className="size-4" />}
          label={t("confirm.unsure")}
          active={current === "unsure"}
          busy={pending === "unsure"}
          onClick={() => void vote("unsure")}
        />
      </div>

      {c && (c.conf_yes + c.conf_no + c.conf_unsure > 0) && (
        <p className="mt-2 text-xs text-muted-foreground">
          {t("confirm.counts", { yes: c.conf_yes, no: c.conf_no, unsure: c.conf_unsure })}
        </p>
      )}
      <p className="mt-1 text-xs text-muted-foreground">{t("confirm.note")}</p>
    </div>
  );
}

function VoteButton({
  icon,
  label,
  active,
  busy,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  busy: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant={active ? "default" : "outline"}
      disabled={busy}
      onClick={onClick}
      aria-pressed={active}
      className="flex items-center justify-center gap-1.5 whitespace-normal text-center leading-tight"
    >
      {busy ? <Check className="size-4 animate-pulse" /> : icon}
      {label}
    </Button>
  );
}
