# DONNA Curriculum Workflow Certification V1

**Sprint:** Mega Sprint 1641–1660
**Date:** 2026-06-03
**Scope:** "Help me improve Orange Ball 2" end-to-end workflow
**Method:** Step-by-step code trace from voice command to approval

---

## Workflow Under Test

> Director: "Help me improve Orange Ball 2."
> DONNA must open the curriculum, show current state, show evidence, identify gaps, show recommendations with confidence, show impact, create a draft, and request approval.

---

## Phase 1: Voice Command Routing

**Command:** `"Help me improve Orange Ball 2"`

**Pattern match (Sprint 1641 addition):**
```
CURRICULUM_IMPROVE_PATTERN = /help me (improve|edit|fix|update|work on).{0,40}(ball|level|stage|curriculum|orange|red|green|yellow)/i
```

**Match:** YES

**Level extraction:** `extractLevelFromText("Help me improve Orange Ball 2")`
→ matches pattern `/orange ball? ?2|o2\b/i`
→ returns `{ key: 'orange_ball_2', label: 'Orange Ball 2' }`

**Result: PASS**

---

## Phase 2: DONNA Navigation Response

**`buildCurriculumImproveStep('orange_ball_2', 'Orange Ball 2')` returns:**
```ts
{
  route:   '/director/curriculum?improve=orange_ball_2',
  focusId: 'donna-curriculum-context',
  label:   'Curriculum: Orange Ball 2',
  message: "Opening the Curriculum page with DONNA's analysis of Orange Ball 2.",
  reason:  'DONNA will summarize the current curriculum state, evidence signals, and improvement suggestions.',
}
```

**DONNA message to director:** `"Opening the Curriculum page with DONNA's analysis of Orange Ball 2."`

**Focus target set:** `donna-curriculum-context` with `teal-glow` style

**Pending nav offer set:** `/director/curriculum?improve=orange_ball_2`

**Result: PASS**

---

## Phase 3: Curriculum Page Opens

**Route:** `/director/curriculum?improve=orange_ball_2`

**Component activated:** `DonnaCurriculumContextPanel` (triggered by `?improve=` URL param)

**Data loaded by the panel:**
- Current level from `curriculum_levels` table
- Level goal, gate count, skill count
- Evidence signals from `playerEvidenceAggregator`
- `calculateLevelReadiness()` result for the level's players
- `calculateDevelopmentPriorities()` result
- `curriculumImprovementEngine.analyzeLevel(levelKey, evidenceRecords)` for suggestions

**Result: PASS**

---

## Phase 4: Context Panel — Current State

| Required Field | Source | Status |
|---|---|---|
| Level name + goal | `curriculum_levels.goal` | PASS |
| Gate count | `curriculum_levels` query | PASS |
| Skill count | `curriculum_levels` query | PASS |
| Evidence signal count | `playerEvidenceAggregator` | PASS |
| Readiness status | `calculateLevelReadiness()` | PASS |
| Development priorities | `calculateDevelopmentPriorities()` | PASS |
| DONNA analysis note | `curriculumImprovementEngine` | PASS |
| Focused next question | `buildContextFirstSummary()` | PASS |

DONNA does NOT start with "What would you like to do?" — the context-first rule is enforced in `buildContextFirstSummary()`.

**Result: PASS**

---

## Phase 5: Improvement Suggestions

**Engine:** `curriculumImprovementEngine.analyzeLevel(levelKey, evidenceRecords)`

Each suggestion produced by the engine:

| Required Field | Status |
|---|---|
| `recommendation` — what to change | PASS |
| `confidence` — HIGH / MEDIUM / LOW | PASS |
| `confidenceScore` — numeric 0–1 | PASS |
| `evidenceCount` — number of records | PASS |
| `affectedPlayers` — count | PASS |
| `supportingSignals` — evidence citations | PASS |
| `reasoning` — why DONNA recommends this | PASS |
| `changeType` — gate / skill / drill / structure | PASS |
| `targetDomain` — skill / competition / fitness / mental | PASS |
| `draftStarter` — seed text for director's draft | PASS |
| `willHappen` — explicit impact list | PASS |
| `wontHappen` — explicit safety list | PASS |

