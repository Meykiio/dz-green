-- Web Push fire alerts (release phase B, 2026-08-31).
-- One row per browser push subscription. The endpoint URL is pseudonymous
-- (no account, no PII); wilaya_code scopes alerts when set (null = all fires).
-- Same posture as feedback/volunteers: RLS on, zero client policies,
-- service-role only.
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique,
  keys jsonb not null,
  wilaya_code text,
  created_at timestamptz not null default now()
);

create index push_subscriptions_wilaya_idx on public.push_subscriptions (wilaya_code);

alter table public.push_subscriptions enable row level security;

revoke all on public.push_subscriptions from anon, authenticated;
grant select, insert, update, delete on public.push_subscriptions to service_role;
