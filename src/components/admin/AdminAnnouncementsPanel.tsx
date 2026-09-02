import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Megaphone, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useI18n, localizeError } from "@/i18n";
import {
  adminCreateAnnouncement,
  adminDeleteAnnouncement,
  adminListAnnouncements,
  adminSetAnnouncementActive,
  adminUpdateAnnouncement,
  type AdminAnnouncement,
} from "@/lib/admin.functions";

type Kind = "info" | "success" | "warning";
type Color = "ink" | "plant" | "care" | "fire" | "amber";

interface FormState {
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

const EMPTY: FormState = { title_ar: "", body_ar: "", title_en: "", body_en: "", title_fr: "", body_fr: "", kind: "info", color: "ink", speed_seconds: 32 };

const SWATCH: Record<Color, string> = {
  ink: "bg-foreground",
  plant: "bg-plant",
  care: "bg-care",
  fire: "bg-fire",
  amber: "bg-amber-500",
};

function KindPicker({ value, onChange }: { value: Kind; onChange: (k: Kind) => void }) {
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

function ColorPicker({ value, onChange }: { value: Color; onChange: (c: Color) => void }) {
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

function SpeedInput({ form, setForm }: { form: FormState; setForm: (f: FormState) => void }) {
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

function BilingualFields({ form, setForm }: { form: FormState; setForm: (f: FormState) => void }) {
  const { t } = useI18n();
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="space-y-2" dir="rtl">
        <p className="eyebrow">{t("moderation.adm.announce.arSide")}</p>
        <input
          value={form.title_ar}
          maxLength={120}
          onChange={(e) => setForm({ ...form, title_ar: e.target.value })}
          placeholder={t("moderation.adm.announce.titlePh")}
          className="tap-target w-full rounded-md border border-input bg-card px-3 py-2 text-base"
        />
        <textarea
          value={form.body_ar}
          maxLength={600}
          rows={3}
          onChange={(e) => setForm({ ...form, body_ar: e.target.value })}
          placeholder={t("moderation.adm.announce.bodyPh")}
          className="w-full rounded-lg border border-input bg-card px-3 py-2 text-base"
        />
      </div>
      <div className="space-y-2" dir="ltr">
        <p className="eyebrow">{t("moderation.adm.announce.enSide")}</p>
        <input
          value={form.title_en}
          maxLength={120}
          onChange={(e) => setForm({ ...form, title_en: e.target.value })}
          placeholder={t("moderation.adm.announce.titlePh")}
          className="tap-target w-full rounded-md border border-input bg-card px-3 py-2 text-base"
        />
        <textarea
          value={form.body_en}
          maxLength={600}
          rows={3}
          onChange={(e) => setForm({ ...form, body_en: e.target.value })}
          placeholder={t("moderation.adm.announce.bodyPh")}
          className="w-full rounded-lg border border-input bg-card px-3 py-2 text-base"
        />
      </div>
      <div className="space-y-2" dir="ltr">
        <p className="eyebrow">{t("moderation.adm.announce.frSide")}</p>
        <input
          value={form.title_fr}
          maxLength={120}
          onChange={(e) => setForm({ ...form, title_fr: e.target.value })}
          placeholder={t("moderation.adm.announce.titlePh")}
          className="tap-target w-full rounded-md border border-input bg-card px-3 py-2 text-base"
        />
        <textarea
          value={form.body_fr}
          maxLength={600}
          rows={3}
          onChange={(e) => setForm({ ...form, body_fr: e.target.value })}
          placeholder={t("moderation.adm.announce.bodyPh")}
          className="w-full rounded-lg border border-input bg-card px-3 py-2 text-base"
        />
      </div>
    </div>
  );
}

function formValid(f: FormState): boolean {
  return !!(
    f.title_ar.trim() &&
    f.body_ar.trim() &&
    f.title_en.trim() &&
    f.body_en.trim() &&
    f.title_fr.trim() &&
    f.body_fr.trim()
  );
}

/** Admin panel for the announcement banner: list, create, edit, publish, delete. */
export function AdminAnnouncementsPanel() {
  const { t, formatDateTime } = useI18n();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState>(EMPTY);

  const list = useQuery({
    queryKey: ["admin", "announcements"],
    queryFn: () => adminListAnnouncements(),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin", "announcements"] });
  const onError = (error: Error) => toast.error(localizeError(error.message ?? ""));

  const create = useMutation({
    mutationFn: () => adminCreateAnnouncement({ data: form }),
    onSuccess: () => {
      setForm(EMPTY);
      refresh();
    },
    onError,
  });
  const setActive = useMutation({
    mutationFn: (vars: { id: string; active: boolean }) => adminSetAnnouncementActive({ data: vars }),
    onSuccess: refresh,
    onError,
  });
  const del = useMutation({
    mutationFn: (id: string) => adminDeleteAnnouncement({ data: { id } }),
    onSuccess: () => {
      setConfirmDelete(null);
      refresh();
    },
    onError,
  });
  const update = useMutation({
    mutationFn: (vars: { id: string } & FormState) => adminUpdateAnnouncement({ data: vars }),
    onSuccess: () => {
      setEditing(null);
      refresh();
    },
    onError,
  });

  const startEdit = (a: AdminAnnouncement) => {
    setEditing(a.id);
    setEditForm({
      title_ar: a.title_ar,
      body_ar: a.body_ar,
      title_en: a.title_en,
      body_en: a.body_en,
      title_fr: a.title_fr,
      body_fr: a.body_fr,
      kind: a.kind,
      color: a.color,
      speed_seconds: a.speed_seconds,
    });
  };

  return (
    <div className="mt-4 space-y-6">
      <form
        className="space-y-3 rounded-xl border border-border bg-card p-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (formValid(form)) create.mutate();
        }}
      >
        <p className="eyebrow flex items-center gap-1.5">
          <Megaphone className="size-3.5" />
          {t("moderation.adm.announce.new")}
        </p>
        <BilingualFields form={form} setForm={setForm} />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <KindPicker value={form.kind} onChange={(kind) => setForm({ ...form, kind })} />
          <ColorPicker value={form.color} onChange={(color) => setForm({ ...form, color })} />
          <SpeedInput form={form} setForm={setForm} />
          <Button type="submit" size="sm" disabled={create.isPending || !formValid(form)}>
            {create.isPending ? t("moderation.adm.announce.creating") : t("moderation.adm.announce.create")}
          </Button>
        </div>
      </form>

      <ul className="space-y-2">
        {(list.data ?? []).map((a) => (
          <li
            key={a.id}
            className={`rounded-xl border p-4 ${a.active ? "border-plant/50 bg-plant/5" : "border-border bg-card"}`}
          >
            {editing === a.id ? (
              <div className="space-y-3">
                <BilingualFields form={editForm} setForm={setEditForm} />
                <div className="flex flex-wrap items-center gap-2">
                  <KindPicker value={editForm.kind} onChange={(kind) => setEditForm({ ...editForm, kind })} />
                  <ColorPicker value={editForm.color} onChange={(color) => setEditForm({ ...editForm, color })} />
                  <SpeedInput form={editForm} setForm={setEditForm} />
                  <Button
                    size="sm"
                    disabled={update.isPending || !formValid(editForm)}
                    onClick={() => update.mutate({ id: a.id, ...editForm })}
                  >
                    {t("moderation.adm.announce.save")}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                    {t("moderation.adm.announce.cancel")}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    <span className={`inline-block size-3 rounded-full ${SWATCH[a.color]}`} aria-hidden />
                    {a.title_ar}
                    {a.active && (
                      <span className="rounded-full bg-plant/15 px-2 py-0.5 text-xs font-medium text-plant">
                        {t("moderation.adm.announce.live")}
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground" dir="rtl">{a.body_ar}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground" dir="ltr">
                    {a.title_en} — {a.body_en}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t(`moderation.adm.announce.kind.${a.kind}`)} · {formatDateTime(a.created_at)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    size="sm"
                    variant={a.active ? "outline" : "secondary"}
                    disabled={setActive.isPending}
                    onClick={() => setActive.mutate({ id: a.id, active: !a.active })}
                  >
                    {a.active ? t("moderation.adm.announce.unpublish") : t("moderation.adm.announce.publish")}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => startEdit(a)}>
                    {t("moderation.adm.announce.edit")}
                  </Button>
                  {confirmDelete === a.id ? (
                    <Button size="sm" variant="destructive" disabled={del.isPending} onClick={() => del.mutate(a.id)}>
                      {t("moderation.adm.announce.confirm")}
                    </Button>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(a.id)}>
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>
              </div>
            )}
          </li>
        ))}
        {list.data?.length === 0 && (
          <p className="text-sm text-muted-foreground">{t("moderation.adm.announce.empty")}</p>
        )}
      </ul>
    </div>
  );
}
