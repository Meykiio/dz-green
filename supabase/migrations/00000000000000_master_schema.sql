-- =====================================================================
-- GREEN ALGERIA — MASTER SCHEMA (the single bootstrap file)
-- Verified against the LIVE database (Supabase MCP introspection)
-- on 2026-09-12. This is THE schema file: keep it current in the same
-- change that alters the schema; never append incremental migrations.
--
-- Target: a brand-new, empty Supabase project.
-- Run ONCE, top to bottom, as the postgres/owner role (SQL editor).
--
-- Scope: the `public` schema (tables, enums, functions, triggers,
-- indexes, RLS policies, grants), the auth signup trigger, the realtime
-- publication, and the private `photos` storage bucket. Supabase-managed
-- schemas (auth, storage, realtime, vault, extensions) already exist.
--
-- NOT included (intentionally):
--   * Row data, auth users, Auth provider settings, secrets.
--   * public.spatial_ref_sys hardening: the table is PostGIS-owned; the
--     RLS/revoke block below only works as the postgres owner. On a fresh
--     project it may need the same one-time Dashboard run as the source
--     project (see docs/DATABASE.md §Known limitations).
--
-- Authoritative documentation: docs/DATABASE.md.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Extensions
-- ---------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp"          WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto             WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements   WITH SCHEMA extensions;
-- PostGIS lives in `public` on this project so geography columns resolve
-- without schema qualification.
CREATE EXTENSION IF NOT EXISTS postgis              WITH SCHEMA public;

-- ---------------------------------------------------------------------
-- 2. Enums
-- ---------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.site_status AS ENUM ('pending','approved','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.care_action AS ENUM ('watered','checked','needs_attention','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.fire_status AS ENUM ('active','resolved','false_alarm');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('admin','moderator');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Non-API schema for SECURITY DEFINER helpers (not reachable via the API).
CREATE SCHEMA IF NOT EXISTS private;

-- ---------------------------------------------------------------------
-- 3. profiles — one row per auth user (trigger-created at signup)
-- ---------------------------------------------------------------------
CREATE TABLE public.profiles (
  id           uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url   text,
  is_moderator boolean NOT NULL DEFAULT false,  -- trigger-synced flag; never write directly
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_read_own ON public.profiles
  FOR SELECT TO authenticated USING (id = (SELECT auth.uid()));

CREATE POLICY profiles_insert_own ON public.profiles
  FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = id);

-- Self-service edits; the moderator flag cannot be self-changed (the new
-- value must equal the stored value). Promotion is admin/server-function only.
CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK (
    (SELECT auth.uid()) = id
    AND is_moderator = (
      SELECT p.is_moderator FROM public.profiles p WHERE p.id = (SELECT auth.uid())
    )
  );

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- ---------------------------------------------------------------------
-- 4. sites — tree planting submissions (moderated)
-- ---------------------------------------------------------------------
CREATE TABLE public.sites (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lat                  double precision NOT NULL,
  lng                  double precision NOT NULL,
  location             geography(Point,4326)
                         GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography) STORED,
  wilaya_code          text NOT NULL,
  commune              text,
  photo_url            text NOT NULL,
  species              text,
  tree_count           integer NOT NULL DEFAULT 1
                         CONSTRAINT sites_tree_count_check CHECK (tree_count > 0 AND tree_count <= 100000),
  planted_date         date NOT NULL DEFAULT CURRENT_DATE,
  notes                text,
  planter_display_name text,
  user_id              uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status               public.site_status NOT NULL DEFAULT 'pending',
  created_at           timestamptz NOT NULL DEFAULT now(),
  reviewed_by          uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at          timestamptz,
  moderator_notes      text,
  location_approximate boolean NOT NULL DEFAULT false,
  contact_phone        text  -- PII: column-grant protected, server-only
);

CREATE INDEX sites_location_gix           ON public.sites USING GIST (location);
CREATE INDEX sites_status_idx             ON public.sites (status);
CREATE INDEX sites_created_at_idx         ON public.sites (created_at DESC);
CREATE INDEX sites_wilaya_idx             ON public.sites (wilaya_code);
CREATE INDEX sites_status_created_idx     ON public.sites (status, created_at DESC);
CREATE INDEX sites_user_id_idx            ON public.sites (user_id);
CREATE INDEX sites_reviewed_by_idx        ON public.sites (reviewed_by);

