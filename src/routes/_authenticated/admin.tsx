import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { UserX } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { AdminOverview } from "@/components/admin/AdminOverview";
import { AssignWilayasDialog } from "@/components/admin/AssignWilayasDialog";
import { FeedbackPanel } from "@/components/admin/FeedbackPanel";
import { Button } from "@/components/ui/button";
import { ssrT, useI18n } from "@/i18n";
import { useAuth } from "@/hooks/useAuth";
import {
  adminListUsers,
  adminSetRole,
  adminSignOutUser,
  type AdminUser,
} from "@/lib/admin.functions";
import { wilayaName } from "@/lib/wilayas";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: ssrT("meta.adminTitle") },
      { property: "og:title", content: ssrT("meta.adminTitle") },
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

  useEffect(() => {
    if (!loading && !isAdmin) void navigate({ to: "/" });
  }, [loading, isAdmin, navigate]);

  const users = useQuery({ queryKey: ["admin", "users"], queryFn: () => adminListUsers() });

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });

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

  if (loading) {
    return (
      <AppShell>
        <p className="p-8 text-muted-foreground">{t("moderation.adm.checking")}</p>
      </AppShell>
    );
  }

  if (!isAdmin) return null;

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-5xl px-4 py-8">
        <p className="eyebrow">{t("moderation.adm.eyebrow")}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{t("moderation.adm.overview")}</h1>
        <div className="mt-6">
          <AdminOverview />
        </div>

        <h2 className="mt-10 text-2xl font-semibold tracking-tight">{t("moderation.adm.feedback")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("moderation.adm.feedbackLead")}</p>
        <FeedbackPanel />

        <h2 className="mt-10 text-2xl font-semibold tracking-tight">{t("moderation.adm.roles")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("moderation.adm.rolesLead")}</p>

        {users.isError && (
          <p className="mt-6 rounded-lg border border-fire/40 bg-fire/10 px-4 py-3 text-sm">
            {t("moderation.adm.errUsers")}
          </p>
        )}
        {users.isLoading && <p className="mt-6 text-muted-foreground">{t("moderation.adm.loadingUsers")}</p>}

        <div className="mt-6 space-y-3">
          {(users.data ?? []).map((u) => (
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
                              names: u.wilayas
                                .slice(0, 4)
                                .map(wilayaName)
                                .join("، "),
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
                {u.role && u.id !== user?.id && (
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
                {u.id !== user?.id && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => signOut.mutate({ data: { userId: u.id } })}
                    disabled={signOut.isPending}
                  >
                    {t("chrome.auth.signout")}
                  </Button>
                )}
              </div>
            </div>
          ))}
          {users.data && users.data.length === 0 && (
            <p className="text-muted-foreground">{t("moderation.adm.emptyUsers")}</p>
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
