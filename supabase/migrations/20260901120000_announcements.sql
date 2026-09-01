-- Admin-controlled announcement banner (owner request, 2026-09-01).
-- One active announcement at a time (enforced in app code). Public reads are
-- limited to the active row by RLS; all writes are service-role (admin fns).
create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 120),
  body text not null check (char_length(body) between 1 and 600),
  kind text not null default 'info' check (kind in ('info','success','warning')),
  active boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.announcements enable row level security;

-- Public read: only the active announcement(s), nothing else.
create policy announcements_public_read on public.announcements
  for select using (active = true);

grant select on public.announcements to anon, authenticated;
-- service_role needs the explicit SELECT too (RLS bypass ≠ table privilege —
-- the feedback lesson, 2026-08-19; owner caught the empty admin list 2026-09-01).
grant select, insert, update, delete on public.announcements to service_role;
