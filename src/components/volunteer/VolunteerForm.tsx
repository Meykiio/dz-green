import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { HandHeart, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Honeypot } from "@/components/FormShell";
import { Button } from "@/components/ui/button";
import { submitVolunteer } from "@/lib/volunteers.functions";
import { WILAYAS } from "@/lib/wilayas";

const INTENTS = [
  { value: "review", label: "Review plantings" },
  { value: "triage", label: "Triage fire reports" },
  { value: "organize", label: "Rally my area" },
  { value: "share", label: "Spread the word" },
] as const;

export function VolunteerForm() {
  const [hp, setHp] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [wilaya, setWilaya] = useState("");
  const [extra, setExtra] = useState("");
  const [intents, setIntents] = useState<string[]>(["review"]);
  const [availability, setAvailability] = useState("");
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);

  const submit = useServerFn(submitVolunteer);
  const mutation = useMutation({
    mutationFn: () =>
      submit({
        data: {
          hp,
          name,
          email,
          phone: phone || null,
          wilaya_code: wilaya,
          extra_wilayas: extra || null,
          intents: intents as ("review" | "triage" | "organize" | "share" | "other")[],
          availability: availability || null,
          message: message || null,
        },
      }),
    onSuccess: () => setDone(true),
    onError: (error: Error) => toast.error(error.message || "Could not send. Try again."),
  });

  if (done) {
    return (
      <div className="rounded-2xl border border-plant/40 bg-plant/10 p-6 text-center">
        <HandHeart className="mx-auto size-7 text-plant" />
        <p className="mt-2 font-semibold">Thank you — we've got it.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          We read every application and we'll reach out by email or WhatsApp. Until then, the
          best help is a true report: keep using the map.
        </p>
      </div>
    );
  }

  const toggleIntent = (value: string) =>
    setIntents((list) =>
      list.includes(value) ? list.filter((v) => v !== value) : [...list, value],
    );

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate();
      }}
    >
      <Honeypot value={hp} onChange={setHp} />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="eyebrow">Your name *</span>
          <input
            required
            value={name}
            maxLength={80}
            onChange={(e) => setName(e.target.value)}
            className="tap-target mt-1 w-full rounded-md border border-input bg-card px-3 py-2 text-base"
          />
        </label>
        <label className="block">
          <span className="eyebrow">Email *</span>
          <input
            type="email"
            required
            value={email}
            maxLength={200}
            placeholder="you@example.com"
            onChange={(e) => setEmail(e.target.value)}
            className="tap-target mt-1 w-full rounded-md border border-input bg-card px-3 py-2 text-base"
          />
        </label>
      </div>
      <label className="block">
        <span className="eyebrow">Phone / WhatsApp (so we can reach you quickly)</span>
        <input
          type="tel"
          value={phone}
          maxLength={40}
          placeholder="05 XX XX XX XX"
          onChange={(e) => setPhone(e.target.value)}
          className="tap-target mt-1 w-full rounded-md border border-input bg-card px-3 py-2 text-base"
        />
      </label>
      <label className="block">
        <span className="eyebrow">Your wilaya *</span>
        <select
          required
          value={wilaya}
          onChange={(e) => setWilaya(e.target.value)}
          className="tap-target mt-1 w-full rounded-md border border-input bg-card px-3 py-2 text-base"
        >
          <option value="">Choose your wilaya</option>
          {WILAYAS.map((w) => (
            <option key={w.code} value={w.code}>
              {w.code} — {w.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="eyebrow">Also happy to help elsewhere?</span>
        <input
          value={extra}
          maxLength={120}
          placeholder="e.g. Als also neighboring wilayas"
          onChange={(e) => setExtra(e.target.value)}
          className="tap-target mt-1 w-full rounded-md border border-input bg-card px-3 py-2 text-base"
        />
      </label>
      <div>
        <span className="eyebrow">I can help with (pick any) *</span>
        <div className="mt-2 flex flex-wrap gap-2">
          {INTENTS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => toggleIntent(option.value)}
              aria-pressed={intents.includes(option.value)}
              className={`tap-target rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                intents.includes(option.value)
                  ? "border-plant/50 bg-plant/10 text-plant"
                  : "border-border bg-card text-muted-foreground"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <label className="block">
        <span className="eyebrow">How much time do you have?</span>
        <input
          value={availability}
          maxLength={120}
          placeholder="e.g. 10 minutes, a few evenings a week"
          onChange={(e) => setAvailability(e.target.value)}
          className="tap-target mt-1 w-full rounded-md border border-input bg-card px-3 py-2 text-base"
        />
      </label>
      <label className="block">
        <span className="eyebrow">Anything you want us to know?</span>
        <textarea
          value={message}
          maxLength={600}
          rows={3}
          placeholder="Your town, your group, your motivation — anything"
          onChange={(e) => setMessage(e.target.value)}
          className="mt-1 w-full rounded-md border border-input bg-card px-3 py-2 text-base"
        />
      </label>
      <p className="text-xs text-muted-foreground">
        This form goes straight to the maintainers. Your details stay private — they are read
        only by us, never shown on the map.
      </p>
      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={mutation.isPending || intents.length === 0}
      >
        {mutation.isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" /> Sending…
          </>
        ) : (
          "Send my offer to help"
        )}
      </Button>
    </form>
  );
}
