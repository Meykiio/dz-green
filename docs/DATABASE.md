# DATABASE — live schema truth

Verified against the **live** database via the platform MCP (tables, columns,
policies, grants, functions, triggers, indexes, publication, bucket) on
**2026-09-12** (documentation audit). Anything not verifiable from SQL is
marked as such.

**Schema source of truth:** `supabase/migrations/00000000000000_master_schema.sql`
— the ONE runnable bootstrap for a fresh project (verified current). The live
project keeps its own platform migration history (`schema_migrations`, 21
entries, 2026-08-17 → 2026-09-02); this repo does not replay it.

## Extensions

`pg_stat_statements`, `uuid-ossp`, `pgcrypto` (extensions schema);
`postgis` in `public` (brings `spatial_ref_sys` + the geometry views).

## Enums

`site_status` (pending/approved/rejected) · `care_action`
(watered/checked/needs_attention/other) · `fire_status`
(active/resolved/false_alarm) · `user_role` (admin/moderator).

## Tables (12, all in `public`)

### profiles
One row per auth user, trigger-created at signup. Columns: `id` (uuid PK,
FK → auth.users CASCADE), `display_name`, `avatar_url` (unused), 
`is_moderator` (denormalized, trigger-synced — never write it directly),
`created_at`.
Policies: `profiles_read_own` (SELECT, own row), `profiles_insert_own`
(INSERT own), `profiles_update_own` (UPDATE own; the new `is_moderator`
must equal the stored value). No DELETE policy. Anon has no grants.

### sites — plantings (moderated)
Columns: id, lat!, lng!, location (generated geography), wilaya_code!,
commune, photo_url!, species, tree_count! (CHECK 1..100000), planted_date!,
notes, planter_display_name, user_id (FK SET NULL), status! (default
pending), created_at!, reviewed_by, reviewed_at, moderator_notes,
location_approximate! (wilaya-level row, lat/lng = display centre),
contact_phone (PII, column-grant protected).
Grants: column-level SELECT (19 cols, excludes `contact_phone`) and
column-level UPDATE (status, reviewed_by, reviewed_at, moderator_notes) for
authenticated; service ALL. `select *` fails on purpose.
Policies: `sites_public_read_approved` (SELECT, approved only),
`sites_read_own` (own rows any status), `sites_moderator_read` /
`sites_moderator_update` (`private.can_moderate`).
No INSERT/DELETE policies — writes are server-function only.
Indexes: location GiST, status, wilaya, created_at DESC,
(status, created_at DESC), user_id, reviewed_by.
Realtime: yes (approved-row filter client-side).

### care_logs
site_id (FK CASCADE), action!, submitter_name, photo_url, notes,
logged_date!, user_id, created_at!. Single policy: public read only when
the parent site is approved. No client writes. Indexes: site_id,
created_at DESC, user_id. Realtime: yes (INSERTs).

### fire_reports
id, lat!, lng!, location (generated), wilaya_code!, commune, severity
(CHECK small/large), description, photo_url, reporter_name + reporter_phone
+ user_id (PII — NOT column-granted to clients), status! (default active),
created_at!, resolved_at, location_approximate!.
Grants: column-level SELECT (13 cols, excludes reporter PII + user_id);
authenticated holds column-level UPDATE (status, resolved_at) only.
Policies: `fire_public_read` (all rows), `fire_moderator_update`
(wilaya-scoped). No INSERT/DELETE policies. `select *` fails on purpose.
Indexes: location GiST, status, created_at DESC, (status, created_at DESC),
user_id. Realtime: yes.

### submission_meta — abuse ledger, deny-all
kind! (CHECK planting/care/fire/feedback/volunteer), ip_hash!
(SHA-256 of `<project-id>:<ip>`), device_fingerprint (daily-rotating HMAC),
created_at!. Zero client grants, RLS on, zero policies. Indexes:
(ip_hash, created_at), (kind, created_at), (device_fingerprint, kind,
created_at).

### user_roles / moderator_wilayas — staff privilege (source of truth)
user_roles: (user_id, role) PK, created_at. Policy: read own rows.
authenticated: column-level SELECT (user_id, role) only; service DML.
moderator_wilayas: (user_id, wilaya_code) PK, **created_at** (present
live; earlier docs omitted it). Zero client grants; service DML.
Trigger `user_roles_sync_profile` rewrites `profiles.is_moderator`
after any change.

### receipts — anonymous receipt tokens (hash only)
token_hash! UNIQUE, kind! (CHECK planting/care/fire), submission_id!
(polymorphic, no FK — resolved in app code), created_at!. Deny-all for
clients; service SELECT/INSERT/DELETE.

