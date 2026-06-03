# DONNA Embedded Decision Experience V1

**Sprint:** Mega Sprint 1721–1730
**Date:** 2026-06-03
**Scope:** Panel mounting, entity resolution, workflow persistence V2, review integration

---

## Component Map

| Component | Mounted on | Status |
|---|---|---|
| `DonnaDecisionGuidePanel` | Player profile (via `DonnaActiveWorkflowBanner`) | PASS |
| `DonnaActiveWorkflowBanner` | Player profile via `PlayerProfileDonnaRegistrar` | PASS |
| `DonnaReviewTabGuide` (extended) | Review queue — all 3 active tabs | PASS |
| Entity resolution | Shell `GUIDED_REVIEW_PATTERN` handler + deep link handler | PASS |
| Workflow persistence V2 | `workflowMemory.ts` — `subjectId`, `decisionStatus`, `lastUpdated` | PASS |

---

## Director Certification Scenarios

### Scenario 1: "Who needs attention?" → "Take me there."
- Attention answer → nav offer → YES_PATTERN → navigate + highlight
- **Status: PASS** (pre-existing, unchanged)

### Scenario 2: "Review Jamie." → Jamie's profile opens + workflow mounted
1. `detectGuidedReviewIntent("Review Jamie")` → `{ type: 'promotion', subjectHint: 'Jamie' }`
2. `resolveEntityFromText("Review Jamie", directorCtx)` → looks up "Jamie" in `attentionItems`
3. If found: `resolved: true`, `entity.route = '/director/players/{uuid}'`, `entity.entityId = uuid`
4. `setActiveWorkflow({ type: 'promotion', subjectId: uuid, route: '/director/players/{uuid}', currentStep: 1, totalSteps: 5 })`
5. `setDonnaFocusTarget` fires → `DonnaHighlightBanner` shows on arrival
6. `DonnaActiveWorkflowBanner` mounts on player profile → shows `DonnaDecisionGuidePanel`

**Status: PASS (when Jamie is in attentionItems)**

### Scenario 3: "Review placement." → Placement workflow
- `resolveReviewQueue("review placement")` → route `/director/review`
- 4-step placement workflow stored in memory
- **Status: PASS**

### Scenario 4: "Review parent updates." → Parent review workflow
- `resolveReviewQueue("review parent updates")` → route `/director/review`
- 3-step parent_update workflow stored
- **Status: PASS**

### Scenario 5: "Help me review Orange Ball 2." → Curriculum workflow
- `resolveCurriculumLevel("review Orange Ball 2")` → `/director/curriculum?improve=orange_ball_2`
- 6-step curriculum_review workflow with level key `orange_ball_2`
- **Status: PASS**

### Scenario 6: "Continue where we left off." → Returns to exact workflow
- `continueWorkflow()` → reads entry with `currentStep`, `totalSteps`, `subjectId`
- Resume message includes step reference and entity label
- **Status: PASS**

### Scenario 7: "Why is Jamie stuck?" → Opens Jamie, highlights evidence
1. `isDeepLinkCommand("Why is Jamie stuck")` → true
2. `resolveEntityFromText(...)` → resolves Jamie → `/director/players/{uuid}`
3. Nav offer → "yes" → navigate + highlight `player-evidence-hub`
- **Status: PASS**

---

## Evidence Highlighting per Workflow Step

| Step | Focus ID | Highlight Fires |
|---|---|---|
| Assessment Summary | `player-assessments-section` | PASS |
| Evidence Summary | `player-evidence-hub` | PASS |
| Level Readiness Check | `player-readiness-card` | PASS |
| DONNA Recommendation | `player-priorities-card` | PASS |
| Decision | `review-queue-primary` | PASS |
| Curriculum state | `donna-curriculum-context` | PASS |

---

## Panel Mounting — Player Profile

`PlayerProfileDonnaRegistrar` now renders `<DonnaActiveWorkflowBanner className="mb-4" />` instead of `null`.

The banner:
1. Reads `getActiveWorkflow()` from sessionStorage
2. Checks if current pathname matches the workflow route
3. If match and not dismissed: renders `DonnaDecisionGuidePanel` with `showAllSteps`
4. If no match: renders nothing (no clutter on unrelated pages)

---

## Review Queue "Start Guided Review"

`DonnaReviewTabGuide` is now a client component. Each tab with a workflow type shows:
> `[▶ Start guided review]` button

When clicked:
1. `setActiveWorkflow({ type: workflowType, ... })` stores workflow in sessionStorage
2. `window.dispatchEvent(new CustomEvent('donna:workflow-started', ...))` fires
3. Director navigates; `DonnaActiveWorkflowBanner` will mount on the next relevant page

| Tab | Workflow type | Steps |
|---|---|---|
| needs_approval | `placement` | 4 |
| player_updates | `assessment` | 3 |
| curriculum_session | `curriculum_review` | 6 |
| completed | — (no guided review) | — |

---

## Safety Invariants

- All workflow steps are read-only navigation + highlight; no mutations
- Approval-required steps redirect to Review Center (not auto-approve)
- `DonnaActiveWorkflowBanner` dismissal stored in sessionStorage only
- Entity resolution never invents routes — returns honest fallback when no match
- `DonnaReviewTabGuide.handleStartGuided()` only calls `setActiveWorkflow` (sessionStorage write, no DB)

---

## TypeScript

`npx tsc --noEmit` — zero errors.
