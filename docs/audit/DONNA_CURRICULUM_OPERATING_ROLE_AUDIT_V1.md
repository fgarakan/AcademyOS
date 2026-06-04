# DONNA Curriculum Operating Role Audit V1

**Date:** 2026-06-04
**Auditor:** Claude Code
**Purpose:** Audit what DONNA should do across curriculum — build, explain, monitor, and guide.

---

## DONNA's Core Constraint (Never Violated)

> DONNA proposes → Director approves → System records → System executes

DONNA never:
- Publishes curriculum content directly
- Auto-advances players
- Sends parent updates without director approval
- Makes decisions on behalf of the director

Everything DONNA does produces a proposal, a draft, or an explanation. The director always has final control.

---

## Capability Inventory

### Current DONNA Curriculum Modules

| Module | File | Status | Connected to UI? |
|---|---|---|---|
| Curriculum improvement suggestions | `curriculumImprovementEngine.ts` | Built | Yes — DonnaCurriculumContextPanel |
| Context-first summary builder | `curriculumBuilderOperator.ts` | Built | Yes — DonnaCurriculumContextPanel |
| Builder guidance conversation | `curriculumBuilderGuidance.ts` | Built | Partial |
| Builder DONNA context | `curriculumBuilderDonnaContext.ts` | Built | Yes |
| Draft proposal answer | `curriculumDraftProposalDonnaAnswer.ts` | Built | Partial |
| Impact answer | `curriculumImpactDonnaAnswer.ts` | Built | Partial |
| Level answer | `curriculumLevelDonnaAnswer.ts` | Built | Partial |
| Bottleneck loader | `curriculumBottleneckLoader.ts` | BLOCKED | No |
| Structural gap loader | `curriculumStructuralGapLoader.ts` | Built | Yes — via gap analysis |
| Template coverage gap detector | `curriculumTemplateCoverageGapDetector.ts` | Built | Partial |
| Bottleneck intelligence | `intelligence/curriculumBottleneckIntelligence.ts` | BLOCKED | No |
| LLM: curriculum answering | `llmOrchestration/curriculumAnswering.ts` | Built | Yes — DONNA chat |
| LLM: change approval flow | `llmOrchestration/curriculumChangeApprovalFlow.ts` | Built | Yes — DONNA chat |
| LLM: context retrieval | `llmOrchestration/curriculumContextRetrieval.ts` | Built | Yes — DONNA chat |
| LLM: impact preview | `llmOrchestration/curriculumImpactPreview.ts` | Built | Partial |
| LLM: strategy conversation | `llmOrchestration/curriculumStrategyConversation.ts` | Built | Yes — DONNA chat |
| Evidence answers | `evidence/donnaEvidenceAnswers.ts` | Built | Partial |

---

## DONNA's Build Capabilities

### Draft a Level

**What DONNA can do today:**
- Extract level from natural language ("improve orange ball 2" → key: `orange_ball_2`)
- Build context-first summary: current gates/skills count, gap summary, evidence line, focused question
- Provide the `draftStarter` text pre-filled for the director's draft

**What DONNA cannot do today:**
- Create a full level scaffold from scratch (all dimensions: gates, drills, skills, missions, badges, parent guidance)
- Suggest a level structure based on the existing curriculum pattern
- Ask the director structured questions to build out a level iteratively

**Gap:** DONNA can help improve an existing level; it cannot guide building a new level from a blank slate.

---

### Draft Skills

**What DONNA can do today:**
- Suggest skills via `CurriculumSkillDraftPanel` (tab in node drawer)
- The skill draft panel exists but its DONNA integration is partial — it may show pre-filled suggestions but not a guided creation conversation

**Gap:** No DONNA-guided skill hierarchy builder. Director must know the 9 domains and fill in fields manually.

---

### Draft Drills

**What DONNA can do today:**
- `suggest_drill_attachments` action — surfaces relevant drills for the director to attach (reads existing drills)
- Pre-fills drill draft from `suggestion.draftStarter`

**What DONNA cannot do today:**
- Create a net-new drill definition from description ("DONNA, create a cross-court rally drill for Orange Ball 2")
- Validate drill parameters (duration, player count, progression difficulty)

**Gap:** DONNA can suggest existing drills; cannot build new drills from scratch via conversation.

---

### Draft Assessments

**What DONNA can do today:**
- `suggest_coach_cues` action — generates coach observation language
- The assessment criterion content type is in the model but DONNA-guided assessment creation is not built

**Gap:** No DONNA-guided assessment criterion creation. Director must know what makes a good assessment gate.

---

### Draft Missions

**What DONNA can do today:**
- 12 static mission definitions exist in `missionModel.ts`
- `missionEngine.ts` ranks eligible missions for a player

**What DONNA cannot do today:**
- Draft a custom mission for a player
- Suggest which mission is most relevant for a specific player based on evidence
- Create new mission definitions through a DONNA conversation

**Gap:** Missions are static — DONNA cannot create custom missions. No mission creation workflow exists.

