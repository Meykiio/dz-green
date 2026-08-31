# MOBILE.md — Green Algeria mobile app (status note)

The single mobile reference. The older planning docs (`MOBILE_RESEARCH.md`,
`PRE_MOBILE_BLOCKERS.md`) are archived in `docs/archive/` — they describe how
we got here, not the current state.

## Current state (2026-08-30)

- **Repo:** `laidanimounir/dz-green-mobile` (collaborator's Expo app, cloned locally at `C:\Users\DELL\Desktop\Sifeddine\projects\dz-green-mobile`). Stack: Expo SDK 57 + React Native + TypeScript, Expo Router, MapLibre React Native (native module), expo-sqlite offline outbox, same Supabase backend.
- **Env:** `.env` set locally (same Supabase project + `EXPO_PUBLIC_API_URL=https://green-dz.vercel.app`).
- **Contract (shipped, PR #33):** `POST /api/mobile/submissions` — Bearer session token, same zod schemas + abuse gate + receipts as the web. Full JSON contract pinned on issue #8. Direct-RLS reads work with the anon key from the app.
- **Auth:** deep-link scheme `dzgreenmobile://**` registered in Supabase Auth → URL Configuration → Redirect URLs (owner, 2026-08-30).

## The one blocker: running it

- **Expo Go is retired** (removed from the App Store at SDK 55, frozen at SDK 54) and can never run native modules anyway — the map needs a **development build**.
- **Free path today:** Android emulator on Windows (Android Studio → `npx expo run:android` in the mobile repo). Full app with map.
- **iOS path:** a development build signed for a physical iPhone requires an Apple Developer Program membership ($99/year) — owner's call when shipping, or ask laidanimounir to sign a TestFlight/dev build.

## Open item

- GitHub issue **#8** — the collaboration thread (contract, deep-link, dev-build testing).
