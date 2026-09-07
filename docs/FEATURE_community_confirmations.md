# Feature Spec: Community Fire Confirmations

Status: proposed. Owner: Sifeddine. Date: 2026-09-05.
Closes part of SEC-01 (fire-report abuse) via community flagging.

## Goal

Let users confirm or deny fire reports on the public map. Produces a
verified labels dataset (human ground truth) for retraining the fire
detection and prediction models, and gives every report a public
community-confidence signal.

## Data model

New table `fire_confirmations`:

| Column | Type | Notes |
|---|---|---|
| id | uuid pk | |
| fire_report_id | uuid fk -> fire_reports.id | cascade delete |
| voter_key | text | session/device hash, never a raw IP |
| verdict | text | one of: yes, no, unsure |
| voter_trust | numeric | trust score at vote time (for audit) |
| created_at | timestamptz | |

Constraints: unique (fire_report_id, voter_key). One vote per voter per report.
RLS enabled: public read of counts only; writes allowed for any session with
rate limiting enforced server-side. No raw IPs stored anywhere (existing rule).

Computed on fire_reports (view or trigger-maintained columns):
`conf_yes`, `conf_no`, `conf_unsure`, and `community_verified` boolean
(true when conf_yes >= 3 AND conf_yes / (conf_yes + conf_no) > 0.7).

## Flow

On any fire report (map detail panel):
- Three buttons: "I see it" / "I don't see it" / "Not sure"
- One vote per voter_key per report (replace on re-vote)
- Submitter cannot vote on their own report
- Public display: "12 confirm, 2 say no" plus the verified badge when earned

## Reputation weighting

Each voter_key carries a trust score, starting at 1.0.
When a report's outcome settles (majority verdict or moderator decision):
- voters on the correct side: trust += 0.1 (clamped to 2.0)
- voters on the wrong side: trust -= 0.1 (clamped to 0.2)
Votes weigh by trust. Nothing is deleted, only weighted. This prevents
"everyone taps yes to be nice" from flooding the signal.

## Abuse guards

- Rate limit: max 20 votes per voter_key per day
- RLS on fire_confirmations (public read of aggregates, no per-voter read)
- ip_hash only for any server-side abuse analysis (existing platform rule)
- No self-votes (submitter excluded)

## Model feedback loop

Settled reports form `verified_labels` (fire_report_id, outcome real|not_real,
settled_by majority|moderator, settled_at). This is the premium training
dataset for retraining detection and prediction: human-verified ground truth
that no satellite provides.

## Build order (small slices)

1. Table + RLS + vote write path (one button state per user)
2. Public counts + verified badge on the map detail panel
3. Trust scoring job (settles and reweights)
4. verified_labels view + export for model retraining

## Notes

- This partially answers SEC-01 (the audit's #1 finding, fire-report abuse).
- This is a Green DZ platform feature, not an ML change. The ML models
  consume verified_labels later; no model work is required to ship v1.
