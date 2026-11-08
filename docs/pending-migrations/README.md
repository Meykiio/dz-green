# Pending migrations (owner approval required)

SQL here is reviewed and ready but NOT yet applied to the live database.
After applying, fold the change into
`supabase/migrations/00000000000000_master_schema.sql`, update
`docs/DATABASE.md`, and delete the file from this folder.

| File | What | Safe to apply? | App works without it? |
|---|---|---|---|
| `2026-11_phase2a_survival_checks.sql` | Phase 2a survival checks: enum, table, 2 views, widened throttle CHECK (includes the throttle kinds below, so apply this one and skip the throttle file). Design: `2026-11_phase2_survival_design.md`; dry run: `2026-11_phase2a_dryrun.mjs` | Yes: additive only, touches no rows; dry-run passed | Yes: the code is deployed and shows "coming soon" until this runs |
| `2026-11-08_throttle_kinds.sql` | Allows the `push`, `vote`, `identify` throttle kinds in `submission_meta` | Yes: relaxes a CHECK, touches no rows | Yes: an in-memory per-instance limit applies until then |

Apply: Supabase Dashboard > SQL Editor > paste the file > Run. Verify:
`select pg_get_constraintdef(oid) from pg_constraint where conname = 'submission_meta_kind_check';`
lists all eight kinds.

## Applying Phase 2a (owner, 5 minutes)

1. Supabase Dashboard > SQL Editor > New query.
2. Paste the whole of `2026-11_phase2a_survival_checks.sql` and Run. It is
   one transaction: it either fully applies or changes nothing.
3. Check: open green-dz.vercel.app/check. The form appears instead of
   "coming soon" (no redeploy needed; the app detects the tables).
4. Tell the next agent session "2a is applied". It then folds the SQL into
   the master schema, updates `DATABASE.md`, regenerates the Supabase types
   and removes the untyped-client casts in `src/lib/survival-*.ts`.

Undo, if ever needed: the rollback block at the bottom of the SQL file
(removes only survival data).
