-- Sprint 6: wilaya-level submissions.
--
-- A submitter may now choose only a wilaya (no exact pin). The server stores
-- the wilaya's display centre and marks the row location_approximate = true,
-- so the UI can show an honest "wilaya-level" badge instead of fake precision.

alter table public.sites add column location_approximate boolean not null default false;
alter table public.fire_reports add column location_approximate boolean not null default false;

-- fire_reports uses column-level SELECT grants; the new column must be granted
-- explicitly or clients cannot read it.
grant select (location_approximate) on public.fire_reports to anon, authenticated;
