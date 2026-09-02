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
import {
  ColorPicker,
  EMPTY_ANNOUNCEMENT_FORM,
  formValid,
  KindPicker,
  SpeedInput,
  SWATCH,
  TrilingualFields,
  type AnnouncementFormState,
} from "@/components/admin/announce-form-bits";

/** Admin panel for the announcement banner: list, create, edit, publish, delete. */
export function AdminAnnouncementsPanel() {
  const { t, formatDateTime } = useI18n();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<AnnouncementFormState>(EMPTY_ANNOUNCEMENT_FORM);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<AnnouncementFormState>(EMPTY_ANNOUNCEMENT_FORM);

  const list = useQuery({
    queryKey: ["admin", "announcements"],
    queryFn: () => adminListAnnouncements(),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin", "announcements"] });
  const onError = (error: Error) => toast.error(localizeError(error.message ?? ""));

  const create = useMutation({
    mutationFn: () => adminCreateAnnouncement({ data: form }),
    onSuccess: () => {
      setForm(EMPTY_ANNOUNCEMENT_FORM);
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
    mutationFn: (vars: { id: string } & AnnouncementFormState) => adminUpdateAnnouncement({ data: vars }),
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
        <TrilingualFields form={form} setForm={setForm} />
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
                <TrilingualFields form={editForm} setForm={setEditForm} />
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
                  <p className="mt-0.5 text-xs text-muted-foreground" dir="ltr">
                    {a.title_fr} — {a.body_fr}
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
