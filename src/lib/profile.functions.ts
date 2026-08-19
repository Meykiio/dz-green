import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Profile server functions. Own-profile edits are gated on the caller's token
 * (the service role performs the write after verifying the uid, and only ever
 * touches display_name / avatar_url — never is_moderator, which stays
 * trigger-synced from user_roles). Public profiles are read through
 * getPublicProfile, which returns a fixed public-safe shape: display name,
 * avatar, join date and aggregate counts — never the email or any staff flag.
 */

async function currentUserId(): Promise<string | null> {
  const auth = getRequest().headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return null;
  const { data } = await supabaseAdmin.auth.getUser(token);
  return data.user?.id ?? null;
}

export interface ProfileStats {
  plantings: number;
  trees: number;
  careLogs: number;
  fireReports: number;
}

/** Aggregate a user's contributions. `publicOnly` limits plantings to approved. */
async function contributionStats(userId: string, publicOnly: boolean): Promise<ProfileStats> {
  let sitesQ = supabaseAdmin.from("sites").select("tree_count").eq("user_id", userId).limit(5000);
  if (publicOnly) sitesQ = sitesQ.eq("status", "approved");
  const [sites, care, fires] = await Promise.all([
    sitesQ,
    supabaseAdmin
      .from("care_logs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabaseAdmin
      .from("fire_reports")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
  ]);
  const siteRows = (sites.data ?? []) as { tree_count: number }[];
  return {
    plantings: siteRows.length,
    trees: siteRows.reduce((sum, s) => sum + (s.tree_count ?? 0), 0),
    careLogs: care.count ?? 0,
    fireReports: fires.count ?? 0,
  };
}

export interface MyProfile {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  email: string | null;
  createdAt: string;
  stats: ProfileStats;
}

/** The signed-in user's own profile — includes their email (private, self only). */
export const getMyProfile = createServerFn({ method: "GET" }).handler(
  async (): Promise<MyProfile> => {
    const userId = await currentUserId();
    if (!userId) throw new Error("Sign in to see your profile.");
    const [{ data: profile }, { data: userData }, stats] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("id, display_name, avatar_url, created_at")
        .eq("id", userId)
        .maybeSingle(),
      supabaseAdmin.auth.admin.getUserById(userId),
      contributionStats(userId, false),
    ]);
    return {
      id: userId,
      displayName: (profile?.display_name as string | null) ?? null,
      avatarUrl: (profile?.avatar_url as string | null) ?? null,
      email: userData.user?.email ?? null,
      createdAt: (profile?.created_at as string) ?? new Date().toISOString(),
      stats,
    };
  },
);

const updateSchema = z.object({
  displayName: z.string().trim().min(1).max(80),
  avatar: z.string().min(20).max(3_000_000).optional().nullable(),
  removeAvatar: z.boolean().optional(),
});

/** Update the caller's own display name and (optionally) avatar. */
export const updateMyProfile = createServerFn({ method: "POST" })
  .validator((data: unknown) => updateSchema.parse(data))
  .handler(async ({ data }): Promise<MyProfile> => {
    const userId = await currentUserId();
    if (!userId) throw new Error("Sign in to edit your profile.");

    const patch: { display_name: string; avatar_url?: string | null } = {
      display_name: data.displayName,
    };
    if (data.removeAvatar) {
      patch.avatar_url = null;
    } else if (data.avatar) {
      const { storePhoto } = await import("./submissions.server");
      patch.avatar_url = await storePhoto(data.avatar, "avatars");
    }

    const { error } = await supabaseAdmin.from("profiles").update(patch).eq("id", userId);
    if (error) throw new Error("Could not save your profile. Please try again.");
    return getMyProfile();
  });

export interface PublicProfile {
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: string;
  stats: ProfileStats;
}

/** A public profile — safe fields + public counts only. Null if unknown. */
export const getPublicProfile = createServerFn({ method: "GET" })
  .validator((data: unknown) => z.object({ userId: z.string().uuid() }).parse(data))
  .handler(async ({ data }): Promise<PublicProfile | null> => {
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("display_name, avatar_url, created_at")
      .eq("id", data.userId)
      .maybeSingle();
    if (!profile) return null;
    return {
      displayName: (profile.display_name as string | null) ?? null,
      avatarUrl: (profile.avatar_url as string | null) ?? null,
      createdAt: profile.created_at as string,
      stats: await contributionStats(data.userId, true),
    };
  });
