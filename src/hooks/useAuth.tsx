import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";

export type StaffRole = "admin" | "moderator";

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isModerator: boolean;
  isAdmin: boolean;
  role: StaffRole | null;
}

export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [role, setRole] = useState<StaffRole | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!active) return;
      setSession(next);
      setRoleLoading(true);
      setSessionLoading(false);
    });

    void supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        setSession(data.session);
        setRoleLoading(true);
        setSessionLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setSessionLoading(false);
      });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) {
      setRole(null);
      setRoleLoading(false);
      return;
    }
    let active = true;
    setRoleLoading(true);
    void (async () => {
      try {
        const { data } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId);
        if (!active) return;
        // A user can hold multiple role rows; admin wins when both exist.
        const roles = (data ?? []).map((r) => r.role);
        setRole(roles.includes("admin") ? "admin" : roles.includes("moderator") ? "moderator" : null);
      } catch {
        if (!active) return;
        setRole(null);
      } finally {
        if (active) setRoleLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [session?.user?.id]);

  const loading = sessionLoading || roleLoading;
  const isModerator = role !== null;
  const isAdmin = role === "admin";

  return { user: session?.user ?? null, session, loading, isModerator, isAdmin, role };
}