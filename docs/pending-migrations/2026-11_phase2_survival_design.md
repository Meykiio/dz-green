# Phase 2 design: the survival layer (awaiting owner approval)

Status: **2a applied live 2026-11-08** (master schema section 14c; verified as anon). 2b and 2c are designs only. Evidence: `docs/archive/RESEARCH_2026-11_NEXT_LEVEL.md`.
Approve each migration separately: **2a** is the core; 2b and 2c build on it.

## 1. What we are solving

Official survival claims run 80 to 98%; independent checks find 15 to 40%.
Nobody in Algeria publishes survival with a method. Goal: for every planting,
a timeline of checks at about 3, 12 and 36 months, and a public survival
rate per wilaya and per campaign **with the sample size, the coverage and the
method printed next to it**, counting only checks made by someone other than
the planter (or by staff).

Requirements:
- R1. Anyone (anonymous allowed, like care logs) can record a survival check
  on an approved planting: status, how many trees checked and alive, a photo
  (required), date, notes.
- R2. The map and site panel show each planting's last status and when its
  next check is due; overdue plantings are visible and filterable.
- R3. Public survival statistics per wilaya (and per campaign in 2b), with
  n, coverage and the "independent checks only" rule.
- R4. Groups (school, association, company, wilaya forest office) can run a
  campaign that owns many plantings for years (2b).
- R5. Every record carries a quality grade, and anyone can flag a record
  back into review (2c).
- R6. Never weaken today's rules: no client-side writes, PII column-grant
  protected, abuse gate on every public write, wilaya-scoped moderation.

## 2. Scale and access pattern

- Reads far outnumber writes (public map and stats vs. a few checks per
  site per year). National planting days are write spikes for **plantings**,
  not checks; checks are spread over months.
- Size at 10x today's ambition: 10^5 sites, 3 checks each = 3 x 10^5
  check rows over 3 years. Small for Postgres; the stats query is the only
  aggregate.
- What breaks first at 10x: the home map loading every approved site
  client-side (already on the roadmap as the `/api/map-data` endpoint), and
  the abuse gate's 6 plantings/hour per IP blocking a school on shared wifi
  during a campaign (2b answer: campaign organizers submit grouped sites
  signed-in, with their own limit).

## 3. Queries first (they drive the schema)

| Query | Where | Shape |
|---|---|---|
| Q1 checks for one site, newest first | site panel | `survival_checks WHERE site_id = $1 ORDER BY checked_date DESC` |
| Q2 last status + next due per site | map dots, overdue filter | one row per approved site: last check, next due window |
| Q3 survival per wilaya at 12 months | Where to plant, wilaya pages | trees alive / trees checked, independent checks in the 9-18 month window, plus n sites, n trees, coverage |
| Q4 due checks for me | `/activity`, receipt page | my approved sites whose window is open and unchecked |
| Q5 checks to review in my wilayas | moderation tab | unverified checks joined to sites in my wilayas |

Q2 and Q3 are views over `sites` + `survival_checks`; at 10^5 sites they
stay plain views. If they ever get slow: a materialized view refreshed hourly
(pg_cron), no app change.

## 4. Schema 2a (draft SQL: `2026-11_phase2a_survival_checks.sql`)

- Enum `survival_status`: `alive, stressed, dead, burned, grazed, not_found`.
- Table `survival_checks`: `site_id` (FK, cascade), `status`,
  `trees_checked` (>= 1), `trees_alive` (0..trees_checked), `photo_url`
  (required), `photo_sha256` (duplicate-photo guard), `checked_date` (not in
  the future), `notes`, `submitter_name` (public, like care), `user_id`
  (hidden), `independence` (`independent | self | staff | unknown`, set by
  the server), `grade` (`unverified | verified | rejected`), `reviewed_by`,
  `reviewed_at`, `client_request_id` (unique, idempotency for offline
  retries), `created_at`.
- Independence rule (server-side, never from the client): `staff` if the
  checker holds a role; `self` if the checker's user id equals the
  planting's; `independent` if both are signed in and differ; `unknown`
  otherwise. Headline survival counts `independent` + `staff` only;
  everything else is shown but labelled.
- Windows from `planted_date`: 3 months (2-5), 12 months (9-18),
  36 months (30-48). Computed in the views, not stored.
- Views (both `security_invoker = true`, so RLS applies):
  `site_survival_status` (Q2) and `survival_stats_wilaya` (Q3).
- `submission_meta.kind` CHECK gains `survival` (and the pending
  `push`/`vote`/`identify`).

## 5. Authorization

Same pattern as care and fires: **no INSERT/UPDATE/DELETE policies for
clients**; every write is a server function with the service role.
- Read: public `SELECT` on non-PII columns of checks on **approved** sites
  (column grant hides `user_id`, `photo_sha256`, `client_request_id`).
