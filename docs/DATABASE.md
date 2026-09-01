# DATABASE.md

Verified directly against the **live** database via `psql` and the platform MCP (`pg_class`, `pg_policies`, `pg_proc`, `pg_trigger`, `pg_indexes`, `information_schema`, `storage.buckets`), not from the migration files: 2026-08-13, re-verified 2026-08-18 (policies, functions, indexes, enums, bucket, realtime publication — all match). Anything I could not read from the live instance is marked as such. `public.feedback` added 2026-08-18 (section 18 below).

**2026-08-17 project migration.** The app moved to a new, empty Supabase project (`jnunqilxiajinylgehuh`); this exact schema was re-applied there from `FULL_SCHEMA_EXPORT.sql` and re-verified table-by-table via MCP (same policies, grants, functions, bucket, realtime publication). Row counts are deliberately **not** in this file — they change daily. Verify against the live project.

**2026-08-17 roles rework (Sprint 3).** Privilege no longer lives in `profiles.is_moderator` alone: `public.user_roles` + `public.moderator_wilayas` are the source of truth, with `admin` (everything) and `moderator` (wilaya-scoped) roles. All moderator policies now call `private.can_moderate`; `profiles.is_moderator` is a denormalized flag kept in sync by the `user_roles_sync_profile` trigger. Grants on app tables were tightened in the same migration (the "broad default privileges" caveat below is resolved). (`alert_contacts` and its `private.can_manage_contact` helper were dropped 2026-08-20 — the alerting feature was storage-only and never wired to send anything; see `ROADMAP.md` "Parked".)

Postgres: Supabase managed. Schema documented here: `public` (+ relevant `storage` and `auth` touchpoints).

## Extensions (live)

| Extension | Version | Schema |
|---|---|---|
| `plpgsql` | 1.0 | `pg_catalog` |
| `pg_stat_statements` | 1.11 | `extensions` |
| `uuid-ossp` | 1.1 | `extensions` |
| `pgcrypto` | 1.3 | `extensions` |
| `supabase_vault` | 0.3.1 | `vault` |
| `postgis` | 3.3.7 | `public` |

`postgis` installed into `public` also creates `public.spatial_ref_sys` and the PostGIS views (`geography_columns`, `geometry_columns`). Those are extension-owned, not app tables.

## Enums

| Type | Values (in order) |
|---|---|
| `site_status` | `pending`, `approved`, `rejected` |
| `care_action` | `watered`, `checked`, `needs_attention`, `other` |
| `fire_status` | `active`, `resolved`, `false_alarm` |
| `user_role` | `admin`, `moderator` |

## Tables

### `public.profiles`

One row per auth user, created automatically by the `on_auth_user_created` trigger.

| Column | Type | Null | Default | Purpose |
|---|---|---|---|---|
| `id` | uuid PK | no | — | Same id as `auth.users.id`. FK → `auth.users(id) ON DELETE CASCADE`. |
| `display_name` | text | yes | — | Shown name; seeded from user metadata or the email local part. |
| `avatar_url` | text | yes | — | Unused by the current UI. |
| `is_moderator` | boolean | no | `false` | **Denormalized flag** (2026-08-17): kept in sync with `user_roles` by the `user_roles_sync_profile` trigger — `true` when the user holds any staff role. Do not write it directly; change roles instead. |
| `created_at` | timestamptz | no | `now()` | — |

RLS **enabled**. Policies:

- `profiles_read_own` — `FOR SELECT TO authenticated USING (id = auth.uid())`. A signed-in user can read **only their own** profile row (tightened 2026-08-16, replacing `profiles_authenticated_read` which used `USING (true)`). Anonymous visitors cannot read profiles at all (the `anon` SELECT grant was revoked). The only client read is the caller's own `is_moderator` flag in `useAuth`.
- `profiles_insert_own` — `FOR INSERT TO authenticated WITH CHECK (auth.uid() = id)`. A signed-in user may only insert their own row.
- `profiles_update_own` — `FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id AND is_moderator = (SELECT p.is_moderator FROM profiles p WHERE p.id = auth.uid()))`. Users can edit their own profile but cannot change their own moderator flag — the check forces the new value to equal the current stored value. Granting moderator therefore requires service-role/SQL access.

