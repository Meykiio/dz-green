import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { z } from "zod";
import type { volunteerSchema } from "./volunteers.functions";

export async function submitVolunteerImpl(
  data: z.infer<typeof volunteerSchema>,
): Promise<{ ok: true }> {
  if (data.hp) {
    return { ok: true };
  }

  const { error } = await supabaseAdmin.from("volunteers").insert({
    name: data.name,
    email: data.email,
    phone: data.phone ?? null,
    wilaya_code: data.wilaya_code,
    extra_wilayas: data.extra_wilayas ?? null,
    intents: data.intents.join(","),
    availability: data.availability ?? null,
    message: data.message ?? null,
  });

  if (error) {
    console.error("[volunteers] insert failed:", error.message);
    throw new Error("Could not send your application. Try again.");
  }

  return { ok: true };
}
