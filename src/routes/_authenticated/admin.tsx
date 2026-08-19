import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { UserX } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { AdminOverview } from "@/components/admin/AdminOverview";
import { AssignWilayasDialog } from "@/components/admin/AssignWilayasDialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n";
import { format } from "@/i18n/format";
import {
  adminListUsers,
  adminSetRole,
  adminSignOutUser,
  type AdminUser,
} from "@/lib/admin.functions";
import { wilayaName } from "@/lib/wilayas";

const TITLE = "Admin — Green Algeria";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: TITLE },
      { property: "og:title", content: TITLE },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { t } = useI18n();
  const { isAdmin, loading, user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [assigning, setAssigning] = useState<AdminUser | null>(null);

  const roleLabel: Record<"admin" | "moderator", string> = {
    admin: t.staff.admin.roleAdmin,
    moderator: t.staff.admin.roleModerator,
  };

  useEffect(() => {
    if (!loading && !isAdmin) void navigate({ to: "/" });
  }, [loading, isAdmin, navigate]);

  const users = useQuery({ queryKey: ["admin", "users"], queryFn: () => adminListUsers() });

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });

  const setRole = useMutation({
    mutationFn: adminSetRole,
    onSuccess: () => {
      toast.success(t.staff.admin.roleUpdated);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const signOut = useMutation({
    mutationFn: adminSignOutUser,
    onSuccess: () => {
      toast.success(t.staff.admin.userSignedOut);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (loading) {
    return (
      <AppShell>
        <p className="p-8 text-muted-foreground">{t.staff.moderate.checkingAccess}</p>
      </AppShell>
    );
  }

  if (!isAdmin) return null;

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-5xl px-4 py-8">
        <p className="eyebrow">{t.staff.admin.eyebrow}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          {t.staff.admin.overviewHeading}
        </h1>
        <div className="mt-6">
          <AdminOverview />
        </div>

        <h2 className="mt-10 text-2xl font-semibold tracking-tight">
          {t.staff.admin.rolesHeading}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{t.staff.admin.rolesSubtitle}</p>

        {users.isError && (
          <p className="mt-6 rounded-lg border border-fire/40 bg-fire/10 px-4 py-3 text-sm">
            {t.staff.admin.usersError}
          </p>
        )}
        {users.isLoading && (
          <p className="mt-6 text-muted-foreground">{t.staff.admin.usersLoading}</p>
        )}

        <div className="mt-6 space-y-3">
          {(users.data ?? []).map((u) => (
            <div
              key={u.id}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {u.display_name || t.staff.admin.noDisplayName}
                  <span className="mx-2 text-xs font-normal text-muted-foreground">{u.email}</span>
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {u.role ? (
                    <>
                      <span className="font-semibold text-foreground">{roleLabel[u.role]}</span>
                      {u.role === "moderator" &&
                        (u.wilayas.length > 0
                          ? ` · ${format(t.staff.admin.wilayasList, {
                              count: u.wilayas.length,
                              names:
                                u.wilayas.slice(0, 4).map(wilayaName).join("، ") +
                                (u.wilayas.length > 4 ? "…" : ""),
                            })}`
                          : ` · ${t.staff.admin.noWilayas}`)}
                    </>
                  ) : (
                    t.staff.admin.noRole
                  )}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {u.role !== "admin" && (
                  <Button
                    size="sm"
                    onClick={() => setRole.mutate({ data: { userId: u.id, role: "admin" } })}
                  >
                    {t.staff.admin.makeAdmin}
                  </Button>
                )}
                {u.role !== "moderator" && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setRole.mutate({ data: { userId: u.id, role: "moderator" } })}
                  >
                    {t.staff.admin.makeModerator}
                  </Button>
                )}
                {u.role === "moderator" && (
                  <Button size="sm" variant="outline" onClick={() => setAssigning(u)}>
                    {t.staff.admin.assignWilayas}
                  </Button>
                )}
                {u.role && u.id !== user?.id && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setRole.mutate({ data: { userId: u.id, role: "none" } })}
                    disabled={setRole.isPending}
                  >
                    <UserX className="size-4" />
                    {t.staff.admin.removeRole}
                  </Button>
                )}
                {u.id !== user?.id && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => signOut.mutate({ data: { userId: u.id } })}
                    disabled={signOut.isPending}
                  >
                    {t.staff.admin.signOutUser}
                  </Button>
                )}
              </div>
            </div>
          ))}
          {users.data && users.data.length === 0 && (
            <p className="text-muted-foreground">{t.staff.admin.noUsers}</p>
          )}
        </div>
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
    </AppShell>
  );
}
