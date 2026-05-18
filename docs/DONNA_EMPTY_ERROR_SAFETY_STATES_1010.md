# DONNA Empty/Error Safety States
Sprint 1010 — 2026-05-18

## Summary

Created `src/components/donna/DonnaStateMessage.tsx` — inline state message component for DONNA panels.

## Relation to Existing DONNAEmptyStateSurface

| Component | Level | Use Case |
|---|---|---|
| `DONNAEmptyStateSurface` (Sprint 636) | Full surface | Full-page/section empty state (review_queue, player_list, etc.) |
| `DonnaStateMessage` (Sprint 1010) | Inline | Compact inline message inside a card/panel/section |

## States

| Kind | Color | Use Case |
|---|---|---|
| `no_data_yet` | muted | Populates as system is used |
| `backend_unavailable` | orange | Fallback to demo |
| `schema_missing` | orange | Migration pending |
| `no_pending_reviews` | green | All clear |
| `no_sessions_today` | muted | No schedule gap |
| `role_cannot_access` | muted | Permission boundary |
| `draft_saved_locally` | blue | localStorage draft |
| `requires_approval` | lime | Director review required |
| `future_capability` | muted | Deferred feature |
| `demo_fallback` | orange | Not live data |
| `live_data` | green | Confirmed live |
| `stale_data` | orange | May be outdated |

## Convenience Wrappers

- `DonnaDemoNotice` — one-line import for demo data callouts
- `DonnaApprovalRequired` — one-line import for approval notices
- `DonnaBackendUnavailable` — one-line import for backend error notices
