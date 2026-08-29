-- Audit hardening (2026-08-28, docs/AUDIT_2026_08.md).
-- Behavior-neutral changes:
--   1. Revoke EXECUTE on rls_auto_enable() from client roles (sec-definer helper,
--      only ever needed as the owner; anon/authenticated must not run it).
--   2. Missing FK indexes for the activity + stats read paths.
--   3. RLS initplan fix: replace per-row auth.uid() calls with a
--      (select auth.uid()) subquery — same semantics, evaluated once per query.

revoke execute on function public.rls_auto_enable() from public;
revoke execute on function public.rls_auto_enable() from anon, authenticated;

create index if not exists sites_user_id_idx on public.sites (user_id);
create index if not exists sites_reviewed_by_idx on public.sites (reviewed_by);
create index if not exists care_logs_user_id_idx on public.care_logs (user_id);
create index if not exists fire_reports_user_id_idx on public.fire_reports (user_id);

drop policy if exists profiles_read_own on public.profiles;
create policy profiles_read_own on public.profiles for select using ((id = (select auth.uid())));

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles for insert with check (((select auth.uid()) = id));

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update
  using ((select auth.uid()) = id)
  with check (
    ((select auth.uid()) = id)
    and (is_moderator = (
      select p.is_moderator from profiles p where (p.id = (select auth.uid()))
    ))
  );

drop policy if exists user_roles_read_own on public.user_roles;
create policy user_roles_read_own on public.user_roles for select using ((user_id = (select auth.uid())));

drop policy if exists sites_read_own on public.sites;
create policy sites_read_own on public.sites for select using ((user_id = (select auth.uid())));

drop policy if exists sites_moderator_read on public.sites;
create policy sites_moderator_read on public.sites for select
  using (private.can_moderate((select auth.uid()), wilaya_code));

drop policy if exists sites_moderator_update on public.sites;
create policy sites_moderator_update on public.sites for update
  using (private.can_moderate((select auth.uid()), wilaya_code))
  with check (private.can_moderate((select auth.uid()), wilaya_code));

drop policy if exists fire_moderator_update on public.fire_reports;
create policy fire_moderator_update on public.fire_reports for update
  using (private.can_moderate((select auth.uid()), wilaya_code))
  with check (private.can_moderate((select auth.uid()), wilaya_code));
