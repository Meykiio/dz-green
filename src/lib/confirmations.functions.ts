import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import {
  getFireCountsImpl,
  getMyVoteImpl,
  submitFireVoteImpl,
  type Verdict,
} from "@/lib/confirmations.server";

const voteSchema = z.object({
  fireReportId: z.string().uuid(),
  verdict: z.enum(["yes", "no", "unsure"]),
  deviceSecret: z.string().min(8).max(200),
});

/** Cast or replace a vote on a fire report (community confirmation). */
export const submitFireVote = createServerFn({ method: "POST" })
  .validator((data: unknown) => voteSchema.parse(data))
  .handler(async ({ data }) => {
    return submitFireVoteImpl(data as { fireReportId: string; verdict: Verdict; deviceSecret: string });
  });

/** Public per-fire vote counts. */
export const getFireCounts = createServerFn({ method: "GET" })
  .validator((data: unknown) => z.object({ fireReportId: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    return getFireCountsImpl((data as { fireReportId: string }).fireReportId);
  });

/** The current voter's existing verdict on a fire (for button state). */
export const getMyVote = createServerFn({ method: "GET" })
  .validator((data: unknown) =>
    z.object({ fireReportId: z.string().uuid(), deviceSecret: z.string().min(8).max(200) }).parse(data),
  )
  .handler(async ({ data }) => {
    const d = data as { fireReportId: string; deviceSecret: string };
    return getMyVoteImpl(d.fireReportId, d.deviceSecret);
  });
