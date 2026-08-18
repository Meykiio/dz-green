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
import { getDeviceSecret } from "@/lib/device";
import { submitFire } from "@/lib/submissions.functions";
import { submitResilient } from "@/lib/offline";

const TITLE = "Report a wildfire — Green Algeria";
const DESCRIPTION =
  "Report a fire on Algeria's community map in seconds. This is not an emergency service — call Protection Civile on 14 or 1021 first.";

export const Route = createFileRoute("/fire")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: FirePage,
});

function FirePage() {
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
    onError: (error: Error) => toast.error(error.message || "Could not submit. Try again."),
  });

  if (done) {
    return (
      <AppShell>
        <FormShell
          title="Report posted"
          intro="Your report is live on the map now. If there is danger to people, call Protection Civile on 14 or 1021 — this platform does not dispatch help."
          accent="fire"
        >
          <div className="space-y-4">
            {mutation.data && mutation.data !== "queued" && mutation.data.receipt && (
              <ReceiptLink token={mutation.data.receipt} />
            )}
            <p className="text-xs text-muted-foreground">
              Public on the map: location, wilaya, severity, description and photo. Never public:
              your name and phone number — they stay on the server, unreachable from the map.
            </p>
            <Button onClick={() => router.navigate({ to: "/" })}>Back to the map</Button>
          </div>
        </FormShell>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <FormShell
        title="Report a fire"
        intro="Just the wilaya is enough — everything else is optional. Reports publish immediately."
        accent="fire"
      >
        <div className="mb-5 rounded-xl border border-fire/40 bg-fire/10 p-4 text-sm">
          <strong>Call Protection Civile first: 14 or 1021.</strong> Green Algeria
          is a community map, not an emergency service.
        </div>

        <form
          className="relative space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (!wilaya) {
              toast.error("Choose a wilaya first.");
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
            <span className="eyebrow">How big? (optional)</span>
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
                  {value === "small" ? "Small / starting" : "Large / spreading"}
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="eyebrow">What do you see? (optional)</span>
            <textarea
              value={description}
              maxLength={600}
              rows={3}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full rounded-lg border border-input bg-card px-3 py-2 text-base"
            />
          </label>

          <PhotoInput value={photo} onChange={setPhoto} label="Photo" />

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="eyebrow">Your name (optional)</span>
              <input
                value={name}
                maxLength={80}
                onChange={(e) => setName(e.target.value)}
                className="tap-target mt-1 w-full rounded-md border border-input bg-card px-3 py-2 text-base"
              />
            </label>
            <label className="block">
              <span className="eyebrow">Phone for moderators (optional, private)</span>
              <input
                type="tel"
                value={phone}
                maxLength={40}
                onChange={(e) => setPhone(e.target.value)}
                className="tap-target mt-1 w-full rounded-md border border-input bg-card px-3 py-2 text-base"
              />
            </label>
          </div>

          <Button type="submit" size="lg" variant="destructive" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? "Sending…" : "Post fire report"}
          </Button>
        </form>
      </FormShell>
    </AppShell>
  );
}