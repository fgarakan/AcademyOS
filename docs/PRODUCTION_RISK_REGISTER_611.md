# Production Risk Register — Sprint 611

**Date:** 2026-05-17
**Sprint:** 611 — Production Risk Register V1

---

## Purpose

Identifies known risks for Academy OS production/pilot deployment. Each risk has a severity, likelihood, mitigation, and owner.

---

## Risk Matrix

### Critical Risks

| ID | Risk | Severity | Likelihood | Mitigation | Owner |
|---|---|---|---|---|---|
| R-01 | RLS policy gap allows cross-academy data read | CRITICAL | Low | All tables verified with RLS. Audit in Sprint 605. Test with multi-academy data before pilot. | Farshad |
| R-02 | `execute_approved_action` called with wrong `action_id` | CRITICAL | Low | Server action validates action exists and is `approved` before calling RPC. | Farshad |
| R-03 | `finalize_player_placement` called without director intent | CRITICAL | Low | Only 3 call sites, all in director-only server actions. DONNA cannot call it. | Farshad |
| R-04 | Parent message sent without director approval | CRITICAL | Low | Send explicitly blocked in `parentDraftApprovalState.ts`. No send function exists in UI. | Farshad |

### High Risks

| ID | Risk | Severity | Likelihood | Mitigation | Owner |
|---|---|---|---|---|---|
| R-05 | Web Speech API not available on coach device | HIGH | Medium | `VoiceErrorFallback` shows text input. `useVoiceDictation` checks availability before starting. | Farshad |
| R-06 | Voice transcript misunderstood — wrong classification | HIGH | Medium | Coach reviews transcript before confirming. `DONNACommandPreviewCard` shows classification + matched signals. Clarification flow available. | Farshad |
| R-07 | Supabase RLS blocks live query (session-level) | HIGH | Low | `donnaCOOAnswerEngine` has `status: 'blocked_by_rls'` — shows degraded answer, not crash. | Farshad |
| R-08 | Placement drafted but not applied — orphaned approved action | HIGH | Medium | `DirectorExecutionReadinessPanel` shows approved-not-applied count. Director can retry apply. | Farshad |

### Medium Risks

| ID | Risk | Severity | Likelihood | Mitigation | Owner |
|---|---|---|---|---|---|
| R-09 | Intent classifier misclassifies ambiguous input | MEDIUM | Medium | Clarification flow (Sprint 594) surfaces on low/ambiguous confidence. Coach can rephrase. | Farshad |
| R-10 | Template immutability violated by direct DB edit | MEDIUM | Very Low | `template_blocks` not exposed in any UI. Override writes to `curriculum_overrides` only. | Farshad |
| R-11 | Audit log write fails silently | MEDIUM | Low | Audit log write is non-blocking — primary action succeeds even if audit fails. Review in next major version. | Farshad |
| R-12 | Wrap-up submitted twice for same session | MEDIUM | Medium | `proposed_actions` allows duplicate proposals — director sees both in review queue. No dedup logic yet. Future sprint. | Farshad |

### Low Risks

| ID | Risk | Severity | Likelihood | Mitigation | Owner |
|---|---|---|---|---|---|
| R-13 | DONNA session memory lost on page reload | LOW | High | By design — ephemeral. Not a bug. Coach must re-enter context. | N/A |
| R-14 | Weekly brief stale if context not refreshed | LOW | Medium | `donnaWeeklyOperatingLoop` accepts pre-fetched context — caller responsible for freshness. | Farshad |
| R-15 | Coach observation not promoted to player profile | LOW | Medium | Observation preview shows promotion path. Director must explicitly apply. | Farshad |

---

## Pre-Pilot Risk Mitigations Required

| Risk | Action |
|---|---|
| R-01 | Run multi-academy RLS test before pilot |
| R-05 | Test Web Speech API on Brian's device/browser |
| R-06 | Rehearse demo with voice — verify classification accuracy |
| R-08 | Load demo data and verify full approve→apply flow |

---

## Accepted Risks for V1 Pilot

The following risks are accepted for the Brian pilot and will be addressed in future sprints:

- R-11: Audit log silently fails — acceptable for pilot
- R-12: Duplicate wrap-up proposals — director can reject duplicates manually
- R-13: Session memory ephemeral — coaching sessions are short enough this is not an issue
- R-14: Weekly brief staleness — not being used in pilot flow