---

### Draft Badges

**What DONNA can do today:**
- 10 static badge definitions in `badgeModel.ts`
- `badgeEligibilityEngine.ts` computes badge status from player data

**Gap:** Same as missions — badges are static. DONNA cannot create custom badges.

---

### Draft Parent Guidance

**What DONNA can do today:**
- `suggest_parent_guidance` action — generates parent-facing text for director review
- `evidenceParentTranslator.ts` — translates evidence to parent-safe language
- `buildParentSupportGuide()` — generates home support guidance

**Gap:** Parent guidance is generated programmatically but not surfaced as a creation workflow. A director cannot ask DONNA "draft parent guidance for Orange Ball 2 players" and have it appear in the curriculum.

---

### Draft Curriculum Improvements

**What DONNA can do today:** This is the best-built DONNA capability.
- `analyzeCurriculumImprovements()` — ranks suggestions by evidence confidence
- Evidence-backed: every suggestion includes confidence score, evidence count, affected players, reasoning, impact lines, "won't happen" lines
- `DonnaCurriculumImproveDraftButton` — one-click to submit a DONNA suggestion as a draft

**Gap:** Only accessible via `?improve=[levelKey]` URL param — not proactively surfaced.

---

## DONNA's Explain Capabilities

### Why This Level Exists

**What DONNA can explain:**
- Level goal (`stage_goal` from DB + `directorGoal` from `levelInsightMap.ts`)
- Exit player profile (what a player who completes this level can do)
- Focus areas (what coaches should emphasize)
- Common blockers (what typically prevents advancement)

**Gap:** This information is in `levelInsightMap.ts` but only shown on the curriculum page in the stage insight cards — not accessible via DONNA chat for a quick question.

---

### Why a Skill Matters

**What DONNA can explain:**
- `curriculumLevelDonnaAnswer.ts` can answer questions about a specific level's skills

**Gap:** No per-skill DONNA explanation. DONNA knows about levels, not individual skills.

---

### How a Drill Connects

**What DONNA can explain:**
- `curriculumAnswering.ts` can answer questions about drills in the context of curriculum Q&A
- Drill has `objective`, `coaching_cues`, `success_criteria` fields

**Gap:** DONNA answers are reactive (director asks) not proactive (DONNA surfaces drill context when coach opens a session).

---

### How an Assessment Proves Readiness

**What DONNA can explain:**
- `levelReadinessEngine.ts` produces `donnaExplanation` — a human-readable explanation of the readiness computation
- `recommendedNextAction` — specific next step DONNA recommends

**Gap:** This explanation is only generated in the `DonnaCurriculumContextPanel` — not surfaced on the player profile where the director would act on it.

---

### What Changed

**What DONNA can explain:**
- `CurriculumOverrideDiffCard` shows diff between curriculum versions
- `AcademyCurriculumVersionCard` shows version history

**Gap:** No DONNA explanation of a change in conversational language. Director must read raw diff fields.

---

### What Evidence Supports a Recommendation

**What DONNA can explain:** This is well-built.
- `supportingEvidence[]` per suggestion — evidence summaries
- `supportingSignals[]` — named signal list
- `reasoning` — DONNA's reasoning paragraph
- `confidence` + `confidenceScore` — transparent uncertainty
- `evidenceCount` — number of records analyzed

**Gap:** Evidence explanation is only shown when there are evidence records. Most academies in early operation have few records — DONNA says "insufficient evidence" which is correct but unhelpful.

---

## DONNA's Monitor Capabilities

### Bottlenecks

**Status: BLOCKED** — `curriculumBottleneckLoader.ts` cannot access required tables

**Should monitor:**
- Average time-at-level per level
- Which levels have the most stalled players
- Which gates have the lowest achievement rates

---

### Missing Connections

**What DONNA monitors today:**
- `curriculumTemplateCoverageGapDetector.ts` — finds levels with no connected templates
- `curriculumStructuralGapLoader.ts` — finds missing content dimensions per level

**Gap:** Template coverage detector requires `templates.curriculum_level_id` (migration 045 pending). Currently returns gaps even when templates exist but aren't linked.

---

### Failed Readiness Signals

**What DONNA monitors today:**
- `levelReadinessEngine.ts` computes readiness status per player with blocking evidence
- `assessmentEvidenceMapper.ts` — marks stale evidence

**Gap:** Readiness failures are computed but not surfaced as alerts. No "Player X has been marked not_ready 3 times" signal on the director dashboard.

---

### Stalled Levels

**What DONNA monitors today:**
- Dashboard `stalledPlayerCount` — players enrolled 6+ months without advancement
- This is a player signal derived from `enrolled_at`

**Gap:** Cannot identify WHICH level causes the stall (aggregate count only). Cannot analyze whether the stall is due to curriculum quality, coaching, or attendance.

---

### Repeated Coach Notes

