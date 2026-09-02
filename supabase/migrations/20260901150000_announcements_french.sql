-- French announcements (third locale, 2026-09-01): title_fr/body_fr.
-- Existing rows backfill from EN as a placeholder; admin edits the real French.
alter table public.announcements
  add column title_fr text,
  add column body_fr text;

update public.announcements set title_fr = title_en, body_fr = body_en;

alter table public.announcements
  alter column title_fr set not null,
  alter column body_fr set not null;

alter table public.announcements
  add constraint announcements_title_fr_len check (char_length(title_fr) between 1 and 120),
  add constraint announcements_body_fr_len check (char_length(body_fr) between 1 and 600);
