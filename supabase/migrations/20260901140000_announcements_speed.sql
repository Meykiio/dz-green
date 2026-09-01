-- Admin-controlled marquee speed (owner request, 2026-09-01):
-- seconds per loop, 10 (fast) to 120 (very slow), default 32.
alter table public.announcements
  add column speed_seconds smallint not null default 32
    check (speed_seconds between 10 and 120);