**What DONNA monitors today:**
- `curriculumBottleneckLoader.ts` reads tagged observations: `topTaggedConcerns[]`
- These are the most-frequently tagged skill concerns from `coach_observations`

**Gap:** This is the only functioning curriculum monitoring signal — and it's only accessible when the bottleneck feature is re-enabled after migrations.

---

### Parent / Player Confusion

**Status: Not built** — No signal that parents or players are confused by curriculum content

**Should monitor:**
- Parent update drafts that reference confusion ("doesn't understand why...")
- Player portal asks to DONNA that indicate confusion
- Frequency of "ask your coach/director" responses to player DONNA questions

---

## DONNA's Guide Capabilities

### Curriculum Creation Guidance

**What DONNA guides today:**
- `curriculumBuilderGuidance.ts` — builder guidance conversation
- `buildContextFirstSummary()` — always shows current state before asking a question
- DONNA never starts with "What would you like to do?" — always shows context first

**Gap:** Builder guidance is a library module but not fully wired to a conversational step-by-step UI for creating a new level.

---

### Curriculum Review Guidance

**What DONNA guides today:**
- `curriculumChangeApprovalFlow.ts` — guides the review conversation
- `DonnaReviewTabGuide` — chips on review queue tabs

**Gap:** Approval flow is conversational in the DONNA chat but not shown in the review queue itself — director reviewing a curriculum draft in the queue doesn't see DONNA's guidance.

---

### Curriculum Improvement Guidance

**What DONNA guides today:** This is the strongest guidance capability.
- Evidence-backed suggestions with `draftStarter` pre-filled
- `impactLines[]` and `wontHappenLines[]` for impact preview
- One-click draft creation from suggestion

**Gap:** Only triggered by `?improve=` URL param — director must discover this entry point.

---

### Template Creation Guidance

**What DONNA guides today:**
- `TemplatesDonnaPanel` on `/director/templates` — DONNA panel for templates
- `DonnaCurriculumNodeAddCard` in node drawer

**Gap:** DONNA does not guide template-to-curriculum connection. Director must know to manually assign `curriculum_level_id` to a template.

---

### Coach Session Planning Guidance

**What DONNA guides today:**
- `CoachSessionFocusCard` shows session focus
- `CoachDailyBriefCard` on coach home

**Gap:** No DONNA brief to the coach: "Today's session is Orange Ball 2. Here's what the curriculum says should happen. Here are the 2 players closest to clearing a gate."

---

### Parent / Player Summary Generation

**What DONNA guides today:**
- `evidenceParentTranslator.ts` — translates evidence to parent-safe language
- `buildParentSupportGuide()` — generates support guidance

**Gap:** Parent summaries require director approval (correct) but DONNA's pre-drafted summaries are not surfaced in the curriculum workflow — they appear in the player IDP, not as a curriculum step.

---

## Capability Gap Summary

| DONNA should... | Status | Priority |
|---|---|---|
| Draft levels (new level from scratch) | Not built | Medium |
| Draft skills with guidance | Partial | Medium |
| Draft drills from description | Not built | Low |
| Draft assessments conversationally | Not built | Medium |
| Create custom missions per player | Not built | Medium |
| Create custom badges | Not built | Low |
| Draft parent guidance for levels | Built (hidden) | High |
| Draft curriculum improvements | Built (hidden behind URL param) | CRITICAL — make discoverable |
| Explain why a skill matters | Partial (level-level only) | Medium |
| Explain drill connection to gate | Not built (reactive only) | Medium |
| Explain readiness assessment clearly | Built (in context panel) | High — surface on player profile |
| Explain what changed | Partial | Medium |
| Monitor bottlenecks | BLOCKED | CRITICAL — apply migrations |
| Monitor missing template connections | Partial | High |
| Monitor stalled levels | Partial (player-level, not level-level) | High |
| Monitor repeated coach observations | Partial (blocked) | High |
| Guide new level creation | Partial | Medium |
| Guide curriculum improvement | Built (hidden behind URL param) | CRITICAL — make discoverable |
| Guide coach session planning | Not built | High |
| Generate parent/player summaries | Built (not in curriculum workflow) | Medium |

---

## The Three Most Critical DONNA Gaps

**1. Curriculum improvement is built but not discoverable.**
The evidence-backed improvement flow in `DonnaCurriculumContextPanel` is the best-designed DONNA feature in the app. It requires navigating to `?improve=[levelKey]`. A director will never find it without documentation. Fix: surface improvement suggestions proactively on the curriculum landing page.

**2. Bottleneck detection is blocked.**
Migrations 041-044 must be applied before DONNA can analyze which levels cause players to stall. This is the most important curriculum intelligence signal and it's entirely unavailable.

**3. DONNA doesn't guide the coach before a session.**
DONNA prepares directors for reviews. DONNA helps directors improve curriculum. But DONNA gives coaches nothing before they walk onto the court. "Today's session is Orange Ball 2. Here's what the curriculum expects. Here are the 2 players closest to advancing." This would be the highest-impact DONNA improvement for day-to-day operations.
