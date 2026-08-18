-- Sprint 8: scale hardening — composite indexes for the hot read paths.
--
-- The moderation queue filters by status and orders by created_at; the abuse
-- gate filters submission_meta by (ip_hash|device_fingerprint, kind,
-- created_at). Single-column indexes covered these individually; the
-- composites keep them fast when the tables grow.

create index if not exists sites_status_created_idx
  on public.sites (status, created_at desc);

create index if not exists fire_status_created_idx
  on public.fire_reports (status, created_at desc);

create index if not exists submission_meta_kind_created_idx
  on public.submission_meta (kind, created_at desc);

create index if not exists submission_meta_device_kind_created_idx
  on public.submission_meta (device_fingerprint, kind, created_at desc);
