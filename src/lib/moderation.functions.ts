import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { assertScope, requireStaff } from "@/lib/staff.server";

/**
 * Moderator-only contact reveal + moderation actions.
 *
 * All PII paths re-check the caller's role live, AND enforce the wilaya
 * scope (audit 2026-08-28: the queue UI was scoped, these paths were not —
 * a moderator could read contact info for any wilaya). Admins bypass the
 * scope; moderators may only touch submissions whose wilaya (or its
 * post-2019 parent) is in their assignment.
 */

export interface ContactInfo {
  name: string | null;
  phone: string | null;
}

const idShape = z.object({ id: z.string().uuid() });

export const getSiteContact = createServerFn({ method: "POST" })
  .validator((data: unknown) => idShape.parse(data))
  .handler(async ({ data }): Promise<ContactInfo> => {
    const staff = await requireStaff();
    const { data: row } = await supabaseAdmin
      .from("sites")
      .select("wilaya_code, planter_display_name, contact_phone")
      .eq("id", data.id)
      .single();
    if (!row) throw new Error("Submission not found.");
    assertScope(staff, row.wilaya_code);
    return { name: row.planter_display_name, phone: row.contact_phone };
  });

export const getFireContact = createServerFn({ method: "POST" })
  .validator((data: unknown) => idShape.parse(data))
  .handler(async ({ data }): Promise<ContactInfo> => {
    const staff = await requireStaff();
    const { data: row } = await supabaseAdmin
      .from("fire_reports")
      .select("wilaya_code, reporter_name, reporter_phone")
      .eq("id", data.id)
      .single();
    if (!row) throw new Error("Report not found.");
    assertScope(staff, row.wilaya_code);
    return { name: row.reporter_name, phone: row.reporter_phone };
  });

const moderateShape = z.object({
  id: z.string().uuid(),
  status: z.enum(["approved", "rejected"]),
  note: z.string().trim().max(1000).optional(),
});

/**
 * Approve/reject a pending planting, or re-approve a rejected one, service-role.
 * Same scope check as the contact reveal; on reject the photo object is removed
 * so a rejected submission is never served again via the public photo proxy
 * (re-approving restores the record without its photo — documented trade-off).
 */
export const moderateSite = createServerFn({ method: "POST" })
  .validator((data: unknown) => moderateShape.parse(data))
  .handler(async ({ data }) => {
    const staff = await requireStaff();
    const { data: site } = await supabaseAdmin
      .from("sites")
      .select("wilaya_code, status, photo_url")
      .eq("id", data.id)
      .single();
    if (!site) throw new Error("Submission not found.");
    const allowedTransition =
      (site.status === "pending" && (data.status === "approved" || data.status === "rejected")) ||
      (site.status === "rejected" && data.status === "approved");
    if (!allowedTransition) throw new Error("This submission was already reviewed.");
    assertScope(staff, site.wilaya_code);

    const { error: updateError } = await supabaseAdmin
      .from("sites")
      .update({
        status: data.status,
        reviewed_by: staff.userId,
        reviewed_at: new Date().toISOString(),
        moderator_notes: data.note?.trim() ? data.note.trim() : null,
      })
      .eq("id", data.id);
    if (updateError) throw updateError;

    if (data.status === "rejected" && site.photo_url) {
      await supabaseAdmin.storage.from("photos").remove([site.photo_url]);
    }
    return { ok: true };
  });
