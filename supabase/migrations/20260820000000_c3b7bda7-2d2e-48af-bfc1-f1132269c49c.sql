-- Drop the alerting feature (2026-08-20). Storage-only: nothing ever sent
-- alerts; owner decision to drop (ROADMAP.md "Parked" — rebuild after the
-- mobile phase and the PR queue settle). Mirrors the live migration
-- `drop_alert_contacts` applied via platform MCP.

drop policy if exists alert_contacts_moderator_all on public.alert_contacts;

drop table if exists public.alert_contacts;

-- can_manage_contact existed only to back alert_contacts_moderator_all;
-- its EXECUTE grant (authenticated, service_role) drops with the function.
drop function if exists private.can_manage_contact(uuid, jsonb);