No DELETE policy — nobody can delete profiles through the API.

### `public.sites`

Tree planting submissions; the anchor record for care logs.

| Column | Type | Null | Default | Purpose |
|---|---|---|---|---|
| `id` | uuid PK | no | `gen_random_uuid()` | |
| `lat` / `lng` | double precision | no | — | Raw coordinates submitted from the precision picker or GPS. |
| `location` | `geography(Point,4326)` | yes | **generated always** `ST_SetSRID(ST_MakePoint(lng,lat),4326)::geography` stored | Derived; never written directly. |
| `wilaya_code` | text | no | — | Wilaya identifier (matches `src/lib/wilayas.ts`). Server-derived from the pin, or the chosen wilaya for wilaya-level rows. |
| `location_approximate` | boolean | no | `false` | `true` = wilaya-level submission (no exact pin); lat/lng hold the wilaya's display centre and the UI shows a "wilaya-level" badge (2026-08-17). |
| `commune` | text | yes | — | Free text, optional. |
| `photo_url` | text | no | — | Storage **path** inside the private `photos` bucket (e.g. `sites/<uuid>.webp`), not a URL. |
| `species` | text | yes | — | Optional. |
| `tree_count` | integer | no | `1` | CHECK `> 0 AND <= 100000`. |
| `planted_date` | date | no | `CURRENT_DATE` | |
| `notes` | text | yes | — | |
| `planter_display_name` | text | yes | — | Works without login. |
| `user_id` | uuid | yes | — | FK → `auth.users(id) ON DELETE SET NULL`. Set only when the submitter was signed in. |
| `status` | `site_status` | no | `pending` | Moderation state. |
| `created_at` | timestamptz | no | `now()` | |
| `reviewed_by` | uuid | yes | — | FK → `auth.users(id) ON DELETE SET NULL`. Written by the moderator queue on approve/reject (2026-08-16). |
| `reviewed_at` | timestamptz | yes | — | Same: unused by current code. |
| `moderator_notes` | text | yes | — | Optional note typed by the moderator when approving/rejecting; `null` when left blank. |
| `contact_phone` | text | yes | — | **PII (2026-08-21).** Optional phone so a moderator can call to verify. **Column-grant protected like fire reporter PII:** `SELECT` on `sites` for `anon`/`authenticated` is now an explicit column list that excludes it — client queries must list columns and `select *` fails on purpose. Moderators read it through a service-role server function only. |

Indexes: `sites_pkey` (btree id), `sites_location_gix` (GiST location), `sites_status_idx`, `sites_wilaya_idx`, `sites_created_at_idx` (created_at DESC), `sites_status_created_idx` (status, created_at DESC — 2026-08-18, queue read path).

Grants (updated 2026-08-30): `SELECT` on `sites` for `anon`/`authenticated` is **column-level** (19 columns, excluding `contact_phone`). `UPDATE` for `authenticated` is also **column-level** (security sweep): only `status, reviewed_by, reviewed_at, moderator_notes` — moderators can no longer write tree_count/photo_url/PII via direct client updates. All other writes go through the service role.

RLS **enabled**. Policies:

- `sites_public_read_approved` — `FOR SELECT USING (status = 'approved')`, role `public`. Anyone, signed in or not, sees approved plantings only.
- `sites_read_own` — `FOR SELECT TO authenticated USING (user_id = auth.uid())`. A signed-in submitter can see their own pending/rejected rows. Anonymous submitters cannot see their own pending row — by design, since there is no anonymous identity.
- `sites_moderator_read` — `FOR SELECT TO authenticated USING (private.can_moderate(auth.uid(), wilaya_code))`. Admins see everything; moderators see only rows in their assigned wilayas (2026-08-17).
- `sites_moderator_update` — `FOR UPDATE TO authenticated USING/WITH CHECK (private.can_moderate(auth.uid(), wilaya_code))`. Same scoping for writes: a moderator's cross-wilaya UPDATE is an RLS no-op (204, row unchanged), not an error.

No INSERT and no DELETE policies exist. All inserts happen through the service-role server functions; no client can insert or delete directly.

In the realtime publication `supabase_realtime`.

### `public.care_logs`

