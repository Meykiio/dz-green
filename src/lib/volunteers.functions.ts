import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Volunteer application (2026-08-28): warm, simple form for people offering
 * to help their wilaya as moderators. PII-heavy — the insert is service-role
 * only (column grants none for clients; reads go through the admin panel).
 * Honeypot: bots that fill `hp` are silently dropped, like feedback.
 */
export const volunteerSchema = z.object({
  hp: z.string().max(100).optional().nullable(),
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().min(6).max(40).optional().nullable(),
  wilaya_code: z.string().min(1).max(4),
  extra_wilayas: z.string().trim().max(120).optional().nullable(),
  intents: z.array(z.enum(["review", "triage", "organize", "share", "other"])).min(1).max(5),
  availability: z.string().trim().max(120).optional().nullable(),
  message: z.string().trim().max(600).optional().nullable(),
});

export const submitVolunteer = createServerFn({ method: "POST" })
  .validator((data: unknown) => volunteerSchema.parse(data))
  .handler(async ({ data }) => {
    const { submitVolunteerImpl } = await import("./volunteers.server");
    return submitVolunteerImpl(data);
  });
