# DESIGN.md — Green Algeria · Canopy

> **Status: live** on `feat/canopy-redesign` (Sprints 0–6, 2026-09-12). The
> owner-made SSOT HTML is vendored at `docs/design-system/canopy.html` — that
> file wins over anything written here. Sprint record:
> `docs/archive/REDESIGN_CANOPY_PLAN.md`. The token truth is `src/styles.css`.

## Identity

**Canopy** is a civic, earth-toned system built for a crowdsourced movement:
a night-soil near-black canvas (dark mode, the canonical token set) or a warm
paper canvas (light, the default), with **one green accent** — canopy green
`#2F6B3F` in light, fresh sprout `#6ED08A` in dark — carrying every primary
CTA. Trust and clarity over spectacle: it is a community map, not a
storefront.

**The colors mean things (functional, not decoration):**
- **Canopy green** — the one accent, all primary actions and brand moments.
- **Wadi blue** — the care/watering system only.
- **Wildfire amber** — the fire-report system ONLY. Never decoration, never
  UI chrome. If it's amber, it's about fire.
- **Terracotta** — Algeria's clay soil; supporting UI accents (eyebrows,
  section labels, the risk-layer tone).
- **Sand** — the quaternary info tone (satellite hotspots, waiting states).
- **Error red** — independent of wildfire amber. Destructive admin actions
  and validation errors use it; the fire system never borrows it.

## Colors (live tokens in `src/styles.css`)

| Token | Light | Dark | Use |
|---|---|---|---|
| `--background` / `--canvas` | `#fdfbf8` warm paper | `#100d0a` night soil | page |
| `--card` / `--surface` | `#ffffff` | `#17130f` | cards, sheets |
| `--foreground` / `--on-surface` | `#211c14` | `#f2ede4` | text |
| `--muted-foreground` | `#6e6353` | `#a89c8a` | secondary text |
| `--primary` | `#2F6B3F` | `#6ED08A` | CTA, active states, indicator |
| `--plant` | `#2F6B3F` | `#6ED08A` | positive/tree semantic |
| `--care` | `#206E86` | `#6FB8CC` | care/water semantic |
| `--fire` | `#C24A1C` | `#E8622C` | fire semantic ONLY |
| `--destructive` | `#d13438` | `#ff6b6b` | error/destructive (independent) |
| `--sand` | `#96751F` | `#E0B65C` | info/waiting/hotspots |
| `--terracotta` | `#B5652E` | `#D99B6C` | eyebrows, risk tone |
| `--border` | `#e2d9c8` | `#2e2519` | hairlines |

Map palette (`map-style.ts colorsFor`): trees green, care wadi blue, fires
wildfire amber, hotspots sand, wilaya borders green, mask = theme base. The
risk layer keeps its perceptual green→red ramp (data-viz).

## Typography

- **Sora** (variable, self-hosted) — display: headings, hero (`display-hero`
  utility, weight 700, -0.02em tracking).
- **DM Sans** (variable, self-hosted) — all body and UI text.
- **Noto Kufi Arabic** (display) + **Noto Sans Arabic** (body) — the Arabic
  faces; Sora/DM Sans carry no Arabic glyphs, stacks fall through per glyph.
- Body ≥ 4.5:1 contrast in both themes; large text ≥ 3:1.

| Tier | Face | Spec |
|---|---|---|
| headline-lg | Sora | 700 · 32px · -0.01em |
| headline-md | Sora | 600/700 · 22-28px |
| display-hero | Sora / Noto Kufi (RTL) | `.display-hero` utility |
| body | DM Sans / Noto Sans Arabic | 16px · 1.5 |
| label | DM Sans | 11-12px · 600 · uppercase · `.eyebrow` (terracotta) |

## Shape, Space, Depth

- **Radius scale:** 4px (chips, tags) · 8px (buttons, inputs — `rounded-md`)
  · 16px (mid cards, `rounded-lg`) · 24px (canonical cards, `rounded-xl`)
  · full (pills, icon circles only where shape signals a control).
