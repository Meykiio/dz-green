-- Feedback box (2026-08-18). Service-role writes only: anon/authenticated
-- grants revoked; RLS on with no policies. Mirrors FULL_SCHEMA_EXPORT.sql
-- section 18. Applied live via platform MCP (feedback_table migration).

create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  message text not null check (char_length(message) between 1 and 2000),
  page text,
  created_at timestamptz not null default now()
);

alter table public.feedback enable row level security;

revoke all on table public.feedback from anon, authenticated;

comment on table public.feedback is 'Visitor feedback from the home page Feedback dialog; service-role write and read only.';