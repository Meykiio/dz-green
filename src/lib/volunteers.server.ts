import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { optionalUserId, throttle } from "@/lib/submissions.server";
import type { z } from "zod";
import type { volunteerSchema } from "./volunteers.functions";

export async function submitVolunteerImpl(
  data: z.infer<typeof volunteerSchema>,
): Promise<{ ok: true }> {
  if (data.hp) {
    return { ok: true };
  }

  // Shared throttle (security report 2026-08-30): 5 applications per hour
  // per hashed IP.
  await throttle("volunteer", 5);

  // Account-first flow (2026-08-29): link the application to the applicant's
  // auth account when they're signed in, so onboarding is one click and
  // nobody needs to be called.
  const userId = await optionalUserId();

  const { error } = await supabaseAdmin.from("volunteers").insert({
    name: data.name,
    email: data.email,
    phone: data.phone ?? null,
    wilaya_code: data.wilaya_code,
    extra_wilayas: data.extra_wilayas ?? null,
    intents: data.intents.join(","),
    availability: data.availability ?? null,
    message: data.message ?? null,
    user_id: userId,
  });

  if (error) {
    console.error("[volunteers] insert failed:", error.message);
    throw new Error("Could not send your application. Try again.");
  }

  return { ok: true };
}
