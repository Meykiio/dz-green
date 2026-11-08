# Pending migrations (owner approval required)

SQL here is reviewed and ready but NOT yet applied to the live database.
After applying, fold the change into
`supabase/migrations/00000000000000_master_schema.sql`, update
`docs/DATABASE.md`, and delete the file from this folder.

| File | What | Safe to apply? | App works without it? |
|---|---|---|---|
| `2026-11_phase2a_survival_checks.sql` | Phase 2a survival checks: enum, table, 2 views, widened throttle CHECK (includes the throttle kinds below). Design: `2026-11_phase2_survival_design.md`; dry run: `2026-11_phase2a_dryrun.mjs` | Yes: additive only, touches no rows; dry-run passed | Yes: code for it is not built until approval |
| `2026-11-08_throttle_kinds.sql` | Allows the `push`, `vote`, `identify` throttle kinds in `submission_meta` | Yes: relaxes a CHECK, touches no rows | Yes: an in-memory per-instance limit applies until then |

Apply: Supabase Dashboard > SQL Editor > paste the file > Run. Verify:
`select pg_get_constraintdef(oid) from pg_constraint where conname = 'submission_meta_kind_check';`
lists all eight kinds.
