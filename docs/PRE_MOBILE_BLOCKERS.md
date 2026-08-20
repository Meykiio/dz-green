# PRE_MOBILE_BLOCKERS.md — Pre-mobile blocker resolution (2026-08-19, research + planning only)

Status: **planning pass — no code written, fixed, or merged.** Owner brief: four separate
investigations (PR #9, PR #10, PR #11, wilayas 58→69), each ending in an explicit verdict,
plus flag-only items. Facts below were re-verified against the actual code and the live
schema on 2026-08-19 — nothing was taken from ROADMAP titles alone.

## Item 1 — PR #9 (i18n/RTL) — Verdict: code is ready to fix now; merge is blocked on the author's rebase

**State (API, 2026-08-19):** head `2c6c3daa` unchanged since the diff review; **7 commits
behind main, diverged** — the author has not rebased despite a request (our comment on the
PR, 2026-08-19 14:43Z: "Can you rebase this on main and resolve the conflicts?"). The
author then posted "These look great thank you!" — no rebase followed. `mergeable_state:
unknown` (GitHub cannot compute conflicts this far apart).

**P1 bug — still present, confirmed against the head code** (`src/i18n/detect.ts` +
`locale.server.ts`):
- Server path reads cookie → Accept-Language → en. Correct.
- Client path (`detect.ts`): `parseLocaleCookie(document.cookie) ?? DEFAULT_LOCALE` —
  **never reads the browser's language**.
- Result: an Arabic-first visitor with no cookie gets correct SSR `dir="rtl"` (server saw
  Accept-Language), then the first in-app navigation re-runs the loader client-side →
  `en` + `dir="ltr"` while the UI stays Arabic. The headline feature breaks for its
  primary audience.
- Fix (~5 lines): in the client branch, when no cookie, resolve via `navigator.languages`
  with the same supported-locale matching the server uses.

**Ready-to-merge checklist (ordered):**
1. Author rebases onto current main (7 behind, diverged; conflicts expected in
   `__root.tsx` + `CHANGELOG.md`).
2. On conflict resolution: keep `<Analytics />` (main `a15845b`) and the feedback grant's
   docs; keep the PR's i18n wiring.
3. Apply the `detect.ts` fix (Accept-Language parity client-side).
4. `bunx tsc --noEmit`, `bun run test` (97), `bun run build`.
5. Live smoke: Arabic-first browser, no cookie, first navigation must keep `dir="rtl"`.
6. Re-review the ~2 conflicting files, then merge.

**Action list:**
1. Wait a defined window for the author's rebase (ping sent 14:43Z; one re-ping max).
2. Owner decision: if no author action by the deadline — take over: copy the branch into
   our repo, apply fix, open our own PR.

## Item 2 — PR #10 (mobile UX) — Verdict: worth merging after #9; one known bug accepted as fast-follow

**State (API, 2026-08-19):** head `c0433208`; ahead=11, behind=7, diverged. Stacked on #9
(its first commits are #9's) → **cannot start until PR #9's verdict is "merged"**, not just
"ready". Rebase must re-add `<Analytics />` in `__root.tsx` or Web Analytics silently
disappears.

**`isMobile`/`isRtl` read once at mount:** acceptable as a fast-follow, not a merge
blocker. The failure needs (a) the map mounted, then (b) a language switch or a
768px-crossing rotation. The language switch only exists after #9 merges; the rotation
case is cosmetic (controls sit on the wrong side; nothing breaks). The post-merge
real-device pass is the right place to catch it.

**Action list:**
1. Rebase onto main only after #9 merges.
2. During conflict resolution: preserve `<Analytics />`.
3. `tsc` + tests + build, then merge.
4. File the read-once bug as a fast-follow item.

## Item 3 — PR #11 (profiles) — Verdict: not mergeable until (a) reopened + rebased and (b) runtime-verified. "Plan exists" ≠ "verified" — hard gate.

**State (API, 2026-08-19):** PR **closed** by the author, `mergeable_state: dirty`, head
`dcf7fcd`, ahead=13, behind=7. Conflicts remain in `__root.tsx`, `admin.tsx`,
`admin.functions.ts`, `CHANGELOG.md`. Author stated it was never runtime-verified against
a real Supabase session.

**Verified: no schema change** (zero migrations; `DATABASE.md` edit docs-only and
accurate). Security posture correct (service-role-only server fns with live caller
verification, no RLS loosening, no PII on public pages).

**Runtime verification procedure (the gate — live project, throwaway user):**

| Flow | Test | Pass criterion |
|---|---|---|
| `getMyProfile` | Sign in as throwaway user, call from app | Own email+name returned; a different signed-in user gets only their own row (no IDOR) |
| `updateMyProfile` | Set display_name; set avatar (jpeg < 900KB); clear it | Row updated; avatar lands in private `photos` bucket under `avatars/`; oversized/non-image rejected cleanly |
| `getPublicProfile` | Unauthenticated request to `/u/<id>` | Only name/avatar/counts; **no email, no is_moderator**; nonexistent UUID behaves (null/404, no leak) |
| Password reset | `resetPasswordForEmail` → email link → new password | Old password stops working, new one works |
| Route guard | Unauthenticated → `/profile` | Redirect, never render |
| Cleanup | Delete throwaway user + rows | No orphan PII (fire PII columns especially) |

Pass = all six green with recorded evidence in the PR. Fail on any = not mergeable.

**Planned changes:** rebase across the 4 files; dedupe `currentUserId()` → import
`optionalUserId` from `src/lib/submissions.server.ts`; `robots: noindex` on `/u/$userId`;
`publicOnly` count over-disclosure → defer to v2 (minor).

**Action list:**
1. Owner decision: ask author to reopen+rebase, or take over the branch.
2. Execute the verification table above; record evidence.
3. Apply the planned changes, then merge.

## Item 4 — Wilayas 58 → 69 — Verdict: No-Go as a blocker on mobile starting; Go as a parallel item that must land before mobile v1 forms. Deferring is safe for data, not for correctness.

**Scope (verified against code + live schema, 2026-08-19):**
- **DB: fully additive, zero schema friction.** `wilaya_code` is plain text on `sites`,
  `fire_reports`, `moderator_wilayas`; live `pg_constraint` query shows **no CHECK
  constraints, enums, or defaults** referencing wilaya codes. RLS moderation is
  equality-based → mechanically fine for new codes.
- **The real work is two data files:** `src/lib/wilayas.ts` (58 entries, codes "01"–"58";
  add 11, each needs a `mapCode` decision) and `src/data/algeria-wilayas.ts` (**48 SVG
  polygons, codes "01"–"48", auto-generated from Natural Earth 10m** — which will not
  contain the Nov-2025 divisions, so geometry needs a new source or deliberate
  hand-authoring).
- **Sharpest gap — silent misfiling:** `geo.ts` `wilayaCodeForPoint` runs
  point-in-polygon over the 48 historic polygons, and `submissions-impl.server.ts`
  `deriveWilaya` stores the hit (`mapCodeFor` only remaps 49–58). A pin in Aflou is
  silently stored as Laghouat ("03"), Barika → Batna ("05"). Fires publish immediately —
  a fire in Aïn Oussara territory lands permanently under Djelfa. **Live today; does not
  wait for this change.**
- **Hard count dependency:** `admin.functions.ts:107` caps moderator wilaya assignment at
  `.max(48)` — a latent bug even at 58.
- **Copy fixes:** "58 wilayas" in `src/routes/index.tsx:26` and `README.md:13`.

**Defer safety:** safe for *data* (existing rows untouched, no constraint to violate). Not
safe for *correctness* — misfiling continues, and mobile v1 (which reuses `wilayas.ts` via
the sync script + the same derivation through the API route) would inherit the stale list
and the misfiling.

**Action list (when Go):**
1. Source the 11 new boundaries (new dataset or explicit parent assignments) → extend
   `algeria-wilayas.ts`.
2. Add 11 entries to `wilayas.ts` with `mapCode` decisions.
3. Fix `.max(48)` → `.max(69)` (or remove).
4. Geo tests: the center test only asserts parents — safe either way, but re-run.
5. Copy fixes: `index.tsx:26`, `README.md:13`.
6. Verify: a pin in each new territory derives the new code; moderation assignment +
   queue work for 59–69.

## Flags (confirmed open — flag only, not planned)

- **Alerting (wire or drop):** still undecided — an owner decision, not a task. Nothing is
  blocked by it.
- **Infra:** load test never run (ROADMAP item 4, gated on items 2–3). Auth dashboard
  check (`AUDIT.md` P1 #3 — email confirmation ON, password min ≥ 8): **still open,
  owner-side, 2 minutes**, pending since 2026-08-18.

## Final line

**Blocking mobile scaffolding from starting:** nothing in this queue technically blocks it
— the write-path architecture is already decided and independent of all four items. **But
mobile v1 must not ship before:** the PR queue (#9 → #10 → #11, in that order; all
currently waiting on the author), the wilayas update (or mobile inherits a stale list and
silent misfiling), and the 2-minute auth dashboard check. Items that can run **in
parallel** with mobile scaffolding: wilayas (data files + `.max(48)` — pure additive),
alerting decision, load test, and PR #9's fix IF the author stalls and we take over the
branch.