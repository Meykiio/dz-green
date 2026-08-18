import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const gateShape = {
  hp: z.string().optional().nullable(),
  elapsedMs: z.number().optional().nullable(),
  deviceSecret: z.string().min(10).max(64).optional().nullable(),
};

/** YYYY-MM-DD, not in the future (server clock). */
const pastDate = z
  .string()
  .min(8)
  .max(10)
  .refine((s) => s <= new Date().toISOString().slice(0, 10), {
    message: "Date can't be in the future.",
  });

/** Coordinates come as a pair or not at all (wilaya-only submission). */
const coordinatePair = {
  lat: z.number().min(-90).max(90).optional().nullable(),
  lng: z.number().min(-180).max(180).optional().nullable(),
};

const pairRefinement = [
  (d: { lat?: number | null | undefined; lng?: number | null | undefined }) =>
    (d.lat == null) === (d.lng == null),
  { message: "Location needs both latitude and longitude, or neither." },
] as const;

export const plantingSchema = z.object({
  ...gateShape,
  ...coordinatePair,
  wilaya_code: z.string().min(1).max(4),
  commune: z.string().trim().max(120).optional().nullable(),
  photo: z.string().min(20),
  species: z.string().trim().max(120).optional().nullable(),
  tree_count: z.number().int().min(1).max(100000),
  planted_date: pastDate,
  notes: z.string().trim().max(1000).optional().nullable(),
  planter_display_name: z.string().trim().max(80).optional().nullable(),
}).refine(...pairRefinement);

export const careSchema = z.object({
  ...gateShape,
  site_id: z.string().uuid(),
  action: z.enum(["watered", "checked", "needs_attention", "other"]),
  submitter_name: z.string().trim().max(80).optional().nullable(),
  photo: z.string().min(20).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
  logged_date: pastDate,
});

export const fireSchema = z.object({
  ...gateShape,
  ...coordinatePair,
  wilaya_code: z.string().min(1).max(4),
  commune: z.string().trim().max(120).optional().nullable(),
  severity: z.enum(["small", "large"]).optional().nullable(),
  description: z.string().trim().max(600).optional().nullable(),
  photo: z.string().min(20).optional().nullable(),
  reporter_name: z.string().trim().max(80).optional().nullable(),
  reporter_phone: z.string().trim().max(40).optional().nullable(),
}).refine(...pairRefinement);

export const submitPlanting = createServerFn({ method: "POST" })
  .validator((data: unknown) => plantingSchema.parse(data))
  .handler(async ({ data }) => {
    const { submitPlantingImpl } = await import("./submissions-impl.server");
    return submitPlantingImpl(data);
  });

export const submitCare = createServerFn({ method: "POST" })
  .validator((data: unknown) => careSchema.parse(data))
  .handler(async ({ data }) => {
    const { submitCareImpl } = await import("./submissions-impl.server");
    return submitCareImpl(data);
  });

export const submitFire = createServerFn({ method: "POST" })
  .validator((data: unknown) => fireSchema.parse(data))
  .handler(async ({ data }) => {
    const { submitFireImpl } = await import("./submissions-impl.server");
    return submitFireImpl(data);
  });

/** Public receipt lookup: token in, moderation status out. Never returns PII. */
export const getReceipt = createServerFn({ method: "GET" })
  .validator((data: unknown) => z.object({ token: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { getReceiptStatus } = await import("./receipts.server");
    return getReceiptStatus(data.token);
  });