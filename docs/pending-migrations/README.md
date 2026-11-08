# Pending migrations (owner approval required)

SQL here is reviewed and ready but NOT yet applied to the live database.
After applying, fold the change into
`supabase/migrations/00000000000000_master_schema.sql`, update
`docs/DATABASE.md`, and delete the SQL file from this folder.

No SQL is pending right now. Phase 2a (survival checks, plus the
push/vote/identify throttle kinds) was applied on 2026-11-08 and folded into
the master schema as section 14c; its SQL, dry-run script and the throttle
file live in git history.

| File | What | Status |
|---|---|---|
| `2026-11_phase2_survival_design.md` | Design for the survival layer: 2a (applied), 2b campaigns and 2c quality grades and flags (not yet drafted as SQL) | 2b and 2c await a go |