-- Column-level SELECT hides contact_phone the same way fire_reports hides
-- reporter PII: `select *` fails on purpose. Do NOT use a table-level SELECT.
REVOKE SELECT ON public.sites FROM anon, authenticated;
GRANT SELECT (
  id, lat, lng, location, wilaya_code, commune, photo_url, species,
  tree_count, planted_date, notes, planter_display_name, user_id, status,
  created_at, reviewed_by, reviewed_at, moderator_notes, location_approximate
) ON public.sites TO anon, authenticated;

-- Moderation writes are column-scoped (RLS scopes the rows).
REVOKE UPDATE ON public.sites FROM authenticated;
GRANT UPDATE (status, reviewed_by, reviewed_at, moderator_notes) ON public.sites TO authenticated;
GRANT ALL ON public.sites TO service_role;

ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;

CREATE POLICY sites_public_read_approved ON public.sites
  FOR SELECT USING (status = 'approved');

CREATE POLICY sites_read_own ON public.sites
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));

CREATE POLICY sites_moderator_read ON public.sites
  FOR SELECT TO authenticated
  USING (private.can_moderate((SELECT auth.uid()), wilaya_code));

CREATE POLICY sites_moderator_update ON public.sites
  FOR UPDATE TO authenticated
  USING (private.can_moderate((SELECT auth.uid()), wilaya_code))
  WITH CHECK (private.can_moderate((SELECT auth.uid()), wilaya_code));

-- ---------------------------------------------------------------------
-- 5. care_logs — open timeline on approved sites, no queue
-- ---------------------------------------------------------------------
CREATE TABLE public.care_logs (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id        uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  action         public.care_action NOT NULL DEFAULT 'watered',
  submitter_name text,
  photo_url      text,
  notes          text,
  logged_date    date NOT NULL DEFAULT CURRENT_DATE,
  user_id        uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX care_logs_site_idx     ON public.care_logs (site_id);
CREATE INDEX care_logs_created_idx  ON public.care_logs (created_at DESC);
CREATE INDEX care_logs_user_id_idx  ON public.care_logs (user_id);

GRANT SELECT ON public.care_logs TO anon, authenticated;
GRANT ALL ON public.care_logs TO service_role;

ALTER TABLE public.care_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY care_logs_public_read ON public.care_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.sites s WHERE s.id = care_logs.site_id AND s.status = 'approved')
  );

-- ---------------------------------------------------------------------
-- 6. fire_reports — publish instantly (speed over review)
-- ---------------------------------------------------------------------
CREATE TABLE public.fire_reports (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lat            double precision NOT NULL,
  lng            double precision NOT NULL,
  location       geography(Point,4326)
                   GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography) STORED,
  wilaya_code    text NOT NULL,
  commune        text,
  severity       text CONSTRAINT fire_reports_severity_check CHECK (severity IN ('small','large')),
  description    text,
  photo_url      text,
  reporter_name  text,   -- PII: column-level grants withheld
  reporter_phone text,   -- PII: column-level grants withheld
  user_id        uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status         public.fire_status NOT NULL DEFAULT 'active',
  created_at     timestamptz NOT NULL DEFAULT now(),
  resolved_at    timestamptz,
  location_approximate boolean NOT NULL DEFAULT false
);

CREATE INDEX fire_location_gix           ON public.fire_reports USING GIST (location);
CREATE INDEX fire_status_idx             ON public.fire_reports (status);
CREATE INDEX fire_created_idx            ON public.fire_reports (created_at DESC);
CREATE INDEX fire_status_created_idx     ON public.fire_reports (status, created_at DESC);
CREATE INDEX fire_reports_user_id_idx    ON public.fire_reports (user_id);

-- Column-level SELECT hides reporter PII (and user_id). Do NOT replace
-- this with a table-level GRANT SELECT.
REVOKE SELECT ON public.fire_reports FROM anon, authenticated;
GRANT SELECT (
  id, lat, lng, location, wilaya_code, commune, severity,
  description, photo_url, status, created_at, resolved_at, location_approximate
) ON public.fire_reports TO anon, authenticated;
REVOKE UPDATE ON public.fire_reports FROM authenticated;
GRANT UPDATE (status, resolved_at) ON public.fire_reports TO authenticated;
GRANT ALL ON public.fire_reports TO service_role;

ALTER TABLE public.fire_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY fire_public_read ON public.fire_reports
  FOR SELECT USING (true);

CREATE POLICY fire_moderator_update ON public.fire_reports
  FOR UPDATE TO authenticated
  USING (private.can_moderate((SELECT auth.uid()), wilaya_code))
  WITH CHECK (private.can_moderate((SELECT auth.uid()), wilaya_code));

