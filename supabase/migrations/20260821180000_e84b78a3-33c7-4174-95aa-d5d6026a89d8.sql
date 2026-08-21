-- Optional contact phone on plantings (owner decision 2026-08-21: optional
-- with a verification nudge, not required). PII: never granted to client
-- roles; moderators read it through a service-role server function only.
-- Applied live via the platform MCP; this file is the change record.

alter table public.sites add column contact_phone text;

-- sites previously used table-level SELECT for clients; switch to explicit
-- column-level grants so contact_phone stays server-only — the same posture
-- fire_reports already uses for reporter PII. Do NOT replace this with a
-- table-level GRANT SELECT.
revoke select on public.sites from anon, authenticated;
grant select (
  id, lat, lng, location, wilaya_code, commune, photo_url, species,
  tree_count, planted_date, notes, planter_display_name, user_id, status,
  created_at, reviewed_by, reviewed_at, moderator_notes, location_approximate
) on public.sites to anon, authenticated;
