# Player Development Blueprint Architecture

**Sprint:** Player Development Blueprint System — Sprint 1112
**Date:** 2026-06-02
**Migration:** `078_player_development_blueprints.sql`
**Library:** `src/lib/blueprint/`
**Server action:** `src/app/director/placement/generateBlueprintAction.ts`

---

## Goal

Immediately after onboarding, every player has a complete development plan — not just a placement. The blueprint answers 10 questions without requiring additional manual coach work:

1. Where does this player sit? (Placement)
2. What are their strengths? (Assessment → Blueprint)
3. What do they need to work on? (Assessment → Priority Engine)
4. What should the coach focus on first? (Coach Brief)
5. What does the parent need to know? (Parent Summary)
6. What should the player work on at home? (DONNA Answer)
7. What are the priorities for each pathway? (4-Pathway Priority Engine)
8. What is the plan for the first 30 days? (30-Day Plan)
9. What missions have been assigned? (Initial Missions → Review Queue)
10. What can DONNA tell me about this player? (DONNA Brief)

---

## Architecture overview

```
finalize_player_placement()
    └── activatePlayerAction()
           └── generateBlueprintAction() [fire-and-forget]
                    │
                    ├── Fetch: placement_recommendations + assessments + curriculum_levels
                    │
                    ├── generateBlueprint() [pure TypeScript]
                    │       ├── generateBlueprintPriorities() [4-pathway priority engine]
                    │       ├── buildThirtyDayPlan()
                    │       ├── generateInitialMissions()
                    │       ├── buildCoachBrief()
                    │       └── buildParentSummary()
                    │
                    ├── Archive previous blueprint (status → superseded)
                    ├── INSERT player_development_blueprints
                    ├── INSERT 3x player_mission_assignments (status=pending_review)
                    ├── UPSERT player_development_summary
                    └── writeAuditLog
```

---

## Data model: player_development_blueprints

| Column | Type | Purpose |
|---|---|---|
| `id` | UUID PK | |
| `academy_id` | UUID FK → academies | |
| `player_id` | UUID FK → players | |
| `assessment_id` | UUID FK → assessments | Source assessment (nullable) |
| `placement_recommendation_id` | UUID | Back-link to placement (no FK) |
| `curriculum_level_id` | UUID FK → curriculum_levels | |
| `curriculum_level_name` | TEXT | Snapshot |
| `curriculum_stage_key` | TEXT | Snapshot of curriculum_stage enum |
| `technical/tactical/movement/competition/behavioral_score` | NUMERIC(4,2) | Score snapshots |
| `strengths[]` | TEXT[] | From assessment |
| `gaps[]` | TEXT[] | From assessment weaknesses |
| `skill/competition/fitness/mental_priorities` | JSONB | 3 priorities per pathway |
| `thirty_day_plan` | JSONB | One focus per pathway + rationale |
| `coach_brief` | TEXT | <60s read brief for coach |
| `coach_focus_areas[]` | TEXT[] | Top 3 coach focus statements |
| `parent_summary` | TEXT | Parent-safe, no ratings/negatives |
| `parent_development_focus` | TEXT | |
| `parent_next_steps[]` | TEXT[] | Actionable parent guidance |
| `parent_thirty_day_preview` | TEXT | What to expect in 30 days |
| `donna_brief` | TEXT | Structured DONNA context string |
| `status` | TEXT | active / superseded / archived |
| `superseded_by` | UUID → self | Points to newer blueprint |
| `generated_by` | UUID FK → profiles | |

---

## Priority Engine (pure TypeScript)

**File:** `src/lib/blueprint/priorityEngine.ts`

4 pathways × 3 priority tiers × 3 stage tiers × 3 priorities = **108 total priority definitions**

| Pathway | Score driver |
|---|---|
| Skill | `technical_score` |
| Competition | average of `competition_score` + `tactical_score` |
| Fitness | `movement_score` |
| Mental | `behavioral_score` |

Score tiers: `emerging` (<5) | `developing` (5–7.5) | `established` (>7.5)
Stage tiers: `foundation` (red) | `development` (orange) | `performance` (green+)

Each priority: `{ rank, label, description, why, pathway }`

---

