# Curriculum Improvement Workflow Audit V1

**Date:** 2026-06-04
**Auditor:** Claude Code
**Prompt:** "Orange Ball 2 needs improvement."

---

## The Question This Audit Answers

Can the director:
1. See curriculum health?
2. Understand bottlenecks?
3. See affected players?
4. See evidence?
5. Understand DONNA's recommendation?
6. Create a draft improvement?
7. Review impact?
8. Approve safely?
9. Understand what changed?

---

## Step 1: Can the director see curriculum health?

**Answer: Partially.**

**What works:**
- `/director/curriculum` shows `CurriculumHealthPanel` with an A-F grade derived from `buildCurriculumCoverageReport()`
- Each level card shows a health dot (color-coded by coverage status)
- The health panel shows a grade per level and overall

**What's missing:**
- Coverage only scores 3 of 8 dimensions (gates, drills, coachCues) — the other 5 are excluded pending migration data
- A level with all gates and drills but no missions, no parent guidance, and no assessment criteria scores "A" — misleading completeness
- No per-level "what is missing" list on the curriculum landing — director must open each level card to see gaps
- No DONNA brief on entry explaining what the health scores mean or which level is most urgent

**Score this step: 4/10**

---

## Step 2: Can the director understand bottlenecks?

**Answer: No — this feature is BLOCKED.**

**What should exist:**
- `curriculumBottleneckLoader.ts` is designed to detect bottlenecks from `coach_observations` tags and curriculum requirement data
- `intelligence/curriculumBottleneckIntelligence.ts` is the analysis layer

**Current state:**
- `curriculumBottleneckLoader.ts` returns `curriculumTablesAvailable: false` and `fieldStatus: 'blocked_by_schema'`
- Block reason: "Curriculum bottleneck detection requires curriculum_requirements and player_curriculum_levels tables — pending migrations 041–044."
- The only data available: skill-tagged concern observations from `coach_observations.tags` (counts only, no drill-down)

**What the director would need:**
- "Orange Ball 2 players advance 40% slower than Orange Ball 1 players"
- "The most common coach observation tag for Orange Ball 2 is 'backhand' (12 times in 30 days)"
- "3 of 8 players at Orange Ball 2 have been there more than 6 months"

**None of this is currently surfaceable through the curriculum UI.**

**Score this step: 1/10**

---

## Step 3: Can the director see affected players?

**Answer: Partially — with significant friction.**

**What works:**
- `playerCurriculumIntersection.ts` has the model for player-curriculum intersection
- `player_curriculum_states` table exists and is queried on the dashboard (`typedCurricRows`)
- The director dashboard shows `playersWithLevel` and `stalledPlayerCount`
- Level cards in the visual map show `playerCount` field

