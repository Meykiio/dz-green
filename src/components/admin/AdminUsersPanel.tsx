import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Trash2, UserPlus, UserX } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AssignWilayasDialog } from "@/components/admin/AssignWilayasDialog";
import { CreateAccountDialog } from "@/components/admin/CreateAccountDialog";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";
import {
  adminDeleteUser,
  adminListUsers,
  adminSetRole,
  adminSignOutUser,
  type AdminUser,
} from "@/lib/admin.functions";
import { useAuth } from "@/hooks/useAuth";
import { wilayaName } from "@/lib/wilayas";

const PAGE = 50;

/** Users, roles and wilayas — one panel with "show more" pagination. */
export function AdminUsersPanel() {
  const { t } = useI18n();
  const { user: me } = useAuth();
  const queryClient = useQueryClient();
  const [offset, setOffset] = useState(0);
  const [rows, setRows] = useState<AdminUser[]>([]);
  const [creating, setCreating] = useState(false);
  const [assigning, setAssigning] = useState<AdminUser | null>(null);
  const listUsers = useServerFn(adminListUsers);

  const users = useQuery({
    queryKey: ["admin", "users", offset],
    queryFn: async () => {
      const page = await listUsers({ data: { offset, limit: PAGE } });
      setRows((prev) => (offset === 0 ? page : [...prev, ...page]));
      return page;
    },
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    setOffset(0);
    setRows([]);
  };

  const setRole = useMutation({
    mutationFn: adminSetRole,
    onSuccess: () => {
      toast.success(t("moderation.adm.toastRole"));
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const signOut = useMutation({
    mutationFn: adminSignOutUser,
    onSuccess: () => {
      toast.success(t("moderation.adm.toastSignout"));
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteUser = useMutation({
    mutationFn: adminDeleteUser,
    onSuccess: () => {
      toast.success(t("moderation.adm.deleteToast"));
      setConfirming(null);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [confirming, setConfirming] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const hasMore = (users.data?.length ?? 0) >= PAGE;

  const filtered = search.trim()
    ? rows.filter((u) =>
        `${u.email ?? ""} ${u.display_name ?? ""}`.toLowerCase().includes(search.trim().toLowerCase()),
      )
    : rows;

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={() => setCreating(true)}>
          <UserPlus className="size-4" /> {t("moderation.adm.create.trigger")}
        </Button>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("moderation.adm.searchUsers")}
          className="tap-target w-48 rounded-md border border-input bg-card px-3 py-1.5 text-sm"
        />
      </div>

      {users.isError && (
        <p className="mt-6 rounded-lg border border-fire/40 bg-fire/10 px-4 py-3 text-sm">
          {t("moderation.adm.errUsers")}
        </p>
      )}
      {users.isLoading && offset === 0 && (
        <p className="mt-6 text-muted-foreground">{t("moderation.adm.loadingUsers")}</p>
      )}

      <div className="mt-4 space-y-3">
        {filtered.map((u) => (
          <div key={u.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-4">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">
                {u.display_name || t("moderation.adm.noName")}
                <span className="ms-2 text-xs font-normal text-muted-foreground">{u.email}</span>
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {u.role ? (
                  <>
                    <span className="font-semibold text-foreground">
                      {t(`moderation.adm.role.${u.role}`)}
                    </span>
                    {u.role === "moderator" &&
                      (u.wilayas.length > 0
                        ? t("moderation.adm.rolesWilayas", {
                            n: u.wilayas.length,
                            names: u.wilayas.slice(0, 4).map(wilayaName).join("، "),
                          }) + (u.wilayas.length > 4 ? "…" : "")
                        : t("moderation.adm.noWilayas"))}
                  </>
                ) : (
                  t("moderation.adm.noRole")
                )}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {u.role !== "admin" && (
                <Button size="sm" onClick={() => setRole.mutate({ data: { userId: u.id, role: "admin" } })}>
                  {t("moderation.adm.makeAdmin")}
                </Button>
              )}
              {u.role !== "moderator" && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setRole.mutate({ data: { userId: u.id, role: "moderator" } })}
                >
                  {t("moderation.adm.makeModerator")}
                </Button>
              )}
              {u.role === "moderator" && (
                <Button size="sm" variant="outline" onClick={() => setAssigning(u)}>
                  {t("moderation.adm.assignWilayas")}
                </Button>
              )}
              {u.role && u.id !== me?.id && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setRole.mutate({ data: { userId: u.id, role: "none" } })}
                  disabled={setRole.isPending}
                >
                  <UserX className="size-4" />
                  {t("moderation.adm.removeRole")}
                </Button>
              )}
              {u.id !== me?.id && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => signOut.mutate({ data: { userId: u.id } })}
                  disabled={signOut.isPending}
                >
                  {t("chrome.auth.signout")}
                </Button>
              )}
              {u.id !== me?.id && (
                <Button
                  size="sm"
                  variant="ghost"
                  className={confirming === u.id ? "text-fire" : ""}
                  onClick={() => {
                    if (confirming === u.id) {
                      deleteUser.mutate({ data: { userId: u.id } });
                    } else {
                      setConfirming(u.id);
                      setTimeout(() => setConfirming((c) => (c === u.id ? null : c)), 4000);
                    }
                  }}
                  disabled={deleteUser.isPending}
                  aria-label={t("moderation.adm.deleteUser")}
                >
                  <Trash2 className="size-4" />
                  {confirming === u.id ? t("moderation.adm.confirmDelete") : t("moderation.adm.deleteUser")}
                </Button>
              )}
            </div>
          </div>
        ))}
        {!users.isLoading && filtered.length === 0 && (
          <p className="text-muted-foreground">{t("moderation.adm.emptyUsers")}</p>
        )}
        {hasMore && (
          <div className="flex justify-center">
            <Button
              variant="secondary"
              onClick={() => setOffset((o) => o + PAGE)}
              disabled={users.isFetching}
            >
              {t("moderation.adm.more")}
            </Button>
          </div>
        )}
      </div>

      {assigning && (
        <AssignWilayasDialog
          user={assigning}
          onClose={() => setAssigning(null)}
          onSaved={() => {
            setAssigning(null);
            invalidate();
          }}
        />
      )}
      {creating && <CreateAccountDialog onClose={() => setCreating(false)} />}
    </div>
  );
}
