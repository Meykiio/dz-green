-- =====================================================================
-- Green Algeria â€” full schema export
-- Generated 2026-08-13 from the LIVE database (psql introspection),
-- not from supabase/migrations/*.sql.
--
-- Target: a brand-new, empty Supabase project.
-- Run as the postgres/owner role in the SQL editor, top to bottom.
--
-- Scope: the `public` schema, its enums/functions/policies/grants,
-- the auth signup trigger, the realtime publication, and the `photos`
-- storage bucket. Supabase-managed schemas (auth, storage, realtime,
-- vault, extensions) are assumed to already exist in the target project.
--
-- Not included: row data, auth users, Supabase Auth provider settings,
-- API keys, or anything configured outside SQL.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Extensions
-- ---------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp"          WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto             WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements   WITH SCHEMA extensions;
-- PostGIS lives in `public` on the source project. Keep it there so that
-- the geography column types below resolve without schema qualification.
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

-- ---------------------------------------------------------------------
-- 3. profiles
-- ---------------------------------------------------------------------
CREATE TABLE public.profiles (
  id           uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url   text,
  is_moderator boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- anon deliberately has NO select: profiles are signed-in-only.
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_read_own ON public.profiles
  FOR SELECT TO authenticated USING (id = auth.uid());

CREATE POLICY profiles_insert_own ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Self-service profile edits, but the moderator flag cannot be changed by
-- the user: the new value must equal the currently stored value.
CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND is_moderator = (SELECT p.is_moderator FROM public.profiles p WHERE p.id = auth.uid())
  );

-- ---------------------------------------------------------------------
-- 4. Functions (both SECURITY DEFINER)
-- ---------------------------------------------------------------------

-- Reads one boolean from profiles while bypassing profiles RLS, so that
-- RLS policies elsewhere can check moderator status without recursion.
CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.is_moderator(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id AND is_moderator = true)
$function$;

REVOKE EXECUTE ON FUNCTION private.is_moderator(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION private.is_moderator(uuid) TO authenticated, service_role;

-- Trigger-only helper: creates the profile row at signup.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $function$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------
-- 5. sites
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
  moderator_notes      text
);

CREATE INDEX sites_location_gix   ON public.sites USING GIST (location);
CREATE INDEX sites_status_idx     ON public.sites (status);
CREATE INDEX sites_created_at_idx ON public.sites (created_at DESC);
CREATE INDEX sites_wilaya_idx     ON public.sites (wilaya_code);

-- Reads only for clients. All writes go through the service role.
GRANT SELECT ON public.sites TO anon, authenticated;
GRANT UPDATE ON public.sites TO authenticated;  -- narrowed by the moderator policy
GRANT ALL    ON public.sites TO service_role;

ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;

CREATE POLICY sites_public_read_approved ON public.sites
  FOR SELECT USING (status = 'approved');

CREATE POLICY sites_read_own ON public.sites
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY sites_moderator_read ON public.sites
  FOR SELECT TO authenticated USING (private.is_moderator(auth.uid()));

CREATE POLICY sites_moderator_update ON public.sites
  FOR UPDATE TO authenticated
  USING (private.is_moderator(auth.uid()))
  WITH CHECK (private.is_moderator(auth.uid()));

-- ---------------------------------------------------------------------
-- 6. care_logs
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

CREATE INDEX care_logs_site_idx    ON public.care_logs (site_id);
CREATE INDEX care_logs_created_idx ON public.care_logs (created_at DESC);

GRANT SELECT ON public.care_logs TO anon, authenticated;
GRANT ALL    ON public.care_logs TO service_role;

ALTER TABLE public.care_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY care_logs_public_read ON public.care_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.sites s WHERE s.id = care_logs.site_id AND s.status = 'approved')
  );

-- ---------------------------------------------------------------------
-- 7. fire_reports
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
  reporter_name  text,   -- PII: never granted to anon/authenticated
  reporter_phone text,   -- PII: never granted to anon/authenticated
  user_id        uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status         public.fire_status NOT NULL DEFAULT 'active',
  created_at     timestamptz NOT NULL DEFAULT now(),
  resolved_at    timestamptz
);

CREATE INDEX fire_location_gix ON public.fire_reports USING GIST (location);
CREATE INDEX fire_status_idx   ON public.fire_reports (status);
CREATE INDEX fire_created_idx  ON public.fire_reports (created_at DESC);

-- Column-level SELECT is what hides reporter PII. Do NOT replace this
-- with a table-level GRANT SELECT.
REVOKE SELECT ON public.fire_reports FROM anon, authenticated;
GRANT SELECT (
  id, lat, lng, location, wilaya_code, commune, severity,
  description, photo_url, status, created_at, resolved_at
) ON public.fire_reports TO anon, authenticated;
GRANT UPDATE ON public.fire_reports TO authenticated;  -- narrowed by the moderator policy
GRANT ALL    ON public.fire_reports TO service_role;

ALTER TABLE public.fire_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY fire_public_read ON public.fire_reports
  FOR SELECT USING (true);

CREATE POLICY fire_moderator_update ON public.fire_reports
  FOR UPDATE TO authenticated
  USING (private.is_moderator(auth.uid()))
  WITH CHECK (private.is_moderator(auth.uid()));

-- ---------------------------------------------------------------------
-- 8. submission_meta (abuse ledger â€” deny-all by design)
-- ---------------------------------------------------------------------
CREATE TABLE public.submission_meta (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind               text NOT NULL CONSTRAINT submission_meta_kind_check
                       CHECK (kind IN ('planting','care','fire')),
  ip_hash            text NOT NULL,   -- SHA-256 of "<project-id>:<ip>", never a raw IP
  device_fingerprint text,
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX submission_meta_lookup_idx ON public.submission_meta (ip_hash, created_at DESC);

-- No anon/authenticated grants, RLS on, zero policies: service role only.
GRANT ALL ON public.submission_meta TO service_role;
ALTER TABLE public.submission_meta ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------
-- 9. Realtime publication
-- ---------------------------------------------------------------------
ALTER PUBLICATION supabase_realtime ADD TABLE public.sites;
ALTER PUBLICATION supabase_realtime ADD TABLE public.care_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.fire_reports;

-- ---------------------------------------------------------------------
-- 10. Storage: private `photos` bucket, no client policies
-- ---------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('photos', 'photos', false, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- Intentionally NO policies on storage.objects for this bucket.
-- Uploads use the service role; reads are proxied by /api/public/photo/*.
-- Size (<= 900000 bytes) and mime type (jpeg/png/webp) are enforced in app code.

-- ---------------------------------------------------------------------
-- 11. Notes on things this file cannot recreate
-- ---------------------------------------------------------------------
-- * public.spatial_ref_sys ships with PostGIS. On the source project RLS is
--   OFF on it and cannot be enabled (extension-owned). Same will be true here.
-- * Supabase applies its own default privileges on the `public` schema, so the
--   target project may end up granting anon/authenticated more table-level
--   privileges than the GRANTs above. RLS is what actually blocks writes.
--   The 2026-08-17 roles migration (section 13) revokes the excess â€” run it
--   to match intent.
-- * Auth providers, email templates, JWT settings and secrets are project
--   configuration, not SQL.

-- ---------------------------------------------------------------------
-- 12. Roles (2026-08-17) â€” admin + wilaya-scoped moderators
-- ---------------------------------------------------------------------
-- Source of truth: public.user_roles + public.moderator_wilayas.
-- profiles.is_moderator is a denormalized flag synced by trigger.
-- Assignments use historic wilaya codes (01-48); post-2019 wilayas share
-- their parent territory. Same content as migration 20260817173000.

create type public.user_role as enum (''admin'', ''moderator'');

create table public.user_roles (
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.user_role not null,
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);
alter table public.user_roles enable row level security;
create policy user_roles_read_own on public.user_roles
  for select to authenticated using (user_id = auth.uid());
grant select (user_id, role) on public.user_roles to authenticated;

create table public.moderator_wilayas (
  user_id uuid not null references auth.users (id) on delete cascade,
  wilaya_code text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, wilaya_code)
);
alter table public.moderator_wilayas enable row level security;
-- No client grants: assignments are managed by admins through server functions.

grant select, insert, update, delete on public.user_roles to service_role;
grant select, insert, update, delete on public.moderator_wilayas to service_role;

create or replace function private.user_role(_user_id uuid)
returns public.user_role language sql stable security definer set search_path = ''public'' as $$
  select role from public.user_roles where user_id = _user_id limit 1
$$;

create or replace function private.is_admin(_user_id uuid)
returns boolean language sql stable security definer set search_path = ''public'' as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = ''admin'')
$$;

create or replace function private.user_wilayas(_user_id uuid)
returns text[] language sql stable security definer set search_path = ''public'' as $$
  select coalesce(array_agg(wilaya_code order by wilaya_code), ''{}''::text[])
  from public.moderator_wilayas where user_id = _user_id
$$;

create or replace function private.is_moderator(_user_id uuid)
returns boolean language sql stable security definer set search_path = ''public'' as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role in (''admin'', ''moderator''))
$$;

create or replace function private.can_moderate(_user_id uuid, _wilaya_code text)
returns boolean language sql stable security definer set search_path = ''public'' as $$
  select private.is_admin(_user_id) or (_wilaya_code = any(private.user_wilayas(_user_id)))
$$;

grant execute on function private.user_role(uuid) to authenticated, service_role;
grant execute on function private.is_admin(uuid) to authenticated, service_role;
grant execute on function private.user_wilayas(uuid) to authenticated, service_role;
grant execute on function private.can_moderate(uuid, text) to authenticated, service_role;
grant execute on function private.is_moderator(uuid) to authenticated, service_role;

create or replace function private.sync_profile_moderator_flag()
returns trigger language plpgsql security definer set search_path = ''public'' as $$
declare
  v_user uuid := coalesce(new.user_id, old.user_id);
  v_mod boolean;
begin
  select exists (select 1 from public.user_roles where user_id = v_user and role in (''admin'', ''moderator''))
  into v_mod;
  update public.profiles set is_moderator = v_mod where id = v_user;
  return coalesce(new, old);
end
$$;

drop trigger if exists user_roles_sync_profile on public.user_roles;
create trigger user_roles_sync_profile
  after insert or update or delete on public.user_roles
  for each row execute function private.sync_profile_moderator_flag();

drop policy if exists sites_moderator_read on public.sites;
create policy sites_moderator_read on public.sites
  for select to authenticated using (private.can_moderate(auth.uid(), wilaya_code));

drop policy if exists sites_moderator_update on public.sites;
create policy sites_moderator_update on public.sites
  for update to authenticated
  using (private.can_moderate(auth.uid(), wilaya_code))
  with check (private.can_moderate(auth.uid(), wilaya_code));

drop policy if exists fire_moderator_update on public.fire_reports;
create policy fire_moderator_update on public.fire_reports
  for update to authenticated
  using (private.can_moderate(auth.uid(), wilaya_code))
  with check (private.can_moderate(auth.uid(), wilaya_code));

revoke insert, update, delete, truncate, references, trigger
  on public.sites, public.care_logs, public.fire_reports,
     public.submission_meta, public.profiles
  from anon;

revoke truncate, references, trigger
  on public.sites, public.care_logs, public.fire_reports,
     public.submission_meta, public.profiles
  from authenticated;

-- Promote existing staff: is_moderator=true users become admins.
insert into public.user_roles (user_id, role)
select id, ''admin'' from public.profiles where is_moderator = true
on conflict do nothing;

-- ---------------------------------------------------------------------
-- 13. Receipt links (2026-08-17, Sprint 4)
-- ---------------------------------------------------------------------
-- Anonymous submitters check status via /my/<token>; only the token hash is
-- stored. Same content as migration 20260817190000.

create table public.receipts (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  kind text not null check (kind in (''planting'', ''care'', ''fire'')),
  -- Polymorphic parent: one of sites/care_logs/fire_reports. No FK because
  -- there are three possible parents; the join is resolved in app code.
  submission_id uuid not null,
  created_at timestamptz not null default now()
);

alter table public.receipts enable row level security;
-- Zero client policies: deny-all for anon/authenticated. Service role only.

grant select, insert, delete on public.receipts to service_role;

-- ---------------------------------------------------------------------
-- 14. Wilaya-level submissions (2026-08-18, Sprint 6)
-- ---------------------------------------------------------------------
-- Submissions may carry only a wilaya (no exact pin); the server stores the
-- wilaya''s display centre and marks the row location_approximate = true.
-- Same content as migration 20260817203000.

alter table public.sites add column location_approximate boolean not null default false;
alter table public.fire_reports add column location_approximate boolean not null default false;

-- fire_reports uses column-level SELECT grants; grant the new column explicitly.
grant select (location_approximate) on public.fire_reports to anon, authenticated;

-- ---------------------------------------------------------------------
-- 15. Scale indexes (2026-08-18, Sprint 8)
-- ---------------------------------------------------------------------
-- Composite indexes for the queue read paths and the gate''s two rate-limit
-- queries. Same content as migration 20260818010000.

create index if not exists sites_status_created_idx
  on public.sites (status, created_at desc);

create index if not exists fire_status_created_idx
  on public.fire_reports (status, created_at desc);

create index if not exists submission_meta_kind_created_idx
  on public.submission_meta (kind, created_at desc);

create index if not exists submission_meta_device_kind_created_idx
  on public.submission_meta (device_fingerprint, kind, created_at desc);

-- ---------------------------------------------------------------------
-- 16. Role-read hardening (2026-08-18)
-- ---------------------------------------------------------------------
-- The (user_id, role) PK allows stacked rows; make user_role deterministic
-- (admin wins). Same content as migration 20260818040000.

create or replace function private.user_role(_user_id uuid)
returns public.user_role
language sql stable security definer
set search_path = ''public''
as $$
  select role from public.user_roles where user_id = _user_id order by role asc limit 1
$$;

-- ---------------------------------------------------------------------
-- 17. Feedback box (2026-08-18)
-- ---------------------------------------------------------------------
-- Visitor feedback (home "Feedback" button). Service-role writes only:
-- anon/authenticated grants revoked; RLS on with no policies. Same
-- content as the live migration applied via platform MCP.

create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  -- bug / idea / other (added 2026-08-21, migration 20260821190000)
  kind text not null default 'other' check (kind in ('bug', 'idea', 'other')),
  message text not null check (char_length(message) between 1 and 2000),
  page text,
  device text,
  created_at timestamptz not null default now()
);

alter table public.feedback enable row level security;

revoke all on table public.feedback from anon, authenticated;

grant select, insert, update, delete on table public.feedback to service_role;

comment on table public.feedback is 'Visitor feedback from the home page Feedback dialog; service-role write and read only.';

-- ---------------------------------------------------------------------
-- 18. Planting contact phone (2026-08-21)
-- ---------------------------------------------------------------------
-- Optional phone so a moderator can call to verify a planting. PII: never
-- granted to client roles — moderators read it through a service-role
-- server function only. Same content as migration 20260821180000.

alter table public.sites add column contact_phone text;

-- sites used table-level SELECT for clients until now; switch to explicit
-- column-level grants so contact_phone stays server-only — the same posture
-- fire_reports uses for reporter PII. Do NOT replace this with a
-- table-level GRANT SELECT.
revoke select on public.sites from anon, authenticated;
grant select (
  id, lat, lng, location, wilaya_code, commune, photo_url, species,
  tree_count, planted_date, notes, planter_display_name, user_id, status,
  created_at, reviewed_by, reviewed_at, moderator_notes, location_approximate
) on public.sites to anon, authenticated;

-- ---------------------------------------------------------------------
-- 19. Volunteer applications (2026-08-28)
-- ---------------------------------------------------------------------
-- Moderator-candidate applications from /volunteer. PII-heavy
-- (name/email/phone): same posture as feedback — service-role write and
-- read only; RLS on, zero client policies, no anon/authenticated grants.
-- Same content as supabase/migrations/20260828120000_0a7233e6-fe94-45bb-97f0-0f4441fc23cc.sql.
-- The app stores intents as a comma-joined string (zod enum: review,
-- triage, organize, share, other); the honeypot field `hp` is not stored.

create table public.volunteers (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  email text not null check (char_length(email) between 5 and 200),
  phone text check (char_length(phone) between 6 and 40),
  wilaya_code text not null,
  extra_wilayas text,
  intents text not null check (intents ~ '^(review|triage|organize|share|other)(,(review|triage|organize|share|other))*$'),
  availability text,
  message text check (char_length(message) <= 600),
  status text not null default 'new' check (status in ('new', 'contacted', 'onboarded')),
  created_at timestamptz not null default now()
);

create index volunteers_status_created_idx on public.volunteers (status, created_at desc);
create index volunteers_wilaya_idx on public.volunteers (wilaya_code);

alter table public.volunteers enable row level security;

revoke all on table public.volunteers from anon, authenticated;

grant select, insert, update, delete on table public.volunteers to service_role;

comment on table public.volunteers is
  'Volunteer applications to be wilaya moderators; service-role read/write only, like feedback.';
