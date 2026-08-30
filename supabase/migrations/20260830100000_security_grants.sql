-- Security pass 2026-08-30 (pattern review + OWASP API Top 10 mapping).
--
-- 1. PostGIS metadata tables must be read-only for client roles. Default
--    grants from the extension install left INSERT/UPDATE/DELETE open to
--    anon/authenticated — an anonymous user could corrupt spatial reference
--    data and break wilaya derivation app-wide (anonymous DoS).
-- 2. Column-level UPDATE on sites/fire_reports: RLS scopes rows for
--    moderators, but table-level UPDATE let them write ANY column on scoped
--    rows (tree_count, photo_url, write-only PII) bypassing the server fn's
--    transition rules. Grant only the moderation columns.

revoke insert, update, delete on public.geometry_columns from anon, authenticated;
revoke insert, update, delete on public.geography_columns from anon, authenticated;
revoke insert, update, delete on public.spatial_ref_sys from anon, authenticated;

revoke update on public.sites from authenticated;
grant update (status, reviewed_by, reviewed_at, moderator_notes) on public.sites to authenticated;

revoke update on public.fire_reports from authenticated;
grant update (status, resolved_at) on public.fire_reports to authenticated;
