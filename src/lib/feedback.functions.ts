import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Visitor feedback box. Deliberately minimal:
 * - message: 1..2000 chars, trimmed
 * - hp: honeypot — real browsers keep it empty, bots fill it. When filled,
 *   the request is silently dropped (no error: give bots nothing to learn).
 * - device: user-agent snapshot (≤300 chars) so bug reports are diagnosable.
 */
export const feedbackSchema = z.object({
  hp: z.string().max(100).optional().nullable(),
  message: z.string().trim().min(1).max(2000),
  page: z.string().trim().max(200).optional().nullable(),
  device: z.string().trim().max(300).optional().nullable(),
});

export const submitFeedback = createServerFn({ method: "POST" })
  .validator((data: unknown) => feedbackSchema.parse(data))
  .handler(async ({ data }) => {
    const { submitFeedbackImpl } = await import("./feedback.server");
    return submitFeedbackImpl(data);
  });