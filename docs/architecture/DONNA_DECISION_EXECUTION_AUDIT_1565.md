# DONNA Decision Execution Audit — Sprint 1565
**Module:** `src/lib/donna/execution/` + Today card UX + DONNA brain
**Sprint:** Mega Sprint 1565–1594 — DONNA Decision Execution Engine V1
**Date:** 2026-06-09

---

## 1. Current Action Path Inventory

### 1.1 Today Card actionHref Behavior (Pre-Sprint)

All Today card actions are **dumb links** — they navigate to a page but carry no intelligence.

| Card | Action | Destination | Intelligence |
|---|---|---|---|
| TodayPrioritiesCard | `{priority.actionLabel} →` | `/director/review` or `/director/players` | None — raw href |
| TodayDecisionsCard | `{d.actionLabel} →` | `/director/review` | None — raw href |
| TodayRisksCard | `{risk.actionLabel} →` | `/director/review` or `/director/players` | None — raw href |
| TodayHealthCard | `{health.recommendedAction}` | Varies | None — raw href |

**Problem:** The director sees "3 assessments need your approval" and clicks "Review assessments →" which opens the review queue with 20 pending items — no direction on which items correspond to this priority, why it matters now, or what the safest action is.

### 1.2 Approvals / Review Flow

File: `src/app/director/review/page.tsx`  
Directory: `src/app/director/review/`

The review queue has **8 tab types**, each with its own review + apply server actions:

| Tab | Target Module | Review Action | Apply Action |
|---|---|---|---|
| Session Wrap-ups | `session_wrap_up_v1` | `updateWrapUpDraftDecisionAction` | `applyWrapUpDraftAction` |
| Structured Drafts | `session_recap_structuring` | `updateStructuredDraftDecisionAction` | `applyApprovedStructuredDraftAction` |
| Attendance Exceptions | `attendance_exception` | `updateAttendanceExceptionDraftDecisionAction` | `applyApprovedAttendanceExceptionAction` |
| Placement Reviews | `placement_review` | Manual | No apply yet |
| Curriculum Overrides | `curriculum_override` | `updateCurriculumOverrideDraftDecisionAction` | `applyApprovedCurriculumOverrideDraftAction` |
| Priority Recommendations | `priority_recommendation` | `updatePriorityRecommendationDecisionAction` | `applyApprovedPriorityRecommendationAction` |
| Evidence Links | `requirement_evidence_link` | `updateEvidenceRequirementDraftDecisionAction` | `applyApprovedEvidenceRequirementDraftAction` |
| Voice Intake | `voice_intake` | `updateVoiceIntakeDraftDecisionAction` | No apply in V1 |

**Key observation:** All server actions in `actions.ts` are well-guarded:
- Auth check (user session)
- Academy membership check (director or head_coach only)
- Proposed action academy match check
- Status guard (`pending_review` only)
- Audit log on every decision

### 1.3 proposed_actions System

The `proposed_actions` table is the central mutation contract:

```
proposed_actions
  id
  academy_id
  proposed_by_id
  voice_command_id (FK)
  action_type
  action_label
  target_module          ← determines which review card + action to use
  target_object_type
  target_object_id
  proposed_payload       ← JSONB, draft_type gated
  status                 ← pending_review | approved | rejected | clarification_needed | executed
  risk_level
  risk_notes
  approved_by / approved_at
  rejected_by / rejected_at
  reviewer_notes
  rejection_reason
```

**Architecture invariant:** `execute_approved_action()` is the only path to execute approved voice actions. All major mutations write to `audit_logs`. DONNA never silently mutates.

### 1.4 Promotion Approval Flow

**Current path:**
1. `player_curriculum_states.advancement_eligible = true` (set by curriculum state computation)
2. Director navigates to `/director/players` — no specific route to players with advancement_eligible=true
3. Director opens player profile → Skill Path tab → confirms advancement manually
4. Advancement triggers `finalize_player_placement()` or a level-change server action

**Gap:** No direct route from "3 players ready to advance" on Today → specific players → one-click advancement confirmation.

### 1.5 Placement Approval Flow

**Current path:**
1. `proposed_actions` row created with `target_module = 'placement_review'`
2. Director navigates to `/director/review` → Placements tab
3. Reviews `PlacementReviewCard`, `PlacementRecommendationDraftCard`
4. Approval marks `proposed_actions.status = 'approved'`

**Gap:** Today card says "2 player placements waiting for approval" but has no execution plan showing which players, what group was recommended, and why.

### 1.6 Parent Update Approval Flow

**Current path:**
1. `proposed_actions` with `target_module = 'parent_communication'`
2. Director navigates to `/director/review` → parent update tab
3. `ParentSummaryReviewCard` shows draft
4. `applyParentCommunicationAction.ts` executes on approval

**Gap:** No intelligence about which parent updates are most urgent, what triggered them, or whether they are time-sensitive.

### 1.7 Coach Assignment Actions

**Current state:** No server action exists for assigning `players.primary_coach_id`. Director must manually update via player profile or DB. The "Assign coaches" attention item routes to `/director/players` — no inline assignment UI.

**V1 execution approach:** Route to player list with guidance. Direct assignment via execution engine is out of scope (requires new server action + migration risk).

### 1.8 Assessment Scheduling Actions

