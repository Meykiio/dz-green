import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireAdmin } from "@/lib/admin-shared.server";

/** Admin server functions for the announcement banner. */

export interface AdminAnnouncement {
  id: string;
  title: string;
  body: string;
  kind: "info" | "success" | "warning";
  active: boolean;
  created_at: string;
}

export const adminListAnnouncements = createServerFn({ method: "GET" })
  .handler(async (): Promise<AdminAnnouncement[]> => {
    await requireAdmin();
    const { data, error } = await supabaseAdmin
      .from("announcements")
      .select("id, title, body, kind, active, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return (data ?? []) as AdminAnnouncement[];
  });

const createShape = z.object({
  title: z.string().trim().min(1).max(120),
  body: z.string().trim().min(1).max(600),
  kind: z.enum(["info", "success", "warning"]).default("info"),
});

export const adminCreateAnnouncement = createServerFn({ method: "POST" })
  .validator((data: unknown) => createShape.parse(data))
  .handler(async ({ data }) => {
    await requireAdmin();
    const { error } = await supabaseAdmin.from("announcements").insert({
      title: data.title,
      body: data.body,
      kind: data.kind,
      active: false,
    });
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
