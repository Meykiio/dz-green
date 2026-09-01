import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireAdmin } from "@/lib/admin-shared.server";

/** Admin server functions for the announcement banner (bilingual + color). */

export interface AdminAnnouncement {
  id: string;
  title_ar: string;
  body_ar: string;
  title_en: string;
  body_en: string;
  kind: "info" | "success" | "warning";
  color: "ink" | "plant" | "care" | "fire" | "amber";
  active: boolean;
  created_at: string;
}

const contentShape = z.object({
  title_ar: z.string().trim().min(1).max(120),
  body_ar: z.string().trim().min(1).max(600),
  title_en: z.string().trim().min(1).max(120),
  body_en: z.string().trim().min(1).max(600),
  kind: z.enum(["info", "success", "warning"]).default("info"),
  color: z.enum(["ink", "plant", "care", "fire", "amber"]).default("ink"),
});

export const adminListAnnouncements = createServerFn({ method: "GET" }).handler(
  async (): Promise<AdminAnnouncement[]> => {
    await requireAdmin();
    const { data, error } = await supabaseAdmin
      .from("announcements")
      .select("id, title_ar, body_ar, title_en, body_en, kind, color, active, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return (data ?? []) as AdminAnnouncement[];
  },
);

export const adminCreateAnnouncement = createServerFn({ method: "POST" })
  .validator((data: unknown) => contentShape.parse(data))
  .handler(async ({ data }) => {
    await requireAdmin();
    const { error } = await supabaseAdmin.from("announcements").insert({
      title_ar: data.title_ar,
      body_ar: data.body_ar,
      title_en: data.title_en,
      body_en: data.body_en,
      kind: data.kind,
      color: data.color,
      active: false,
    });
    if (error) throw error;
    return { ok: true };
  });

export const adminUpdateAnnouncement = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z.object({ id: z.string().uuid() }).and(contentShape).parse(data),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const { error } = await supabaseAdmin
      .from("announcements")
      .update({
        title_ar: data.title_ar,
        body_ar: data.body_ar,
        title_en: data.title_en,
        body_en: data.body_en,
        kind: data.kind,
        color: data.color,
      })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

/** One active at a time: activating one deactivates every other row. */
export const adminSetAnnouncementActive = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z.object({ id: z.string().uuid(), active: z.boolean() }).parse(data),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    if (data.active) {
      const { error: clearErr } = await supabaseAdmin
        .from("announcements")
        .update({ active: false })
        .eq("active", true);
      if (clearErr) throw clearErr;
    }
    const { error } = await supabaseAdmin
      .from("announcements")
      .update({ active: data.active })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const adminDeleteAnnouncement = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    await requireAdmin();
    const { error } = await supabaseAdmin.from("announcements").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });
