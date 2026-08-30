import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { throttle } from "@/lib/submissions.server";
import type { z } from "zod";
import type { feedbackSchema } from "./feedback.functions";

export async function submitFeedbackImpl(
  data: z.infer<typeof feedbackSchema>,
): Promise<{ ok: true }> {
  if (data.hp) {
    return { ok: true };
  }

  // Shared throttle (security report 2026-08-30): 10 feedback messages per
  // hour per hashed IP — honest users never notice, spam dies here.
  await throttle("feedback", 10);

  const { error } = await supabaseAdmin
    .from("feedback")
    .insert({
      kind: data.kind,
      message: data.message,
      page: data.page ?? null,
      device: data.device ?? null,
    });

  if (error) {
    console.error("[feedback] insert failed:", error.message);
    throw new Error("Could not save feedback. Try again.");
  }

  return { ok: true };
}