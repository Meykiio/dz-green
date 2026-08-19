import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { AppShell } from "@/components/AppShell";
import { FormShell, Honeypot } from "@/components/FormShell";
import { PhotoInput } from "@/components/PhotoInput";
import { ReceiptLink } from "@/components/ReceiptLink";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";
import { format } from "@/i18n/format";
import { sitesQuery } from "@/lib/data";
import { getDeviceSecret } from "@/lib/device";
import { submitCare } from "@/lib/submissions.functions";
import { submitResilient } from "@/lib/offline";
import { wilayaName } from "@/lib/wilayas";

const TITLE = "Log care for a planting — Green Algeria";
const DESCRIPTION =
  "Watered or checked on a planting site? Log it so everyone can see which trees are still being looked after.";

const searchSchema = z.object({ site: z.string().uuid().optional() });

export const Route = createFileRoute("/care")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: CarePage,
});

const ACTIONS = [
  { value: "watered", key: "actionWatered" },
  { value: "checked", key: "actionChecked" },
  { value: "needs_attention", key: "actionNeedsAttention" },
  { value: "other", key: "actionOther" },
] as const;

function CarePage() {
  const { t } = useI18n();
  const router = useRouter();
  const { site: initialSite } = Route.useSearch();
  const sites = useQuery(sitesQuery);
  const startedAt = useState(() => Date.now())[0];

  const [hp, setHp] = useState("");
  const [siteId, setSiteId] = useState(initialSite ?? "");
  const [action, setAction] = useState<(typeof ACTIONS)[number]["value"]>("watered");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [done, setDone] = useState(false);

  const submit = useServerFn(submitCare);
  const mutation = useMutation({
    mutationFn: async () =>
      submitResilient(() =>
        submit({
          data: {
            hp,
            elapsedMs: Date.now() - startedAt,
            deviceSecret: getDeviceSecret(),
            site_id: siteId,
            action,
            submitter_name: name || null,
            photo,
            notes: notes || null,
            logged_date: date,
          },
        }),
      ),
    onSuccess: () => setDone(true),
    onError: (error: Error) => toast.error(error.message || t.errGeneric),
  });

  if (done) {
    return (
      <AppShell>
        <FormShell title={t.care.doneTitle} intro={t.care.doneIntro} accent="care">
          <div className="space-y-4">
            {mutation.data && mutation.data !== "queued" && mutation.data.receipt && (
              <ReceiptLink token={mutation.data.receipt} />
            )}
            <Button onClick={() => router.navigate({ to: "/" })}>{t.common.backToMap}</Button>
          </div>
        </FormShell>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <FormShell title={t.care.title} intro={t.care.intro} accent="care">
        <form
          className="relative space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (!siteId) {
              toast.error(t.care.errChooseSite);
              return;
            }
            mutation.mutate();
          }}
        >
          <Honeypot value={hp} onChange={setHp} />

          <label className="block">
            <span className="eyebrow">
              {t.care.site}
              {t.field.requiredMark}
            </span>
            <select
              required
              value={siteId}
              onChange={(e) => setSiteId(e.target.value)}
              className="tap-target mt-1 w-full rounded-md border border-input bg-card px-3 py-2 text-base"
            >
              <option value="">{t.care.chooseSite}</option>
              {(sites.data ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.species || format(t.care.optionTrees, { count: s.tree_count })} ·{" "}
                  {wilayaName(s.wilaya_code)}
                  {s.commune ? ` · ${s.commune}` : ""}
                </option>
              ))}
            </select>
            {sites.data?.length === 0 && (
              <span className="mt-1 block text-sm text-muted-foreground">{t.care.noSites}</span>
            )}
          </label>

          <div>
            <span className="eyebrow">
              {t.care.whatDidYouDo}
              {t.field.requiredMark}
            </span>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {ACTIONS.map((a) => (
                <button
                  key={a.value}
                  type="button"
                  onClick={() => setAction(a.value)}
                  aria-pressed={action === a.value}
                  className={`tap-target rounded-lg border px-3 py-2 text-sm font-medium ${
                    action === a.value
                      ? "border-care/60 bg-care/15 text-care"
                      : "border-border bg-card text-muted-foreground"
                  }`}
                >
                  {t.care[a.key]}
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="eyebrow">
              {t.care.date}
              {t.field.requiredMark}
            </span>
            <input
              type="date"
              required
              max={new Date().toISOString().slice(0, 10)}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="tap-target mt-1 w-full rounded-md border border-input bg-card px-3 py-2 text-base"
            />
          </label>

          <PhotoInput value={photo} onChange={setPhoto} label={t.care.photoLabel} />

          <label className="block">
            <span className="eyebrow">
              {t.care.notes}
              {t.field.optionalSuffix}
            </span>
            <textarea
              value={notes}
              maxLength={1000}
              rows={3}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-card px-3 py-2 text-base"
            />
          </label>

          <label className="block">
            <span className="eyebrow">
              {t.care.yourName}
              {t.field.optionalSuffix}
            </span>
            <input
              value={name}
              maxLength={80}
              onChange={(e) => setName(e.target.value)}
              className="tap-target mt-1 w-full rounded-md border border-input bg-card px-3 py-2 text-base"
            />
          </label>

          <Button type="submit" size="lg" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? t.common.sending : t.care.submit}
          </Button>
        </form>
      </FormShell>
    </AppShell>
  );
}