- Write: `submitSurvivalCheck` (anonymous allowed, abuse gate kind
  `survival`, photo required and sniffed, site must be approved, duplicate
  photo hash rejected, idempotent on `client_request_id`).
- Review: `reviewSurvivalCheck(id, verified|rejected)` re-checks the
  moderator's wilaya scope live (same `assertScope` as plantings). Rejecting
  deletes the photo object, like rejected plantings.

## 6. Failure modes

- Retry after a dropped connection: `client_request_id` unique -> the second
  insert returns the first row's receipt, no duplicate.
- Same photo reused across sites or checks: `photo_sha256` match -> rejected
  with a clear message. (Re-encoded photos evade exact hashes; perceptual
  hashing is a later step.)
- Planter checks their own trees: allowed, labelled `self`, excluded from
  the headline rate. That keeps the rate honest without blocking anyone.
- A check on a pending or rejected site: refused (site must be approved).
- Fire burns a site: a `burned` check; 2c can also link nearby fire reports.

## 7. API and UI surface (2a)

- Server functions: `submitSurvivalCheck`, `reviewSurvivalCheck`,
  `listSurvivalChecks(siteId)` (or a direct RLS read), plus the two views.
- `/check?site=<id>` form (status chips, counts, photo, date), linked from
  the site panel and from receipt pages.
- Site panel: survival timeline + "next check due" + "Check this planting".
- Map: overdue plantings get a dashed ring; a "Needs a check" filter.
- `/activity` and receipt pages: "due for a check" list.
- Where to plant: survival at 12 months per wilaya with n, coverage and the
  method sentence; "not enough data yet" when fewer than 10 independent
  checks.
- Moderation: a "Survival checks" tab (unverified checks in my wilayas).
- AR/EN/FR for everything.

## 8. 2b campaigns (outline, own migration)

`campaigns` (slug, name, organizer user, organisation name, wilaya scope,
start/end, status `pending | active | closed`, admin-approved so nobody can
impersonate a ministry), `sites.campaign_id` (nullable FK). Pages
`/c/<slug>` with totals, survival at 12 months, coverage and a server-picked
**random audit sample** (deterministic per campaign, visible to moderators).
Signed-in organizers get a higher planting limit than anonymous IPs.

## 9. 2c quality grades and flags (outline, own migration)

Site grade derived, not stored: `reported` (moderator approved the photo),
`confirmed` (at least one independent `alive` check with photo),
`audited` (a staff check). `record_flags` (service-role only): anyone can
flag a site or check (duplicate, wrong place, not trees, reused photo);
flagged records return to the moderation queue. No automatic hiding (it
would be abusable).

## 10. Observability

Admin overview gains: checks this week, overdue sites, share of approved
sites checked at 12 months, gate rejections by kind. Server logs keep the
existing `[gate]` lines; no new service.

## 11. Rollout and rollback

1. Owner approves 2a. 2. Dry-run the SQL on a copy (Supabase branch or a
local Postgres). 3. Apply in the SQL editor, fold into the master schema,
update `DATABASE.md`. 4. Ship the code behind the schema (the app must
tolerate the tables being absent until applied). Rollback: the migration is
purely additive (new enum, table, views, a widened CHECK); dropping them
loses only survival data. No existing row is touched.

## 12. Dry run (2026-11-08)

`2026-11_phase2a_dryrun.mjs` runs the 2a SQL in PGlite (in-memory Postgres
17) against stand-ins of `sites`, `auth`, `private.can_moderate` and the
realtime publication, then checks behaviour as the `anon` role. Run it from
a temp folder with `npm i @electric-sql/pglite@0.3` then
`node 2026-11_phase2a_dryrun.mjs <path to the .sql>`. Results:

- Migration applies; rollback block runs.
- Survival stats: 3 eligible sites, 2 counted (independent 8/10, staff
  5/20 -> 13/30 = 43%); a later self check (10/10) and a rejected check
  (20/20) are correctly excluded; a site with only a self check counts as
  unchecked.
- Due windows: a 3-month-old site is `due_3m`, a 1-month-old one `too_early`.
- `anon` cannot read `user_id`, `photo_sha256`, `client_request_id`; cannot
  insert; rejected checks are hidden; bad values hit the constraints.
- Limits: stand-ins, not the live schema (no PostGIS, simplified `sites`).
  The real apply should still be preceded by a check on a copy of the live
  database once the Supabase connection works.

Semantics to confirm: a planter's own check marks a site "up to date" for
reminders, but it never enters the headline rate. Sites with only self
checks show as "checked by the planter, independent check wanted".

## 13. Decisions for the owner

- [ ] Approve migration 2a as drafted.
- [ ] Photo required for every check? (Recommended: yes; a check without a
  photo cannot be verified.)
- [ ] Headline rate counts only independent + staff checks? (Recommended:
  yes; it is the whole point.)