### feedback — visitor messages, service-role only
kind! (bug/idea/other), message! (1..2000), page, device (UA ≤300),
created_at!. Zero client grants; service all. Comment on the table marks
the posture.

### volunteers — moderator applications, service-role only (PII-heavy)
name!, email!, phone, wilaya_code!, extra_wilayas, intents! (regex
review|triage|organize|share|other), availability, message (≤600), status!
(new/contacted/onboarded), user_id (applicant account, account-first flow),
created_at!. Zero client grants; service all. Indexes: (status,
created_at), wilaya_code, user_id.

### push_subscriptions — Web Push fire alerts, service-role only
endpoint! UNIQUE (pseudonymous push address), keys! (jsonb {p256dh, auth}),
wilaya_code (null = all Algeria), created_at!. Zero client grants. Index:
wilaya_code.

### announcements — admin marquee
title_ar/body_ar/title_en/body_en/title_fr/body_fr (all NOT NULL with
length CHECKs), kind! (info/success/warning), color! (ink/plant/care/fire/
amber), active!, speed_seconds! (10-120), created_at!.
Policy: `announcements_public_read` — SELECT only where active = true
(anon + authenticated hold SELECT). Service: full DML.

## Functions (private schema, SECURITY DEFINER, `search_path = public`)

`user_role(uuid)` → caller's top role (admin wins deterministically) ·
`is_admin(uuid)` · `is_moderator(uuid)` (any staff role) ·
`user_wilayas(uuid) → text[]` · `can_moderate(uuid, wilaya_code)` (admin OR
assigned wilaya). EXECUTE: authenticated + service_role only. Live reads —
revocation takes effect on the next request. Plus trigger-only
`private.sync_profile_moderator_flag()` and `public.handle_new_user()`
(revoked from clients; fires `on_auth_user_created` on auth.users).

## Triggers

`on_auth_user_created` (auth.users → profile row) ·
`user_roles_sync_profile` (public.user_roles → profiles.is_moderator).
No updated_at columns or triggers anywhere.

## Realtime

Publication `supabase_realtime`: sites, care_logs, fire_reports.

## Storage

Bucket `photos`: **private**, `file_size_limit = 10MB`,
`allowed_mime_types = {image/jpeg, image/png, image/webp}` (the app keeps
its own tighter 900KB cap). Zero policies on `storage.objects` for this
bucket — uploads via service role, public reads only via
`/api/public/photo/*` (1-year cache, immutable UUID paths).

## Grants — client roles (verified live, 2026-09-12)

- Table-level SELECT: care_logs (anon+authed), announcements (anon+authed).
  Everything else is column-level or absent (see per-table notes).
- profiles: no anon grants (revoked).
- **Known excess (hardening gap, open):** `anon` holds grantable
  TRUNCATE/REFERENCES/TRIGGER table bits on announcements, receipts,
  user_roles, moderator_wilayas (Supabase default privileges on newer
  tables; the 2026-08-17 sweep covered only 5 tables). Not reachable via
  the PostgREST API (no TRUNCATE endpoint), and RLS blocks row access, but
  the grant surface should be narrowed — owner-approved migration,
  one-time: see `SECURITY.md` §Open findings. The master schema already
  carries the correct revokes for new projects.
- PostGIS-owned `spatial_ref_sys` / `geometry_columns` /
  `geography_columns`: the 2026-08-30 revoke did not stick (extension-owned
  tables; the migration role is not the owner) — verified live 2026-09-12:
  anon INSERT/DELETE still allowed. Unreachable through the PostgREST API
  but a real hardening gap. Fix is owner-only (below).

## Owner dashboard actions (one-time, postgres role)

```sql
-- spatial_ref_sys (+ the PostGIS views) must be read-only for clients:
alter table public.spatial_ref_sys enable row level security;
create policy spatial_ref_sys_read on public.spatial_ref_sys for select using (true);
revoke insert, update, delete on public.spatial_ref_sys from anon, authenticated, public;
revoke insert, update, delete on public.geometry_columns from anon, authenticated, public;
revoke insert, update, delete on public.geography_columns from anon, authenticated, public;
-- verify:
select has_table_privilege('anon','public.spatial_ref_sys','delete');  -- must be f
```
Reads keep working (PostGIS transforms unaffected).

## Pending (owner approval)

`fire_confirmations` votes table + public `fire_confirmation_counts` view —
SQL ready in `pending-migrations/`; app code already committed and failing
soft until it lands.

## Deploying to a fresh project

Run `supabase/migrations/00000000000000_master_schema.sql` once (postgres
role, top to bottom), then the owner actions above if the PostGIS-owned
tables block them, then seed the first admin:
`INSERT INTO public.user_roles (user_id, role) VALUES ('<auth user id>', 'admin');`
