-- Feedback device capture (2026-08-20): browser/device of the reporter, so future bug reports are diagnosable.
-- Additive, nullable, no constraint (the client zod rule caps it at 300 chars).
alter table public.feedback add column device text;
