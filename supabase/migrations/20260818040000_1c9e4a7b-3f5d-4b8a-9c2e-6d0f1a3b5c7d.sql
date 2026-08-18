-- Harden private.user_role against stacked role rows.
--
-- The (user_id, role) primary key allows a user to hold both 'moderator'
-- and 'admin'. A bare `limit 1` then returns an arbitrary row. Prefer
-- 'admin' deterministically ('admin' < 'moderator' alphabetically).

create or replace function private.user_role(_user_id uuid)
returns public.user_role
language sql stable security definer
set search_path = 'public'
as $$
  select role from public.user_roles where user_id = _user_id order by role asc limit 1
$$;
