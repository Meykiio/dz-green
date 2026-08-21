# Contributing to Green Algeria

Thanks for helping. This file is the short version; the binding rules live in
`AGENTS.md` (how to work) and `docs/SYSTEM_INSTRUCTIONS.md` (project-technical
rules). Read both before your first change.

## Ways to contribute

- **Bug reports** — open an issue with the bug template. Include the page/flow,
  device + browser, wilaya if location-related, console errors, and screenshots.
- **Feature suggestions** — open an issue first and describe the problem, not
  the solution. Unrequested features get built by nobody, including us.
- **Code** — pick an issue (or file one and wait for a go-ahead), then follow
  the checks below.
- **Moderation** — want to review plantings in your wilaya? Open an issue
  titled "Moderator: <your wilaya>".

## Setup

1. Bun 1.2+: `bun install`
2. `cp .env.example .env` and fill in your Supabase project values (the
   service-role key is needed locally for the photo proxy and submissions).
3. `bun run dev` → http://localhost:5173

## Checks that must pass before a PR

- `bunx tsc --noEmit`
- `bun run test` (unit)
- `bun run build`
- `bunx playwright test` (live E2E — needs the SQL fixtures from
  `docs/SYSTEM_INSTRUCTIONS.md` §E2E fixture recipe, and cleanup after)
- Schema/policy changes also need the RLS battery re-run — the procedure
  (seed, run, read the contract, clean up) is in
  `docs/SYSTEM_INSTRUCTIONS.md` §RLS audit battery.

CI runs the first three on every PR and push to `main`
(`.github/workflows/ci.yml`). E2E stays local — it needs the live database.

## Branch and PR conventions

- Work on a short-lived branch off `main`, one logical change per PR.
- Commit message: `type(scope): summary` — e.g. `feat(map): …`,
  `fix(auth): …`, `docs: …`. Types: feat, fix, docs, chore, test, refactor.
- Fill the PR template's verification checklist honestly — "not verified"
  is an acceptable line; a false "done" is not.
- Schema changes stay rare and explicit: a new dated file in
  `supabase/migrations/` **and** a new numbered section in
  `docs/FULL_SCHEMA_EXPORT.sql`, in the same commit, with GRANTs + RLS +
  policies together.

## Rules that bite

- **Max 250 lines per hand-written file.** Split past that.
- **Commit after every phase** and keep `/docs` current in the same change
  (`FEATURES.md`, `DATABASE.md`, `PROJECT_STRUCTURE.md`, `CHANGELOG.md`,
  `SYSTEM_INSTRUCTIONS.md`, `ROADMAP.md`).
- **No schema change without an explicit request**, and every new `public`
  table needs GRANTs + RLS + policies in the same migration.
- **No unrequested features.** Missing something? Open an issue first.
- Never store or expose a raw IP. Never put reporter PII in a client query
  (fire PII is column-grant protected on purpose).
- The fire flow is a community map, not an emergency service — the Protection
  Civile disclaimer stays visible. Do not soften it.
- Verification beats intention: say "not verified" when you didn't run it.

## Getting help

Open an issue with the question template. Be specific about what you tried
and what happened.

## Ownership

Green Algeria is owned by Sifeddine Mebarki (Meykiio), Algiers. By
contributing you agree your changes are licensed under the project's
[AGPL-3.0 license](LICENSE).
