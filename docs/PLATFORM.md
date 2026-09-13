# Green Algeria — الجزائر الخضراء

A community-run live map of Algeria's tree planting, tree care, and wildfire
reporting. Anonymous-first: no account needed to submit or to browse. Live at
**green-dz.vercel.app**. Arabic-first interface (AR/EN/FR), free, no ads, open
source (AGPL-3.0). Owned by Sifeddine Mebarki (Meykiio), built for and by the
community.

## The problem it solves

Algeria plants millions of trees, and the proof disappears into social media
feeds. Nobody sees the total grow, nobody tracks which trees were watered a
month later, and when a fire starts there is no shared public picture. Green
Algeria puts all of it on one living map of the country: every planting, every
care visit, every fire — posted by ordinary people, visible to everyone.

## Who uses it

| User | What they do |
|---|---|
| Anonymous visitors (the core audience) | Plant a tree, log care on a site, report a fire — no account, under a minute. Follow their own submission via a private receipt link. |
| Signed-in users | Everything above plus a personal "My activity" dashboard. |
| Volunteer moderators (wilaya-scoped) | Review pending plantings, triage fire reports, reveal submitter contact info on demand — only for their assigned wilayas. |
| Admin (the owner) | Users and roles, volunteer onboarding, feedback inbox, announcements, platform stats. |
| Volunteers (applicants) | Apply from the platform; approved applicants become wilaya moderators. |

## The three submission flows

1. **Plant a tree** (`/plant`) — photo + location (GPS, map pin, Google Maps
   link, or just a wilaya). Enters the moderation queue (`pending`); a
   wilaya-scoped moderator approves it before it appears on the public map.
   Optional contact phone lets a moderator call to verify.
2. **Log care** (`/care`) — "I watered it" / "I checked it" on any approved
   site. Publishes immediately, no queue. Drives the rain-aware "needs water"
   flag (14 days without care, cleared by real rainfall via Open-Meteo).
3. **Report a fire** (`/fire`) — publishes instantly, no review: minutes
   matter. Community confirmations ("I see it / I don't / Not sure") add a
   public trust signal.

Around those: a full-viewport MapLibre home map with five layers (trees,
care, fires, NASA FIRMS satellite hotspots, the Kabylie fire-risk model),
realtime updates, monthly wilaya leaderboard, Web Push fire alerts, installable
PWA, trilingual UI (Arabic default with full RTL), and anonymous receipt links
(`/my/<token>`) as the only way back to an anonymous submission.

## Non-negotiable product rules

- **Not an emergency service.** The Protection Civile disclaimer
  (call 14 / 1021) is permanently visible on the fire form, its confirmation
  screen, and the SOS panel. Never soften, hide, or imply dispatch.
- **Privacy is structural, not promised.** No raw IPs ever (salted SHA-256
  hashes only). Reporter name/phone and planting contact phone are
  column-grant protected: no client can read them; moderators reveal them
  on demand through scope-checked server functions. No PII on public pages.
- **No client-side writes.** Every insert goes through a server function
  behind the abuse gate (honeypot silent-drop → 1.2s timing floor →
  hashed-IP + rotating device-hash hourly limits). Zero INSERT RLS policies
  exist by design.
- **Speed vs review:** plantings are reviewed; care and fires are instant.
- **The map is the product.** No clustering — every tree is its own dot.

## Trust model

- Volunteer moderation is per-wilaya: admins see everything, moderators see
  only assigned wilayas, enforced by RLS and re-checked live on every server
  call. Roles live in `user_roles`, never in user metadata.
- Fires get community confirmations (threshold: 3+ yes votes and >70% yes
  ratio) — a trust layer, never a replacement for Protection Civile.
- Everything is open source; moderation policy and code are public.
