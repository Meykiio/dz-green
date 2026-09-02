import { useI18n } from "@/i18n";

/** Shared form bits for the announcements admin panel (extracted 2026-09-01). */

export type Kind = "info" | "success" | "warning";
export type Color = "ink" | "plant" | "care" | "fire" | "amber";

export interface AnnouncementFormState {
  title_ar: string;
  body_ar: string;
  title_en: string;
  body_en: string;
  title_fr: string;
  body_fr: string;
  kind: Kind;
  color: Color;
  speed_seconds: number;
}

export const EMPTY_ANNOUNCEMENT_FORM: AnnouncementFormState = {
  title_ar: "",
  body_ar: "",
  title_en: "",
  body_en: "",
  title_fr: "",
  body_fr: "",
  kind: "info",
  color: "ink",
  speed_seconds: 32,
};

export const SWATCH: Record<Color, string> = {
  ink: "bg-foreground",
  plant: "bg-plant",
  care: "bg-care",
  fire: "bg-fire",
  amber: "bg-amber-500",
};

export function formValid(f: AnnouncementFormState): boolean {
  return !!(
    f.title_ar.trim() &&
    f.body_ar.trim() &&
    f.title_en.trim() &&
    f.body_en.trim() &&
    f.title_fr.trim() &&
    f.body_fr.trim()
  );
}

export function KindPicker({ value, onChange }: { value: Kind; onChange: (k: Kind) => void }) {
  const { t } = useI18n();
  return (
    <div className="flex flex-wrap items-center gap-2">
      {(["info", "success", "warning"] as const).map((k) => (
        <button
          key={k}
          type="button"
          onClick={() => onChange(k)}
          aria-pressed={value === k}
          className={`tap-target rounded-full border px-3 py-1.5 text-xs font-medium ${
            value === k
              ? k === "warning"
                ? "border-fire/50 bg-fire/15 text-fire"
                : k === "success"
                  ? "border-plant/50 bg-plant/15 text-plant"
                  : "border-care/50 bg-care/15 text-care"
              : "border-border bg-card text-muted-foreground"
          }`}
        >
          {t(`moderation.adm.announce.kind.${k}`)}
        </button>
      ))}
    </div>
  );
}

export function ColorPicker({ value, onChange }: { value: Color; onChange: (c: Color) => void }) {
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-2" role="radiogroup" aria-label={t("moderation.adm.announce.color")}>
      {(Object.keys(SWATCH) as Color[]).map((c) => (
        <button
          key={c}
          type="button"
          role="radio"
          aria-checked={value === c}
          aria-label={t(`moderation.adm.announce.colors.${c}`)}
          onClick={() => onChange(c)}
          className={`size-7 rounded-full ${SWATCH[c]} transition-transform ${
            value === c ? "ring-2 ring-foreground ring-offset-2 ring-offset-background" : "opacity-60 hover:opacity-100"
          }`}
        />
      ))}
    </div>
  );
}

export function SpeedInput({
  form,
  setForm,
}: {
  form: AnnouncementFormState;
  setForm: (f: AnnouncementFormState) => void;
}) {
  const { t } = useI18n();
  return (
    <label className="flex items-center gap-2 text-xs text-muted-foreground">
      {t("moderation.adm.announce.speed")}
      <input
        type="number"
        min={10}
        max={120}
        value={form.speed_seconds}
        onChange={(e) =>
          setForm({ ...form, speed_seconds: Math.max(10, Math.min(120, Number(e.target.value) || 32)) })
        }
        className="tap-target w-16 rounded-md border border-input bg-card px-2 py-1.5 text-sm tabular-nums"
      />
      <span>{t("moderation.adm.announce.speedUnit")}</span>
    </label>
  );
}

function LangFields({
  side,
  title,
  body,
  dir,
  onTitle,
  onBody,
}: {
  side: string;
  title: string;
  body: string;
  dir: "rtl" | "ltr";
  onTitle: (v: string) => void;
  onBody: (v: string) => void;
}) {
  const { t } = useI18n();
  return (
    <div className="space-y-2" dir={dir}>
      <p className="eyebrow">{side}</p>
      <input
        value={title}
        maxLength={120}
        onChange={(e) => onTitle(e.target.value)}
        placeholder={t("moderation.adm.announce.titlePh")}
        className="tap-target w-full rounded-md border border-input bg-card px-3 py-2 text-base"
      />
      <textarea
        value={body}
        maxLength={600}
        rows={3}
        onChange={(e) => onBody(e.target.value)}
        placeholder={t("moderation.adm.announce.bodyPh")}
        className="w-full rounded-lg border border-input bg-card px-3 py-2 text-base"
      />
    </div>
  );
}

export function TrilingualFields({
  form,
  setForm,
}: {
  form: AnnouncementFormState;
  setForm: (f: AnnouncementFormState) => void;
}) {
  const { t } = useI18n();
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <LangFields
        side={t("moderation.adm.announce.arSide")}
        title={form.title_ar}
        body={form.body_ar}
        dir="rtl"
        onTitle={(v) => setForm({ ...form, title_ar: v })}
        onBody={(v) => setForm({ ...form, body_ar: v })}
      />
      <LangFields
        side={t("moderation.adm.announce.enSide")}
        title={form.title_en}
        body={form.body_en}
        dir="ltr"
        onTitle={(v) => setForm({ ...form, title_en: v })}
        onBody={(v) => setForm({ ...form, body_en: v })}
      />
      <LangFields
        side={t("moderation.adm.announce.frSide")}
        title={form.title_fr}
        body={form.body_fr}
        dir="ltr"
        onTitle={(v) => setForm({ ...form, title_fr: v })}
        onBody={(v) => setForm({ ...form, body_fr: v })}
      />
    </div>
  );
}