| Column | Type | Null | Default | Purpose |
|---|---|---|---|---|
| `id` | uuid PK | no | `gen_random_uuid()` | |
| `site_id` | uuid | no | — | FK → `sites(id) ON DELETE CASCADE`. |
| `action` | `care_action` | no | `'watered'` | |
| `submitter_name` | text | yes | — | Works without login. |
| `photo_url` | text | yes | — | Storage path in `photos` (`care/...`). |
| `notes` | text | yes | — | |
| `logged_date` | date | no | `CURRENT_DATE` | Drives the client-side "needs water" 14-day flag. |
| `user_id` | uuid | yes | — | FK → `auth.users(id) ON DELETE SET NULL`. |
| `created_at` | timestamptz | no | `now()` | |

Indexes: `care_logs_pkey`, `care_logs_site_idx` (site_id), `care_logs_created_idx` (created_at DESC).

RLS **enabled**. Single policy:

- `care_logs_public_read` — `FOR SELECT USING (EXISTS (SELECT 1 FROM sites s WHERE s.id = care_logs.site_id AND s.status = 'approved'))`. Anyone can read care logs, but only those attached to an approved site; logs on pending/rejected sites are invisible to everyone except service role.

No INSERT/UPDATE/DELETE policies. Writes are service-role only. In the realtime publication.

### `public.fire_reports`

| Column | Type | Null | Default | Purpose |
|---|---|---|---|---|
| `id` | uuid PK | no | `gen_random_uuid()` | |
| `lat` / `lng` | double precision | no | — | |
| `location` | `geography(Point,4326)` | yes | generated always, stored | Derived from lng/lat. |
| `wilaya_code` | text | no | — | |
| `location_approximate` | boolean | no | `false` | Same wilaya-level semantics as `sites` (2026-08-17). Column-granted to `anon`/`authenticated` like the other public columns. |
| `commune` | text | yes | — | |
| `severity` | text | yes | — | CHECK `IN ('small','large')`. |
| `description` | text | yes | — | |
| `photo_url` | text | yes | — | Storage path (`fires/...`). |
| `reporter_name` | text | yes | — | **PII. Not readable by `anon` or `authenticated`** (column grant withheld). |
| `reporter_phone` | text | yes | — | **PII. Same restriction.** |
| `user_id` | uuid | yes | — | FK → `auth.users(id) ON DELETE SET NULL`. Also not column-granted to clients. |
| `status` | `fire_status` | no | `'active'` | |
| `created_at` | timestamptz | no | `now()` | |
| `resolved_at` | timestamptz | yes | — | Column exists and is readable; **no code currently writes it**. |

Indexes: `fire_reports_pkey`, `fire_location_gix` (GiST), `fire_status_idx`, `fire_created_idx` (created_at DESC), `fire_status_created_idx` (status, created_at DESC — 2026-08-18).

RLS **enabled**. Policies:

- `fire_public_read` — `FOR SELECT USING (true)`, role `public`. Everyone can read fire reports — but only the columns they hold a grant for (see below). Fires are deliberately unmoderated: speed over review.
- `fire_moderator_update` — `FOR UPDATE TO authenticated USING/WITH CHECK (private.can_moderate(auth.uid(), wilaya_code))`. Admins may change any report; moderators only reports in their assigned wilayas (2026-08-17). Driven by the fire triage panel in the moderator dashboard.

No INSERT/DELETE policies; inserts go through the service-role server function.

**Column-level grants (this is what actually hides the PII):** table-level SELECT was revoked from `anon` and `authenticated`; SELECT is granted per column on `id, lat, lng, location, wilaya_code, commune, severity, description, photo_url, status, created_at, resolved_at` only. A client that does `select *` gets a permission error — client queries must list columns explicitly, which `src/lib/data.ts` does. **UPDATE is also column-level (2026-08-30 security sweep):** only `status, resolved_at` — moderators can no longer write severity/description/photo_url/reporter PII via direct client updates.

### `public.submission_meta`

Abuse ledger for the rate limiter. Never exposed to clients.

