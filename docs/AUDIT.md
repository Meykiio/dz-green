# AUDIT.md — Full platform audit (2026-08-18)

Method: six tracks, evidence-based. Standards: OWASP ASVS 5.0.0 (security), Core Web Vitals (performance), WCAG 2.2 AA (accessibility), plus SEO, code quality, and data/backend integrity. Every finding carries its evidence. Run again before each launch.

## Verdict

**No P0 findings.** Nothing broken, nothing exploitable, no data integrity issues. P1 #1–2 and P2 #4–6 are **fixed** (commits `777a1bc`/`be33a38`, see statuses below); P1 #3 is owner-side. Remaining backlog: P2 #7–10.

## P0 — fix now

_None._

## P1 — fix before launch

| # | Finding | Evidence | Fix |
|---|---|---|---|
| 1 | `src/components/map/HeroMap.tsx` is **393 lines**, over the project's 250-line rule | line count | **Fixed** (`777a1bc`): split into `map-style.ts` / `map-data.ts` / `map-layers.ts` + slim `HeroMap.tsx`, all < 250 |
| 2 | `public/sitemap.xml` uses **relative `loc`s** — invalid per the sitemap spec (absolute URLs required) | file content; sitemaps.org spec | **Fixed** (`777a1bc`): removed; regenerate with the real domain at deploy |
| 3 | **Auth dashboard settings unverified** — email-confirmation requirement and password minimum length live in the Supabase dashboard, not in SQL | not queryable via MCP/SQL | Owner: 2-minute check in Auth → Settings (require email confirmation ON for signups; password min ≥ 8) |

## P2 — backlog

| # | Finding | Evidence | Suggested fix |
|---|---|---|---|
| 4 | Moderator panels (`PendingQueue`, `FireTriage`, `ContactsPanel`) **silently render empty on query error** — a moderator can't tell "clear queue" from "query failed" | grep: `isLoading` handled, `isError` absent in all three | **Fixed** (`777a1bc`): error state added to each panel |
| 5 | Dark-theme `--fire` text contrast **4.18:1** (AA needs 4.5 for small text) | computed-contrast probe | **Fixed** (`777a1bc`): `--fire` lightened to 0.67 L in `.dark` (4.5+:1) |
| 6 | `inputValidator` (deprecated) used in 8 server fns | rg; dev-server warnings | **Fixed** (`be33a38`): renamed to `.validator()` |
| 7 | Vendored `ui/chart.tsx` (296 lines) and `ui/sidebar.tsx` (691 lines) have **zero consumers** | rg: no imports outside the vendored dir | Prune or keep as vendored — owner decision |
| 8 | First load transfers **~21 MB / 209 requests** (tile-heavy basemap) | performance probe | Accepted cost of the real map; evaluate a lighter basemap style later |
| 9 | `submission_meta` has **no retention policy** — grows unboundedly at scale | row count 0 today; insert path reviewed | Opportunistic cleanup (delete > 24 h rows inside the gate insert) or a cron |
| 10 | LCP/INP need **field data** — lab-only numbers captured (CLS 0, zero long tasks) | probe | PageSpeed Insights / RUM on the deployed URL post-launch |

## Verified clean (no action)

- **Dependencies:** `bun audit` — zero vulnerabilities.
- **XSS/injection:** 3 `dangerouslySetInnerHTML`/`innerHTML` usages, all static literals (`__root` theme script, RecenterControl SVG, vendored chart.tsx); no `eval`, no `document.write`, no raw SQL — every query is parameterized via supabase-js; all server-fn inputs zod-validated.
- **PII:** `fire_reports` column grants intact — `anon` SELECTs only the 13 safe columns; `reporter_name`/`reporter_phone`/`user_id` unreachable by clients.
- **RLS:** role-matrix battery **40/40** (anon/regular/wilaya-moderator/admin; cross-wilaya write no-ops verified row-level; self-promotion denied; trigger sync both ways).
- **Service key:** server-only (`*.server.ts` + server routes + tests; never a component or client module).
- **Uploads:** photo type (jpeg/png/webp) + 900 KB cap enforced server-side.
- **Schema vs export file:** exact match — 9 app tables, 12 policies, 7 private functions, 2 triggers, 25 indexes, 4 enums, private `photos` bucket, 3 realtime tables.
- **Indexes:** pending-queue query uses `sites_status_created_idx` when it matters (EXPLAIN with seqscan off).
- **Receipts:** zero orphans across all three kinds.
- **A11y:** body text 13.27:1 (light) / 15.13:1 (dark); CTA 12.28:1 both themes (AAA); one `h1` per route with logical `h2` progression; unique titles; forms labeled; alt texts present; reduced-motion honored; **drawer made `inert` + `aria-hidden` when closed during this audit** (was a keyboard-focus-into-invisible-nav bug).
- **Performance:** CLS 0; zero long tasks; bundle code-split correctly (maplibre separate chunk, 250 KB gzip; app 121 KB gzip); fonts subset-loaded on demand.
- **Code hygiene:** no TODOs, no `any` leaks outside tests, console calls are all intentional error plumbing.
- **Dashboard UI consistency (Phase 5, `6a37cc8` + this pass):** `/moderate`, `/admin`, `/activity` verified page-by-page against the home chrome — same `rounded-lg` card family (24px via `--radius`), same `border-border bg-card` rows, eyebrow pattern (admin/activity), icon-tinted section headers, tone colors (plant/care/fire); one divergence found and fixed — `PendingQueue` printed `planted_date` raw while activity used `formatDate`.

## Dashboard checks for the owner (not SQL-verifiable)

1. Auth → Settings: email confirmation required for signups; password minimum length ≥ 8.
2. Auth → URL configuration: production redirect URLs when the domain exists.
