-- Sprint 3: roles — admin + wilaya-scoped moderators.
--
-- Source of truth: public.user_roles + public.moderator_wilayas.
-- public.profiles.is_moderator is kept as a denormalized flag synced by
-- trigger so existing client hooks and legacy policies keep working.
-- Assignments use historic wilaya codes (01-48); the ten post-2019 wilayas
-- share their parent territory's moderator because map geometry only covers
-- the historic polygons.

create type public.user_role as enum ('admin', 'moderator');

create table public.user_roles (
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.user_role not null,
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

alter table public.user_roles enable row level security;

-- A user may read their own role(s); everything else is server-side only.
create policy user_roles_read_own on public.user_roles
  for select to authenticated
  using (user_id = auth.uid());

grant select (user_id, role) on public.user_roles to authenticated;

create table public.moderator_wilayas (
  user_id uuid not null references auth.users (id) on delete cascade,
  wilaya_code text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, wilaya_code)
);

alter table public.moderator_wilayas enable row level security;
-- No client grants: assignments are managed by admins through server functions.

-- Server-side management (admin server functions) runs with the service role.
grant select, insert, update, delete on public.user_roles to service_role;
grant select, insert, update, delete on public.moderator_wilayas to service_role;

-- Role helpers (private, SECURITY DEFINER). Live reads from the tables, so
-- revocation is immediate — no reliance on JWT claims or the access-token
-- auth hook (avoids the dashboard dependency; revisit at scale if RLS checks
-- become a hot path).
create or replace function private.user_role(_user_id uuid)
returns public.user_role
language sql stable security definer
set search_path = 'public'
as $$
  select role from public.user_roles where user_id = _user_id limit 1
$$;

create or replace function private.is_admin(_user_id uuid)
returns boolean
language sql stable security definer
set search_path = 'public'
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = 'admin')
$$;

create or replace function private.user_wilayas(_user_id uuid)
returns text[]
language sql stable security definer
set search_path = 'public'
as $$
  select coalesce(array_agg(wilaya_code order by wilaya_code), '{}'::text[])
  from public.moderator_wilayas where user_id = _user_id
$$;

-- Legacy moderator check now means "any staff role".
create or replace function private.is_moderator(_user_id uuid)
returns boolean
language sql stable security definer
set search_path = 'public'
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role in ('admin', 'moderator'))
$$;

-- Staff scope: admins act on every wilaya; moderators only on assigned ones.
create or replace function private.can_moderate(_user_id uuid, _wilaya_code text)
returns boolean
language sql stable security definer
set search_path = 'public'
as $$
  select private.is_admin(_user_id) or (_wilaya_code = any(private.user_wilayas(_user_id)))
$$;

-- Alert contacts: admins manage any; moderators only contacts fully scoped to
-- their assigned wilayas (a global/empty filter is admin-only).
create or replace function private.can_manage_contact(_user_id uuid, _filter jsonb)
returns boolean
language sql stable security definer
set search_path = 'public'
as $$
  select
    private.is_admin(_user_id)
    or (
      (select count(*) from jsonb_array_elements_text(coalesce(_filter -> 'wilayas', '[]'::jsonb))) > 0
      and (select bool_and(w = any(private.user_wilayas(_user_id)))
           from jsonb_array_elements_text(coalesce(_filter -> 'wilayas', '[]'::jsonb)) w)
    )
$$;

grant execute on function private.user_role(uuid) to authenticated, service_role;
grant execute on function private.is_admin(uuid) to authenticated, service_role;
grant execute on function private.user_wilayas(uuid) to authenticated, service_role;
grant execute on function private.can_moderate(uuid, text) to authenticated, service_role;
grant execute on function private.can_manage_contact(uuid, jsonb) to authenticated, service_role;
grant execute on function private.is_moderator(uuid) to authenticated, service_role;

-- Keep profiles.is_moderator in sync with user_roles (denormalized flag).
create or replace function private.sync_profile_moderator_flag()
returns trigger
language plpgsql security definer
set search_path = 'public'
as $$
declare
  v_user uuid := coalesce(new.user_id, old.user_id);
  v_mod boolean;
begin
  select exists (select 1 from public.user_roles where user_id = v_user and role in ('admin', 'moderator'))
  into v_mod;
  update public.profiles set is_moderator = v_mod where id = v_user;
  return coalesce(new, old);
end
$$;

drop trigger if exists user_roles_sync_profile on public.user_roles;
create trigger user_roles_sync_profile
  after insert or update or delete on public.user_roles
  for each row execute function private.sync_profile_moderator_flag();

-- Policies: scope every staff policy by wilaya.
drop policy if exists sites_moderator_read on public.sites;
create policy sites_moderator_read on public.sites
  for select to authenticated
  using (private.can_moderate(auth.uid(), wilaya_code));

drop policy if exists sites_moderator_update on public.sites;
create policy sites_moderator_update on public.sites
  for update to authenticated
  using (private.can_moderate(auth.uid(), wilaya_code))
  with check (private.can_moderate(auth.uid(), wilaya_code));

drop policy if exists fire_moderator_update on public.fire_reports;
create policy fire_moderator_update on public.fire_reports
  for update to authenticated
  using (private.can_moderate(auth.uid(), wilaya_code))
  with check (private.can_moderate(auth.uid(), wilaya_code));

drop policy if exists alert_contacts_moderator_all on public.alert_contacts;
create policy alert_contacts_moderator_all on public.alert_contacts
  for all to authenticated
  using (private.can_manage_contact(auth.uid(), region_filter))
  with check (private.can_manage_contact(auth.uid(), region_filter));

-- Grant tightening: drop privileges no policy can exercise.
revoke insert, update, delete, truncate, references, trigger
  on public.sites, public.care_logs, public.fire_reports, public.alert_contacts,
     public.submission_meta, public.profiles
  from anon;

revoke truncate, references, trigger
  on public.sites, public.care_logs, public.fire_reports, public.alert_contacts,
     public.submission_meta, public.profiles
  from authenticated;

-- Promote existing staff to roles: current is_moderator=true users become admins.
insert into public.user_roles (user_id, role)
select id, 'admin' from public.profiles where is_moderator = true
on conflict do nothing;