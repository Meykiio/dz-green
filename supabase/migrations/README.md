# supabase/migrations — change record, NOT a bootstrap path

**Setting up a fresh project? Do not run this folder.** Use
[`docs/FULL_SCHEMA_EXPORT.sql`](../../docs/FULL_SCHEMA_EXPORT.sql) — the
single canonical schema source. It is what actually built the current
project and it is verified against the live database.

This folder is the chronological record of schema changes. It cannot be
run in order to reproduce the current project:

- The first four files (`20260812…` → `20260815…`) were applied to the
  **previous** Supabase project (`jvxotfcxolwotcavrluu`), not the current
  one. The current project (`jnunqilxiajinylgehuh`) was bootstrapped in a
  single pass from the export file on 2026-08-17 (live migration
  `20260817012002 green_algeria_full_schema_from_live_export`).
- The last six files (`20260817…` → `20260818…`) are the real changes
  since the bootstrap, mirrored into the export as sections 13–18. Their
  filenames don't match the live migration versions because they were
  applied through the platform MCP, which assigns its own version labels.
- Two fixture-DML files (an audit-test insert + its delete, 2026-08-16)
  were removed from this folder on 2026-08-18 — they were test data, not
  schema. They remain in git history.

New schema changes land here as a new dated file **and** in
`docs/FULL_SCHEMA_EXPORT.sql` as a new numbered section, in the same
commit. `docs/DATABASE.md` tracks what is live.
