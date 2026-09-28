# Pending migrations (owner approval required)

Empty — every reviewed migration has been applied to the live database and
folded into `supabase/migrations/00000000000000_master_schema.sql`
(fire_confirmations landed 2026-09-13).

When a future schema change needs owner approval first, its SQL lives here
with a README entry, then moves into the master file when applied.
