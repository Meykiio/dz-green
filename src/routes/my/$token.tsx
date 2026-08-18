import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { getReceipt } from "@/lib/submissions.functions";
import { wilayaName } from "@/lib/wilayas";

const TITLE = "Your submission — Green Algeria";

export const Route = createFileRoute("/my/$token")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ReceiptPage,
});

const KIND_LABEL: Record<string, string> = {
  planting: "Tree planting",
  care: "Care log",
  fire: "Fire report",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Under review",
  approved: "Approved — on the map",
  rejected: "Not approved",
  published: "Published on the map",
  active: "Active",
  resolved: "Resolved",
  false_alarm: "Marked as false alarm",
};

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
  const receipt = useQuery({
    queryKey: ["receipt", token],
    queryFn: () => getReceipt({ data: { token } }),
    staleTime: 30_000,
  });

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-xl px-4 py-12">
        <p className="eyebrow">Receipt</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Your submission</h1>

        {receipt.isLoading && <p className="mt-6 text-muted-foreground">Checking…</p>}

        {receipt.data === null && (
          <div className="mt-6 rounded-lg border border-border bg-card p-5">
            <p className="font-medium">This link doesn't match any submission</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Receipt links are shown once, right after you submit. Check the link for typos — if
              you lost it, there is no way to recover it (we can't tell which submission was
              yours, and that's deliberate).
            </p>
          </div>
        )}

        {receipt.data && (
          <div className="mt-6 space-y-4 rounded-lg border border-border bg-card p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium">{KIND_LABEL[receipt.data.kind] ?? "Submission"}</p>
              <p className={`text-sm font-semibold ${STATUS_TONE[receipt.data.status] ?? ""}`}>
                {STATUS_LABEL[receipt.data.status] ?? receipt.data.status}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Submitted {new Date(receipt.data.createdAt).toLocaleDateString("en-DZ", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              {receipt.data.wilayaCode ? ` · ${wilayaName(receipt.data.wilayaCode)}` : ""}
            </p>
            {receipt.data.kind === "planting" && receipt.data.status === "pending" && (
              <p className="text-sm text-muted-foreground">
                A volunteer moderator will review it shortly. Check this page again later — it
                updates on its own.
              </p>
            )}
            {receipt.data.kind === "planting" && receipt.data.status === "approved" && (
              <p className="text-sm text-muted-foreground">
                It's live. Thank you — every tree on the map nudges the next person to plant one.
              </p>
            )}
          </div>
        )}

        <div className="mt-6">
          <Link to="/">
            <Button variant="secondary">Back to the map</Button>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