**Current path:**
1. `proposed_actions` with `target_module = 'assessment_studio_draft'` or `'placement_assessment_draft'`
2. Director navigates to `/director/review` → assessment tab
3. `AssessmentStudioDraftCard` or `PlacementAssessmentDraftCard` shows draft
4. Approval marks reviewed; execution records result

**Gap:** Today card routes to review queue generally — no guidance on which type of assessment and what the recommended decision is.

### 1.9 Existing DONNA Action Router / Workflow Execution

**`processDonnaMessage.ts` — current execution-related coverage:**

| Step | What it does | Execution-related? |
|---|---|---|
| Step 0a | Check goal session (guided workflow) | Partial — routes to workflow |
| Step 3 | Continuity phrase detection | Goal memory only |
| Step 4 | Today guidance question | Surfaces attention items, no execution |
| Step 10.5.1b | Coach entity Q&A | Evaluates coach intelligence, no execution |
| Step 10.7 | Player entity build | Populates context, no execution |
| Step 10.8 | Coach support query | Returns coach summary, no execution |

**Gaps:**
- No handler for "fix it", "take me there", "approve this", "defer this", "show evidence", "why does this matter"
- No execution plan generation from conversational input
- No route to propose an action from conversation → review queue

---

## 2. UX Problems Identified

| Problem | Severity | Impact |
|---|---|---|
| Today cards are dumb links — no recommendation, evidence, or confidence | CRITICAL | Director clicks through blindly |
| "3 assessments need review" → dumps director into 20-item queue | HIGH | Decision fatigue; wrong items acted on first |
| DONNA phrases "fix it" / "take me there" have no wired handler | HIGH | DONNA appears incapable of action |
| No evidence summary on Today card expansions | HIGH | Director cannot judge urgency without drilling in |
| Execution plans not persisted — no audit trail pre-action | MEDIUM | Director-override reason not captured at the Today layer |
| Coach assignment has no server action | MEDIUM | "Assign coaches" routes to player list with no actionable path |

---

## 3. Decision Execution Framework Design

### 3.1 Core Principle

```
DONNA recommends → Director approves → AcademyOS records → System executes
```

The execution engine is a **pure recommendation layer**:
- Takes attention items, decisions, and signals
- Produces structured plans: recommendation + confidence + evidence + risks + actions
- Never mutates data
- Always routes through existing `/director/review` approval flows or `/director/players`

### 3.2 Execution Plan Structure

```typescript
DecisionExecutionPlan {
  id                 // matches attention item id
  type               // DecisionExecutionType
  headline           // what to do
  recommendation     // specific recommendation text
  confidence         // 'high' | 'medium' | 'low'
  evidence           // string[] — what signals support this
  risks              // string[] — what happens if ignored
  actions            // ExecutionAction[] — primary + secondary
  approvalRequired   // boolean — always true for mutations
  targetHref         // primary destination
  approvalGuardrail  // why director approval is required
}
```

### 3.3 Approval Guardrail Rules (V1)

| Action | Approval Required | Guardrail |
|---|---|---|
| Promote a player | Yes | `finalize_player_placement()` is the only path to activate; DONNA never auto-promotes |
| Reassign a player's coach | Yes | `players.primary_coach_id` mutations require director confirmation |
| Send parent updates | Yes | `applyParentCommunicationAction` requires approved proposed_action |
| Curriculum changes | Yes | `applyApprovedCurriculumOverrideDraftAction` requires approved proposed_action |
| Manual overrides | Yes | Override reason must be captured |

### 3.4 Audit Trail

For every execution plan:
- Plans are pure TypeScript (in-memory) — no DB write for plan generation
- When director takes action through `/director/review`, existing `audit_logs` mechanism captures it
- If a V2 "plan accepted" event is needed, it can be added to `audit_logs` with `action = 'execution_plan.accepted'`
- Override reasons captured via `reviewer_notes` on `proposed_actions`

---

## 4. Target Architecture Post-Sprint

```
TodayPrioritiesCard
  └─ PriorityRow
       ├─ "Why?" toggle (existing)
       └─ "Take action" toggle (new)
            └─ TodayActionExpansionPanel
                 ├─ recommendation + confidence badge
                 ├─ evidence bullets
                 ├─ risk bullets
                 ├─ primary action link → /director/review or /director/players
                 └─ "Ask DONNA" button → donna:open event

TodayDecisionsCard (converted to 'use client')
  └─ DecisionRow
       ├─ existing display
       └─ "Take action" toggle (new)
            └─ TodayActionExpansionPanel

DONNA brain (processDonnaMessage.ts)
  └─ Step 10.9 (new): execution intent detection
       ├─ "fix it" → route to most urgent pending action
       ├─ "take me there" → provide direct link
       ├─ "approve this" → route to review queue with approval context
       ├─ "defer this" → explain defer path
       ├─ "show evidence" → return evidence from execution context
       └─ "why does this matter" → return risk/consequence
```

---

## 5. What Is Out of Scope for V1

- Direct coach assignment server action (no migration approved)
- In-line approval from Today card (all approvals go through `/director/review`)
- Multi-step execution wizard (planned for V2)
- Execution plan persistence in DB (plans are computed in-memory)
- Execution plan for `TodayRisksCard` rows (risks route via `actionHref` directly — V2)
