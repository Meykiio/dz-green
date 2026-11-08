-- =====================================================================
-- Phase 2a: survival checks (DRAFT, awaiting owner approval, NOT applied)
-- Design: docs/pending-migrations/2026-11_phase2_survival_design.md
--
-- Purely additive: one enum, one table, two views, a widened CHECK.
-- No existing row is read or changed. Rollback = the DROP block at the end.
-- Run once in the Supabase SQL editor (as postgres), after a dry run on a
-- copy. Then fold into 00000000000000_master_schema.sql and DATABASE.md.
-- Includes the earlier pending throttle kinds (push/vote/identify).
-- =====================================================================

BEGIN;

DO $$ BEGIN
  CREATE TYPE public.survival_status AS ENUM
    ('alive','stressed','dead','burned','grazed','not_found');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE public.survival_checks (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id           uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  status            public.survival_status NOT NULL,
  trees_checked     integer NOT NULL CHECK (trees_checked BETWEEN 1 AND 100000),
  trees_alive       integer NOT NULL CHECK (trees_alive >= 0),
  photo_url         text NOT NULL,
  photo_sha256      text NOT NULL,               -- duplicate-photo guard (server-computed)
  checked_date      date NOT NULL,
  notes             text CHECK (char_length(notes) <= 600),
  submitter_name    text CHECK (char_length(submitter_name) <= 80),
  user_id           uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  -- Set by the server, never by the client:
  independence      text NOT NULL DEFAULT 'unknown'
                      CHECK (independence IN ('independent','self','staff','unknown')),
  grade             text NOT NULL DEFAULT 'unverified'
                      CHECK (grade IN ('unverified','verified','rejected')),
  reviewed_by       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at       timestamptz,
  client_request_id uuid UNIQUE,                 -- idempotency for offline retries
  created_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT survival_alive_le_checked CHECK (trees_alive <= trees_checked)
);

CREATE INDEX survival_checks_site_date_idx ON public.survival_checks (site_id, checked_date DESC);
CREATE INDEX survival_checks_grade_idx     ON public.survival_checks (grade, created_at DESC);
CREATE INDEX survival_checks_photo_idx     ON public.survival_checks (photo_sha256);
CREATE INDEX survival_checks_user_idx      ON public.survival_checks (user_id);

ALTER TABLE public.survival_checks ENABLE ROW LEVEL SECURITY;

-- Column-level read: user_id, photo_sha256, client_request_id, reviewed_by
-- stay server-only (select * fails on purpose, like sites and fire_reports).
REVOKE ALL ON public.survival_checks FROM anon, authenticated;
GRANT SELECT (
  id, site_id, status, trees_checked, trees_alive, photo_url, checked_date,
  notes, submitter_name, independence, grade, reviewed_at, created_at
) ON public.survival_checks TO anon, authenticated;
GRANT ALL ON public.survival_checks TO service_role;

-- Public: non-rejected checks on approved plantings.
CREATE POLICY survival_public_read ON public.survival_checks
  FOR SELECT USING (
    grade <> 'rejected'
    AND EXISTS (SELECT 1 FROM public.sites s
                WHERE s.id = survival_checks.site_id AND s.status = 'approved')
  );
-- Moderators: every check in their wilayas (review queue).
CREATE POLICY survival_moderator_read ON public.survival_checks
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.sites s
            WHERE s.id = survival_checks.site_id
              AND private.can_moderate((SELECT auth.uid()), s.wilaya_code))
  );
-- No INSERT/UPDATE/DELETE policies: writes are server functions only.

