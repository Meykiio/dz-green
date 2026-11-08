import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { AppShell } from "@/components/AppShell";
import { FormShell, Honeypot } from "@/components/FormShell";
import { PhotoInput } from "@/components/PhotoInput";
import { StatusPicker } from "@/components/survival/StatusPicker";
import { Button } from "@/components/ui/button";
import { localizeError, ssrT, useI18n } from "@/i18n";
import { sitesQuery } from "@/lib/data";
import { todayLocalISO } from "@/lib/dates";
import { getDeviceSecret } from "@/lib/device";
import { submitResilient } from "@/lib/offline";
import { defaultAlive, type SurvivalStatus } from "@/lib/survival";
import { siteSurvivalStatusQuery } from "@/lib/survival-data";
import { submitSurvivalCheck } from "@/lib/survival.functions";
import { wilayaName } from "@/lib/wilayas";

const searchSchema = z.object({ site: z.string().uuid().optional().catch(undefined) });

export const Route = createFileRoute("/check")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: ssrT("meta.checkTitle") },
      { name: "description", content: ssrT("meta.checkDesc") },
    ],
  }),
  component: CheckPage,
});

const field = "tap-target mt-1 w-full rounded-md border border-input bg-card px-3 py-2 text-base";

function CheckPage() {
  const { t, count } = useI18n();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { site: initialSite } = Route.useSearch();
  const sites = useQuery(sitesQuery);
  // null = the survival migration is not applied yet: say so, don't fail.
  const live = useQuery(siteSurvivalStatusQuery);
  const startedAt = useState(() => Date.now())[0];
  // One id per form: a retried submit (offline queue) is recognised server-side.
  const requestId = useState(() => crypto.randomUUID())[0];

  const [hp, setHp] = useState("");
  const [siteId, setSiteId] = useState(initialSite ?? "");
  const [status, setStatus] = useState<SurvivalStatus>("alive");
  const [checked, setChecked] = useState(1);
  const [alive, setAlive] = useState(1);
  const [date, setDate] = useState(() => todayLocalISO());
  const [photo, setPhoto] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [name, setName] = useState("");
  const [done, setDone] = useState(false);

  const chosen = (sites.data ?? []).find((s) => s.id === siteId);
  const pickSite = (id: string) => {
    setSiteId(id);
    const site = (sites.data ?? []).find((s) => s.id === id);
    const n = Math.min(site?.tree_count ?? 1, 100000);
    setChecked(n);
    setAlive(defaultAlive(status, n));
  };

  const submit = useServerFn(submitSurvivalCheck);
  const mutation = useMutation({
    mutationFn: async () =>
      submitResilient(() =>
        submit({
          data: {
            hp,
            elapsedMs: Date.now() - startedAt,
            deviceSecret: getDeviceSecret(),
            site_id: siteId,
            status,
            trees_checked: checked,
            trees_alive: Math.min(alive, checked),
            photo: photo!,
            checked_date: date,
            notes: notes || null,
            submitter_name: name || null,
            client_request_id: requestId,
          },
        }),
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["survival_checks"] });
      setDone(true);
    },
    onError: (error: Error) => toast.error(localizeError(error.message ?? "")),
  });

  if (done) {
    return (
      <AppShell>
        <FormShell title={t("survival.doneTitle")} intro={t("survival.doneIntro")} accent="plant">
          <Button onClick={() => router.navigate({ to: "/" })}>{t("chrome.shell.backToMap")}</Button>
        </FormShell>
      </AppShell>
    );
  }

  const notLive = live.isSuccess && live.data === null;

  return (
    <AppShell>
      <FormShell title={t("survival.title")} intro={t("survival.intro")} accent="plant">
        {notLive ? (
          <p className="rounded-lg border border-border bg-card px-3 py-3 text-sm" role="status">
            {t("survival.notLive")}
          </p>
        ) : (
          <form
            className="relative space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (!siteId) return void toast.error(t("survival.missing"));
              if (!photo) return void toast.error(t("survival.photoRequired"));
              mutation.mutate();
            }}
          >
            <Honeypot value={hp} onChange={setHp} />

            <label className="block">
              <span className="eyebrow">{t("survival.site")}</span>
              <select required value={siteId} onChange={(e) => pickSite(e.target.value)} className={field}>
                <option value="">{t("survival.chooseSite")}</option>
                {(sites.data ?? []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.species || count(s.tree_count, "tree")} · {wilayaName(s.wilaya_code)}
                    {s.commune ? ` · ${s.commune}` : ""} · {s.planted_date}
                  </option>
                ))}
              </select>
            </label>

            <StatusPicker
              value={status}
              onChange={(s) => {
                setStatus(s);
                setAlive(defaultAlive(s, checked));
              }}
            />

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="eyebrow">{t("survival.treesChecked")}</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={chosen?.tree_count ?? 100000}
                  required
                  value={checked}
                  onChange={(e) => setChecked(Math.max(1, Number(e.target.value) || 1))}
                  className={field}
                />
              </label>
              <label className="block">
                <span className="eyebrow">{t("survival.treesAlive")}</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={checked}
                  required
                  value={alive}
                  onChange={(e) => setAlive(Math.max(0, Math.min(checked, Number(e.target.value) || 0)))}
                  className={field}
                />
              </label>
            </div>

            <label className="block">
              <span className="eyebrow">{t("survival.date")}</span>
              <input
                type="date"
                required
                max={todayLocalISO()}
                min={chosen?.planted_date}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={field}
              />
            </label>

            <PhotoInput value={photo} onChange={setPhoto} label={t("survival.photo")} />

            <label className="block">
              <span className="eyebrow">{t("survival.notes")}</span>
              <textarea
                value={notes}
                maxLength={600}
                rows={3}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-card px-3 py-2 text-base"
              />
            </label>

            <label className="block">
              <span className="eyebrow">{t("survival.name")}</span>
              <input value={name} maxLength={80} onChange={(e) => setName(e.target.value)} className={field} />
            </label>

            <p className="text-xs text-muted-foreground">{t("survival.independenceNote")}</p>

            <Button type="submit" size="lg" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? t("survival.sending") : t("survival.submit")}
            </Button>
          </form>
        )}
      </FormShell>
    </AppShell>
  );
}
