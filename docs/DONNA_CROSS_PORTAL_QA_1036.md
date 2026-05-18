# DONNA Director Coach Cross Portal QA
Sprint 1036 — 2026-05-18

## Summary

Cross-portal verification of DONNA infrastructure built in Sprints 1001-1035.

---

## Director Portal

### Route: `/director/donna`

| Check | Status | Notes |
|---|---|---|
| Page exists | Pass | `src/app/director/donna/page.tsx` (Sprint 1004) |
| Live data queries | Pass | Queries `proposed_actions` pending count + today's `sessions` |
| DONNA daily brief component | Pass | `DirectorDonnaDailyBrief` (Sprint 1005) — props shape defined |
| DONNA review panel | Pass | `DirectorDonnaReviewPanel` (Sprint 1006) — category display |
| Director context aggregator | Built but not wired | `loadDirectorDonnaContext` (Sprint 1012) — not yet called from page |
| DonnaVoiceReadyShell | Built but not wired | Created Sprint 1035 — not yet on page |
| DonnaChatThread | Built but not wired | Created Sprint 1030 — not yet on page |
| Quick links | Pass | 6 quick-link cards wired to /director/review, /director/sessions, etc. |
| 8 question chips | Pass | Links to /director/donna-coo-demo |
| Data status badge | Pass | live/demo indicator |

**Integration gap:** `loadDirectorDonnaContext` is built but the `/director/donna` page still uses direct Supabase queries rather than the aggregator. The chat thread and voice shell are built but not surfaced.

---

## Coach Portal

### Route: `/coach` (layout)

| Check | Status | Notes |
|---|---|---|
| DonnaAssistantButton present | Pass | `src/app/coach/layout.tsx` uses DonnaAssistantButton from Sprint ~360 |
| CoachDonnaSessionPanel | Built | Sprint 1007 — props defined, not wired from sessions page |
| Coach context aggregator | Built but not wired | `loadCoachDonnaContext` (Sprint 1013) — not called from any page |
| DonnaVoiceReadyShell | Built but not wired | Sprint 1035 — not yet on coach portal |

### Route: `/coach/sessions/[id]/execute`

| Check | Status | Notes |
|---|---|---|
| Session execute page | Pass | Session execution flow exists |
| CoachDonnaSessionPanel | Not yet wired | Panel built but not surfaced in execute route |
| Voice wrap-up | Pass (existing) | `CoachSessionVoiceShell` (Sprint pre-1030) provides voice wrap-up |

### Route: `/coach/wrap-up` or `/coach/sessions/[id]/wrap-up`

| Check | Status | Notes |
|---|---|---|
| WrapUpPageClient | Pass | Sprint 1008 verified — full wrap-up flow |
| CoachSubmitForReviewFlow | Built but not wired | Sprint 1026 — UI ready, not surfaced in wrap-up page |

---

## Component Integration Status

### New components (Sprints 1025-1035) — none yet wired into page routes

| Component | Sprint | Wired to page | Notes |
|---|---|---|---|
| `DirectorApprovalActionFlow` | 1025 | No | Director review queue page could use this |
| `CoachSubmitForReviewFlow` | 1026 | No | Coach wrap-up page could use this |
| `DonnaActionPreviewCard` | 1027 | No | Could appear in review queue and submit flows |
| `DonnaChatThread` | 1030 | No | Needs a page route to live in |
| `DonnaVoiceReadyShell` | 1035 | No | Wraps DonnaChatThread — needs a page |

### Lib files (Sprints 1020-1034) — all pure, not yet called from pages

| File | Sprint | Status |
|---|---|---|
| `donnaActionTypes.ts` | 1020 | Built, not called from page routes |
| `donnaSafeReadActions.ts` | 1021 | Called from `DonnaVoiceReadyShell` (Sprint 1035) |
| `donnaDraftOnlyActions.ts` | 1022 | Built, not called from page routes |
| `donnaApprovalActions.ts` | 1023 | Built, not called from page routes |
| `donnaRoleBlocks.ts` | 1024 | Built, called from `DonnaVoiceReadyShell` indirectly |
| `donnaAuditTrail.ts` | 1028 | Built, not yet called (no server action writer yet) |
| `donnaSuggestedQuestions.ts` | 1031 | Called from `DonnaVoiceReadyShell` |
| `donnaChatSessionMemory.ts` | 1032 | Called from `DonnaVoiceReadyShell` |
| `donnaBoundaryResponses.ts` | 1033 | Called from `DonnaVoiceReadyShell` |
| `donnaAnswerFormatter.ts` | 1034 | Built, not yet called from page routes |

---

## Role Isolation Verification

| Rule | Verified |
|---|---|
| Director sees all academy data | Yes — `loadDirectorDonnaContext` queries with `academy_id` scope |
| Coach sees only own sessions | Yes — `loadCoachDonnaContext` scopes by `coach_id` |
| Coach cannot call `approve_level_move` | Yes — `classifyAction` + `donnaRoleBlocks` both block this |
| Coach cannot send parent messages | Yes — `donnaRoleBlocks` blocks + `buildParentSendNotBuiltResponse` |
| DONNA never auto-executes | Yes — all draft/approval payloads have literal `autoExecute: false` |
| All drafts go through review | Yes — `requiresDirectorReview: true` on all draft payloads |
| Review queue is director-only | Yes — `getDonnaActionsByRole('coach')` does not include review queue management |

---

## TypeScript

All 35 Sprint files (1001-1035) clean on `npx tsc --noEmit`.

---

## Integration Roadmap (for Sprint 1037 audit)

The following wiring tasks would complete Phase 4:

1. **Wire `loadDirectorDonnaContext` to `/director/donna` page** — replace the manual queries with the aggregator
2. **Surface `DonnaVoiceReadyShell` on `/director/donna`** — add a collapsible DONNA chat panel
3. **Wire `loadCoachDonnaContext` to `/coach` layout** — provide context for CoachDonnaSessionPanel
4. **Surface `CoachSubmitForReviewFlow` in wrap-up** — replace the current submit button with the new flow component
5. **Add `DirectorApprovalActionFlow` to review queue** — give directors the structured approval UI for DONNA-proposed actions

These are integration tasks, not new capability builds — all the pieces exist.

---

## Status

Phase 4 library and component infrastructure is complete. All components are TypeScript-clean and safety-verified. Page wiring is the remaining integration step, which Sprint 1037 will audit and document.