## Blueprint Generator (pure TypeScript)

**File:** `src/lib/blueprint/blueprintGenerator.ts`

Assembles:
- **Priorities:** from `priorityEngine.generateBlueprintPriorities()`
- **30-Day Plan:** one focus per pathway + rationale from score analysis
- **Initial Missions:** 3 missions linked to top priorities (using ~20 label templates)
- **Coach Brief:** name, level, top strengths, top 4 priorities, 3 focus statements, 30-day lead
- **Parent Summary:** friendly language, no ratings, no negatives, no internal terminology
- **DONNA Brief:** structured multi-line reference text for DONNA context injection

---

## Mission Generation Logic

Missions come from the top priority of 3 selected pathways:
- Skill pathway #1 → Mission 1 (most universal)
- Competition pathway #1 → Mission 2 (competition development)
- Mental pathway #1 → Mission 3 (confidence and retention)

**All missions enter with `status = 'pending_review'`** — director approval required before they become active. They appear in the director Review Queue immediately after blueprint generation.

~20 label templates map priority labels to mission titles:
- "Contact Spacing" → "Create More Space"
- "Low Ball Adaptation" → "Own The Low Ball"
- "Serve Rhythm" → "Smooth Serve Rhythm"
- "Resilience" → "Bounce Back Fast"
- etc.

---

## DONNA Blueprint Context

**File:** `src/lib/donna/donnaPlayerBlueprintContext.ts`

8 answer functions for blueprint-aware DONNA responses:

| Intent | Answer content |
|---|---|
| `why_placed_here` | Placement rationale + stage description + overall score |
| `coach_first_focus` | Coach focus areas + 30-day plan |
| `player_strengths` | Strengths from assessment |
| `player_gaps` | Gaps from assessment + 30-day plan connection |
| `parent_summary` | Role-gated: directors see coach brief, parents see parent summary |
| `player_home_practice` | Skill + mental focus with specific home drill suggestions |
| `thirty_day_plan` | Full 4-pathway plan with rationale |
| `mission_status` | Pending mission count + review queue prompt |

**Safety:** DONNA never invents answers. Returns explicit fallback when blueprint not loaded. Parent-facing answers always use `parentSummary` only — never `coachBrief`.

---

## Blueprint Evolution

The schema is designed for future assessment-triggered updates:

1. Player reassessed after 3 months → new placement_recommendation
2. `generateBlueprintAction()` called again → archives current blueprint (`status → superseded`, `superseded_by → new_id`, `superseded_at`)
3. New blueprint becomes active
4. Comparison UI (not built in V1) can compare old vs new priorities using the `superseded_by` chain

---

## V1 limitations

| Limitation | Impact |
|---|---|
| Migration 078 must be applied to live DB | Blueprint table does not exist until migration runs; `generateBlueprintAction` returns `isSchemaMissing: true` gracefully |
| No blueprint display UI yet | Blueprint data exists in DB; player profile tab to surface it is a future sprint |
| No blueprint comparison UI | Schema supports it via `superseded_by`; comparison UI deferred |
| No AI used in priority generation | All generation is deterministic from scores; AI-enhanced suggestions are a future sprint |
| `show_to_parent = false` on parent summary | Director must explicitly enable parent visibility; parent portal does not show it until approved |

---

## Audit trail

Every blueprint generation writes:
- `audit_logs.action = 'player_blueprint_generated'`
- Payload includes: blueprint_id, curriculum_level, top 4 priorities, assessment_id, missions_created count

---

## Success criteria

After onboarding approval, the following are immediately available without additional coach work:

- ✅ 4-pathway priorities (3 per pathway) in `player_development_blueprints.skill/competition/fitness/mental_priorities`
- ✅ 30-day plan in `player_development_blueprints.thirty_day_plan`
- ✅ 3 initial missions in `player_mission_assignments` (pending_review — director review required)
- ✅ Coach brief in `player_development_blueprints.coach_brief`
- ✅ Parent summary in `player_development_blueprints.parent_summary` (show_to_parent=false until director enables)
- ✅ DONNA brief in `player_development_blueprints.donna_brief`
- ✅ `player_development_summary` upserted with strengths, gaps, development focus
- ✅ Audit log written
