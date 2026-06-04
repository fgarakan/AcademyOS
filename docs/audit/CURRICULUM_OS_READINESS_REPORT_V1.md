# Curriculum OS Readiness Report V1

**Date:** 2026-06-04
**Auditor:** Claude Code
**Based on:** Curriculum System Map, Creation Workflow, Improvement Workflow, Session Workflow, Role Consumption, Health Intelligence, DONNA Role audits (V1)

---

## Current Curriculum OS Score

| Dimension | Score | Assessment |
|---|---|---|
| Curriculum structure and content | 6/10 | Gates, drills, coach language well-built. Skills/missions/badges underrepresented. |
| Template-curriculum connection | 2/10 | Two critical migrations pending. Connection broken in live DB. |
| Session-curriculum delivery | 2/10 | Sessions generate correctly but no curriculum context flows to coaches. |
| Evidence collection | 3/10 | Evidence types defined. DB tables may be missing. No drill-level exposure tracking. |
| Level advancement logic | 5/10 | Readiness engine built. Not surfaced on player profile. No bottleneck detection. |
| Director UX for curriculum | 4/10 | 12-tab drawer, two draft pipelines, improvement hidden behind URL param. |
| Coach UX for curriculum | 3/10 | Coach sees session structure but not curriculum context. No pre-session brief. |
| Player curriculum experience | 4/10 | Missions work. Gates/advancement criteria invisible to players. |
| Parent curriculum experience | 5/10 | IDP works. Support guidance is generic. |
| DONNA curriculum intelligence | 5/10 | Excellent when triggered. Not proactively surfaced. Bottleneck blocked. |
| **Overall Curriculum OS** | **3.9/10** | **Operating at approximately 40% capability due to pending migrations and UX gaps** |

---

## Top 20 Curriculum Workflow Gaps

| # | Gap | Severity |
|---|---|---|
| 1 | `templates.curriculum_level_id` (migration 045) — sessions have no curriculum context | CRITICAL |
| 2 | `curriculum_class_template_blocks` (migration 062) — coach curriculum panel empty | CRITICAL |
| 3 | Migrations 041-044 — bottleneck detection, gate progress, requirement aggregation all blocked | CRITICAL |
| 4 | Block execution status stored in localStorage only — not persisted to DB | CRITICAL |
| 5 | Approved coach curriculum suggestions ≠ applied to curriculum — execution gap | CRITICAL |
| 6 | No "view players at this level" action on curriculum level card | HIGH |
| 7 | DONNA improvement flow hidden behind `?improve=[levelKey]` URL param | HIGH |
| 8 | Two draft pipelines (proposed_actions + academy_curriculum_overrides) with no UI indicating which queue received a draft | HIGH |
| 9 | No player-facing gate advancement criteria ("here's what unlocks your next level") | HIGH |
| 10 | No DONNA pre-session brief for coaches | HIGH |
| 11 | Session block exercises missing RLS (migration 056) | HIGH |
| 12 | Coverage scoring excludes 5 of 8 dimensions — health grade is misleading | HIGH |
| 13 | Mission and badge creation is static — no custom mission/badge creation workflow | MEDIUM |
| 14 | Parent guidance content type has no dedicated creation workflow | MEDIUM |
| 15 | Learning modules are not connected to player/parent portal | MEDIUM |
| 16 | No "recently changed" indicator on curriculum levels | MEDIUM |
| 17 | No drill usage analytics — cannot see which drills are being run | MEDIUM |
| 18 | Readiness signal not surfaced on player profile | MEDIUM |
| 19 | 12-tab node drawer with no orientation guidance | MEDIUM |
| 20 | Player evidence → readiness signal → director action path has no UI surface | MEDIUM |

---

## Top 20 Curriculum UX / Cognitive Load Gaps

