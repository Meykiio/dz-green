import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { HandHeart, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Honeypot } from "@/components/FormShell";
import { Button } from "@/components/ui/button";
import { localizeError, useI18n } from "@/i18n";
import { submitVolunteer } from "@/lib/volunteers.functions";
import { WILAYAS } from "@/lib/wilayas";

const INTENTS = [
  { value: "review", key: "review" },
  { value: "triage", key: "triage" },
  { value: "organize", key: "organize" },
  { value: "share", key: "share" },
] as const;

export function VolunteerForm() {
  const { t, locale } = useI18n();
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
    onError: (error: Error) =>
      toast.error(localizeError(error.message ?? "") || t("info.volunteerForm.toastError")),
  });

  if (done) {
    return (
      <div className="rounded-2xl border border-plant/40 bg-plant/10 p-6 text-center">
        <HandHeart className="mx-auto size-7 text-plant" />
        <p className="mt-2 font-semibold">{t("info.volunteerForm.doneTitle")}</p>
        <p className="mt-1 text-sm text-muted-foreground">{t("info.volunteerForm.doneBody")}</p>
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
          <span className="eyebrow">{t("info.volunteerForm.name")}</span>
          <input
            required
            value={name}
            maxLength={80}
            onChange={(e) => setName(e.target.value)}
            className="tap-target mt-1 w-full rounded-md border border-input bg-card px-3 py-2 text-base"
          />
        </label>
        <label className="block">
          <span className="eyebrow">{t("info.volunteerForm.email")}</span>
          <input
            type="email"
            required
            value={email}
            maxLength={200}
            placeholder={t("info.volunteerForm.emailPlaceholder")}
            onChange={(e) => setEmail(e.target.value)}
            className="tap-target mt-1 w-full rounded-md border border-input bg-card px-3 py-2 text-base"
          />
        </label>
      </div>
      <label className="block">
        <span className="eyebrow">{t("info.volunteerForm.phone")}</span>
        <input
          type="tel"
          value={phone}
          maxLength={40}
          placeholder={t("info.volunteerForm.phonePlaceholder")}
          onChange={(e) => setPhone(e.target.value)}
          className="tap-target mt-1 w-full rounded-md border border-input bg-card px-3 py-2 text-base"
        />
      </label>
      <label className="block">
        <span className="eyebrow">{t("info.volunteerForm.wilaya")}</span>
        <select
          required
          value={wilaya}
          onChange={(e) => setWilaya(e.target.value)}
          className="tap-target mt-1 w-full rounded-md border border-input bg-card px-3 py-2 text-base"
        >
          <option value="">{t("info.volunteerForm.chooseWilaya")}</option>
          {WILAYAS.map((w) => (
            <option key={w.code} value={w.code}>
              {w.code} — {locale === "ar" ? w.nameAr : w.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="eyebrow">{t("info.volunteerForm.extra")}</span>
        <input
          value={extra}
          maxLength={120}
          placeholder={t("info.volunteerForm.extraPlaceholder")}
          onChange={(e) => setExtra(e.target.value)}
          className="tap-target mt-1 w-full rounded-md border border-input bg-card px-3 py-2 text-base"
        />
      </label>
      <div>
        <span className="eyebrow">{t("info.volunteerForm.intents")}</span>
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
              {t(`info.volunteerForm.intent.${option.key}`)}
            </button>
          ))}
        </div>
      </div>
      <label className="block">
        <span className="eyebrow">{t("info.volunteerForm.time")}</span>
        <input
          value={availability}
          maxLength={120}
          placeholder={t("info.volunteerForm.timePlaceholder")}
          onChange={(e) => setAvailability(e.target.value)}
          className="tap-target mt-1 w-full rounded-md border border-input bg-card px-3 py-2 text-base"
        />
      </label>
      <label className="block">
        <span className="eyebrow">{t("info.volunteerForm.message")}</span>
        <textarea
          value={message}
          maxLength={600}
          rows={3}
          placeholder={t("info.volunteerForm.messagePlaceholder")}
          onChange={(e) => setMessage(e.target.value)}
          className="mt-1 w-full rounded-md border border-input bg-card px-3 py-2 text-base"
        />
      </label>
      <p className="text-xs text-muted-foreground">{t("info.volunteerForm.privacy")}</p>
      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={mutation.isPending || intents.length === 0}
      >
        {mutation.isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" /> {t("info.volunteerForm.sending")}
          </>
        ) : (
          t("info.volunteerForm.submit")
        )}
      </Button>
    </form>
  );
}
