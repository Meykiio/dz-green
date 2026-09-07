-- Community fire confirmations (Phase E, feat/fire-ai-layers, 2026-09-05).
-- One row per vote on a fire report. voter_key is a session/device hash, never
-- a raw IP. Base table is deny-all for clients (service-role only); a public
-- counts view exposes only the per-fire aggregates.
create table public.fire_confirmations (
  id uuid primary key default gen_random_uuid(),
  fire_report_id uuid not null references public.fire_reports(id) on delete cascade,
  voter_key text not null,
  verdict text not null check (verdict in ('yes','no','unsure')),
  voter_trust numeric not null default 1.0,
  created_at timestamptz not null default now(),
  unique (fire_report_id, voter_key)
);

create index fire_confirmations_report_idx on public.fire_confirmations (fire_report_id);
create index fire_confirmations_voter_idx on public.fire_confirmations (voter_key);

alter table public.fire_confirmations enable row level security;

revoke all on public.fire_confirmations from anon, authenticated;
grant select, insert, update, delete on public.fire_confirmations to service_role;

-- Public per-fire vote counts (no per-voter data exposed).
create or replace view public.fire_confirmation_counts as
select
  fire_report_id,
  count(*) filter (where verdict = 'yes') as conf_yes,
  count(*) filter (where verdict = 'no') as conf_no,
  count(*) filter (where verdict = 'unsure') as conf_unsure,
  (count(*) filter (where verdict = 'yes') >= 3
     and count(*) filter (where verdict = 'yes')::numeric
         / nullif(count(*) filter (where verdict in ('yes','no')), 0) > 0.7) as community_verified
from public.fire_confirmations
group by fire_report_id;

grant select on public.fire_confirmation_counts to anon, authenticated;