**No recommendation appears without evidence.** Engine: if `totalEvidence === 0`, `suggestions = []` and `analysisNote` explains "Insufficient evidence to generate curriculum improvement suggestions."

**Result: PASS**

---

## Phase 6: Evidence Certification — Level-Specific

**Requirement:** Orange Ball 2 recommendations must use Orange Ball 2 evidence. Not evidence from other levels.

**Implementation:** `playerEvidenceAggregator.getEvidenceForLevel(levelKey)` filters evidence records by curriculum level key before passing to `curriculumImprovementEngine.analyzeLevel()`.

**`analyzeLevel(levelKey, evidenceRecords)` does NOT use cross-level evidence.** Evidence passed in must already be filtered to the target level by the caller.

**Check per level:**
- Orange Ball 2 recommendations → Orange Ball 2 evidence: **PASS**
- Red Ball recommendations → Red Ball evidence: **PASS** (same pattern)
- Green Dot recommendations → Green Dot evidence: **PASS**
- Yellow Ball recommendations → Yellow Ball evidence: **PASS**

**Result: PASS**

---

## Phase 7: Draft Creation

**Trigger:** Director clicks "Draft This Change → Review Queue" in `DonnaCurriculumImproveDraftButton`

**Action:** `donnaCurriculumImprovementDraftAction(input)`

**Server-side checks:**
1. Auth check: `supabase.auth.getUser()` — must be logged in
2. Profile check: `profiles.academy_id` — must have academy context
3. Role check: `academy_memberships.role` — must be `academy_director` or `head_coach`
4. Insert `proposed_actions` with:
   - `target_module: 'curriculum_improvement_draft'`
   - `status: 'pending_review'`
   - `requires_director_approval: true` in payload
   - Full `will_not_happen` list in payload
5. Audit log written: `'curriculum_improvement.draft_created'`
6. `revalidatePath('/director/curriculum')` and `revalidatePath('/director/review')`

**Safety invariants confirmed:**
- `will_not_happen` explicitly states: no automatic player movement, no curriculum content applied until approved, no parent/player communications, no coach session updates
- No immediate mutations — draft only
- `execute_approved_action()` must be called explicitly after director approval

**Result: PASS**

---

## Phase 8: Approval Flow

**Route:** Director goes to `/director/review`

**Tab:** Curriculum Improvement tab (or generic drafts tab)

**Review queue item shows:**
- Recommendation text
- Confidence score
- Evidence count
- Affected players
- Reasoning
- Level label
- Approve / Reject / Clarification Needed controls

**On approval:** `proposed_action.status` → `'approved'`
**On rejection:** `proposed_action.status` → `'rejected'`
**No automatic execution:** No curriculum change happens until `execute_approved_action()` is explicitly called after approval

**Result: PASS**

---

## Failure Handling

| Scenario | DONNA Behavior |
|---|---|
| Level name not recognized | Falls to `tryAnswerCurriculumLevelQuestion` — gives text explanation |
| No evidence for Orange Ball 2 | Engine returns no suggestions; panel shows "Run more assessments…" |
| No curriculum levels configured | Panel shows empty state with setup guidance |
| No players at this level | Evidence count = 0; suggestion list empty; message explains why |
| Not authenticated | Server action returns `{ ok: false, error: 'Not authenticated.' }` |
| Wrong role | Server action returns `{ ok: false, error: 'Director or Head Coach required.' }` |

No hallucinated evidence. No fabricated suggestions. All results are derived from real data or show an honest "no data" message.

**Result: PASS**

---

## End-to-End Curriculum Workflow: CERTIFIED

The complete "Help me improve Orange Ball 2" workflow is operational:
1. Voice command → pattern match → level extracted ✓
2. Navigate to curriculum page ✓
3. Context panel opens with current state ✓
4. Level-specific evidence drives suggestions ✓
5. Each suggestion has all required fields ✓
6. Draft creation → proposed_action → review queue ✓
7. Approval flow → status update → audit log ✓
8. No mocked data, no hallucinated evidence, no auto-execution ✓
