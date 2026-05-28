# QA — DONNA Event Ledger V1
**Sprint:** 914.6 | **Date:** 2026-05-28

## Table: `donna_events` (migration 071)
Immutable event rows. INSERT-only RLS. Academy-scoped.

## Events Wired (fire-and-forget, additive)
| Event | Trigger location |
|---|---|
| `donna_session_started` | Session init `useEffect` after `sessionIdRef` set |
| `context_packet_generated` | `buildDonnaContextPacketForSession` success callback |
| `confirmation_requested` | `storeAndSetPendingConfirmation()` |
| `confirmation_accepted` | CONFIRM path `clearPendingAction()` |
| `confirmation_cancelled` | CANCEL path `clearPendingAction()` |
| `curriculum_draft_created` | `execute().then()` success when `result.ok` |

## Safety
- All fire-and-forget: `.catch(() => {})` — failure never breaks DONNA ✅
- No sensitive data in metadata: only `activePage`, `actionType`, `recentConversationCount`, `source` ✅
- No raw coach notes, player names, IDs in metadata ✅
- RLS: INSERT for staff (academy-scoped), SELECT for directors ✅
- No UPDATE/DELETE policies — events are immutable ✅
- No curriculum execution changes ✅
- Sprint 904 untouched ✅
