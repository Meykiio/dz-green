# Documentation Index

Everything about the Green Algeria platform, organized so any contributor —
human or AI agent — can orient in minutes. Read in this order:

| # | File | What it answers |
|---|---|---|
| 1 | `README.md` (this file) | Where everything lives. |
| 2 | `PLATFORM.md` | What the product IS: purpose, users, flows, rules, trust model. |
| 3 | `ARCHITECTURE.md` | How it works technically: stack, data flow, request lifecycle, patterns. |
| 4 | `FEATURES.md` | What exists today, feature by feature, with honest verified/unverified status. |
| 5 | `DATABASE.md` | The live schema truth: every table, RLS policy, grant, function — verified against the live database. |
| 6 | `DESIGN.md` | The Canopy design system (owner SSOT: `design-system/canopy.html`). |
| 7 | `PROJECT_STRUCTURE.md` | Every file and folder, one line each. |
| 8 | `ROADMAP.md` | What's next, what's parked, open owner decisions, the mobile app pointer. |
| 9 | `SECURITY.md` | Security posture, hardening history, open findings. |
| 10 | `SYSTEM_INSTRUCTIONS.md` | Standing rules for anyone working in this repo (process, not product). |
| 11 | `CHANGELOG.md` | Append-only work log, newest first. History lives here, nowhere else. |

## Special folders

| Folder | Contents |
|---|---|
| `design-system/` | `canopy.html` — the owner-made design system SSOT (single source of truth for colors, components, motion, UX rules). |
| `pending-migrations/` | Reviewed SQL waiting for owner approval, not yet applied live. Empty when everything landed. |

## Related files outside `/docs`

- `AGENTS.md` (repo root) — how to work in this repo, non-negotiables, done-criteria.
- `../SECURITY.md` (repo root) — vulnerability reporting process.
- `../CONTRIBUTING.md` (repo root) — contributor setup and conventions.

## Maintenance rules

1. **Update the doc in the same change that makes it stale.** `FEATURES.md`,
   `DATABASE.md`, `PROJECT_STRUCTURE.md`, `CHANGELOG.md`,
   `SYSTEM_INSTRUCTIONS.md`, `ROADMAP.md` are the always-current set.
2. **Never create a new doc file for a one-off topic.** Fold it into the file
   it belongs to, or into the archive folder below.
3. **History lives only in `CHANGELOG.md`** — every other doc describes the
   current state, not how we got here.
4. **Verify before writing.** Claims about the database are checked against
   the live DB; claims about behavior are traced in code. No stale facts.
5. `archive/` holds superseded reference material that is still occasionally
   useful (e.g. the translation master). Nothing there is a source of truth.
