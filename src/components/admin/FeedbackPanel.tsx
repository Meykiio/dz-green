import { useQuery } from "@tanstack/react-query";

import { adminListFeedback } from "@/lib/admin.functions";
import { formatDate } from "@/lib/data";

const KIND_META = {
  bug: { label: "Bug", classes: "bg-fire/15 text-fire" },
  idea: { label: "Idea", classes: "bg-care/15 text-care" },
  other: { label: "Other", classes: "bg-muted text-muted-foreground" },
} as const;

/** Read-only visitor feedback list (admin page). Latest 100 messages. */
export function FeedbackPanel() {
  const feedback = useQuery({
    queryKey: ["admin", "feedback"],
    queryFn: () => adminListFeedback(),
  });

  if (feedback.isLoading) {
    return <p className="mt-6 text-muted-foreground">Loading feedback…</p>;
  }
  if (feedback.isError) {
    return (
      <p className="mt-6 rounded-lg border border-fire/40 bg-fire/10 px-4 py-3 text-sm">
        Couldn't load feedback — refresh to try again.
      </p>
    );
  }
  if (!feedback.data?.length) {
    return <p className="mt-6 text-muted-foreground">No feedback yet.</p>;
  }

  return (
    <div className="mt-6 space-y-3">
      {feedback.data.map((f) => (
        <div key={f.id} className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <p className="whitespace-pre-wrap text-sm">{f.message}</p>
            <span
              className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${KIND_META[f.kind].classes}`}
            >
              {KIND_META[f.kind].label}
            </span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {formatDate(f.created_at)}
            {f.page ? ` · from ${f.page}` : ""}
          </p>
          {f.device ? (
            <p className="mt-1 truncate font-mono text-[11px] text-muted-foreground/70" title={f.device}>
              {f.device}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}