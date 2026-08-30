-- Volunteer account-first flow (2026-08-29): applications link to the
-- applicant's auth account, so onboarding is one click (role + wilaya) and
-- nobody needs to be called. Nullable: older applications predate the link.

alter table public.volunteers add column if not exists user_id uuid;

create index if not exists volunteers_user_id_idx on public.volunteers (user_id);

comment on column public.volunteers.user_id is
  'auth.users id of the applicant, when they applied signed in (account-first flow).';
