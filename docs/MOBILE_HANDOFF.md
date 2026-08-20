# MOBILE_HANDOFF.md — Onboarding note for the mobile developer

Welcome. You're building the mobile app for Green Algeria (Expo + the existing Supabase
backend). Before writing any code, read these two documents — they are required reading:

1. `docs/MOBILE_RESEARCH.md` — the architecture research: stack choice, auth, offline,
   map, repo layout, distribution. Everything below is decided here.
2. `docs/PRE_MOBILE_BLOCKERS.md` — the web-side queue that gates when mobile work starts
   (PRs #9/#10/#11, wilayas 58→69). Read it so you know what "ready" means and what
   depends on what.

## Already decided — do not re-litigate

- **Write path:** submissions go through a **new API route in the web app** that reuses
  the existing abuse gate in `src/lib/submissions.server.ts`. Not direct RLS inserts, not
  an Edge Function. Follow the design in `MOBILE_RESEARCH.md` §1.
- **Offline queue:** append-only, **expo-sqlite outbox + NetInfo drain + backoff**,
  photos staged in expo-file-system and deleted after upload. No WatermelonDB, no RxDB.
  See `MOBILE_RESEARCH.md` §2.

If you believe these are wrong, say so once with evidence — then follow the document.

## Before you build these two, share your plan

The web owner reviews plans for the two highest-risk pieces before you build them:

1. **Auth flow** — Supabase JS client direct, SecureStore session (LargeSecureStore
   pattern), PKCE, deep-link email confirmation.
2. **Offline queue** — schema, drain, retry/backoff, photo staging, conflict rules.

Send the plan for each before implementing. Everything else (screens, map, forms, list)
you can build freely.

## Web-side status

The web app is live at `green-dz.vercel.app`. Mobile scaffolding can start in parallel,
but mobile v1 must not ship before the queue in `PRE_MOBILE_BLOCKERS.md` clears. The repo
is separate: `dz-green-mobile` (see `MOBILE_RESEARCH.md` §6).