| Column | Type | Null | Default | Purpose |
|---|---|---|---|---|
| `id` | uuid PK | no | `gen_random_uuid()` | |
| `kind` | text | no | — | CHECK `IN ('planting','care','fire','feedback','volunteer')` — the last two added 2026-08-30 for the shared throttle. |
| `ip_hash` | text | no | — | SHA-256 of `"<project-id>:<ip>"`. Raw IPs are never stored. |
| `device_fingerprint` | text | yes | — | Daily-rotating **device hash** (2026-08-17): `HMAC-SHA256(server key, SHA-256(client secret + kind + UTC date))`. Never a raw secret, never a real fingerprint. |
| `created_at` | timestamptz | no | `now()` | |

Index: `submission_meta_lookup_idx` on `(ip_hash, created_at DESC)`; plus `submission_meta_kind_created_idx` (kind, created_at DESC) and `submission_meta_device_kind_created_idx` (device_fingerprint, kind, created_at DESC) — both 2026-08-18, matching the gate's two rate-limit queries.

RLS **enabled with zero policies** — deliberate deny-all. Only service role (which bypasses RLS) can read or write.

### `public.user_roles` (2026-08-17)

Source of truth for staff privilege. Never trust `user_metadata` for roles.

| Column | Type | Null | Default | Purpose |
|---|---|---|---|---|
| `user_id` | uuid | no | — | FK → `auth.users(id) ON DELETE CASCADE`. Part of PK. |
| `role` | `user_role` | no | — | `admin` or `moderator`. Part of PK (`user_id, role`). |

RLS **enabled**. Single policy `user_roles_read_own` — `FOR SELECT TO authenticated USING (user_id = auth.uid())`: a signed-in user reads only their own role(s) (this is what `useAuth` does). Grant: `SELECT (user_id, role)` to `authenticated`; full DML to `service_role` only. All role changes go through the admin server functions (`src/lib/admin.functions.ts`), which re-check the caller's role live on every call.

### `public.moderator_wilayas` (2026-08-17)

Wilaya assignments for moderators. **Since the 69-wilaya map (2026-09-01):** assignments use any of the 69 codes; a moderator of a split parent keeps territory via expansion rows (2019 + 2025 children added alongside their code — the idempotent expansion SQL ran 2026-09-01, 0 rows needed it that day). Before that: assignments used the historic 01–48 codes with post-2019 wilayas sharing the parent's territory.

| Column | Type | Null | Default | Purpose |
|---|---|---|---|---|
| `user_id` | uuid | no | — | FK → `auth.users(id) ON DELETE CASCADE`. Part of PK. |
| `wilaya_code` | text | no | — | Historic wilaya code. Part of PK (`user_id, wilaya_code`). |

RLS **enabled with zero client policies** — no client reads or writes assignments; management is service-role only via the admin server functions.

### `public.receipts` (2026-08-17, Sprint 4)

Receipt-link tokens for anonymous submissions. The raw token is a 128-bit UUID shown once on the success screen (`/my/<token>`); only its salted SHA-256 hash is stored, so a database read never reveals a working link.

| Column | Type | Null | Default | Purpose |
|---|---|---|---|---|
| `id` | uuid PK | no | `gen_random_uuid()` | |
| `token_hash` | text | no | — | UNIQUE. `SHA-256("<project-id>:<token>")`. |
| `kind` | text | no | — | CHECK `IN ('planting','care','fire')`. |
| `submission_id` | uuid | no | — | Polymorphic parent (one of `sites`/`care_logs`/`fire_reports`). No FK — three possible parents; resolved in app code. |
| `created_at` | timestamptz | no | `now()` | |

RLS **enabled with zero client policies** — deny-all for `anon`/`authenticated`; `SELECT`/`INSERT`/`DELETE` granted to `service_role` only. Lookups go through the `getReceipt` server function, which returns kind, status, date and wilaya — never PII, never the photo.

### `public.feedback` (2026-08-18)

Visitor feedback box (home page "Feedback" button). Writes come from the `submitFeedback` server function; reads are service-role only, surfaced to admins via the read-only Feedback panel on `/admin` (`adminListFeedback`, latest 100).

| Column | Type | Null | Default | Purpose |
|---|---|---|---|---|
| `id` | uuid PK | no | `gen_random_uuid()` | |
| `kind` | text | no | `'other'` | CHECK `kind IN ('bug','idea','other')` — structured feedback (2026-08-21): the dialog offers Bug / Feature idea / Other; the admin panel badges each message. |
| `message` | text | no | — | CHECK `char_length(message) BETWEEN 1 AND 2000` (mirrors the client-side zod rule). |
| `page` | text | yes | — | Path the feedback was sent from (e.g. `/about`); informational. |
| `device` | text | yes | — | User-agent snapshot (≤300 chars, client-capped) so bug reports are diagnosable — added 2026-08-20. |
| `created_at` | timestamptz | no | `now()` | |

