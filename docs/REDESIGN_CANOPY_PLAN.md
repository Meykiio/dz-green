# REDESIGN_CANOPY_PLAN.md

Full-platform design refactor to the **Canopy** design system
(`greendz-design-system.html`, the owner-made SSOT, vendored at Sprint 0 to
`docs/design-system/canopy.html`).

Status: **plan approved-in-progress**. Branch: `feat/canopy-redesign`.
Rule per sprint: one commit, CI green (`tsc` + unit + build), no logic changes,
docs updated in the same commit. Zero schema changes. Zero new features.

---

## 0. Why this shape (research digest)

Codebase scan (2026-09-12):

- The app is already token-driven: `--plant` / `--care` / `--fire` + shadcn
  semantic tokens in `src/styles.css`. Hardcoded colors: **41 occurrences in
  14 files**, almost all in the map (`map-style.ts`, `risk-layer.ts`,
  `PrecisionPicker.tsx`) plus a handful of `text-amber/orange` utilities.
  A token swap re-skins ~90% of the app without touching components.
- Layout today: fixed top bar everywhere + hamburger drawer; staff pages get
  a static `w-60` sidebar only on md+. Forms are centered `max-w-xl` cards.
  Staff dashboards use `SectionTabs` segmented pills + card lists.
- RTL is already first-class (`dir=rtl`, logical Tailwind utilities), but the
  Canopy HTML is LTR-only: every imported pattern must be mirrored.

Web research (2026-09-12, sources at the bottom):

- **Dashboard layout (Linear/Stripe/Grafana/Vercel convergence):** 240-280px
  sidebar collapsing to a 64-78px icon rail; 4-6 KPI cards max above the fold;
  12-col grid, 24px gutters, `auto-rows: minmax(200px, auto)`; skeleton
  loading states (never spinners alone); every component has designed
  loading/empty/error states; tables get sticky headers, 48-52px rows,
  left-text/right-numbers/center-badges alignment.
- **Review-queue UX (HITL moderation research):** keyboard shortcuts for 90%+
  of decisions (mouse-only cuts throughput 30-40%); content first, AI/context
  second (anchoring bias); rationale required on high-stakes decisions; SLA/
  age visible as urgency color; **never show queue depth to the reviewer in
  session** (throughput rises, quality drops); show the reviewer their own
  progress instead.
- **RTL engineering:** logical properties everywhere; mirror only directional
  icons (`scaleX(-1)`), never logos/search/settings; direction-aware
  animations via a CSS var; `dir="ltr"` on phone/email/URL inputs; `dir="auto"`
  for user-generated text; explicit grid column positions do NOT mirror, DOM
  order does.
- **Dashboard UX craft:** F/Z scanning puts the most global numbers top-left
  (top-right in RTL); consistent card anatomy (title always same spot);
  progressive disclosure via tooltips/drawers; on mobile show only the top
  section vertically; comparisons/deltas give numbers meaning; never
  rainbow-salad status colors.

## 1. Decisions needed BEFORE Sprint 0 (owner call) — ALL CONFIRMED 2026-09-12

