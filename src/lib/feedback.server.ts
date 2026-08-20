import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { z } from "zod";
import type { feedbackSchema } from "./feedback.functions";

export async function submitFeedbackImpl(
  data: z.infer<typeof feedbackSchema>,
): Promise<{ ok: true }> {
  if (data.hp) {
    return { ok: true };
  }

  const { error } = await supabaseAdmin
    .from("feedback")
    .insert({ message: data.message, page: data.page ?? null, device: data.device ?? null });

  if (error) {
    console.error("[feedback] insert failed:", error.message);
    throw new Error("Could not save feedback. Try again.");
  }

  return { ok: true };
}