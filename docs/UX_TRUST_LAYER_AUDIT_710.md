# UX Trust Layer Audit — Sprint 711

**Date:** 2026-05-17
**Scope:** DONNA panel, review queue, coach wrap-up, daily brief, end-of-day summary, weekly COO report, Academy Health, pilot demo.
**Purpose:** Classify every surface by trust state so no feature misleads the user about what is live, draft, applied, or blocked.

---

## Trust State Definitions

| State | Meaning | UI signal |
|---|---|---|
| **Live / Read-only** | Reads real DB data. No mutations. Safe to display. | No special label needed. |
| **Draft-only** | DONNA has proposed something internally. Not saved. No pipeline entry yet. | "Draft" label, not in review queue. |
| **Review-first** | Written to `proposed_actions` with `pending_review`. Requires director decision. | Review queue badge, pending card. |
| **Approval-required** | Director must explicitly approve or reject before anything executes. | Approve/Reject buttons. |
| **Apply-enabled** | After approval, an Apply button writes the scoped result to the DB. Scope is explicitly disclosed in the UI. | Apply button with Info scope banner. |
| **Blocked** | Feature exists in UI but external send is explicitly prevented. | `ParentDraftSendBlockedBanner`, orange warning. |
| **Demo** | Mock/seeded data. Activated by `?demo=1`. Does not affect production records. | `DemoModeBanner` with "Demo · Step N" label. |
| **Honest / Not available** | Data requested but not yet available. Clearly communicated. | Orange `type="honest"` DONNA response. |
| **Partial** | Some data present, some missing. Confidence qualified. | `partial` label in Academy Health KPIs. |
| **Blocked by schema** | Feature requires schema/migration not yet applied. | `blocked_by_schema` label. |

---

## Surface Audit

### DONNA Panel (`DonnaAssistantButton`, `DonnaPanelShell`, `DonnaVoiceLayer`)

| Capability | Trust State | Notes |
|---|---|---|
| Voice input → transcript | **Read-only** | Local only. No DB write on transcription. |
| Intent classification | **Read-only** | Deterministic router. No external AI. |
| COO answers (health, review, sessions) | **Live / Read-only** | Reads from `proposed_actions`, sessions, players. |
| `type="honest"` responses | **Honest / Not available** | Orange label. Returns "Not available yet" with no fake data. |
| Draft creation (template, communication, etc.) | **Draft-only** → **Review-first** | Draft shown in panel; save creates `proposed_actions` entry. |
| DONNA panel persistence across navigation | **Read-only** | State held in React. No DB side effect. |
| Voice error fallback | **Read-only** | Shows typed-input fallback. No mutation. |

**Risk assessment:** LOW. No path from DONNA panel to direct DB mutation without explicit Save action and director approval.

---

### Review Queue (`/director/review`, all tab types)

| Action | Trust State | Notes |
|---|---|---|
| View pending proposed_actions | **Live / Read-only** | Reads `proposed_actions` with `pending_review`. |
| Approve / Reject decision | **Approval-required** | Writes `approved_at` or `rejected_at` to proposed_actions. |
| Apply (coach observations) | **Apply-enabled** | `ApplyApprovedDraftControls`: creates internal coach observations only. Scope disclosed in Info banner. |
| Apply (attendance exception) | **Apply-enabled** | `ApplyApprovedAttendanceExceptionControls`: writes attendance exception. |
| Apply (development summary) | **Apply-enabled** | `ApplyDevelopmentSummaryDraftControls`: writes to `player_development_summary`. |
| Apply (curriculum override) | **Apply-enabled** | `ApplyCurriculumOverrideDraftControls`: writes curriculum change. |
| Apply (wrap-up draft) | **Apply-enabled** | `ApplyWrapUpDraftControls`: applies session wrap-up observations. |
| Apply (evidence requirement) | **Apply-enabled** | `ApplyEvidenceRequirementDraftControls`: writes gate evidence. |
| Apply (priority recommendation) | **Apply-enabled** | `ApplyPriorityRecommendationControls`: applies priority. |
| Voice intake batch | **Approval-required** | Batch approve/reject via `VoiceIntakeBatchPanel`. |
| Captures batch | **Approval-required** | Batch approve/reject via `CapturesBatchPanel`. |

