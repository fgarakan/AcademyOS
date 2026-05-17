# No Parent Sends Audit — Sprint 723

**Date:** 2026-05-17
**Sprint:** 723 — No Parent Sends Audit V1
**Auditor:** Claude Code (automated codebase scan + manual review)

---

## 1. Executive Summary

**Result: No external parent sends exist in AcademyOS V1.**

Every code path that touches parent communication either:
- Inserts a record into the `proposed_actions` pipeline as `pending_review` (internal only), or
- Is blocked at the routing layer with an explicit guardrail, or
- Is marked `isExecutable: false` with no send infrastructure wired.

No email, SMS, or push notification provider is installed. No API route makes an outbound communication call. The production readiness conclusion is **safe**.

One copy fix was made: a button CTA that falsely implied an outbound send was corrected to accurately describe its internal navigation action.

---

## 2. Files / Routes Audited

### API routes
- `src/app/api/auth/signout/route.ts` — auth only
- `src/app/api/coach/sessions/[sessionId]/transcribe/route.ts` — Whisper STT (audio → text), no external sends
- `src/app/api/donna/tts/route.ts` — TTS synthesis only
- `src/app/api/donna/brief/route.ts` — internal brief generation, no external dispatch
- `src/app/api/donna/attention/route.ts` — internal attention engine, no external dispatch
- `src/app/api/director/interview/realtime-session/route.ts` — realtime interview session, no external sends

### Parent-facing surfaces
- `src/app/parent/page.tsx` — read-only parent portal (IDP view, attendance, progress)
- `src/app/parent/PrivateLessonRequestCard.tsx` — "Send Request" button
- `src/app/parent/requestPrivateLessonAction.ts` — server action backing the above

### Director parent communication surfaces
- `src/app/director/parents/page.tsx` — Parent Communication Center (display only)
- `src/app/director/review/StructuredDraftCard.tsx` — coach recap review card (approve/reject only)
- `src/app/director/review/VoiceIntakeDraftCard.tsx` — voice intake review card (approve/reject only)
- `src/app/director/review/actions.ts` — server actions for review queue decisions

### DONNA parent draft surfaces
- `src/components/assistant/DonnaCommunicationDraftCard.tsx` — draft display only
- `src/components/assistant/DonnaMessageReviewPanel.tsx` — message review, no send
- `src/components/donna/ParentDraftSendBlockedBanner.tsx` — send-blocked state display
- `src/components/donna/DONNAParentCommunicationStatus.tsx` — status display only
- `src/components/assistant/DonnaAssistantButton.tsx` — DONNA panel (multi-step plan UI)

### DONNA routing and guardrail layer
- `src/lib/donna/donnaCommandRouter.ts` — explicit SEND BLOCKED routing contract
- `src/lib/donna/donnaIntentClassifier.ts` — parent intent classification
- `src/lib/donna/parentDraftApprovalState.ts` — state machine with `isSendReady` always false
- `src/components/assistant/donnaProtectedActionRouter.ts` — blocks send phrases
- `src/components/assistant/donnaProtectedActionRegistry.ts` — `send_parent_message` is protected
- `src/components/assistant/donnaWorkflowRegistry.ts` — parent_update workflow spec

### KPI and NBA surfaces
- `src/lib/donna/kpiNextBestActionMap.ts` — all parent-related CTAs have `isExecutable: false`
- `src/lib/kpi/parentTrustKpiEngine.ts` — explicit "no send infrastructure" annotations
- `src/components/assistant/ParentTrustCoverageDashboard.tsx` — read-only, no send button
- `src/components/assistant/PlayerAttentionRiskDashboard.tsx` — CTA opens review queue only

### Voice pipeline
- `src/lib/voice/structureVoiceIntake.ts` — detects `parent_send_requested`, adds warning
- `src/lib/voice/voiceIntakeTypes.ts` — `parent_send_requested` flag type
- `src/lib/voice/voiceDestinationRouter.ts` — "No message is sent to the parent"
- `src/lib/voice/voiceRoleGuardrails.ts` — role-level send restrictions

### Content and safety rules
- `src/lib/communications/parentSafeResponseRules.ts` — locked content filter
- `src/lib/donna/observationVisibilityGuardrails.ts` — "parentSafeStillNeedsApproval"
- `src/lib/review/executionGuardrailCopy.ts` — `PARENT_SEND_GUARDRAIL` with two-step approval requirement

### Backend
- `src/lib/backend/intelligence.ts` — `sendCoachingMessage()` sets DB flag only; not called from any UI

### Package dependencies
- `package.json` — checked for: nodemailer, resend, sendgrid, mailgun, postmark, twilio, vonage, AWS SES. **None present.**

---

## 3. Confirmed No-Send Surfaces

### 3.1 PrivateLessonRequestCard — "Send Request" button

`src/app/parent/PrivateLessonRequestCard.tsx` → `requestPrivateLessonAction`

Action: inserts to `proposed_actions` with `status: 'pending_review'`, `target_module: 'parent_lesson_request'`. No external dispatch. No email, SMS, or notification sent. Director sees this in the review queue.

**Verdict: Safe. Internal DB insert only.**

### 3.2 Parent Communication Center — status display

`src/app/director/parents/page.tsx`

Displays parent updates by status (draft / needs approval / approved / sent). No send button exists on any card. The "approved" section header says "Approved — Staged for Delivery". The workflow banner explicitly states: *"External delivery is not yet active — approved messages are staged and ready for when the delivery pipeline is enabled."*

**Verdict: Safe. Display-only. No send trigger.**

### 3.3 DONNA parent draft workflow