-- Q2: last status and next due window per approved site.
-- Windows from planted_date: 3 m (2-5), 12 m (9-18), 36 m (30-48).
CREATE OR REPLACE VIEW public.site_survival_status
WITH (security_invoker = true) AS
SELECT
  s.id AS site_id,
  s.wilaya_code,
  last.status AS last_status,
  last.checked_date AS last_checked_date,
  CASE
    WHEN s.planted_date > CURRENT_DATE - INTERVAL '2 months' THEN 'too_early'
    WHEN s.planted_date > CURRENT_DATE - INTERVAL '5 months'
      AND NOT EXISTS (SELECT 1 FROM public.survival_checks c WHERE c.site_id = s.id
                      AND c.grade <> 'rejected'
                      AND c.checked_date >= s.planted_date + INTERVAL '2 months') THEN 'due_3m'
    WHEN s.planted_date <= CURRENT_DATE - INTERVAL '9 months'
      AND s.planted_date > CURRENT_DATE - INTERVAL '18 months'
      AND NOT EXISTS (SELECT 1 FROM public.survival_checks c WHERE c.site_id = s.id
                      AND c.grade <> 'rejected'
                      AND c.checked_date >= s.planted_date + INTERVAL '9 months') THEN 'due_12m'
    WHEN s.planted_date <= CURRENT_DATE - INTERVAL '30 months'
      AND s.planted_date > CURRENT_DATE - INTERVAL '48 months'
      AND NOT EXISTS (SELECT 1 FROM public.survival_checks c WHERE c.site_id = s.id
                      AND c.grade <> 'rejected'
                      AND c.checked_date >= s.planted_date + INTERVAL '30 months') THEN 'due_36m'
    ELSE 'up_to_date'
  END AS due
FROM public.sites s
LEFT JOIN LATERAL (
  SELECT c.status, c.checked_date FROM public.survival_checks c
  WHERE c.site_id = s.id AND c.grade <> 'rejected'
  ORDER BY c.checked_date DESC, c.created_at DESC LIMIT 1
) last ON true
WHERE s.status = 'approved';

GRANT SELECT ON public.site_survival_status TO anon, authenticated;

-- Q3: survival at 12 months per wilaya. Counts only independent and staff
-- checks, the latest one per site inside the 9-18 month window, never
-- rejected ones. eligible_sites = approved sites at least 9 months old.
CREATE OR REPLACE VIEW public.survival_stats_wilaya
WITH (security_invoker = true) AS
WITH eligible AS (
  SELECT s.id, s.wilaya_code, s.planted_date FROM public.sites s
  WHERE s.status = 'approved' AND s.planted_date <= CURRENT_DATE - INTERVAL '9 months'
), latest AS (
  SELECT DISTINCT ON (c.site_id) c.site_id, c.trees_checked, c.trees_alive
  FROM public.survival_checks c JOIN eligible e ON e.id = c.site_id
  WHERE c.grade <> 'rejected'
    AND c.independence IN ('independent','staff')
    AND c.checked_date BETWEEN e.planted_date + INTERVAL '9 months'
                           AND e.planted_date + INTERVAL '18 months'
  ORDER BY c.site_id, c.checked_date DESC, c.created_at DESC
)
SELECT
  e.wilaya_code,
  count(*)                       AS eligible_sites,
  count(l.site_id)               AS checked_sites,
  COALESCE(sum(l.trees_checked), 0) AS trees_checked,
  COALESCE(sum(l.trees_alive), 0)   AS trees_alive
FROM eligible e LEFT JOIN latest l ON l.site_id = e.id
GROUP BY e.wilaya_code;

GRANT SELECT ON public.survival_stats_wilaya TO anon, authenticated;

-- Throttle kinds: survival (new) + the earlier pending push/vote/identify.
ALTER TABLE public.submission_meta DROP CONSTRAINT submission_meta_kind_check;
ALTER TABLE public.submission_meta ADD CONSTRAINT submission_meta_kind_check
  CHECK (kind = ANY (ARRAY['planting','care','fire','feedback','volunteer',
                           'push','vote','identify','survival']));

-- Realtime: new checks refresh open maps (public columns only via RLS).
ALTER PUBLICATION supabase_realtime ADD TABLE public.survival_checks;

COMMIT;

-- ---------------------------------------------------------------------
-- Rollback (only if needed; deletes survival data):
--   BEGIN;
--   ALTER PUBLICATION supabase_realtime DROP TABLE public.survival_checks;
--   DROP VIEW IF EXISTS public.survival_stats_wilaya;
--   DROP VIEW IF EXISTS public.site_survival_status;
--   DROP TABLE IF EXISTS public.survival_checks;
--   DROP TYPE IF EXISTS public.survival_status;
--   COMMIT;
-- (The widened CHECK can stay; it only allows more throttle kinds.)
-- ---------------------------------------------------------------------