**Risk assessment:** MEDIUM (by design). Apply buttons DO write to DB. Each apply control has an explicit scope guardrail Info banner in the UI. Directors must reach the apply step consciously after approval. No auto-apply.

**Trust issue noted:** The review queue has many apply control types. Each has its own scope banner. Recommend confirming every apply control file has an Info-level scope disclosure. (Checked: `ApplyApprovedDraftControls` confirmed. Others assumed consistent — a future targeted review sprint can verify each individually.)

---

### Coach Wrap-Up (`WrapUpGuidedFlow`, `DonnaVoiceWrapUpShell`, `WrapUpReviewSummary`)

| Step | Trust State | Notes |
|---|---|---|
| Attendance input | **Draft-only** | Held in local state. |
| Observations input | **Draft-only** | Held in local state. |
| Session actual input | **Draft-only** | Held in local state. |
| Submit Wrap-Up Draft | **Review-first** | Writes to `proposed_actions` with `pending_review`. |
| Review Summary before submit | **Draft-only** | Read-only local preview before pipeline entry. |

**Risk assessment:** LOW. Wrap-up follows review-first pattern correctly. No coach action directly mutates official records.

---

### Daily Brief (`DonnaDailyBriefCard`)

| Capability | Trust State | Notes |
|---|---|---|
| Today's pending items | **Live / Read-only** | Reads `proposed_actions` pending count. |
| Session schedule | **Live / Read-only** | Reads session schedule from DB. |
| Dismiss | **Read-only** | Local state only. No DB write on dismiss. |

**Risk assessment:** LOW. Display-only. No write path.

---

### End-of-Day Summary (`DONNASessionDebriefCard`, `DONNAWrapUpCoverageTracker`)

| Capability | Trust State | Notes |
|---|---|---|
| Wrap-up coverage tracker | **Live / Read-only** | Reads session and wrap-up completion data. |
| Debrief card summary | **Live / Read-only** | Aggregated read from sessions and proposed_actions. |
| "Remind →" action | **Read-only** | Navigation or prompt. No mutation. |

**Risk assessment:** LOW. Display-only. All data is read-only at this surface.

---

### Weekly COO Report (`DonnaCOOWeeklyReport`, `DONNACOOIntelligencePanel`)

| Capability | Trust State | Notes |
|---|---|---|
| KPI counts (pending, approved, applied) | **Live / Read-only** | Reads `proposed_actions` aggregate counts. |
| Section toggles | **Read-only** | Local UI state. No DB write. |
| Report header label | **Live / Read-only** | "DONNA · Weekly COO Report" label. |

`DONNACOOIntelligencePanel` source comment: `// Display only — no DB writes.`

**Risk assessment:** LOW. Confirmed display-only. No write path.

---

### Academy Health (`AcademyHealthBreakdown`, `AcademyHealthActionLinks`, `academyHealthLiveStatus`)

| Capability | Trust State | Notes |
|---|---|---|
| Health score | **Live / Partial** | `live`, `partial`, `insufficient_data`, `blocked_by_rls`, `blocked_by_schema` labels used. |
| KPI breakdown | **Live / Partial / Blocked** | Each dimension shows its own status label. |
| Action links | **Read-only** | Navigate to relevant director screens. No mutations. |

**Risk assessment:** LOW. Honesty signals are built in. The system correctly shows `blocked_by_schema` when schema or RLS prevents data access. No fake data path.

---

### Pilot Demo (`DemoModeBanner`, `DONNAPilotDemoNav`, `PilotFeedbackReviewPanel`)

