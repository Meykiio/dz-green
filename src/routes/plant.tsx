import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { FormShell, Honeypot } from "@/components/FormShell";
import { LocationField } from "@/components/LocationField";
import { PhotoInput } from "@/components/PhotoInput";
import { ReceiptLink } from "@/components/ReceiptLink";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";
import { getDeviceSecret } from "@/lib/device";
import { submitPlanting } from "@/lib/submissions.functions";
import { submitResilient } from "@/lib/offline";

const TITLE = "Log a tree planting — Green Algeria";
const DESCRIPTION =
  "Add the trees you planted to Algeria's public map: photo, exact location, species and count. No account needed.";

export const Route = createFileRoute("/plant")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: PlantPage,
});

function PlantPage() {
  const { t } = useI18n();
  const router = useRouter();
  const startedAt = useState(() => Date.now())[0];
  const [hp, setHp] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [wilaya, setWilaya] = useState("");
  const [commune, setCommune] = useState("");
  const [species, setSpecies] = useState("");
  const [count, setCount] = useState("1");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [name, setName] = useState("");
  const [done, setDone] = useState(false);

  const submit = useServerFn(submitPlanting);
  const mutation = useMutation({
    mutationFn: async () =>
      submitResilient(() =>
        submit({
          data: {
            hp,
            elapsedMs: Date.now() - startedAt,
            deviceSecret: getDeviceSecret(),
            lat,
            lng,
            wilaya_code: wilaya,
            commune: commune || null,
            photo: photo!,
            species: species || null,
            tree_count: Number(count),
            planted_date: date,
            notes: notes || null,
            planter_display_name: name || null,
          },
        }),
      ),
    onSuccess: () => setDone(true),
    onError: (error: Error) => toast.error(error.message || t.errGeneric),
  });

  if (done) {
    return (
      <AppShell>
        <FormShell title={t.plant.doneTitle} intro={t.plant.doneIntro} accent="plant">
          <div className="space-y-4">
            {mutation.data && mutation.data !== "queued" && mutation.data.receipt && (
              <ReceiptLink token={mutation.data.receipt} />
            )}
            <p className="text-xs text-muted-foreground">{t.plant.donePrivacy}</p>
            <div className="flex gap-2">
              <Button onClick={() => router.navigate({ to: "/" })}>{t.common.backToMap}</Button>
              <Button variant="secondary" onClick={() => window.location.reload()}>
                {t.plant.logAnother}
              </Button>
            </div>
          </div>
        </FormShell>
      </AppShell>
    );
  }

  const valid = photo && wilaya && Number(count) >= 1;

  return (
    <AppShell>
      <FormShell title={t.plant.title} intro={t.plant.intro} accent="plant">
        <form
          className="relative space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (!valid) {
              toast.error(t.plant.errPhotoWilaya);
              return;
            }
            mutation.mutate();
          }}
        >
          <Honeypot value={hp} onChange={setHp} />
          <PhotoInput value={photo} onChange={setPhoto} label={t.plant.photoLabel} required />
          <LocationField
            lat={lat}
            lng={lng}
            accuracy={accuracy}
            wilaya={wilaya}
            commune={commune}
            onLocation={(la, ln, acc) => {
              setLat(la);
              setLng(ln);
              setAccuracy(acc);
            }}
            onClearLocation={() => {
              setLat(null);
              setLng(null);
              setAccuracy(null);
            }}
            onWilaya={setWilaya}
            onCommune={setCommune}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="eyebrow">
                {t.plant.numTrees}
                {t.field.requiredMark}
              </span>
              <input
                type="number"
                min={1}
                max={100000}
                required
                value={count}
                onChange={(e) => setCount(e.target.value)}
                className="tap-target mt-1 w-full rounded-md border border-input bg-card px-3 py-2 text-base"
              />
            </label>
            <label className="block">
              <span className="eyebrow">
                {t.plant.datePlanted}
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
          </div>

          <label className="block">
            <span className="eyebrow">
              {t.plant.species}
              {t.field.optionalSuffix}
            </span>
            <input
              value={species}
              maxLength={120}
              placeholder={t.plant.speciesPlaceholder}
              onChange={(e) => setSpecies(e.target.value)}
              className="tap-target mt-1 w-full rounded-md border border-input bg-card px-3 py-2 text-base"
            />
          </label>

          <label className="block">
            <span className="eyebrow">
              {t.plant.notes}
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
              {t.plant.yourNameGroup}
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
            {mutation.isPending ? t.common.sending : t.plant.submit}
          </Button>
          <p className="text-xs text-muted-foreground">{t.plant.reviewNote}</p>
        </form>
      </FormShell>
    </AppShell>
  );
}