RLS **enabled with zero client policies** — `anon`/`authenticated` have no grants at all (revoked); only `service_role` can write or read. **Note:** RLS bypass does not imply table privileges — `service_role` needed an explicit `GRANT SELECT, INSERT, UPDATE, DELETE` (added 2026-08-19 after a live insert failed with 42501). Bot spam is handled client-side by the shared honeypot; no rate limit (deliberately — this is a low-value write path).

### `public.volunteers` (2026-08-28 — live, applied via MCP; extended 2026-08-29)

Moderator-candidate applications from `/volunteer`. Same privacy posture as `feedback`: writes come from the `submitVolunteer` service-role server function (zod `volunteerSchema`, honeypot); reads service-role only (`adminListVolunteers` / `adminSetVolunteerStatus` / `adminOnboardVolunteer`, `requireAdmin`). **PII-heavy** (name/email/phone), so zero grants for `anon`/`authenticated`; DDL stored in `supabase/migrations/20260828120000_*.sql` (+ `20260829100000_volunteers_user_id.sql`).

| Column | Type | Null | Default | Purpose |
|---|---|---|---|---|
| `id` | uuid PK | no | `gen_random_uuid()` | |
| `name` | text | no | — | CHECK `char_length(name) BETWEEN 2 AND 80`. |
| `email` | text | no | — | CHECK `char_length(email) BETWEEN 5 AND 200` (zod `.email()` does the real validation). |
| `phone` | text | yes | — | CHECK `char_length(phone) BETWEEN 6 AND 40`. Optional but encouraged (WhatsApp). |
| `wilaya_code` | text | no | — | Two-digit code from the UI; no DB check (zod min 1, max 4). |
| `extra_wilayas` | text | yes | — | Free text (≤120). |
| `intents` | text | no | — | Comma-joined list of `review, triage, organize, share, other` (zod enum; migration CHECK mirrors it with a regex). Zod requires ≥1. |
| `availability` | text | yes | — | Free text (≤120 client-side, no DB check). |
| `message` | text | yes | — | CHECK `char_length(message) <= 600`. |
| `status` | text | no | `'new'` | CHECK `status IN ('new','contacted','onboarded')` — admin pipeline. `onboarded` = account linked + moderator role assigned in "Users & roles" (or one-click onboard). |
| `user_id` | uuid | yes | — | **2026-08-29:** the applicant's `auth.users` id when applied signed in (account-first flow). Indexed. Onboarding assigns role + wilaya to this account. |
| `created_at` | timestamptz | no | `now()` | |

Indexes: `(status, created_at desc)`, `(wilaya_code)`, `(user_id)`. The app's honeypot field is `hp` — validated client-side, **never stored**. RLS enabled, **zero policies**, anon/authenticated grants revoked; only `service_role` has table grants. **Live as of 2026-08-28** (applied via MCP; verified columns/grants/zero policies post-apply — see `FEATURES.md` §10).

### `public.push_subscriptions` (2026-08-31 — live, applied via MCP)

Web Push fire-alert subscriptions (release phase B). One row per browser subscription. The `endpoint` is the browser's private push address (pseudonymous — no account, no PII); `wilaya_code` scopes alerts when set (null = all of Algeria). Same privacy posture as `feedback`/`volunteers`: writes from the `subscribePush`/`unsubscribePush` service-role server functions, reads service-role only (`notifyFireSubscribers` in `push.server.ts`). Migration mirrored in `supabase/migrations/20260831120000_*.sql`.

| Column | Type | Null | Default | Purpose |
|---|---|---|---|---|
| `id` | uuid PK | no | `gen_random_uuid()` | |
| `endpoint` | text | no | — | UNIQUE. The push service URL (up to ~1k chars). |
| `keys` | jsonb | no | — | `{p256dh, auth}` encryption keys from the browser. |
| `wilaya_code` | text | yes | — | Two-digit code, or null = all fires. Post-2019 codes resolve to the historic parent at send time. |
| `created_at` | timestamptz | no | `now()` | |

