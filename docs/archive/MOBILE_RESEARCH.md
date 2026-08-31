# MOBILE_RESEARCH.md — Green Algeria Mobile: architecture & planning research

Status: **2026-08-19.** Research phase only — no code, no repo setup. Context: a community member
proposed a React Native + Expo companion app for field submissions with offline support. This
document answers the seven research questions with current (2026) sources, flags which decisions
lock in early, and splits a PRD into v1 vs v2. Sources cited inline; all claims re-checked against
the live web app's actual architecture.

## The constraint that shapes everything

The web app's abuse gate (`submissions.server.ts`) is **HTTP-request-shaped**: silent-drop
honeypot (form field), 1.2 s submit-timing floor (client timing), hashed-IP + rotating device-hash
rate limits (server-fn middleware), wilaya derived server-side from coordinates. There are **zero
insert RLS policies** on any table — every write is service-role-only behind a server fn. A mobile
app cannot call TanStack Start server fns (they assume the SSR request context). Everything below
is about preserving the gate's guarantees on a device we don't control.

## Q1 — Write path: API route vs direct Supabase inserts + RLS/Postgres functions

**Comparison.**

| | (a) API route | (b) Direct inserts + RLS/functions |
|---|---|---|
| Gate preservation | Reuses the exact existing gate code | Honeypot: impossible in Postgres (form-level concept). Timing floor: impossible (no client timing). Rate limits: doable via trigger + `submission_meta`. Wilaya: doable via trigger. |
| New attack surface | One new endpoint, service key stays server-side | Public anon key ships inside the app binary; native insert path becomes a spammer's direct write route; RLS policies on live tables (hard to tighten later) |
| Maintainer cost | One endpoint calling existing server fns | Reimplements half the gate in SQL; two copies of the rules |
| Sources | Supabase App Check guidance (below) | — |

Supabase's own mobile guidance is: publishable key in-app + RLS for reads and user-scoped writes,
and platform attestation (Play Integrity / App Attest) for sensitive endpoints. `@expo/app-integrity`
(alpha, SDK 54+) wraps both platforms' attestation; Supabase Edge Functions can verify App Attest
assertions (`supabase-integrity-attest`, WebCrypto-only). That's the v2 hardening path — see below.

**Decision: (a), implemented as a new route in the existing TanStack Start app** (not a separate
Edge Function). The route imports `submissions.server.ts` gate functions directly — zero
reimplementation, one codebase, one deploy. Mobile calls it with a Bearer token; the web's
`auth-attacher` middleware pattern already proves token→user plumbing. Rate limiting keyed on an
install-scoped device ID (random UUID generated per install, stored in expo-secure-store), since
IP hashing is meaningless on mobile data networks.

**Reversibility: hard.** Policy surface + write patterns + stored data lock this in. Decide now,
don't revisit in v1.

## Q2 — Offline queue: append-only creates

**Confirmed: no WatermelonDB/RxDB.** Those exist for bidirectional sync with conflict resolution.
Green Algeria's need is append-only creates (plant/care/fire + photos) — an outbox, not a sync
engine. Minimal correct pattern:

- `expo-sqlite` outbox table: `(id, kind, payload_json, photo_path, attempts, next_retry_at, created_at)`.
- Drain triggers: `@react-native-community/netinfo` connectivity change + app foreground.
- Per-item retry with exponential backoff; delete row on success.
- **Photo staging:** write to `expo-file-system` document directory (`photos/<uuid>.jpg`, device-local,
  never in SQLite), reference the path from the outbox row; delete the file after successful drain.
  Upload path: reuse the API route (it already stores to the private `photos` bucket and returns a
  path — same `storePhoto` contract). Plain retry of the whole file is fine for <5 MB photos;
  supabase-js storage has no true resumable upload, and that's acceptable at this size.
- **Idempotency:** each outbox row carries a client-generated UUID; the API route treats it as a new
  submission (web has no client-UUID dedupe today — acceptable for v1; add a `client_uuid` column
  later only if double-submit reports appear).
