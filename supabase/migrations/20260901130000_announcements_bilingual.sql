-- Bilingual announcements + admin color control (owner request, 2026-09-01).
-- title/body split into _ar/_en pairs; the banner picks by visitor locale.
-- Color is a curated palette (contrast-safe), not free hex.
alter table public.announcements
  add column title_ar text,
  add column body_ar text,
  add column title_en text,
  add column body_en text,
  add column color text not null default 'ink';

-- Backfill the existing row(s): current title/body become the EN text, and
-- the AR fields start as a copy (admin edits the real Arabic after).
update public.announcements
  set title_en = title, body_en = body, title_ar = title, body_ar = body;

alter table public.announcements
  alter column title_ar set not null,
  alter column body_ar set not null,
  alter column title_en set not null,
  alter column body_en set not null,
  drop column title,
  drop column body;

alter table public.announcements
  add constraint announcements_color_check check (color in ('ink','plant','care','fire','amber')),
  add constraint announcements_title_ar_len check (char_length(title_ar) between 1 and 120),
  add constraint announcements_body_ar_len check (char_length(body_ar) between 1 and 600),
  add constraint announcements_title_en_len check (char_length(title_en) between 1 and 120),
  add constraint announcements_body_en_len check (char_length(body_en) between 1 and 600);
