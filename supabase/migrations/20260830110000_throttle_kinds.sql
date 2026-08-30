-- Shared throttle support (security report 2026-08-30): widen the
-- submission_meta.kind CHECK so feedback + volunteer attempts can be counted
-- with the same hashed-IP mechanism the submission gate uses.

alter table public.submission_meta drop constraint if exists submission_meta_kind_check;
alter table public.submission_meta add constraint submission_meta_kind_check
  check (kind = any (array['planting','care','fire','feedback','volunteer']));