-- ---------------------------------------------------------------------
-- 7. submission_meta — abuse ledger, deny-all by design
-- ---------------------------------------------------------------------
CREATE TABLE public.submission_meta (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind               text NOT NULL CONSTRAINT submission_meta_kind_check
                       CHECK (kind = ANY (ARRAY['planting','care','fire','feedback','volunteer'])),
  ip_hash            text NOT NULL,   -- SHA-256 of "<project-id>:<ip>", never a raw IP
  device_fingerprint text,            -- daily-rotating HMAC device hash
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX submission_meta_lookup_idx              ON public.submission_meta (ip_hash, created_at DESC);
CREATE INDEX submission_meta_kind_created_idx        ON public.submission_meta (kind, created_at DESC);
CREATE INDEX submission_meta_device_kind_created_idx ON public.submission_meta (device_fingerprint, kind, created_at DESC);

-- Zero client grants; RLS on with zero policies: service role only.
GRANT ALL ON public.submission_meta TO service_role;
ALTER TABLE public.submission_meta ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------
-- 8. user_roles + moderator_wilayas — staff privilege source of truth
-- ---------------------------------------------------------------------
CREATE TABLE public.user_roles (
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       public.user_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_roles_read_own ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));

GRANT SELECT (user_id, role) ON public.user_roles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO service_role;

CREATE TABLE public.moderator_wilayas (
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wilaya_code  text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, wilaya_code)
);

ALTER TABLE public.moderator_wilayas ENABLE ROW LEVEL SECURITY;
-- Zero client grants: assignment management is admin-only via server functions.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.moderator_wilayas TO service_role;

-- ---------------------------------------------------------------------
-- 9. receipts — anonymous receipt links (token hash only)
-- ---------------------------------------------------------------------
CREATE TABLE public.receipts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash    text NOT NULL UNIQUE,   -- SHA-256("<project-id>:<token>")
  kind          text NOT NULL CHECK (kind IN ('planting','care','fire')),
  -- Polymorphic parent (sites/care_logs/fire_reports): no FK, resolved in app code.
  submission_id uuid NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

-- Zero client policies (deny-all). Lookups go through the getReceipt server fn.
GRANT SELECT, INSERT, DELETE ON public.receipts TO service_role;

