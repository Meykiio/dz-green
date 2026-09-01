import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { subscribePushImpl, unsubscribePushImpl } from "@/lib/push.server";

/** Public push-subscription server functions (fire alerts). */

const subscribeShape = z.object({
  endpoint: z.string().url().max(1000),
  keys: z.object({
    p256dh: z.string().min(1).max(500),
    auth: z.string().min(1).max(500),
  }),
  wilaya_code: z.string().regex(/^\d{2}$/).nullish(),
});

export const subscribePush = createServerFn({ method: "POST" })
  .validator((data: unknown) => subscribeShape.parse(data))
  .handler(async ({ data }) => subscribePushImpl(data));

export const unsubscribePush = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({ endpoint: z.string().url().max(1000) }).parse(data))
  .handler(async ({ data }) => unsubscribePushImpl(data));
