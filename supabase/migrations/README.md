# supabase/migrations

**This folder holds exactly ONE file: `00000000000000_master_schema.sql`.**

That file is the complete, current database schema (public schema, functions,
triggers, indexes, RLS, grants, realtime publication, `photos` bucket). It is
verified against the live database and kept up to date **in place**: whenever
the schema changes, EDIT the master file to its new final state — do not append
new incremental migration files.

Rules:

1. **A fresh project runs this file once** (postgres/owner role, SQL editor,
   top to bottom) and ends up with the current schema. Nothing else to run.
2. **Schema changes edit the master** in the same commit as the code change,
   and update `docs/DATABASE.md` in the same commit.
3. **No schema change without the owner's explicit approval** (standing rule).
4. The live platform project keeps its own migration history in its
   `schema_migrations` table (platform-managed); this folder is not a replay
   of it. The one intentional gap is documented in the master header and in
   `docs/pending-migrations/`.

Pending migrations (owner approval required, NOT yet applied live) live in
`docs/pending-migrations/`.