- **Spacing:** 8px rhythm (4/8/16/24/48/80). Spacing IS hierarchy: tight
  within groups, ≥24px between them.
- **Elevation:** surface contrast (paper vs card) is the primary cue;
  shadows are soft and rare (`--shadow-sm/md/lg`); glass panels use
  `--glass` + blur.

## Motion

- `--ease-out: cubic-bezier(.22,1,.36,1)` — signature expo-out: entrances,
  drawers, reveals, hovers.
- `--ease-spring: cubic-bezier(.34,1.3,.64,1)` — micro-UI overshoot
  (indicator, toggles).
- Durations: `.18s` micro · `.3s` cards/panels · `.55s` drawers.
- `prefers-reduced-motion` disables every animation and transition.

## Layout

- **Public pages:** slim fixed top bar + hamburger drawer (grouped nav with
  a staggered reveal). The map fills the viewport; view toggle floats
  centered at top; the action card anchors bottom-start; "find my location"
  is the single map control (bottom-end desktop, top-end phones, RTL-mirrored).
- **Staff pages (`/moderate`, `/admin`, `/activity`):** the Canopy sidebar is
  the shell from 1024px up — 280px expanding, 78px icon rail (persisted),
  sliding 3px active indicator (ease-spring), labeled groups (Explore 5 /
  Contribute 3 / Workspace 3), footer carries collapse + theme + locale +
  privacy, auth row below. Below 1024px: top bar + drawer.
- Content fills the available width; no centered max-w dashboards.

## Components

- **Buttons:** 8px radius, 600 label, hover lift + `active:scale-[0.96]`.
  Variants: primary (green), outline, secondary (neutral), ghost, link.
  Destructive actions are outlined wildfire-amber text — one style for one
  meaning app-wide.
- **Chips/badges:** 4px radius, 11-13px · 600 · 0.04em tracking. Tones:
  green active/approved, wadi blue category, sand info/satellite, wildfire
  amber fire status only, terracotta risk.
- **Inputs:** 44px touch height, `text-align: start`, focus = primary border
  + 4px green glow (one global rule covers every hand-rolled field).
- **Status badge:** `StatusBadge` (queue tones). Role badges: admin plant,
  moderator care, none muted.
- **Toast:** pill on the card surface.
- **Photo fallback (`PhotoThumb`):** missing/404 photos never render the
  browser's broken-image icon — a tinted block with a sprout (plant) or
  flame (fire) icon.
- **Skeletons:** content-shaped shimmer cards for queues, tables, map.
- **Reveal (`Reveal`):** one-time fade/slide on viewport entry, reduced-motion
  safe. Used on form shells and public sections.
- **Staff queue:** keyboard-first review (arrows/j-k pick, A approve, R
  reject — never while typing), submission-age chip (neutral <24h, sand
  24-72h, wildfire >72h), no queue-depth display during review.

## RTL rules (checklist)

- Logical properties only (`ms/me/ps/pe/start/end`, `text-start/end`).
- Mirror only directional icons; never logos, search, settings.
- Direction-aware animations via CSS vars (`rtl:` variant or `--dx`).
- Phone/email/URL inputs: `dir="ltr"`; user-generated text: `dir="auto"`.
- Grid: DOM order + auto-placement mirror; explicit column positions don't.
- The marquee track is ALWAYS `dir=ltr` (geometry hack, documented in
  `AnnouncementBanner`).

## Do's and Don'ts

**Do**
- Reserve the green for primary CTAs — one emphasized element per screen.
- Use the semantic tokens (`plant`/`care`/`fire`/`sand`/`terracotta`); never
  hardcoded colors or Tailwind's default palette in app code.
- 4px chips, 8px buttons, 24px cards. Keyboard-first staff flows. Both
  themes from the same token set. RTL-first: every pattern mirrors.

**Don't**
- Don't use wildfire amber for anything that isn't the fire system.
- Don't introduce a second brand accent.
- Don't show reviewers queue depth; don't soften the Protection Civile
  disclaimer; don't render the broken-image icon.
- Don't use Sora/Manrope-style Latin faces for Arabic text — the Noto
  Arabic faces carry it.