Index: `(wilaya_code)`. RLS **enabled with zero client policies** — anon/authenticated grants revoked; only `service_role` has table grants. Stale subscriptions (push service answers 404/410) are deleted at send time.

### `public.announcements` (2026-09-01 — live, applied via MCP)

Admin-controlled site-wide banner (owner request). One active at a time (enforced in app code — activating one clears the others). Public reads are RLS-limited to the active row only; all writes are service-role (the `adminCreateAnnouncement`/`adminSetAnnouncementActive`/`adminDeleteAnnouncement` fns, `requireAdmin`). Migration mirrored in `supabase/migrations/20260901120000_*.sql`.

| Column | Type | Null | Default | Purpose |
|---|---|---|---|---|
| `id` | uuid PK | no | `gen_random_uuid()` | |
| `title_ar` / `body_ar` | text | no | — | Arabic text (CHECK ≤120/≤600). The banner picks by visitor locale. |
| `title_en` / `body_en` | text | no | — | English text (same checks). |
| `kind` | text | no | `'info'` | CHECK `IN ('info','success','warning')` — icon tone. |
| `color` | text | no | `'ink'` | CHECK `IN ('ink','plant','care','fire','amber')` — curated contrast-safe palette (2026-09-01). |
| `active` | boolean | no | `false` | Only active rows are publicly readable. **Several rows can be active at once** (2026-09-01) — the strip joins them; color/speed from the newest. |
| `speed_seconds` | smallint | no | `32` | Marquee loop duration, CHECK 10–120 (2026-09-01). |
| `created_at` | timestamptz | no | `now()` | |

RLS **enabled**. One policy: `announcements_public_read` — `FOR SELECT USING (active = true)`; anon/authenticated hold `SELECT` (active rows only by design). `service_role` holds explicit `SELECT, INSERT, UPDATE, DELETE` (the SELECT grant matters — RLS bypass does not imply table privilege; owner caught the empty admin list 2026-09-01). Bilingual columns + color added by `20260901130000_announcements_bilingual.sql` (backfilled from the original title/body).

### `public.spatial_ref_sys`

PostGIS reference table, extension-owned. **RLS is off** and cannot be enabled from a migration on Supabase (the role does not own the table). It contains static public projection definitions with no user data. Accepted risk, recorded in security memory.

## Grants — live picture

The 2026-08-17 roles migration tightened the Supabase project-default privileges that used to give `anon`/`authenticated` broad table rights (`arwdDxtm`-style) on app tables. Current state: `anon` holds only SELECT grants (and none on `profiles`); `authenticated` holds SELECT/INSERT/UPDATE where a policy exists, with `TRUNCATE`/`REFERENCES`/`TRIGGER` revoked everywhere. RLS was already the effective guard; the grants now match intent.

Explicitly hardened deviations from the defaults:

- `profiles`: SELECT revoked from `anon`.
- `fire_reports`: table SELECT revoked from `anon` and `authenticated`, replaced by the column list above; UPDATE granted to `authenticated` (gated by the moderator policy).
- `user_roles`: column grant `SELECT (user_id, role)` to `authenticated`; full DML to `service_role`.
- `moderator_wilayas`: no client grants at all; full DML to `service_role`.

## Functions

### `private.is_moderator(_user_id uuid) → boolean`

Relocated from `public` to the `private` schema on 2026-08-16 so it is not reachable through the Data API as an RPC. **Redefined 2026-08-17:** now means "holds any staff role" —

```sql
SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','moderator'))
```

`SECURITY DEFINER` (lives in the non-API `private` schema, runs as owner `postgres`, bypassing RLS) so RLS policies can check privilege without recursing into policies. **Who can call it:** `{postgres, authenticated, service_role}` — EXECUTE revoked from `anon` and `PUBLIC`.

### `private.user_role(_user_id uuid) → user_role` (2026-08-17)

Returns the caller's role. **Hardened 2026-08-18:** `order by role asc limit 1` — the `(user_id, role)` PK allows stacked rows (a user holding both `moderator` and `admin`), and a bare `limit 1` returned an arbitrary one. `admin` now wins deterministically. The same day, `adminSetRole` was changed to replace-not-stack (one role per user, always).

