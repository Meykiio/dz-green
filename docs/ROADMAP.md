# ROADMAP.md

Status: **2026-08-19.** Live at `green-dz.vercel.app`; the community found the repo and started contributing (3 PRs, 7 issues). This file is the forward-looking list: what blocks launch, what needs an owner decision, and what is parked. Items are ordered by what actually matters first. Nothing here is scheduled — the owner calls the sequence, and **no fix starts without owner approval** (standing rule since 2026-08-19).

## Community feedback backlog (2026-08-19) — all items wait for owner approval

Ordered by impact, not by arrival. Everything here came from the GitHub issues/PRs or live submissions.

1. **Wilayas 58 → 69** (issue #6 — verified real against APS, 16/11/2025). Our list already ships the 10 delegated wilayas (codes 49–58); the 11 new full wilayas (59–69: Aflou, Barika, Ksar Chellala, Messaâd, Aïn Oussara, Boussaâda, El Abiodh Sidi Cheikh, El Kantara, Bir El Ater, Ksar El Boukhari, El Aricha) are missing everywhere: wilaya list, forms, moderation scoping, map shapes, any DB constraints. Touggourt's official code is 55 (the Algeria-Cities dataset duplicates it under 30 — flagged to the reporter). Plan as its own change: data + schema + app, must not break existing submissions. **Verified public reply posted on issue #6.**
2. **PR #9 — Arabic/French/English i18n + RTL** (hzemislam4-svg, +2,515/−584). Highest audience value (Algeria is Arabic/French-first; this was already an open decision below). Currently conflicting with main; author was asked to rebase. Order of merges: **#9 first** — full review (diff, tsc, tests, build, live smoke) before merging.
3. **PR #10 — mobile UX pass 320–768px + map/theme fixes** (+2,598/−610). Rebase first, review, merge second. Real-device pass after merge.
4. **PR #11 — user profiles (own + public) + password reset** (+3,287/−635). Touches `DATABASE.md` → likely schema change. Review last; schema diff must be reviewed and migrated explicitly (AGENTS.md: no schema change without an explicit request).
5. **Issue #2 — the list only shows planted trees, not fires** (verify + small fix; likely a filter/query gap in `SiteList`).
6. **Issue #3 — Directions button only partially visible** (small CSS fix).
7. **Issue #4 — filter map/list by clicking the legend color dots** (medium feature, clean fit).
8. **Issue #7 — WebGL2-only basemap; raster fallback request** (real, but big — parked unless adoption data says otherwise).
9. **Issue #8 — mobile app** (parked; the web app already works on phones).
10. **PR #1 (Vercel bot) — close**: Web Analytics was already shipped manually (`a15845b`).
11. **Bachir's submission (wilaya 41, pending)** — owner believes it was a test. Decision: delete or keep pending. Not approved/deleted until the owner says so.
12. **Feedback messages** — two so far ("test", "thansk for the platform"); the admin panel to read them shipped (2026-08-19). No action.

**Demo data (2026-08-19):** 13 sites (12 approved + 1 pending), 6 care logs, 4 fire reports were seeded live so the map shows everything. All rows are visibly tagged (`planter_display_name`/`submitter_name`/`reporter_name` = "Démo — …", notes/description = "Données de démonstration — Green Algeria") and carry deterministic IDs (`d0000000-…` sites, `d1000000-…` care logs, `d2000000-…` fires). Removal (one command, safe):

```sql
DELETE FROM public.care_logs WHERE id::text LIKE 'd1%';
DELETE FROM public.sites WHERE id::text LIKE 'd0%';
DELETE FROM public.fire_reports WHERE id::text LIKE 'd2%';
```

## Before launch (owner actions, not code)

1. ~~**Deploy target.**~~ **Done 2026-08-19** — live at `green-dz.vercel.app`.
2. **Supabase dashboard check (2 min).** Auth → Settings: email confirmation ON for signups; password minimum length ≥ 8. Not SQL-verifiable (`docs/AUDIT.md` P1 #3).
3. **Plans + budgets.** Supabase Pro ($25/mo) and Vercel Pro before public launch, per the scale posture in `docs/FEATURES.md` §13.
4. **Load test.** 1k-concurrent home loads against the deployed URL, p95 < 2 s, plus a spam-flood rerun at scale. Needs items 2–3 first.
5. **Real-device testing.** Mid-range Android + slow connection; the Realtime push check on an open map session. The owner's device testing has caught more real bugs than any automated pass.

## Open decisions (owner call)

- **Alerting: wire or drop.** `alert_contacts` has a moderator management screen but nothing sends alerts. Wire it (real emergency value for fires) or drop the table.
- **Arabic/French UI.** Now concrete: PR #9 implements it — decision is review-and-merge order, not scope.
- **Vendored UI prune.** `src/components/ui/chart.tsx` + `sidebar.tsx` (zero consumers, ~1000 lines) — delete or keep as vendored.
- **Moderator onboarding.** Promotion is admin-driven via `/admin`. Recruiting 58 wilaya moderators is then a people problem, not code — plan it separately. (Note: the wilaya count itself is about to become 69.)

## Parked (would be real scope, no decision needed yet)

- **`submission_meta` retention policy** (`AUDIT.md` P2 #9): opportunistic cleanup inside the gate insert, or a cron.
- **Payload reduction** (`AUDIT.md` P2 #8): ~21 MB / 209 requests first load, tile-heavy basemap. Evaluate a lighter basemap style after launch numbers exist.
- **Field performance data** (`AUDIT.md` P2 #10): PageSpeed Insights / RUM on the deployed URL post-launch.
- **Commune auto-suggest**: no commune dataset exists; adding one is real scope.
- **Photo CDN**: stay on Supabase storage + proxy + cache headers (current) or move to a dedicated CDN. Cost-vs-simplicity decision, only relevant at scale.
- **Search, per-wilaya pages, user profiles, leaderboards, sharing cards**: ideas, not plans.
- **Scale revisit**: the no-auth-hook RLS design (live reads of `user_roles`) is the right call today; revisit if RLS checks ever become a hot path. Same for the 50k-row / 200-concurrent-realtime threshold on the home query.