- **Fire caveat:** fire reports are time-critical. Flag in-app ("report sent when connection returns —
  may be stale") but still queue; losing a report offline is worse than a stale one.

**Reversibility: easy** — internal detail, replaceable without schema changes.

## Q3 — Auth

Confirmed: Supabase JS client **directly in Expo**, independent of the web app's cookie-based SSR
session. Both coexist on one project — same `auth.users`, same JWT issuer; the web's TanStack
middleware and the mobile Bearer token don't conflict. Per Supabase/Expo docs:

- Storage: `expo-secure-store` — but a Supabase session (JWT + refresh token) exceeds SecureStore's
  ~2 KB keychain item limit, so use the documented **LargeSecureStore pattern**: AES-256 key in
  SecureStore, encrypted session blob in AsyncStorage (official Supabase JS docs; also Expo's
  `using-supabase` guide, 2026-08-11, offers `expo-sqlite/localStorage` as the simpler alternative —
  pick LargeSecureStore, it's the security-conscious default).
- `autoRefreshToken: true`, `persistSession: true`, `detectSessionInUrl: false`, and an
  `AppState` listener calling `startAutoRefresh()`/`stopAutoRefresh()` (SDK refresh loop keeps
  firing while backgrounded otherwise — Expo guide).
- **Gotcha: email confirmation.** Supabase confirms emails by default; the mobile app must handle
  deep links (app scheme + Supabase Auth redirect config) so a user tapping the confirmation link
  lands back in the app. This is the #1 failure mode in RN auth (documented across Supabase/Expo
  guidance). Set `flowType: 'pkce'` now — it's required once OAuth lands and harmless today.

**Reversibility: cheap to keep correct now** (PKCE + deep links are one-time config, not refactors).

## Q4 — Type/schema sharing

| Shareable (pure TS) | Not shareable (server-bound) |
|---|---|
| Generated Supabase DB types (`supabase gen types` — same live DB → same types, regenerate in mobile repo) | `submissions.server.ts` (service-role client + gate), `admin.functions.ts`, everything importing `@tanstack/react-start` |
| Zod schemas from `submissions.schemas.ts` (validate client-side before submit) | Supabase service-role client |
| Domain types (`MapFeature`, `Site`, `FireReport`, `CareLog`) | — |
| Pure helpers: `wilayas.ts`, `maps-link.ts`, `data.ts` (formatDate/photoUrl) | — |

**Decision: vendored copy + a `scripts/sync-shared.mjs`** in the mobile repo that copies the shared
files from the web repo and `tsc`-checks them. A private npm package is over-engineering for one
consumer and two consumers worth of shared code; extract it only if/when a second consumer appears.
The server-fn layer stays in the web repo — mobile talks to the API route (Q1), never to server fns.

**Reversibility: easy.**

## Q5 — Map on mobile

- `@maplibre/maplibre-react-native`: **stable and actively maintained** — v11.3.6 (2026-06-25),
  MIT, fork of rnmapbox, supports Expo via dev builds (native module — not Expo Go). Requires an
  Apple/Google dev account for device builds (Q7).
- Maturity caveats (be honest, from the maintainers' own words): E2E/integration test coverage is
  thin ("simple bugs sneak into each release" — discussion #797); new-architecture support is
  "basically it compiles"; an offline-pack crash on v10→v11 upgrade shipped and was fixed fast
  (#1432/#1434). **Budget a one-day device spike** (real device, both platforms) before committing.
- OpenFreeMap: no key, no limits, works with MapLibre Native — proven in the wild (a Brazilian
  OSS app migrated Mapbox → MapLibre RN + OpenFreeMap with offline region download, $0/month).
- **Offline tiles ("see your location without internet"):** technically real — `OfflineManager.
  createPack(region, zoom)` downloads offline packs with progress listeners; `setTileCountLimit`
  exists precisely to respect tile hosts' terms ("consult the ToS of your map tile host" — MapLibre
  docs). But for a solo dev, **cut from v1**: pack-selection UX, size estimation, storage hygiene,
  ToS review, and the fact that v1's offline need is *submitting*, not navigating. v2 item.

**Reversibility: moderate** (map binding choice locks early; switching engines later is a rewrite).

## Q6 — Repo structure

**Separate `dz-green-mobile` repo** (matches the contributor's instinct). For a solo maintainer:
- No monorepo tooling to maintain (Turborepo/workspaces are config surface, not value, at two apps).
- Independent CI/build/test per repo; no risk of Expo/Metro tooling fighting TanStack Start/Nitro.
- One AGENTS.md per repo; the 250-line/`/docs`-current discipline carries over cleanly.
- Monorepo's real value (atomic cross-app changes) is tiny here because the shared surface is ~6
  small files handled by the sync script (Q4).

**Reversibility: easy now** (no code exists); annoying later (repo moves + history). Decide now.

## Q7 — Distribution (EAS Build + store testing)

- **EAS Build free tier (2026):** 15 Android + 15 iOS builds/month, low-priority queue (90+ min
  waits possible at peak), 45-min timeout, 1 concurrency, hard stop at quota (resets monthly).
  Starter $19/mo: $45 credit + priority queue. EAS Update (OTA JS updates): free 1K MAU.
- **TestFlight (iOS):** requires Apple Developer Program ($99/yr). Internal testing (up to 100
  team members): no review, live ~30 min after processing — the zero-gatekeeping channel. External:
  Beta App Review on the first build of each version (1–2 days). **Builds expire after 90 days** —
  plan a re-upload every ~60 days.
- **Play (Android):** Play Console $25 one-time. Internal track (100 testers, no review, ~5 min).
  **Long pole:** personal Play accounts created after 2023-11-13 must run a closed test with 12
  testers opted in for 14 consecutive days before production access — recruit testers before you
  need them. Play builds never expire.
- **Timeline reality:** days to first installable internal builds on both platforms; weeks to an
  external beta; Android production gated by the 14-day closed test.

## Lock-in summary

| Decision | Reversible? | When to decide |
|---|---|---|
| Write path (API route, not RLS) | **Hard** — lock now | Before any code |
| Repo structure (separate repo) | Easy now, annoying later | Before any code |
| Map binding (MLRN) | Moderate | After the device spike, early |
| Auth (PKCE + deep links) | Cheap to keep correct | Configure once, now |
| Offline queue (outbox) | Easy | During v1 |
| Offline map tiles | Easy (v2 add) | Cut from v1 |

## PRD split — v1 vs v2

**v1 (field submission + basic offline queue):** email/password auth + session restore (SecureStore);
online map view (MLRN + OpenFreeMap vector tiles + the existing dot styling); plant/care/fire forms
(camera + gallery, GPS pin, wilaya derived server-side via the API route); outbox offline queue for
all three types incl. photos with a "pending sync" indicator; own submissions list (read-only);
deep-link email confirmation. No moderation tooling (stays web-only).

**v2 (explicitly cut):** offline map tiles/offline basemap; push notifications; realtime live map
sync; App Attest / Play Integrity hardening (`@expo/app-integrity` is alpha — do not build v1 on an
alpha security primitive); OAuth / Apple Sign-In; moderation or admin screens; activity-feed parity.

This split deliberately inherits the web app's "no unrequested features" discipline: v1 is the
smallest thing that puts a plant in the ground from a phone.