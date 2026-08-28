import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { adminListVolunteers, adminSetVolunteerStatus } from "@/lib/admin.functions";
import { formatDate } from "@/lib/data";
import { wilayaName } from "@/lib/wilayas";

const STATUS_META = {
  new: { label: "New", classes: "bg-plant/15 text-plant" },
  contacted: { label: "Contacted", classes: "bg-care/15 text-care" },
  onboarded: { label: "Onboarded", classes: "bg-muted text-muted-foreground" },
} as const;

const INTENT_LABELS: Record<string, string> = {
  review: "Review plantings",
  triage: "Triage fire reports",
  organize: "Rally my area",
  share: "Spread the word",
  other: "Other",
};

/** Volunteer applications (admin page): PII is service-role only, read here. */
export function VolunteerPanel() {
  const queryClient = useQueryClient();
  const volunteers = useQuery({
    queryKey: ["admin", "volunteers"],
    queryFn: () => adminListVolunteers(),
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "new" | "contacted" | "onboarded" }) =>
      adminSetVolunteerStatus({ data: { id, status } }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["admin", "volunteers"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  if (volunteers.isLoading) {
    return <p className="mt-6 text-muted-foreground">Loading volunteers…</p>;
  }
  if (volunteers.isError) {
    return (
      <p className="mt-6 rounded-lg border border-fire/40 bg-fire/10 px-4 py-3 text-sm">
        Couldn't load volunteers — refresh to try again.
      </p>
    );
  }
  if (!volunteers.data?.length) {
    return (
      <p className="mt-6 text-muted-foreground">
        No volunteers yet. Share the volunteer page — it takes a minute.
      </p>
    );
  }

  return (
    <div className="mt-6 space-y-3">
      {volunteers.data.map((v) => (
        <div key={v.id} className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium">
                {v.name}
                <span className="font-normal text-muted-foreground"> · {wilayaName(v.wilaya_code)}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                {v.email}
                {v.phone ? ` · ${v.phone}` : ""} · applied {formatDate(v.created_at)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_META[v.status].classes}`}
              >
                {STATUS_META[v.status].label}
              </span>
              <select
                value={v.status}
                onChange={(e) =>
                  setStatus.mutate({ id: v.id, status: e.target.value as "new" | "contacted" | "onboarded" })
                }
                disabled={setStatus.isPending}
                aria-label="Volunteer status"
                className="rounded-md border border-border bg-background px-2 py-1 text-xs"
              >
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="onboarded">Onboarded</option>
              </select>
            </div>
          </div>
          {v.extra_wilayas && (
            <p className="mt-1 text-xs text-muted-foreground">Also: {v.extra_wilayas}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {v.intents.split(",").map((intent) => (
              <span
                key={intent}
                className="inline-flex rounded-full bg-plant/10 px-2.5 py-0.5 text-xs font-medium text-plant"
              >
                {INTENT_LABELS[intent] ?? intent}
              </span>
            ))}
          </div>
          {(v.availability || v.message) && (
            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
              {v.availability && <p>Time: {v.availability}</p>}
              {v.message && <p className="whitespace-pre-wrap">{v.message}</p>}
            </div>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            To onboard: make sure the person has an account, then assign the moderator role +
            wilaya in “Moderators & roles”.
          </p>
        </div>
      ))}
    </div>
  );
}