**What's missing:**
- To see which specific players are at Orange Ball 2: Director → Players → Filter by level (this filter doesn't exist in the UI) → manual scan
- No "View players at this level" button on the level card
- The gap between "8 players are at this level" (shown on the card) and "here are those 8 players" requires 3-4 navigation steps
- Stalled players (6+ months at same level) are shown as a count on the dashboard but cannot be filtered by level in the players list

**Score this step: 3/10**

---

## Step 4: Can the director see evidence?

**Answer: Only if DONNA improvement context is activated.**

**The evidence trigger:** `?improve=[levelKey]` URL param on the curriculum page
- Director must manually add this to the URL OR click a DONNA improvement suggestion that includes this param
- When triggered: `DonnaCurriculumContextPanel` loads evidence data via `getPlayerEvidenceRecords()`, `calculateLevelReadiness()`, `calculateDevelopmentPriorities()`, `analyzeCurriculumImprovements()`

**What the evidence panel shows when activated:**
- Evidence count (total records analyzed)
- Confidence-scored improvement suggestions with supporting evidence
- Each suggestion shows: recommendation, confidence (LOW/MEDIUM/HIGH), evidence count, affected players, supporting signals, reasoning

**What's missing:**
- Evidence context is hidden behind a URL param — not visible by default when a director opens the curriculum page
- No "View evidence for this level" button on the level card
- Evidence from `player_evidence_records` (migration 083) requires that table to exist in the live DB
- Evidence from `player_requirement_progress` requires migrations 041-044

**Score this step: 4/10 (when triggered) / 1/10 (by default)**

---

## Step 5: Can the director understand DONNA's recommendation?

**Answer: Yes — but only when the improvement flow is triggered.**

**When `?improve=[levelKey]` is active:**
- `DonnaCurriculumContextPanel` renders improvement suggestions from `analyzeCurriculumImprovements()`
- Each `CurriculumImprovementSuggestion` includes:
  - `recommendation` — what DONNA recommends
  - `confidence` — LOW/MEDIUM/HIGH with confidence score (0-100)
  - `evidenceCount` — how many records support this
  - `affectedPlayers` — estimated players affected
  - `supportingSignals` — named signals
  - `reasoning` — why DONNA is recommending this
  - `draftStarter` — pre-filled text for the curriculum draft
  - `impactLines` — what will change if approved
  - `wontHappenLines` — what won't change

**This is the best-designed part of the improvement workflow.** DONNA's evidence transparency is excellent — it never presents opinions as facts.

**What's missing:**
- The `?improve=` trigger is not obvious to directors — they won't find it without documentation or a UI hint
- DONNA's response quality depends on evidence volume — with few evidence records, suggestions are LOW confidence and less actionable

**Score this step: 7/10 (when triggered) / 2/10 (not discoverable)**

---

## Step 6: Can the director create a draft improvement?

**Answer: Yes, via two routes — but the routes are confusing.**

**Route A: DONNA-suggested draft (cleaner)**
- Trigger `?improve=[levelKey]`
- See DONNA's suggestions
- Click `DonnaCurriculumImproveDraftButton`
- Draft is pre-filled from `suggestion.draftStarter`
- Submits to `proposed_actions` pipeline

**Route B: Manual draft (complex)**
- Open level → CurriculumNodeDrawer
- Navigate to "Draft Entry" tab
- Write draft text manually
- Submit → `academy_curriculum_overrides` table

**Confusion:** Two routes create drafts in different tables:
- Route A → `proposed_actions` (review queue, Curriculum & Session tab)
- Route B → `academy_curriculum_overrides` (builder change queue at `/director/curriculum/builder`)

Director who creates a draft via Route A cannot find it in the builder change queue. Director who creates via Route B cannot find it in the review queue. No UI informs which queue received the draft.

**Score this step: 4/10**

---

## Step 7: Can the director review impact?

**Answer: Partially — impact information exists but is not prominently shown.**

**What exists:**
- `CurriculumImprovementSuggestion.impactLines[]` — shown in the DONNA context panel
- `CurriculumImprovementSuggestion.wontHappenLines[]` — shown in the DONNA context panel
- `affectedPlayers` count — shown on each suggestion card
- `CurriculumImpactPreview` (LLM orchestration) — exists but unclear if wired to UI
- `curriculumChangeScope.ts` — scope model for understanding what a change affects

**What's missing:**
- No "before/after" visualization — director cannot see what the level looked like before and after the proposed change
- Impact review happens at the draft creation step (in DONNA context panel) — by the time the draft reaches the review queue, the impact information may no longer be visible
- Review queue card (`CurriculumBuilderDraftCard`) shows the draft text and change type but not the original impact analysis

**Score this step: 4/10**

---

## Step 8: Can the director approve safely?

**Answer: Structurally yes — but execution gap exists.**

**Approval safeguards in place:**
- All curriculum changes require `requiresDirectorApproval: true`
- `neverAutoApply: true` is enforced at the type level in `DonnaCurriculumContextView`
- Risk level (low/medium/high) is shown on drafts
- "This change affects existing players" warnings fire for modify/remove operations

**The execution gap:**
- For `proposed_actions` drafts: approving marks `status = 'approved'` but does NOT call `execute_curriculum_override()`. The curriculum is not changed.
- For `academy_curriculum_overrides` in the builder: approving DOES call `execute_curriculum_override()` (migration 069 required).

**Result:** A director who approves a coach's curriculum suggestion via the review queue has NOT changed the curriculum. The suggestion is "approved" but never applied. There is no UI feedback that the approval is incomplete.

**Score this step: 5/10**

---

## Step 9: Can the director understand what changed?

**Answer: Partially.**

**What exists:**
- `AcademyCurriculumVersionCard` on the curriculum page — shows version history
- `CurriculumOverrideDiffCard` in the review queue — shows diff between old and new
- `/director/curriculum/academy-version` — shows all applied overrides
- `audit_logs` — all major mutations write here

**What's missing:**
- No "recently changed" summary on the curriculum landing page
- Diff cards are in the review queue but after approval they move to "Completed" tab — director loses the diff view
- No "curriculum changelog" visible alongside the level tree

**Score this step: 5/10**

---

## Overall Improvement Workflow Score

| Step | Score | Primary Gap |
|---|---|---|
| 1. See curriculum health | 4/10 | Only 3/8 dimensions scored |
| 2. Understand bottlenecks | 1/10 | BLOCKED by schema |
| 3. See affected players | 3/10 | No "view players at this level" button |
| 4. See evidence | 4/10 | Hidden behind URL param |
| 5. Understand DONNA's recommendation | 7/10 | Not discoverable — well-designed when found |
| 6. Create draft improvement | 4/10 | Two pipelines, no guidance |
| 7. Review impact | 4/10 | Impact not visible at review step |
| 8. Approve safely | 5/10 | Execution gap for coach suggestions |
| 9. Understand what changed | 5/10 | No curriculum changelog on landing |
| **Average** | **4.1/10** | |

---

## Ideal Improvement Flow

```
Director opens /director/curriculum

DONNA brief: "Orange Ball 2 has 2 critical gaps: no fitness content, no parent guidance.
             8 players are currently at this level. Want to address this?"

→ Director clicks "Yes, show me"

→ DONNA shows: 
   - Current level state (gates: 5, drills: 8, no fitness drills)
   - Evidence: 3 coach observations mention "fitness fatigue" at this level
   - Suggestion: Add 2 fitness drills (confidence: MEDIUM, 8 players affected)
   - Draft pre-filled: "Add conditioning block to Orange Ball 2 sessions"

→ Director reviews draft → clicks "Submit for Review"

→ Draft appears in review queue with impact lines and affected player count

→ Director approves in review queue → curriculum is updated in one action

→ Curriculum page shows "Orange Ball 2 updated 2 days ago" badge
```

**Current reality:** 9 separate steps across 3 pages, 2 pipelines, 1 blocked feature, and no end-to-end confirmation that the change was applied.

---

## DONNA's Role in the Improvement Flow

**Currently:**
- Activated by URL param (`?improve=`)
- Provides evidence-backed suggestions when evidence records exist
- Pre-fills draft starters

**Should be:**
- Proactively surfaces improvement needs on curriculum landing
- Guides director to the right level without URL manipulation
- Tracks the draft from creation to application — notifies when approved but not applied
- After approval: confirms whether curriculum was updated
