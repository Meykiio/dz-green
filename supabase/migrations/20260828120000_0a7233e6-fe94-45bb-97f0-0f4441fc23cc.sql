-- Volunteer recruitment (2026-08-28): people offer to help their wilaya as
-- moderators. PII-heavy (email/phone) — same posture as feedback: RLS on,
-- zero client grants, service-role only. `status` tracks the review flow
-- (new -> contacted -> onboarded).
-- Applied to the live project (2026-08-28) via the Supabase MCP migration
-- tool; this file is the change record. Verified after: 11 columns,
-- RLS enabled with zero policies, service_role granted
-- SELECT/INSERT/UPDATE/DELETE, no anon/authenticated grants.

create table public.volunteers (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  email text not null check (char_length(email) between 5 and 200),
  phone text check (char_length(phone) between 6 and 40),
  wilaya_code text not null,
  extra_wilayas text,
  intents text not null check (intents ~ '^(review|triage|organize|share|other)(,(review|triage|organize|share|other))*$'),
  availability text,
  message text check (char_length(message) <= 600),
  status text not null default 'new' check (status in ('new', 'contacted', 'onboarded')),
  created_at timestamptz not null default now()
);

create index volunteers_status_created_idx on public.volunteers (status, created_at desc);
create index volunteers_wilaya_idx on public.volunteers (wilaya_code);

alter table public.volunteers enable row level security;

revoke all on table public.volunteers from anon, authenticated;

grant select, insert, update, delete on table public.volunteers to service_role;

comment on table public.volunteers is
  'Volunteer applications to be wilaya moderators; service-role read/write only, like feedback.';
