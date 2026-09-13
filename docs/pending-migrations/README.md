# Pending migrations (owner approval required)

These SQL files are written and reviewed but **NOT applied to the live
database** — schema changes wait for the owner's explicit approval
(standing rule). Once approved, the change is applied live AND merged into
`supabase/migrations/00000000000000_master_schema.sql` in the same pass,
and this folder goes back to empty.

## fire_confirmations.sql (2026-09-05)

Community fire confirmations: the `fire_confirmations` votes table
(deny-all RLS, service-role only), its indexes, and the public
`fire_confirmation_counts` view exposing only per-fire aggregates. The
application code (`src/lib/confirmations.*`) is already committed and fails
soft (counts return zeros, voting errors server-side) until this lands.