| # | Gap | Page |
|---|---|---|
| 1 | No DONNA brief on curriculum landing ("3 levels need attention") | `/director/curriculum` |
| 2 | Two representations of curriculum hierarchy (stage insight cards + level tree) | `/director/curriculum` |
| 3 | 12-tab node drawer — no tab guidance for user intent | Curriculum node drawer |
| 4 | Mission and badge tabs missing from node drawer despite content type definitions | Curriculum node drawer |
| 5 | Parent guidance tab missing from node drawer | Curriculum node drawer |
| 6 | "Level Detail" tab is read-only but positioned first — director expects to edit | Curriculum node drawer |
| 7 | "Draft Entry" tab is freeform text with no structure — director must know what to write | Curriculum node drawer |
| 8 | Two template route trees for class templates | `/director/templates` + `/director/class-templates` |
| 9 | Improvement flow (DONNA's best feature) requires URL manipulation | `/director/curriculum` |
| 10 | No "health status changed" notification when a level coverage drops | `/director/curriculum` |
| 11 | Coverage grade A-F shows high scores despite missing player-facing content | CurriculumHealthPanel |
| 12 | Curriculum builder change queue (`/builder`) is separate from review queue | Two pages |
| 13 | Director cannot see which sessions taught which curriculum drills | Sessions view |
| 14 | Coach has no visible connection between session blocks and curriculum gates | Coach session view |
| 15 | "Assessment" tab in drawer is ambiguous — player assessment vs curriculum criterion | Node drawer |
| 16 | No "curriculum impact" summary when approving a change in the review queue | Review queue |
| 17 | No visual indicator on level cards showing how many players are at risk | Level tree |
| 18 | Parent guidance requires director approval but there's no parent guidance draft queue | Review queue |
| 19 | Player missions don't show their connection to curriculum gates | Player home |
| 20 | No "curriculum unchanged for N days" signal to prompt director engagement | `/director/curriculum` |

---

## Top 10 Curriculum Data-Flow Gaps

| # | Gap | Root cause |
|---|---|---|
| 1 | Session blocks have no curriculum content | Migrations 045, 062 pending |
| 2 | Gate achievement tracking not available | Migrations 041-044 pending |
| 3 | Skill failure rates not tracked | Migrations 041-044 + skill-gate linkage |
| 4 | Drill usage not recorded per session | No drill_id in session_block execution records |
| 5 | Block execution status not persisted to DB | localStorage-only tracking (known limitation) |
| 6 | Coach observations not systematically tagged by gate | No guided tagging in wrap-up |
| 7 | Evidence records not written from wrap-up approval path | playerEvidenceWriter.ts wiring unclear |
| 8 | Exposure to curriculum content is derived (not confirmed) | No confirmed_exposure record |
| 9 | No level transition log (when player moved from level X to Y) | No level change history table |
| 10 | Assessment criteria exist in model but not linked to player progress rows | Requires requirement_evidence_links (migration 041) |

---

## Top 10 DONNA Curriculum Gaps

| # | Gap | Impact |
|---|---|---|
| 1 | DONNA improvement flow not discoverable (hidden behind URL param) | Director never uses DONNA's best curriculum feature |
| 2 | Bottleneck detection blocked by schema | Cannot identify which levels cause players to stall |
| 3 | DONNA gives coaches nothing before a session | Coaches have no curriculum context on court |
| 4 | Readiness signal explanation not on player profile | Director must navigate to curriculum page to understand readiness |
| 5 | No proactive DONNA brief on curriculum landing | Director must manually hunt for gaps |
| 6 | DONNA cannot create new missions or badges | Custom player motivation not possible |
| 7 | DONNA cannot guide new level creation from blank slate | Director must know curriculum structure to build it |
| 8 | Parent guidance DONNA suggestions not surfaced in curriculum workflow | Parent-facing content not authored |
| 9 | Repeated coach observation patterns not monitored (blocked) | DONNA can't surface "coaches keep flagging backhand at Orange Ball 2" |
| 10 | DONNA doesn't track draft from creation to application | Director approves, curriculum doesn't change, no notification |

---

## What Should Be Redesigned

### 1. Curriculum Landing Page
**Current:** CONNECTIONS list + stage insight cards + level tree + health panel. No entry-point brief.
**Should be:** DONNA brief first ("3 levels need attention. Orange Ball 2 has the most impact — 8 players affected.") → Stage health overview (5 color dots) → Level tree on demand. Node drawer opens on level tap.

### 2. Curriculum Node Drawer
**Current:** 12-13 tabs with no intent guidance.
**Should be:** 4 tabs: Overview (read-only summary + health), Add Content (content type picker with DONNA suggestions), Review Changes (pending drafts for this level), Evidence (player signals for this level). DONNA guides within each tab.

### 3. Curriculum Improvement Entry Point
**Current:** Hidden behind `?improve=[levelKey]` URL param.
**Should be:** Accessible via a "Improve this level" button on each level card. DONNA's improvement context opens immediately with evidence summary and suggestions.

### 4. Dual Draft Pipeline
**Current:** `proposed_actions` for coach suggestions + `academy_curriculum_overrides` for director overrides — two queues, director doesn't know which.
**Should be:** One review interface. All curriculum change proposals appear in `/director/review` with a "Curriculum" type filter. The builder change queue is a sub-view of the same list.

### 5. Coach Session Curriculum Context
**Current:** Empty after migrations applied it will show content — but still no "here's what matters today" DONNA brief.
**Should be:** When a coach opens a session, DONNA brief at top: "This is an Orange Ball 2 session. The curriculum focus is backhand consistency. Lucas is close to clearing his cross-court gate — watch for it today."

---

## What Should Be Merged

| Merge | From | Into | Rationale |
|---|---|---|---|
| Curriculum builder change queue | `/director/curriculum/builder` | `/director/review` (Curriculum tab) | All change reviews belong in one place |
| Academy version diff view | `/director/curriculum/academy-version` | Tab on `/director/curriculum` | Related content, same workflow |
| Curriculum learning modules | Director-preview only page | Player/parent portal | Content is ready for consumption |
| Two class template route trees | `/director/class-templates/*` + `/director/templates/class/*` | One route | Same purpose |

---

## What Should Be Hidden Behind Drilldowns

| Item | Current location | Should be |
|---|---|---|
| Per-level gap details | Always visible on health panel | Expandable per level |
| Node drawer full content | 12 tabs always visible | 4 primary tabs + advanced section |
| Curriculum version history | Separate page | Collapsed section on curriculum landing |
| Domain balance breakdown | CurriculumDimensionBreakdown panel | Expandable from health grade |
| Coach language per level | Level tree | In node drawer Level Detail tab |
| Competition/fitness/volume guidance | Level tree cards | Node drawer tabs |

---

## What DONNA Should Absorb

| Content currently in UI | DONNA should handle instead |
|---|---|
| Curriculum gap list (individual items) | DONNA brief: "3 gaps found. Most urgent: Orange Ball 2 missing fitness content — 8 players affected." |
| Coverage grade explanation | DONNA: "Coverage is B. Gates and drills are complete. Missing missions and parent guidance." |
| Improvement suggestions list | DONNA proactively: "I have 2 evidence-backed suggestions for Orange Ball 2. Want to review them?" |
| Stalled player count on dashboard | DONNA: "4 players are stalled. 3 are at Orange Ball 2. One possible cause: no fitness content at that level." |
| "Connections" section on curriculum landing | DONNA explains inline when director asks "what does curriculum connect to?" |

---

## What Belongs in Academy Health (`/director/kpi`)

| Intelligence | Should be on `/director/kpi` |
|---|---|
| Level-by-level enrollment distribution | Yes |
| Time-at-level per stage (advancement velocity) | Yes |
| Curriculum coverage score per level | Summary (full view on `/director/curriculum`) |
| Top gate failure rates | Yes (once migrations applied) |
| Sessions per level per week | Yes |
| Coach coverage by level | Yes |

---

## What Belongs in Today (`/director/today`)

| Signal | Should appear on Today |
|---|---|
| Sessions today with curriculum levels listed | Yes |
| Players close to advancing (3+ gates met) | Yes |
| Curriculum content items that coaches should focus on today | Yes (once template-curriculum connection is live) |
| Coach wrap-ups mentioning curriculum gaps | Yes (DONNA brief) |

---

## Recommended Next Sprint

**Sprint 1981–1990: Apply Pending Curriculum Migrations + Unlock Intelligence**

Goal: Apply all pending migrations that unlock the curriculum OS. This is the highest-impact work that can be done.

Steps:
1. Apply to live Supabase in order:
   - Migration 041: `041_requirement_domains.sql`
   - Migration 042: `042_requirement_domain_seed.sql`
   - Migration 043: `043_orange_ball_starter_requirements.sql`
   - Migration 044: `044_player_requirement_progress_bootstrap.sql`
   - Migration 045: `045_curriculum_level_id_on_templates.sql`
   - Migration 056: `056_session_block_exercises_rls.sql`
   - Migration 060: `060_gate_status_repair.sql`
   - Migration 061: `061_curriculum_content_taxonomy.sql`
   - Migration 062: `062_class_template_content_junction.sql`
   - Migration 083: `083_player_evidence_records.sql` (confirm applied)
2. Regenerate `database.types.ts`
3. Re-enable `curriculumBottleneckLoader.ts` after confirming tables exist
4. Verify `CoachSessionCurriculumPanel` shows curriculum content in session view
5. Verify `CurriculumLevelPickerCard` saves correctly with new template column

**No new code needed.** All intelligence modules are built and waiting for this data.

---

## If AcademyOS Were Built From Scratch Today

The Curriculum OS would look like this:

### Core Architecture (unchanged)
- 5 stages × N levels with gates, drills, skills, missions, badges — correct
- `proposed_actions` pipeline for all changes — correct
- Role-scoped visibility (director / coach / player / parent) — correct
- Evidence model with ownership and portability — correct

### What Would Be Different

**1. Simpler creation surface**
Instead of 12-tab drawer: DONNA-guided conversation.
"I want to add to Orange Ball 2" → DONNA asks 3 questions → draft created.

**2. Unified draft pipeline**
One table for all curriculum proposals. No split between `proposed_actions` and `academy_curriculum_overrides`. Everything reviewed in one queue, sorted by urgency.

**3. Proactive DONNA presence**
DONNA surfaces improvement suggestions on curriculum landing — no URL param required. DONNA monitors every level weekly and generates a "curriculum health digest" for the director.

**4. Curriculum in sessions from day one**
Template-curriculum connection would be part of the core session creation flow — not an add-on requiring separate migrations. Coaches would always see curriculum context because it would never have been absent.

**5. Evidence → Readiness → Director as a visible loop**
The evidence → readiness → director decision loop would be visible as a three-step indicator on every player profile. "Evidence: 4 records | Readiness: Close | Next: Schedule reassessment." Not hidden in a context panel behind a URL param.

**6. Coach pre-session brief**
Before every session, DONNA would send the coach: "Today's session is Orange Ball 2. Here's what the curriculum expects. Here are the 2 players to watch." This would be the most used feature in the system.
