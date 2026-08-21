# Green Algeria

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](LICENSE)
[![CI](https://github.com/Meykiio/dz-green/actions/workflows/ci.yml/badge.svg)](https://github.com/Meykiio/dz-green/actions/workflows/ci.yml)

A community-run live map of Algeria's tree planting, tree care, and wildfire reports — every tree on one map, so the next person plants one too.

**[green-dz.vercel.app](https://green-dz.vercel.app)** — use the app · **[github.com/Meykiio/dz-green](https://github.com/Meykiio/dz-green)** — the code

![Green Algeria home](public/og.png)

## What it does

Planting activity in Algeria happens all over social media and disappears there. Nobody can see the cumulative total, nobody knows which trees are still being watered a month later, and there is no fast, shared way to flag a fire. Green Algeria puts all three on one live map of the country's 58 wilayas.

Anyone can contribute, no account needed:

- **Plant** — post a planting with a photo and a location (GPS, a pin, a Google Maps link, or just the wilaya). A volunteer moderator in that wilaya reviews it before it appears.
- **Care** — log that you watered or checked any approved site. Publishes immediately and builds a visible timeline per site.
- **Fire** — report a wildfire. Publishes immediately — speed beats moderation there.

**Green Algeria is not an emergency service.** In danger, call Protection Civile on 14 or 1021. The app says this on the fire form, on its confirmation screen, and in the SOS panel in the top bar — and that wording stays.

## Features

- **Map-first home** — MapLibre GL + OpenFreeMap: every tree, care log and fire as its own dot at every zoom, wilaya borders, fire pulse halos, click-to-zoom wilayas, a recenter control, correct Arabic labels, dark theme.
- **Anonymous-first submissions** — no account, under a minute, with a private receipt link (`/my/<token>`) to check your submission's status later.
- **Honest locations** — server-side wilaya derivation from coordinates; wilaya-only submissions are stored and labeled as "wilaya-level", never fake precision.
- **Roles** — admin + wilaya-scoped moderators managed from `/admin`; moderation queues scoped by RLS, with an audit trail (`reviewed_by/at`, moderator notes).
- **Dashboards** — admin (platform stats + wilaya oversight + role management), moderator (queues scoped to their wilayas), and `/activity` for every signed-in user.
- **Abuse gate** — silent-drop honeypot, submit-timing floor, hashed-IP + daily-rotating device-hash rate limits. Raw IPs and device secrets are never stored.
- **Emergency contacts** — Protection Civile 14/1021, Police 17, Gendarmerie Nationale 1055, SAMU 16, one tap in the top bar.

Known gaps, honestly: alerting is schema-only (a contacts UI exists but nothing sends — wire-or-drop is an open decision); the interface is English-only (Arabic/French is an open decision). See [`docs/FEATURES.md`](docs/FEATURES.md) for the per-flow truth and [`docs/ROADMAP.md`](docs/ROADMAP.md) for what's next.

## Stack

React 19 + TypeScript, TanStack Start (SSR + server functions) + TanStack Router + TanStack Query, Vite, Tailwind CSS v4, MapLibre GL, Supabase (Postgres + PostGIS, Auth, Storage, Realtime, RLS).

## Run it locally

Requires Bun (or npm) and a Supabase project.

```bash
bun install
cp .env.example .env   # then fill in your project values
```

`.env.example` lists every variable. The `VITE_*` trio goes into the browser bundle (safe — the publishable key is public by design). The server-side variables must reach the server runtime; the service-role key is required locally for submissions and photo serving, and is injected by the host in production. Never commit a real `.env`.

Set up the database by running [`docs/FULL_SCHEMA_EXPORT.sql`](docs/FULL_SCHEMA_EXPORT.sql) in your project's SQL editor — the **single canonical schema source**, verified against the live database. It recreates everything: extensions, enums, tables, indexes, functions, triggers, RLS policies, grants, the realtime publication, and the private `photos` storage bucket. (`supabase/migrations/` is the change record for reviewers, not a bootstrap path — see its README.)

```bash
bun run dev     # http://localhost:5173
bun run test    # unit tests
bun run build   # production build
```

To make yourself an admin, sign up in the app, then run:

```sql
INSERT INTO public.user_roles (user_id, role) VALUES ('<your auth user id>', 'admin');
```

The first admin must be seeded in SQL; after that, roles and wilaya assignments are managed from `/admin` in the app.

## Documentation

- [`docs/FEATURES.md`](docs/FEATURES.md) — what works, what is unverified, what is missing
- [`docs/DATABASE.md`](docs/DATABASE.md) — tables, columns, every RLS policy in plain English, functions, grants, storage
- [`docs/AUDIT.md`](docs/AUDIT.md) — the last full audit (security, performance, accessibility, SEO, code, data)
- [`docs/PROJECT_STRUCTURE.md`](docs/PROJECT_STRUCTURE.md) — every file and folder, one line each
- [`docs/SYSTEM_INSTRUCTIONS.md`](docs/SYSTEM_INSTRUCTIONS.md) — standing rules for contributors
- [`docs/CHANGELOG.md`](docs/CHANGELOG.md) — what changed and when
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — what's next: pre-launch owner actions, open decisions, parked ideas
- [`docs/FULL_SCHEMA_EXPORT.sql`](docs/FULL_SCHEMA_EXPORT.sql) — one-file database recreation

## Contributing

Contributions welcome — read [`CONTRIBUTING.md`](CONTRIBUTING.md) first. Bugs go through the issue templates; bigger ideas start as an issue before any code.

## License

[AGPL-3.0](LICENSE) — Copyright © 2026 Sifeddine Mebarki ([Meykiio](https://github.com/Meykiio)), Algiers, Algeria.
