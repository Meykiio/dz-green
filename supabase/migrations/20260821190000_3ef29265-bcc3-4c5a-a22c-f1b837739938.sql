-- Structured feedback kinds (bug / idea / other) so feature propositions are
-- separable from bug reports. Existing rows default to 'other'.
-- Applied live via the platform MCP; this file is the change record.

alter table public.feedback
  add column kind text not null default 'other'
  check (kind in ('bug', 'idea', 'other'));
