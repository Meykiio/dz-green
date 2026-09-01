import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Megaphone, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";
import {
  adminCreateAnnouncement,
  adminDeleteAnnouncement,
  adminListAnnouncements,
  adminSetAnnouncementActive,
} from "@/lib/admin.functions";
import { localizeError } from "@/i18n";

/** Admin panel for the announcement banner: list, create, activate, delete. */
export function AdminAnnouncementsPanel() {
  const { t, formatDateTime } = useI18n();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [kind, setKind] = useState<"info" | "success" | "warning">("info");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const list = useQuery({
    queryKey: ["admin", "announcements"],
    queryFn: () => adminListAnnouncements(),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin", "announcements"] });
  const onError = (error: Error) => toast.error(localizeError(error.message ?? ""));

  const create = useMutation({
    mutationFn: () => adminCreateAnnouncement({ data: { title, body, kind } }),
    onSuccess: () => {
      setTitle("");
      setBody("");
      setKind("info");
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

  return (
    <div className="mt-4 space-y-6">
      <form
        className="space-y-3 rounded-xl border border-border bg-card p-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (title.trim() && body.trim()) create.mutate();
        }}
      >
        <p className="eyebrow flex items-center gap-1.5">
          <Megaphone className="size-3.5" />
          {t("moderation.adm.announce.new")}
        </p>
        <input
          value={title}
          maxLength={120}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("moderation.adm.announce.titlePh")}
          className="tap-target w-full rounded-md border border-input bg-card px-3 py-2 text-base"
        />
        <textarea
          value={body}
          maxLength={600}
          rows={3}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t("moderation.adm.announce.bodyPh")}
          className="w-full rounded-lg border border-input bg-card px-3 py-2 text-base"
        />
        <div className="flex flex-wrap items-center gap-2">
          {(["info", "success", "warning"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              aria-pressed={kind === k}
              className={`tap-target rounded-full border px-3 py-1.5 text-xs font-medium ${
                kind === k
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
          <Button type="submit" size="sm" disabled={create.isPending || !title.trim() || !body.trim()}>
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
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">
                  {a.title}
                  {a.active && (
                    <span className="ms-2 rounded-full bg-plant/15 px-2 py-0.5 text-xs font-medium text-plant">
                      {t("moderation.adm.announce.live")}
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">{a.body}</p>
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
          </li>
        ))}
        {list.data?.length === 0 && (
          <p className="text-sm text-muted-foreground">{t("moderation.adm.announce.empty")}</p>
        )}
      </ul>
    </div>
  );
}
