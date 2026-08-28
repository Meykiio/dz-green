import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { FormShell, Honeypot } from "@/components/FormShell";
import { LocationField } from "@/components/LocationField";
import { PhotoInput } from "@/components/PhotoInput";
import { ReceiptLink } from "@/components/ReceiptLink";
import { Button } from "@/components/ui/button";
import { localizeError, ssrT, useI18n } from "@/i18n";
import { getDeviceSecret } from "@/lib/device";
import { submitFire } from "@/lib/submissions.functions";
import { submitResilient } from "@/lib/offline";

export const Route = createFileRoute("/fire")({
  head: () => ({
    meta: [
      { title: ssrT("meta.fireTitle") },
      { name: "description", content: ssrT("meta.fireDesc") },
      { property: "og:title", content: ssrT("meta.fireTitle") },
      { property: "og:description", content: ssrT("meta.fireDesc") },
    ],
  }),
  component: FirePage,
});

function FirePage() {
  const { t } = useI18n();
  const router = useRouter();
  const startedAt = useState(() => Date.now())[0];
  const [hp, setHp] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [wilaya, setWilaya] = useState("");
  const [commune, setCommune] = useState("");
  const [severity, setSeverity] = useState<"small" | "large" | "">("");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [done, setDone] = useState(false);

  const submit = useServerFn(submitFire);
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
            severity: severity || null,
            description: description || null,
            photo,
            reporter_name: name || null,
            reporter_phone: phone || null,
          },
        }),
      ),
    onSuccess: () => setDone(true),
    onError: (error: Error) => toast.error(localizeError(error.message ?? "")),
  });

  if (done) {
    return (
      <AppShell>
        <FormShell
          title={t("forms.fire.doneTitle")}
          intro={t("forms.fire.doneIntro")}
          accent="fire"
        >
          <div className="space-y-4">
            {mutation.data && mutation.data !== "queued" && mutation.data.receipt && (
              <ReceiptLink token={mutation.data.receipt} />
            )}
            <p className="text-xs text-muted-foreground">{t("forms.fire.donePublic")}</p>
            <Button onClick={() => router.navigate({ to: "/" })}>
              {t("chrome.shell.backToMap")}
            </Button>
          </div>
        </FormShell>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <FormShell title={t("forms.fire.title")} intro={t("forms.fire.intro")} accent="fire">
        <div className="mb-5 rounded-xl border border-fire/40 bg-fire/10 p-4 text-sm">
          <strong>{t("forms.fire.bannerCall")}</strong> {t("forms.fire.bannerBody")}
        </div>

        <form
          className="relative space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (!wilaya) {
              toast.error(t("forms.fire.missing"));
              return;
            }
            mutation.mutate();
          }}
        >
          <Honeypot value={hp} onChange={setHp} />
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

          <div>
            <span className="eyebrow">{t("forms.fire.howBig")}</span>
            <div className="mt-2 flex gap-2">
              {(["small", "large"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSeverity((s) => (s === value ? "" : value))}
                  aria-pressed={severity === value}
                  className={`tap-target flex-1 rounded-lg border px-4 py-2 text-sm font-medium ${
                    severity === value
                      ? "border-fire/60 bg-fire/15 text-fire"
                      : "border-border bg-card text-muted-foreground"
                  }`}
                >
                  {value === "small" ? t("forms.fire.small") : t("forms.fire.large")}
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="eyebrow">{t("forms.fire.whatYouSee")}</span>
            <textarea
              value={description}
              maxLength={600}
              rows={3}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full rounded-lg border border-input bg-card px-3 py-2 text-base"
            />
          </label>

          <PhotoInput value={photo} onChange={setPhoto} label={t("forms.fire.photo")} />

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="eyebrow">{t("forms.fire.name")}</span>
              <input
                value={name}
                maxLength={80}
                onChange={(e) => setName(e.target.value)}
                className="tap-target mt-1 w-full rounded-md border border-input bg-card px-3 py-2 text-base"
              />
            </label>
            <label className="block">
              <span className="eyebrow">{t("forms.fire.phone")}</span>
              <input
                type="tel"
                value={phone}
                maxLength={40}
                placeholder="05 XX XX XX XX"
                onChange={(e) => setPhone(e.target.value)}
                className="tap-target mt-1 w-full rounded-md border border-input bg-card px-3 py-2 text-base"
              />
              <span className="mt-1 block text-xs text-muted-foreground">
                {t("forms.fire.phoneHelper")}{" "}
                <Link to="/privacy" className="underline">
                  {t("forms.fire.whyWeAsk")}
                </Link>
              </span>
            </label>
          </div>

          <Button type="submit" size="lg" variant="destructive" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? t("forms.fire.sending") : t("forms.fire.submit")}
          </Button>
        </form>
      </FormShell>
    </AppShell>
  );
}