| # | Question | Decision |
|---|---|---|
| D1 | Default theme | **Light default** (dark stays the toggle; Canopy's dark token set is canonical, both themes fully built) |
| D2 | Fonts | **Adopt** Sora + DM Sans for Latin; Arabic keeps Noto Kufi + Noto Sans |
| D3 | Fire color | **Adopt** wildfire amber; error stays independent red |
| D4 | Radius | **Adopt** Canopy scale (4/8/16/24) |
| D5 | Staff navigation | **Sidebar** for `/moderate` + `/admin` + `/activity`; public keeps the top bar |
| D6 | Scope guard | **Token-first sprints**, commit per sprint, no logic/schema changes |

## 2. Token mapping (current → Canopy)

| Current token | Canopy replacement (light / dark) |
|---|---|
| `--primary` lime `#9fe870` | `#2F6B3F` canopy / `#6ED08A` sprout |
| `--plant` `#2ead4b` | `#2F6B3F` / `#6ED08A` (same family, one green) |
| `--care` cyan `#38c8ff` | wadi blue `#206E86` / `#6FB8CC` |
| `--fire` red `#d03238` | wildfire amber `#C24A1C` / `#E8622C` |
| `--destructive` | independent error red `#d13438` / `#ff6b6b` |
| `--background` sage `#e8ebe6` | warm paper `#fdfbf8` / night soil `#100d0a` |
| `--card` white | `#ffffff` / `#17130f` |
| `--muted-foreground` | `#6e6353` / `#a89c8a` |
| `--border` | `#e2d9c8` / `#2e2519` |
| new: `--sand` (quaternary) | `#96751F` / `#E0B65C` (info chips, hotspots tone) |
| new: `--terracotta` (secondary) | `#B5652E` / `#D99B6C` (supporting UI, section labels) |
| radius | `--r-xs 4 / --r-sm 8 / --r-md 12 / --r-lg 16 / --r-xl 24 / --r-full` |
| motion | `--ease-out cubic-bezier(.22,1,.36,1)`, `--ease-spring cubic-bezier(.34,1.3,.64,1)`, `--dur-fast .18s / --dur-med .3s / --dur-slow .55s` |
| fonts | display: Sora / Noto Kufi Arabic; body: DM Sans / Noto Sans Arabic |

Map colors (`map-style.ts`) remap in the same pass: trees → canopy green,
care → wadi blue, fires → wildfire amber, hotspots → sand, wilaya borders →
green family, mask → theme base. Fire pulse keeps its signature animation,
recolored.

## 3. The sprints

### Sprint 0 — Branch, vendor, token foundation — **DONE 2026-09-12**
- `git checkout -b feat/canopy-redesign` ✓
- SSOT HTML vendored to `docs/design-system/canopy.html` ✓
- `@fontsource-variable/sora` + `@fontsource-variable/dm-sans` installed ✓
- `src/styles.css` rewritten to Canopy tokens (both themes, fonts, radius,
  motion); `@utility` API kept (`eyebrow`, `tap-target`, `glass-panel`,
  `display-hero`); `ga-*` keyframes untouched ✓
- theme-color meta → `#2F6B3F` ✓
- Verified: `tsc` clean, 219/219 unit tests, client + SSR + Nitro build
  green. In-browser two-theme/RTL visual pass queued for the owner device
  check; map colors remap in Sprint 3 ✓ (limits noted)
- Commit: `feat(canopy): token foundation — colors, fonts, radius, motion`

### Sprint 1 — Primitives — **DONE 2026-09-12**
- `ui/button.tsx` (8px radius, ease tokens, tactile press), `SectionTabs`
  picks up tokens automatically (primary fill + counts), `StatusBadge`,
  `Chip`/`Stat` (HomeBits), inputs via one global focus-glow rule +
  `text-align: start`, `ui/textarea`, toast (`ui/sonner`), announcement
  palette + color-picker swatch + legend dot → sand/terracotta semantics ✓
- Stray `text-amber-*`/`text-orange-*` utilities replaced with semantic
  tokens (`--sand`, `--terracotta`, `--destructive`); zero palette classes
  remain outside the map pipeline ✓
- Verify: tsc + 219/219 unit + build green ✓; visual pass queued (merge)

### Sprint 2 — Chrome: public top bar + staff sidebar — **DONE 2026-09-12**
- `components/shell/StaffSidebar.tsx`: 280px → 78px persisted rail, sliding
  3px inline-start indicator (ease-spring), nav groups, footer (collapse +
  theme + privacy), auth row; `lg:` breakpoint (drawer below 1024) ✓
- `AppShell` split: public routes keep top bar + drawer; staff pages mount
  the sidebar (old `w-60` aside removed); privacy toggle moved to the
  chrome footers; `AppShell` back under the 250 cap (206) ✓
- `AppDrawer`: grouped nav + staggered RTL-safe reveal, privacy in footer ✓
- `nav.ts`: shared NAV_ITEMS + GROUP_SPECS for drawer and sidebar ✓
- i18n: `navGroup.*` + `aria.{collapseNav,expandNav}` in AR/EN/FR ✓
- Verify: tsc + 219/219 unit + build green ✓; nav walk + 390px + RTL
  queued (merge)

### Sprint 3 — Home map surface — **DONE 2026-09-12**
- `map-style.ts` colorsFor → Canopy palette (fires amber, hotspots sand,
  paper/night-soil masks); `PrecisionPicker` pin + accuracy circle ✓
- ActionCard / ViewToggle / ticker / Leaderboard / SiteList /
  FireConfirmations / legend: token-driven, inherit Canopy with zero
  markup changes ✓
- 250-line rule zeroed: DetailPanel 253→189 (FireBody + Field →
  detail-bodies), map-layers 255→191 (wireInteractions →
  map-interactions) ✓
- Verify: tsc + 219/219 unit + build green ✓; E2E flows.spec + visual map
  pass queued (merge gate)

### Sprint 4 — Submission flows + public pages
- `/plant`, `/care`, `/fire`, `/volunteer`, `/auth`, `/my/$token`,
  `/about`, `/privacy`, `/terms`: FormShell-derived layout, Canopy inputs,
  severity/action selectors → Canopy chips, photo input, `LocationField`,
  `CommuneField`, `PlantingGuide`, `SpeciesSuggest`, `ReceiptLink`,
  `FireAlertsCard`, success screens (Peak-End rule: the confirmation is the
  emotional moment — receipt link gets the primary card).
- The Protection Civile disclaimer keeps its exact visibility semantics —
  restyle, never reduce.
- Verify: all three submissions end-to-end on the branch (dev DB), receipt
  round-trip, honeypot intact, RTL, 390px; E2E `flows.spec.ts` +
  `receipts.spec.ts`.
- Commit: `feat(canopy): submission flows + public pages`

### Sprint 5 — Staff dashboards (moderate / admin / activity)
- Apply the review-queue research:
  - `/moderate`: KPI strip (pending / approved today / active fires / total),
    queue cards redesigned (photo, metadata grid, contact reveal, note,
    Approve/Reject as the one primary + one destructive action), keyboard
    shortcuts (A approve / R reject / arrows navigate, never while typing),
    age-of-submission visible; **no total-queue-depth banner** (research:
    it degrades decisions). Fire triage gets status urgency color.
  - `/admin`: five sections in the sidebar (users, volunteers, feedback,
    announcements, overview); users list → proper table (sticky header,
    48px rows, left text / center badges); dialogs restyled.
  - `/activity`: three sections as Canopy cards with empty states.
- Verify: moderator approve/reject/reopen flows, admin role/wilaya actions,
  volunteer onboard, announcement publish; E2E `admin.spec.ts` +
  `activity.spec.ts`; RTL; 390px.
- Commit: `feat(canopy): staff dashboards — queues, tables, shortcuts`

### Sprint 6 — Life layer, a11y, docs, merge prep
- Motion: scroll reveals on public pages, draw-underline hero accent,
  skeleton loaders (map card, queues, tables), empty-state illustrations
  (existing copy, Canopy surfaces), focus-visible rings everywhere.
- Accessibility pass: contrast of every new token pair (AA), keyboard
  walk of all staff actions, reduced-motion honored.
- RTL audit against the research checklist (physical properties, icons,
  animations, grid positions, `dir="ltr"` inputs, `dir="auto"` UGC).
- Docs: rewrite `docs/DESIGN.md` (Canopy), update `PROJECT_STRUCTURE.md`,
  `FEATURES.md`, `CHANGELOG.md`, `SYSTEM_INSTRUCTIONS.md` (design-token
  rule now points at Canopy), `ROADMAP.md` (redesign shipped).
- Full E2E suite (16 tests) + unit suite + build + owner device pass.
- Commit: `feat(canopy): motion, a11y, RTL audit, docs` → PR → merge.

## 4. Do-NOT-touch list (breakage guards)

- `useHeroMapMount.ts` mount/cancellation logic (colors only, no behavior).
- `submissions.*`, `moderation.functions.ts`, `admin-*.functions.ts`,
  `confirmations.*` — zero logic changes; classNames only where rendered.
- i18n: no key removals; new keys (sidebar groups, shortcut hints) added in
  all three dicts in the same sprint that needs them.
- The `ga-marquee` track direction hack (RTL blank-strip bug) — restyle
  colors only.
- E2E selectors: keep existing text/role queries stable where possible;
  update specs only when a label genuinely changes, in the same commit.
- The pending `fire_confirmations` migration is independent — the redesign
  branch never touches schema.

## 5. Risks

1. **Drift from main.** Mitigation: short sprints, commit each, merge the
   moment E2E is green; no parallel feature work on main during the redesign.
2. **Theme flip regressions on the map.** The map has its own color pipeline;
   Sprint 3 is deliberately isolated so map bugs can't hide inside chrome
   changes.
3. **RTL regressions from LTR-born patterns.** Every sidebar/indicator/
   animation lands mirrored in the same commit, checked on an Arabic page.
4. **Scope creep ("while we're here").** The plan changes pixels, not
   behavior. Anything behavioral goes to `ROADMAP.md` as a follow-up item.

## 6. Sources

- Art of Styleframe, "Best Dashboard Design Patterns 2026" (sidebar metrics,
  KPI discipline, grid, states, tables).
- EngineersOfAI, "Review Queues and Tooling" (keyboard-first review,
  anchoring, queue-depth hiding, SLA urgency).
- SimpleLocalize, "RTL design guide for developers" (logical properties,
  icon mirroring, direction-aware animation, form direction).
- Pencil & Paper, "Dashboard Design UX Patterns" (F/Z hierarchy, card
  consistency, progressive disclosure, mobile reduction).
- Codebase scan 2026-09-12 (token coverage, hardcoded-color inventory,
  layout map).
