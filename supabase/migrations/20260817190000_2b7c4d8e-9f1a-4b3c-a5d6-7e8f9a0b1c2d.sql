-- Sprint 4: anonymous-first — receipt links.
--
-- A receipt lets an anonymous submitter check their submission's status later
-- via an unguessable link (/my/<token>). Only the SHA-256 hash of the token is
-- stored; the raw token exists only in the URL shown once on the success
-- screen. No client can read this table — lookups go through a server
-- function that returns status only (never PII).

create table public.receipts (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  kind text not null check (kind in ('planting', 'care', 'fire')),
  -- Polymorphic parent: one of sites/care_logs/fire_reports. No FK because
  -- there are three possible parents; the join is resolved in app code.
  submission_id uuid not null,
  created_at timestamptz not null default now()
);

alter table public.receipts enable row level security;
-- Zero client policies: deny-all for anon/authenticated. Service role only.

grant select, insert, delete on public.receipts to service_role;
