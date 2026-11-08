-- Widen submission_meta.kind so the new throttles are counted in the
-- database (shared across serverless instances), not only in memory.
-- Code already sends these kinds; until this runs the insert fails quietly
-- and the per-instance in-memory limiter is the only layer (see
-- src/lib/rate-limit.ts). Safe: only relaxes a CHECK, no data touched.
ALTER TABLE public.submission_meta DROP CONSTRAINT submission_meta_kind_check;
ALTER TABLE public.submission_meta ADD CONSTRAINT submission_meta_kind_check
  CHECK (kind = ANY (ARRAY['planting','care','fire','feedback','volunteer','push','vote','identify']));
