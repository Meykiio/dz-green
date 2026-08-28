import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { ssrT, useI18n } from "@/i18n";
import { getReceipt } from "@/lib/submissions.functions";
import { wilayaName } from "@/lib/wilayas";

export const Route = createFileRoute("/my/$token")({
  head: () => ({
    meta: [
      { title: ssrT("meta.receiptTitle") },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ReceiptPage,
});

const STATUS_TONE: Record<string, string> = {
  pending: "text-amber-400",
  approved: "text-plant",
  published: "text-plant",
  rejected: "text-fire",
  active: "text-fire",
  resolved: "text-care",
  false_alarm: "text-muted-foreground",
};

function ReceiptPage() {
  const { token } = Route.useParams();
  const { t, formatDate } = useI18n();
  const receipt = useQuery({
    queryKey: ["receipt", token],
    queryFn: () => getReceipt({ data: { token } }),
    staleTime: 30_000,
  });

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-xl px-4 py-12">
        <p className="eyebrow">{t("info.receipt.eyebrow")}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{t("info.receipt.heading")}</h1>

        {receipt.isLoading && <p className="mt-6 text-muted-foreground">{t("info.receipt.checking")}</p>}

        {receipt.data === null && (
          <div className="mt-6 rounded-lg border border-border bg-card p-5">
            <p className="font-medium">{t("info.receipt.notFound")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("info.receipt.notFoundBody")}</p>
          </div>
        )}

        {receipt.data && (
          <div className="mt-6 space-y-4 rounded-lg border border-border bg-card p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium">
                {t(`info.receipt.kind.${receipt.data.kind}`) ||
                  t("info.receipt.kind.fallback")}
              </p>
              <p className={`text-sm font-semibold ${STATUS_TONE[receipt.data.status] ?? ""}`}>
                {t(`info.receipt.status.${receipt.data.status}`) || receipt.data.status}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              {t("info.receipt.submitted", {
                date: formatDate(receipt.data.createdAt, {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                }),
              })}
              {receipt.data.wilayaCode ? ` · ${wilayaName(receipt.data.wilayaCode)}` : ""}
            </p>
            {receipt.data.kind === "planting" && receipt.data.status === "pending" && (
              <p className="text-sm text-muted-foreground">{t("info.receipt.pendingMsg")}</p>
            )}
            {receipt.data.kind === "planting" && receipt.data.status === "approved" && (
              <p className="text-sm text-muted-foreground">{t("info.receipt.approvedMsg")}</p>
            )}
          </div>
        )}

        <div className="mt-6">
          <Link to="/">
            <Button variant="secondary">{t("info.receipt.back")}</Button>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
