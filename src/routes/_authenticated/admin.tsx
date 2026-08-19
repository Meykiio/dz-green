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
import { useAuth } from "@/hooks/useAuth";
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

const ROLE_LABEL: Record<"admin" | "moderator", string> = {
  admin: "Admin",
  moderator: "Moderator",
};

function AdminPage() {
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
      toast.success("Role updated");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const signOut = useMutation({
    mutationFn: adminSignOutUser,
    onSuccess: () => {
      toast.success("User signed out");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (loading) {
    return (
      <AppShell>
        <p className="p-8 text-muted-foreground">Checking your access…</p>
      </AppShell>
    );
  }

  if (!isAdmin) return null;

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-5xl px-4 py-8">
        <p className="eyebrow">Administration</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Overview</h1>
        <div className="mt-6">
          <AdminOverview />
        </div>

        <h2 className="mt-10 text-2xl font-semibold tracking-tight">Feedback</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Messages from the Feedback button, newest first.
        </p>
        <FeedbackPanel />

        <h2 className="mt-10 text-2xl font-semibold tracking-tight">Moderators &amp; roles</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Admins control everything. Moderators act only inside their assigned wilayas.
        </p>

        {users.isError && (
          <p className="mt-6 rounded-lg border border-fire/40 bg-fire/10 px-4 py-3 text-sm">
            Couldn't load the user list — refresh to try again.
          </p>
        )}
        {users.isLoading && <p className="mt-6 text-muted-foreground">Loading users…</p>}

        <div className="mt-6 space-y-3">
          {(users.data ?? []).map((u) => (
            <div key={u.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-4">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {u.display_name || "No display name"}
                  <span className="ml-2 text-xs font-normal text-muted-foreground">{u.email}</span>
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {u.role ? (
                    <>
                      <span className="font-semibold text-foreground">{ROLE_LABEL[u.role]}</span>
                      {u.role === "moderator" &&
                        (u.wilayas.length > 0
                          ? ` · ${u.wilayas.length} wilaya${u.wilayas.length > 1 ? "s" : ""}: ${u.wilayas
                              .slice(0, 4)
                              .map(wilayaName)
                              .join(", ")}${u.wilayas.length > 4 ? "…" : ""}`
                          : " · no wilayas assigned yet")}
                    </>
                  ) : (
                    "No role"
                  )}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {u.role !== "admin" && (
                  <Button size="sm" onClick={() => setRole.mutate({ data: { userId: u.id, role: "admin" } })}>
                    Make admin
                  </Button>
                )}
                {u.role !== "moderator" && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setRole.mutate({ data: { userId: u.id, role: "moderator" } })}
                  >
                    Make moderator
                  </Button>
                )}
                {u.role === "moderator" && (
                  <Button size="sm" variant="outline" onClick={() => setAssigning(u)}>
                    Assign wilayas
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
                    Remove role
                  </Button>
                )}
                {u.id !== user?.id && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => signOut.mutate({ data: { userId: u.id } })}
                    disabled={signOut.isPending}
                  >
                    Sign out
                  </Button>
                )}
              </div>
            </div>
          ))}
          {users.data && users.data.length === 0 && (
            <p className="text-muted-foreground">No users yet.</p>
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
