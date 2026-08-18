# SYSTEM_INSTRUCTIONS.md

Standing rules for anyone — human or AI — working on Green Algeria. Owner: Sifeddine Mebarki (Meykiio). These are project rules; `AGENTS.md` covers how the owner wants to be worked with.

## Non-negotiables

1. **Read before writing.** Read the relevant code and the live schema before changing anything. Do not work from the original spec in the README or from a migration file — both drift from reality.
2. **Never break working code.** The map, the three submission flows, and the moderation queue all work today. Any change that risks them needs to be justified, not assumed safe.
3. **No unrequested features.** If you notice something missing, raise it as a question or a roadmap item. Do not build it.
4. **Never assume — ask.** Ambiguity gets a question, not a best guess presented as fact.
5. **Max 250 lines per file.** Split when a file grows past it. Generated files (`src/routeTree.gen.ts`, `src/integrations/supabase/types.ts`) are exempt.
6. **Commit after every phase.** Uncommitted work does not count as done. Never report a task complete while it is uncommitted.
7. **Keep `/docs` current.** `PROJECT_STRUCTURE.md`, `DATABASE.md`, `FEATURES.md`, `CHANGELOG.md`, `SYSTEM_INSTRUCTIONS.md`, `ROADMAP.md` get updated in the same change that makes them stale.
8. **Do not mark anything "done" you have not verified.** Trace the code path or run it. "Not verified" is an acceptable answer; a false "done" is not.

## Architecture rules

- Routing is TanStack Router file-based under `src/routes/`. Never add React Router. Never edit `src/routeTree.gen.ts`.
- App-internal backend logic goes in `createServerFn` (`*.functions.ts` thin wrapper + `*-impl.server.ts` implementation). No Supabase Edge Functions in this project.
- External callers (webhooks, cron) go under `src/routes/api/public/*` and must verify the caller inside the handler.
- The service-role client (`client.server.ts`) is server-only and loaded inside handlers. It never appears in a component or loader.
- All public writes go through the abuse gate in `submissions.server.ts`. There is no client-side insert path and there must not be one — no INSERT RLS policy exists for `anon`/`authenticated` on any table.
- The hero map is **MapLibre GL + OpenFreeMap vector tiles** (open-source, no API key) — owner decision 2026-08-18, superseding the old hand-built-SVG-only rule. Algeria stays framed via `maxBounds` and a recenter control; wilaya boundaries come from the converted polygon data (`src/lib/wilaya-geo.ts`). The RTL text plugin is mandatory (Arabic labels render broken without it). Dev note: `optimizeDeps.exclude: ["maplibre-gl"]` in `vite.config.ts` is load-bearing — without it the maplibre worker 404s in dev and every GeoJSON source silently never renders.
- Photos live in the private `photos` bucket and are served only through `/api/public/photo/*`. Never make the bucket public.
- Design tokens live in `src/styles.css`. Use `--plant` / `--care` / `--fire` semantic tokens; no hardcoded colour utilities.

## Data and privacy rules

- Never store or expose a raw IP. `submission_meta.ip_hash` only.
- `fire_reports.reporter_name` and `reporter_phone` are server-only. They are protected by **column-level grants**, so client queries must always list columns explicitly — `select *` on `fire_reports` will fail, and that is intentional. Do not "fix" it with a table-level grant.
- Staff privilege lives in `public.user_roles` (+ `public.moderator_wilayas` for moderator scoping), managed from `/admin`. `profiles.is_moderator` is a trigger-synced denormalized flag — never write it directly. Never put roles in `user_metadata`.
- No schema change without a migration through the platform tool, and every new `public` table needs GRANTs plus RLS plus policies in the same migration.

## Safety rule specific to this product

The fire flow is a community map, not an emergency service. The "call Protection Civile on 14 / 1021" disclaimer must remain visible on the fire form and its confirmation screen. Do not soften it, hide it behind a tooltip, or imply any dispatch capability.

## E2E fixture recipe (running `e2e/flows.spec.ts` + `e2e/admin.spec.ts`)

The suites need three auth users, recreated via SQL before a run and deleted after — the suites do not clean up:

| Fixture | UUID | Email / password | Role + wilayas |
|---|---|---|---|
| moderator | `11111111-1111-4111-8111-111111111111` | `e2e.moderator@test.local` / `ModeratorPass123!` | `moderator` + `['16']` (asserted as `reviewed_by`) |
| admin | `aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa` | `e2e.admin@test.local` / `AdminPass123!` | `admin` |
| mod2 | `22222222-2222-4222-8222-222222222222` | `e2e.mod2@test.local` / `Mod2Pass123!` | `moderator`, **no wilayas** (the admin spec assigns/removes them) |
| regular | `33333333-3333-4333-8333-333333333333` | `e2e.regular@test.local` / `RegularPass123!` | **no role** (the activity spec's plain user) |

`admin.spec.ts` also needs two seeded pending sites: `notes = 'ADMIN E2E - delete me B'` in wilaya `31` (Oran, `35.6969, -0.6333`) and `'ADMIN E2E - delete me C'` in wilaya `16` (Alger, `36.7538, 3.0588`), both `photo_url = ''`.

`activity.spec.ts` also needs, all with `user_id = '33333333-…'` and markers `E2E TEST - delete me activity …`: one pending site (Alger, "2 trees · Olive"), one approved site (Oran, "5 trees · Aleppo pine"), one care log on any approved site, one active small fire report (Alger).

Learned the hard way, the `auth.users` row must match what GoTrue writes:

- `encrypted_password = crypt('<password>', gen_salt('bf', 10))` — the default cost 6 is rejected by GoTrue.
- The token columns must be **empty strings, not NULL** — GoTrue fails to decode a NULL there ("Database error querying schema", HTTP 500 on password grant): `email_change`, `recovery_token`, `confirmation_token`, `email_change_token_new` all `''`.
- **`instance_id = '00000000-0000-0000-0000-000000000000'` is required** (found 2026-08-17): a NULL `instance_id` makes the password grant return `invalid_credentials` even with a correct hash. `confirmation_sent_at` and a populated `raw_user_meta_data` (`sub`/`email`/`email_verified`) should also be set to match real signups.
- An `auth.identities` row (`provider = 'email'`, `provider_id` = the user id, `identity_data` with `sub`/`email`/`email_verified`) helps and matches what signup produces.
- Signup via the API is not an option: `test.local` addresses are rejected by email validation, which is exactly why the fixtures are SQL-inserted.
- Roles come from inserts into `public.user_roles` / `public.moderator_wilayas` (the trigger syncs `profiles.is_moderator`).

**Reset between runs** (the admin spec ends with mod2 demoted and B approved): delete `sites` with `notes like 'ADMIN E2E%'`, re-insert B and C as above, delete mod2's `moderator_wilayas`, and re-insert mod2's `user_roles` row (`on conflict do nothing`).

After a run: delete the marker rows (`sites`/`care_logs.notes`, `fire_reports.description` like `E2E TEST - delete me%` or `ADMIN E2E%`), their `photos/sites/*` objects (per-object DELETE; the batch endpoint silently no-ops), all `submission_meta` (rate-limit history), and the fixture auth users.

## RLS audit battery (per-identity, seeded rows)

Two batteries exist, both kept out of the repo as session scripts:

- **`rls-audit2.mjs`** (50 checks): the original per-policy battery — anon/authenticated/moderator against seeded rows. Procedure below.
- **`rls-audit3.mjs`** (40 checks, 2026-08-17): the role-matrix battery — anon / regular user / wilaya-scoped moderator / admin. Verifies: pending reads scoped by assignment, cross-wilaya UPDATE is a 204 no-op with the row unchanged, own-wilaya UPDATE applies, contact management scoped (global = admin-only), `user_roles` own-read vs others-denied, self-promotion denied, and the `user_roles_sync_profile` trigger both ways. Creates its own fixture users via the Auth Admin API with the service key and cleans them up itself.

How to re-run `rls-audit2`:

- **Seed before running** (via SQL/service role): the moderator fixture (`11111111-…`, recipe above), a second fixture user (`22222222-…`, plain profile), one approved site, two pending sites (one owned by each fixture user), care logs on an approved and a pending parent, a fire report with real PII values, one `submission_meta` row. Markers: notes/description `AUDIT SEED - delete me%`. Live-schema gotchas that broke a first attempt: `sites.photo_url` is NOT NULL (use `''`), and the fire `severity` check constraint accepts only `small`|`large`.
- **Idempotency:** the battery first resets the two rows a moderator-positive check mutates (pending site → `pending`, fire → `active`) through the service key, so re-runs are safe.
- **Read the contract, not the code:** a denied write is either 403 (WITH CHECK violation) or 204 with the row verified unchanged (RLS-filtered no-op); a "200 + empty body" is the RLS filter working, not a leak; error codes legitimately differ by role (anon 401 vs authenticated 403 on `submission_meta`).
- **After:** delete the marker rows, the `submission_meta` seed, and both fixture auth users (+ identities + profiles). Verify zero by query, same as the E2E cleanup.

## Portability rule

This project must stay exportable. It is intentionally runnable against a plain Supabase project, with no platform-specific tooling. Keep `docs/FULL_SCHEMA_EXPORT.sql` accurate, and avoid platform-only constructs where a standard alternative exists.