-- ---------------------------------------------------------------------
-- 10. feedback — visitor messages, service-role only
-- ---------------------------------------------------------------------
CREATE TABLE public.feedback (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind       text NOT NULL DEFAULT 'other' CHECK (kind IN ('bug','idea','other')),
  message    text NOT NULL CHECK (char_length(message) BETWEEN 1 AND 2000),
  page       text,
  device     text,   -- user-agent snapshot (<= 300 chars) for bug diagnosis
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.feedback FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.feedback TO service_role;

COMMENT ON TABLE public.feedback IS
  'Visitor feedback from the home page Feedback dialog; service-role write and read only.';

-- ---------------------------------------------------------------------
-- 11. volunteers — moderator applications, service-role only (PII-heavy)
-- ---------------------------------------------------------------------
CREATE TABLE public.volunteers (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 80),
  email         text NOT NULL CHECK (char_length(email) BETWEEN 5 AND 200),
  phone         text CHECK (char_length(phone) BETWEEN 6 AND 40),
  wilaya_code   text NOT NULL,
  extra_wilayas text,
  intents       text NOT NULL CHECK (intents ~ '^(review|triage|organize|share|other)(,(review|triage|organize|share|other))*$'),
  availability  text,
  message       text CHECK (char_length(message) <= 600),
  status        text NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','onboarded')),
  user_id       uuid REFERENCES auth.users(id) ON DELETE SET NULL,  -- account-first flow
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX volunteers_status_created_idx ON public.volunteers (status, created_at DESC);
CREATE INDEX volunteers_wilaya_idx         ON public.volunteers (wilaya_code);
CREATE INDEX volunteers_user_id_idx        ON public.volunteers (user_id);

ALTER TABLE public.volunteers ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.volunteers FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.volunteers TO service_role;

COMMENT ON TABLE public.volunteers IS
  'Volunteer applications to be wilaya moderators; service-role read/write only, like feedback.';

COMMENT ON COLUMN public.volunteers.user_id IS
  'auth.users id of the applicant, when they applied signed in (account-first flow).';

-- ---------------------------------------------------------------------
-- 12. push_subscriptions — Web Push fire alerts, service-role only
-- ---------------------------------------------------------------------
CREATE TABLE public.push_subscriptions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint    text NOT NULL UNIQUE,   -- the browser push address (pseudonymous)
  keys        jsonb NOT NULL,         -- {p256dh, auth}
  wilaya_code text,                   -- null = all of Algeria
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX push_subscriptions_wilaya_idx ON public.push_subscriptions (wilaya_code);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.push_subscriptions FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO service_role;

-- ---------------------------------------------------------------------
-- 13. announcements — admin marquee, public reads limited to active rows
-- ---------------------------------------------------------------------
CREATE TABLE public.announcements (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_ar      text NOT NULL CONSTRAINT announcements_title_ar_len CHECK (char_length(title_ar) BETWEEN 1 AND 120),
  body_ar       text NOT NULL CONSTRAINT announcements_body_ar_len CHECK (char_length(body_ar) BETWEEN 1 AND 600),
  title_en      text NOT NULL CONSTRAINT announcements_title_en_len CHECK (char_length(title_en) BETWEEN 1 AND 120),
  body_en       text NOT NULL CONSTRAINT announcements_body_en_len CHECK (char_length(body_en) BETWEEN 1 AND 600),
  title_fr      text NOT NULL CONSTRAINT announcements_title_fr_len CHECK (char_length(title_fr) BETWEEN 1 AND 120),
  body_fr       text NOT NULL CONSTRAINT announcements_body_fr_len CHECK (char_length(body_fr) BETWEEN 1 AND 600),
  kind          text NOT NULL DEFAULT 'info' CHECK (kind IN ('info','success','warning')),
  color         text NOT NULL DEFAULT 'ink' CHECK (color IN ('ink','plant','care','fire','amber')),
  active        boolean NOT NULL DEFAULT false,
  speed_seconds smallint NOT NULL DEFAULT 32 CHECK (speed_seconds BETWEEN 10 AND 120),
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY announcements_public_read ON public.announcements
  FOR SELECT USING (active = true);

GRANT SELECT ON public.announcements TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcements TO service_role;

-- ---------------------------------------------------------------------
-- 14. Functions — SECURITY DEFINER helpers live in `private`
-- ---------------------------------------------------------------------

-- Role helpers: user_roles is the source of truth (live reads, no JWT staleness).
CREATE OR REPLACE FUNCTION private.user_role(_user_id uuid)
RETURNS public.user_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $function$
  SELECT role FROM public.user_roles WHERE user_id = _user_id ORDER BY role ASC LIMIT 1
$function$;

CREATE OR REPLACE FUNCTION private.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $function$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin')
$function$;

CREATE OR REPLACE FUNCTION private.is_moderator(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $function$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','moderator'))
$function$;

CREATE OR REPLACE FUNCTION private.user_wilayas(_user_id uuid)
RETURNS text[]
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $function$
  SELECT COALESCE(ARRAY_AGG(wilaya_code ORDER BY wilaya_code), '{}'::text[])
  FROM public.moderator_wilayas WHERE user_id = _user_id
$function$;

CREATE OR REPLACE FUNCTION private.can_moderate(_user_id uuid, _wilaya_code text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $function$
  SELECT private.is_admin(_user_id) OR (_wilaya_code = ANY (private.user_wilayas(_user_id)))
$function$;

-- Trigger helper: keeps profiles.is_moderator in sync with user_roles.
CREATE OR REPLACE FUNCTION private.sync_profile_moderator_flag()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
DECLARE
  v_user uuid := COALESCE(NEW.user_id, OLD.user_id);
  v_mod  boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = v_user AND role IN ('admin','moderator')
  ) INTO v_mod;
  UPDATE public.profiles SET is_moderator = v_mod WHERE id = v_user;
  RETURN COALESCE(NEW, OLD);
END;
$function$;

DROP TRIGGER IF EXISTS user_roles_sync_profile ON public.user_roles;
CREATE TRIGGER user_roles_sync_profile
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION private.sync_profile_moderator_flag();

-- Trigger-only helper: creates the profile row at signup.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Executable by authenticated + service_role only (never anon/PUBLIC).
REVOKE EXECUTE ON FUNCTION private.user_role(uuid),     private.is_admin(uuid),
                            private.is_moderator(uuid), private.user_wilayas(uuid),
                            private.can_moderate(uuid, text), private.sync_profile_moderator_flag()
FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION private.user_role(uuid),     private.is_admin(uuid),
                            private.is_moderator(uuid), private.user_wilayas(uuid),
                            private.can_moderate(uuid, text)
TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- The Supabase DDL helper must never be callable by clients (audit S3).
DO $$ BEGIN
  EXECUTE 'REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM public';
  EXECUTE 'REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon, authenticated';
EXCEPTION WHEN undefined_function THEN NULL; END $$;

-- ---------------------------------------------------------------------
-- 14b. fire_confirmations — community votes, service-role only
-- ---------------------------------------------------------------------
CREATE TABLE public.fire_confirmations (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fire_report_id uuid NOT NULL REFERENCES public.fire_reports(id) ON DELETE CASCADE,
  voter_key      text NOT NULL,   -- daily-rotating device hash, never a raw IP
  verdict        text NOT NULL CHECK (verdict IN ('yes','no','unsure')),
  voter_trust    numeric NOT NULL DEFAULT 1.0,
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (fire_report_id, voter_key)
);

CREATE INDEX fire_confirmations_report_idx ON public.fire_confirmations (fire_report_id);
CREATE INDEX fire_confirmations_voter_idx  ON public.fire_confirmations (voter_key);

ALTER TABLE public.fire_confirmations ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.fire_confirmations FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fire_confirmations TO service_role;

-- Public per-fire aggregates only (no per-voter data exposed).
CREATE OR REPLACE VIEW public.fire_confirmation_counts AS
SELECT
  fire_report_id,
  count(*) FILTER (WHERE verdict = 'yes') AS conf_yes,
  count(*) FILTER (WHERE verdict = 'no') AS conf_no,
  count(*) FILTER (WHERE verdict = 'unsure') AS conf_unsure,
  (count(*) FILTER (WHERE verdict = 'yes') >= 3
     AND count(*) FILTER (WHERE verdict = 'yes')::numeric
         / NULLIF(count(*) FILTER (WHERE verdict IN ('yes','no')), 0) > 0.7) AS community_verified
FROM public.fire_confirmations
GROUP BY fire_report_id;

GRANT SELECT ON public.fire_confirmation_counts TO anon, authenticated;

-- ---------------------------------------------------------------------
-- 15. Client-role cleanup on app tables (defense in depth)
-- ---------------------------------------------------------------------
-- Supabase default privileges hand anon/authenticated write bits + TRUNCATE
-- on new public tables; RLS blocks row writes, but revoke the leftovers so
-- the grant surface matches intent on every table.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.sites, public.care_logs, public.fire_reports,
     public.submission_meta, public.profiles, public.receipts,
     public.feedback, public.volunteers, public.push_subscriptions,
     public.announcements, public.user_roles, public.moderator_wilayas
  FROM anon;
REVOKE INSERT, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.sites, public.care_logs, public.fire_reports,
     public.submission_meta, public.profiles, public.receipts,
     public.feedback, public.volunteers, public.push_subscriptions,
     public.announcements, public.user_roles, public.moderator_wilayas
  FROM authenticated;

-- PostGIS metadata: readable by clients, never writable. NOTE: these tables
-- are extension-owned — if the revokes silently fail (the migration role is
-- not the owner), apply the owner-level block in docs/DATABASE.md §"Owner
-- dashboard actions".
REVOKE INSERT, UPDATE, DELETE ON public.geometry_columns, public.geography_columns, public.spatial_ref_sys FROM anon, authenticated;
REVOKE TRUNCATE, REFERENCES, TRIGGER
  ON public.geometry_columns, public.geography_columns, public.spatial_ref_sys
  FROM anon, authenticated;

-- ---------------------------------------------------------------------
-- 16. Realtime publication
-- ---------------------------------------------------------------------
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.sites;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.care_logs;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.fire_reports;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------
-- 17. Storage: private `photos` bucket, zero client policies
-- ---------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('photos', 'photos', false, 10485760, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Intentionally NO policies on storage.objects for this bucket.
-- Uploads use the service role (900KB cap + magic-byte sniff in app code);
-- public reads are proxied by /api/public/photo/* with long cache headers.

-- ---------------------------------------------------------------------
-- 18. Known one-time owner actions this file cannot do
-- ---------------------------------------------------------------------
-- * public.spatial_ref_sys: extension-owned. On the source project the
--   migration role could not revoke or enable RLS on it — verified live.
--   Owner-only fix (Dashboard SQL editor), documented in docs/DATABASE.md:
--     alter table public.spatial_ref_sys enable row level security;
--     create policy spatial_ref_sys_read on public.spatial_ref_sys for select using (true);
--     revoke insert, update, delete on public.spatial_ref_sys from anon, authenticated, public;
-- =====================================================================