### `private.is_admin(_user_id uuid) → boolean` (2026-08-17)

`EXISTS (user_roles where role = 'admin')`.

### `private.user_wilayas(_user_id uuid) → text[]` (2026-08-17)

`coalesce(array_agg(wilaya_code order by wilaya_code), '{}')` from `moderator_wilayas`.

### `private.can_moderate(_user_id uuid, _wilaya_code text) → boolean` (2026-08-17)

`is_admin(_user_id) OR (_wilaya_code = any(user_wilayas(_user_id)))`. Backs every moderator read/update policy on `sites` and `fire_reports`.

All five are `SECURITY DEFINER`, `STABLE`, `SET search_path = public`, EXECUTE granted to `authenticated, service_role` only. Live reads mean revocation takes effect on the next request — no JWT staleness window, and no dependency on an auth hook.

### `private.sync_profile_moderator_flag() → trigger` (2026-08-17)

Trigger function behind `user_roles_sync_profile`: after any INSERT/UPDATE/DELETE on `user_roles`, rewrites `profiles.is_moderator` for the affected user to `EXISTS (any staff role)`.

### `public.handle_new_user() → trigger`

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $function$
```

`SECURITY DEFINER` because it inserts into `profiles` during signup, before any session exists. **Who can call it:** live ACL is `{postgres, service_role}` — EXECUTE revoked from `anon`, `authenticated` and `PUBLIC`. It is a trigger-only helper.

## Triggers

| Trigger | Table | Definition |
|---|---|---|
| `on_auth_user_created` | `auth.users` | `AFTER INSERT ... FOR EACH ROW EXECUTE FUNCTION public.handle_new_user()` |
| `user_roles_sync_profile` | `public.user_roles` | `AFTER INSERT OR UPDATE OR DELETE ... FOR EACH ROW EXECUTE FUNCTION private.sync_profile_moderator_flag()` (2026-08-17) |

No `updated_at` triggers exist — no table has an `updated_at` column.

## Realtime

Publication `supabase_realtime` includes `public.sites`, `public.care_logs`, `public.fire_reports`. The home page subscribes with filters (`status=eq.approved` for sites, all events for fires, INSERT only for care logs).

## Storage

Bucket `photos`: **private** (`public = false`), no `file_size_limit`, no `allowed_mime_types` restriction set at the bucket level (size/type are enforced in application code: `MAX_PHOTO_BYTES = 900000`, jpeg/png/webp only). Objects are uploaded with `cacheControl: 31536000` and random UUID names — immutable paths, safe for long CDN caching (2026-08-18 confirmed).

`storage.objects` has **no policies** for this project. That is intentional deny-by-default: no client ever touches storage directly. Uploads go through the service-role client in `submissions.server.ts`; reads go through `/api/public/photo/*`, a server route that fetches with the service role and re-serves with public cache headers.

## Live vs. tracked migrations — the honest picture (2026-08-18)

**Canonical schema source: `docs/FULL_SCHEMA_EXPORT.sql`.** It is what built the current project and every section has been applied to a real, empty project and verified live. A single-pass re-run on a second fresh project is the remaining test (needs a throwaway project — owner action).

The live project's migration history (`schema_migrations`) has exactly six entries: `20260817012002 green_algeria_full_schema_from_live_export` (the bootstrap), `20260817161559 roles_moderator_wilayas`, `20260817230600` (receipts), `20260817235601` (location_approximate), `20260818003911` (scale indexes), `20260818035834` (role-read hardening).

The repo's `supabase/migrations/` folder is a **change record, not a runnable history** (see its README): the first four files were applied to the previous project, and the last five carry different version labels than the live records because the platform MCP assigns its own. Two fixture-DML files (audit-test insert/delete) were removed from the folder on 2026-08-18; they live on in git history only.

Residual drift notes kept from earlier audits:

1. **`spatial_ref_sys` RLS was attempted and did not apply** (extension-owned). Live state is RLS **off** with no policy. Accepted risk.
2. **The `photos` bucket is not in any migration.** It was created through the platform API. `FULL_SCHEMA_EXPORT.sql` includes it explicitly.
3. Live also contains platform-managed schemas (`auth`, `storage`, `realtime`, `vault`, `extensions`) that this repo neither tracks nor should modify.
