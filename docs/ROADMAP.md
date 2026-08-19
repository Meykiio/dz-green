# ROADMAP.md

Status: **2026-08-18.** The pre-viral and post-viral sprint plans (previously `ROADMAP.md` / `MASTER_SPRINT_PLAN.md`) are fully shipped and now live in `CHANGELOG.md` as history. This file is the forward-looking list: what blocks launch, what needs an owner decision, and what is parked. Items are ordered by what actually matters first. Nothing here is scheduled — the owner calls the sequence.

## Before launch (owner actions, not code)

1. **Deploy target.** No production host is wired. Picking one (Vercel or other) unblocks: deployment itself, sitemap regeneration with the real domain (removed in the audit — relative `loc`s were spec-invalid), and production redirect URLs in Supabase Auth settings.
2. **Supabase dashboard check (2 min).** Auth → Settings: email confirmation ON for signups; password minimum length ≥ 8. Not SQL-verifiable (`docs/AUDIT.md` P1 #3).
3. **Plans + budgets.** Supabase Pro ($25/mo) and Vercel Pro before public launch, per the scale posture in `docs/FEATURES.md` §13.
4. **Load test.** 1k-concurrent home loads against the deployed URL, p95 < 2 s, plus a spam-flood rerun at scale. Needs items 1–2 first.
5. **Real-device testing.** Mid-range Android + slow connection; the Realtime push check on an open map session. The owner's device testing has caught more real bugs than any automated pass.

## Open decisions (owner call)

- **Alerting: wire or drop.** `alert_contacts` has a moderator management screen but nothing sends alerts. Wire it (real emergency value for fires) or drop the table.
- ~~**Arabic/French UI.**~~ **Shipped 2026-08-18** (sixteenth pass): full AR/FR/EN i18n with RTL, cookie-persisted, SSR-correct. See `src/i18n/` and the CHANGELOG. Remaining follow-up (not blocking): localize `<head>` meta titles/descriptions per locale for SEO.
- **Vendored UI prune.** `src/components/ui/chart.tsx` + `sidebar.tsx` (zero consumers, ~1000 lines) — delete or keep as vendored.
- **Moderator onboarding.** Promotion is admin-driven via `/admin`. Recruiting 58 wilaya moderators is then a people problem, not code — plan it separately.

## Parked (would be real scope, no decision needed yet)

- **`submission_meta` retention policy** (`AUDIT.md` P2 #9): opportunistic cleanup inside the gate insert, or a cron.
- **Payload reduction** (`AUDIT.md` P2 #8): ~21 MB / 209 requests first load, tile-heavy basemap. Evaluate a lighter basemap style after launch numbers exist.
- **Field performance data** (`AUDIT.md` P2 #10): PageSpeed Insights / RUM on the deployed URL post-launch.
- **Commune auto-suggest**: no commune dataset exists; adding one is real scope.
- **Photo CDN**: stay on Supabase storage + proxy + cache headers (current) or move to a dedicated CDN. Cost-vs-simplicity decision, only relevant at scale.
- **Search, per-wilaya pages, user profiles, leaderboards, sharing cards**: ideas, not plans.
- **Scale revisit**: the no-auth-hook RLS design (live reads of `user_roles`) is the right call today; revisit if RLS checks ever become a hot path. Same for the 50k-row / 200-concurrent-realtime threshold on the home query.