import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { latestAcceptedISO } from "@/lib/dates";
import { SURVIVAL_STATUSES } from "@/lib/survival";

/** Survival-check server functions: zod at the trust boundary, impl lazily loaded. */

export const survivalSchema = z
  .object({
    hp: z.string().optional().nullable(),
    elapsedMs: z.number().optional().nullable(),
    deviceSecret: z.string().min(10).max(64).optional().nullable(),
    site_id: z.string().uuid(),
    status: z.enum(SURVIVAL_STATUSES),
    trees_checked: z.number().int().min(1).max(100000),
    trees_alive: z.number().int().min(0).max(100000),
    photo: z.string().min(20),
    checked_date: z
      .string()
      .min(8)
      .max(10)
      .refine((s) => s <= latestAcceptedISO(), { message: "Date can't be in the future." }),
    notes: z.string().trim().max(600).optional().nullable(),
    submitter_name: z.string().trim().max(80).optional().nullable(),
    client_request_id: z.string().uuid().optional().nullable(),
  })
  .refine((d) => d.trees_alive <= d.trees_checked, {
    message: "Trees alive can't be more than trees checked.",
  });

export const submitSurvivalCheck = createServerFn({ method: "POST" })
  .validator((data: unknown) => survivalSchema.parse(data))
  .handler(async ({ data }) => {
    const { submitSurvivalCheckImpl } = await import("@/lib/survival-impl.server");
    return submitSurvivalCheckImpl(data);
  });

export const reviewSurvivalCheck = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z.object({ id: z.string().uuid(), grade: z.enum(["verified", "rejected"]) }).parse(data),
  )
  .handler(async ({ data }) => {
    const { reviewSurvivalCheckImpl } = await import("@/lib/survival-impl.server");
    return reviewSurvivalCheckImpl(data);
  });
