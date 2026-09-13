# SECURITY — posture, hardening, open findings

Single security reference. Last full verification: 2026-09-12 (live DB
checks + code trace). Findings from the 2026-08-28 / 2026-08-30 audits that
were fixed are listed as hardening history; everything still open is in
§Open findings. Reporting process: repo-root `SECURITY.md`.

## Defense in depth (current)

Layers, outermost first:

1. **No client writes anywhere.** Zero INSERT/DELETE RLS policies on any
   table. Every write is a `createServerFn` RPC using the service-role
   client, behind the CSRF middleware.
2. **Abuse gate on every public write:** honeypot silent-drop → 1.2s
   submit-timing floor → hashed-IP hourly limits (planting 6 / care 20 /
   fire 8) + daily-rotating HMAC device-hash limits, counted in
   `submission_meta`. Feedback/volunteers use the shared throttle. No raw
   IPs or raw device secrets ever stored. Cloudflare Turnstile was
   considered and deliberately dropped (no third-party dependency).
3. **RLS everywhere** except by-design deny-all service-role tables
   (feedback, volunteers, push_subscriptions, receipts, submission_meta,
   user_roles writes, moderator_wilayas). Every new table ships RLS +
   policies + grants in the same migration.
4. **Column-level grants hide PII:** fire reporter name/phone,
   `sites.contact_phone`, `fire_reports.user_id` — clients cannot select
   them (`select *` fails on purpose). `select *` on sites/fire_reports
   fails by design; queries must list columns.
5. **Server-side derivation:** the wilaya comes from the submitted
   coordinates server-side (client value ignored); dates are future-checked
   server-side; photos are mime-sniffed (magic bytes) before decode.
6. **Live role re-checks:** every staff/admin server function re-reads
   `user_roles` from the request token (no JWT staleness window) AND
   asserts wilaya scope (moderators cannot touch other wilayas' rows or
   contact info).
7. **Storage:** private bucket, 10MB + mime allowlist at the bucket level,
   zero client policies, service-role uploads only, public reads only via
   the proxy route.
8. **Transport/headers:** Nitro route rules set CSP (self + Supabase +
   tiles + analytics; explicit wss for realtime), X-Frame-Options, nosniff,
   referrer + permissions policy; CSRF middleware on server fns; neutral
   auth errors (no email enumeration); no raw secrets client-side.
9. **SSRF-hardened:** `resolveMapsLink` follows only Google-hosted short
   links with per-hop validation.
10. **Transition guards:** moderation writes validate status transitions
    (pending→approved/rejected, rejected→approved) server-side; rejects
    delete the photo object so rejected content never serves again.

## Hardening history (all verified live)

- 2026-08-17: roles rework (admin + wilaya-scoped moderators), grants
  tightened on the original 5 tables, RLS initplan rewrites (2026-08-28/29),
  FK indexes for the activity/stats read paths.
- 2026-08-30 sweep (OWASP API Top-10 mapping): SSRF allowlist in
  `resolveMapsLink`; wilaya-scope assertion on all PII reads; sanitized IP
  header trust; rejected-photo lifecycle (proxy 404s after reject);
  neutral auth error copy; fail-loud salt/env checks; bucket-level
  10MB/mime backstop; magic-byte image sniffing; `rls_auto_enable()`
  EXECUTE revoked; column-level UPDATE on sites/fire_reports (moderators
  can no longer write unmoderation columns client-side); throttle kinds
  widened for feedback/volunteers; `service_role` explicit SELECT grant on
  announcements (RLS bypass ≠ table privilege).
- 2026-09-12: full E2E + unit + build green on the Canopy branch; live
  grants re-verified (see §Open findings for what didn't stick).

## Open findings (tracked)

1. **PostGIS-owned metadata tables are still client-writable** (verified
   live 2026-09-12): `spatial_ref_sys` (anon INSERT/DELETE allowed), and
   the `geometry_columns` / `geography_columns` views. Both the migration
   role (2026-08-30) and the Dashboard SQL editor (2026-09-13,
   `42501: must be owner of table`) failed — the tables are owned by the
   PostGIS extension, so only Supabase support can fix it (ticket filed
   2026-08-30; GitHub issue #40). Not reachable through the PostgREST API.
   Keep the ticket alive until Supabase confirms the tables are locked.
2. **`fire_reports` INSERT is open to any session by design** (speed over
   review). The community-confirmations trust layer (migration pending
   until the feature ships — see ROADMAP) plus the abuse gate are the
   mitigation; SEC-01's full answer (reputation weighting) is a follow-up.
3. **Dashboard toggles that need the owner:** leaked-password protection
   (Pro), email-confirmation setting (deliberately disabled for instant
   signups — emails unverified, staff accounts are admin-created; revisit
   on Pro), custom SMTP if signup volume grows (built-in caps at 2/hour).

## Applied (2026-09-13)

- **Client TRUNCATE/REFERENCES/TRIGGER bits revoked** on announcements,
  receipts, user_roles, moderator_wilayas (both client roles), verified by
  `has_table_privilege` = false, read grants untouched. Live now matches
  the master schema exactly on these tables.

## Monitoring

Weekly: Supabase advisors + auth/query/realtime logs review, Vercel alerts
(5xx rate, function duration), a monthly `get_advisors` run recorded in the
changelog. `submission_meta` retention (~45 days) is parked in ROADMAP.