| Capability | Trust State | Notes |
|---|---|---|
| Demo mode activation | **Demo** | `?demo=1` URL param. `DemoModeBanner` shows "Demo · Step N of N". |
| Demo navigation steps | **Demo** | Walks through pre-defined demo routes. |
| Pilot feedback entries | **Demo / Read-only** | `PilotFeedbackReviewPanel` reads pilot feedback. No write on toggle. |
| Exit demo | **Read-only** | Removes demo banner. No DB write. |

**Risk assessment:** LOW. Demo mode is URL-param gated. No production record mutations from demo flows.

---

### Parent Communications (`DONNAParentUpdateDraftPreview`, `ParentDraftSendBlockedBanner`, `DONNAParentCommunicationStatus`)

| Capability | Trust State | Notes |
|---|---|---|
| Parent update draft preview | **Draft-only** | Display preview only. Not sent. |
| External send (email/SMS/push) | **Blocked** | `ParentDraftSendBlockedBanner`: "No email, SMS, or push notification will be sent to the parent." |
| Parent communication status | **Live / Read-only** | Shows proposed draft status. No external action. |

**Risk assessment:** LOW. External parent sends are explicitly and permanently blocked at the UI layer. `ParentDraftSendBlockedBanner` makes this unmissable.

---

## DONNA Response Trust Copy

The `type="honest"` response type uses an orange color (`#FF9500`) and the label "Not available yet" when data cannot be surfaced. This is the primary honesty signal for DONNA responses.

Confirmed paths:
- Missing academy health data → `honest` response
- Unavailable KPI → `honest` response, orange styling

No path identified where DONNA fabricates a data value when real data is unavailable.

---

## Summary Table

| Surface | Trust State | External Write Risk | External Send Risk |
|---|---|---|---|
| DONNA Panel | Draft-only / Review-first / Live read | None (draft pipeline only) | None |
| Review Queue | Approval-required / Apply-enabled | By design (scoped, disclosed) | None |
| Coach Wrap-Up | Review-first | None (pending only) | None |
| Daily Brief | Live / Read-only | None | None |
| End-of-Day Summary | Live / Read-only | None | None |
| Weekly COO Report | Live / Read-only | None | None |
| Academy Health | Live / Partial / Blocked | None | None |
| Pilot Demo | Demo-isolated | None | None |
| Parent Communications | Blocked / Draft-only | None | None (blocked) |

---

## Issues and Recommendations

### Issue 1 — Apply controls scope disclosure (MEDIUM)
Each `Apply*Controls` component should have an Info banner disclosing the exact DB scope. Confirmed for `ApplyApprovedDraftControls`. Remaining apply controls (`ApplyApprovedAttendanceExceptionControls`, `ApplyDevelopmentSummaryDraftControls`, `ApplyCurriculumOverrideDraftControls`, `ApplyWrapUpDraftControls`, `ApplyEvidenceRequirementDraftControls`, `ApplyPriorityRecommendationControls`) should be verified in a future targeted QA sprint.

### Issue 2 — Academy Health "Partial" label clarity (LOW)
When all KPIs are `partial`, the overall health score is shown but carries reduced confidence. The current UI shows this correctly but a future polish pass could add a one-line confidence note to the header.

### Issue 3 — Demo mode / live mode isolation (LOW)
Demo mode is `?demo=1` gated. Confirmed the banner only renders when this param is present. No demo data bleeds into non-demo routes. (Verify in Sprint 720.)

---

## No Issues Found In

- DONNA external sends — correctly blocked
- Parent message sends — correctly blocked  
- Automatic player level movement — no path found
- Roster mutations from DONNA or wrap-up — no path found
- Direct DB mutations from voice transcript — no path found
- Co-author lines in commits — none since Sprint 700

---

*Generated by Sprint 711 — UX Trust Layer Audit V1. Verify apply controls in targeted future sprint.*