DONNA routes parent message intent to `draft_parent_update`. The `donnaCommandRouter.ts` contract reads: `noParentSend: 'Parent draft route creates draft only. Send is always blocked at routing layer.'`

`DonnaCommunicationDraftCard.tsx` comment: `// Never shows a "Send" button — always shows "Review before sending".` The card's action button is "Review on screen" — navigating to the review queue, not sending.

**Verdict: Safe. Draft-only, blocked at routing layer.**

### 3.4 Review queue approve/reject actions

`src/app/director/review/actions.ts` — approval of a parent-related draft changes status to `approved` in `proposed_actions`. No external send is triggered. `executionGuardrailCopy.ts` PARENT_SEND_GUARDRAIL: *"Approval here queues it; sending requires a second director action."*

**Verdict: Safe. Approval = status flag change only, no external send.**

### 3.5 Voice intake parent send detection

`structureVoiceIntake.ts` detects parent-send language and adds `parent_send_requested` flag with warning: *"Parent send language detected — no parent message will be sent without explicit director approval."*

`donnaProtectedActionRouter.ts` blocks all send-intent phrases and returns `send_message_denied` failure mode with message: *"Sending messages always requires the on-screen button. Nothing is sent until you click Send."*

**Verdict: Safe. Active blocking guardrail.**

### 3.6 `sendCoachingMessage` in intelligence.ts

Sets `is_sent: true` in `coaching_messages` DB table. Not called from any UI component or API route in the app layer. No external email or SMS dispatch. No callers found in `src/app/`.

**Verdict: Safe. DB flag update only, no active UI path.**

### 3.7 KPI / NBA parent CTAs

`kpiNextBestActionMap.ts` — all parent-related entries have `isExecutable: false`. CTAs are navigation buttons that open the review queue or parent coverage dashboard. `parentTrustKpiEngine.ts` explicitly notes: *"no send infrastructure"* and that all `sent_at` values are `null`.

**Verdict: Safe. Navigation only, no send execution.**

---

## 4. Risky Labels Found

### 4.1 FIXED — `kpiNextBestActionMap.ts:75` — "Send wrap-up reminder"

**Before:** `actionCta: 'Send wrap-up reminder'`
**After:** `actionCta: 'View wrap-up queue'`

This button in `PlayerAttentionRiskDashboard` called `onOpenReviewQueue` (opens internal review queue). The label "Send wrap-up reminder" falsely implied an outbound send to coaches. The underlying entry had `isExecutable: false` and `executionNote: 'Wrap-up reminders are draft-only.'` — the label was the only misleading element.

### 4.2 FLAGGED — `donnaWorkflowRegistry.ts:148` — Step label "Review & Send"

The parent_update multi-step workflow defines step 2 as `{ label: 'Review & Send', taskId: null, requiresApprovalGate: true }`. This label appears in the DONNA multi-step plan step indicator UI.

The label is misleading in isolation, but:
- `taskId: null` means the step has no executable task
- `requiresApprovalGate: true` means it cannot auto-proceed
- The `openingLine` says: *"It stays in review until you approve and send it yourself."*
- The `readyForReviewLine` says: *"nothing is sent automatically"*
- `DonnaCommunicationDraftCard.tsx` has explicit comment: *"never a 'Send' button"*
- `donnaProtectedActionRegistry.ts` blocks all DONNA-initiated sends for this action type

**Decision: No code change.** The label is a step indicator in a progress wizard, not a send button. The surrounding copy and guardrails make the intent clear. This is flagged for future copy review in a dedicated DONNA copy audit sprint.

---

## 5. Fixes Made

| File | Change |
|---|---|
| `src/lib/donna/kpiNextBestActionMap.ts` | Changed `actionCta` for `player_attention_risk / no_data` from `'Send wrap-up reminder'` to `'View wrap-up queue'` |

No other code changes. No schema changes. No migrations. No package changes. No DB writes.

---

## 6. Remaining Blocked / Future Send Integration Notes

The following are correctly documented in the codebase as blocked until a future sprint wires external send infrastructure:

| Capability | Blocked By | Source |
|---|---|---|
| Parent message delivery | No send provider installed | `parentTrustKpiEngine.ts` lines 81, 98, 109 |
| Parent update frequency KPI | No `sent_at` data; `sent_at = null` for all records | `parentTrustKpiEngine.ts` line 98 |
| Parent response rate KPI | No inbound response tracking; no send infrastructure | `parentTrustKpiEngine.ts` line 109 |
| `approved_for_send` state activation | Requires `sendIntegrationAvailable: true` from a future provider | `parentDraftApprovalState.ts` line 109 |
| Parent update adapter | Blocked until Sprint 486+ | `academyHealthSourceMap.ts` line 101 |

When a messaging provider is integrated in a future sprint, the following guardrails must be reviewed before any parent send path is activated:
- `parentDraftApprovalState.ts` — `isSendReady` logic and `sendIntegrationAvailable` flag
- `PARENT_SEND_GUARDRAIL` in `executionGuardrailCopy.ts` — second director action requirement
- `parentSafeResponseRules.ts` — content filter must gate every outbound message
- `donnaProtectedActionRegistry.ts` — `send_parent_message` approval flow

---

## 7. Final Safety Conclusion

**No external parent send path exists in AcademyOS V1.**

- No email, SMS, or push notification provider is installed.
- No API route makes an outbound communication call to parents.
- All parent-facing data flows through the `proposed_actions` pipeline as `pending_review`.
- Every DONNA parent draft path is blocked at the routing layer before any send.
- The only parent portal interaction that inserts a record (lesson request) is explicitly internal.
- Active guardrails (voice flag detection, protected action router, send-blocked banner, execution guardrail copy) all independently prevent accidental send.

**Sprint 723 production readiness check: PASSED.**
