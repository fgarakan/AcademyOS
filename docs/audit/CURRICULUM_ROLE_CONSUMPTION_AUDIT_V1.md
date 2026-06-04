# Curriculum Role Consumption Audit V1

**Date:** 2026-06-04
**Auditor:** Claude Code
**Purpose:** Audit how each role consumes curriculum information and whether AcademyOS currently answers their core questions.

---

## Role 1: Director

**Core questions:**
1. What is being taught?
2. What is working?
3. What is not working?
4. What should improve?

---

### 1.1 What is being taught?

**Where the director can find this today:**
- `/director/curriculum` — the level tree shows all curriculum levels, gates, drills, and coach language
- `CurriculumStageInsightCard` shows stage goal and exit player profiles per stage
- `getLevelInsight()` provides per-level director goal, exit player profile, focus areas, readiness signals, common blockers

**What the director can understand today:**
- The structure of the curriculum (5 stages × N levels)
- The gates (criteria players must meet) at each level
- The drills attached to each level
- The coach language (doing_well, working_on, current_focus, next_step)

**What the director cannot understand today:**
- Whether what's in the curriculum is actually being taught in sessions (curriculum → template connection is broken)
- Which drills are most commonly used (no drill usage analytics)
- Whether coaches are following the curriculum or running ad-hoc sessions

**Score: 4/10** — Can see what the curriculum says, cannot verify what's actually being taught.

---

### 1.2 What is working?

**Where the director can find this today:**
- `/director/kpi` — Academy Health page with KPIs including advancement rate
- `computeTimeInLevel()` from `developmentVelocityKpiEngine` — estimates time players spend at each level
- `advancementReadyCount` on dashboard — how many players are eligible for advancement

**What the director cannot understand today:**
- Which curriculum levels produce the most advancements (no cohort analysis)
- Whether specific drills correlate with gate achievement
- Whether curriculum changes in the past 6 months improved player outcomes
- Which coaches are most effectively delivering the curriculum

**Score: 2/10** — Very limited "what's working" signal. Only macro counts, no curriculum-level effectiveness data.

---

### 1.3 What is not working?

**What exists:**
- `CurriculumHealthPanel` — shows coverage grade and gaps per level
- `buildGapAnalysisReport()` — identifies structural gaps (missing levels, domain imbalances)
- `stalledPlayerCount` on dashboard — players who've been at the same level for 6+ months
- `curriculumBottleneckLoader.ts` — BLOCKED by schema

**What the director sees:**
- "Orange Ball 2 has a partial coverage score" — tells them content is missing but not WHY players are stalled there
- Stalled player count (aggregate) but not which level is causing the stall
- Curriculum gaps flagged by type (missing_level, missing_domain_coverage, etc.)

**What the director cannot see:**
- Which level players get stuck at most often
- Whether a specific gate is too hard (repeated failure)
- Whether coach observation patterns suggest a curriculum gap at a specific level
- Any bottleneck analysis (blocked by schema)

**Score: 3/10** — Content gaps are visible. Player bottleneck analysis is blocked.

---

### 1.4 What should improve?

**What exists:**
- `DonnaCurriculumContextPanel` (activated by `?improve=` param) with evidence-backed suggestions
- `analyzeCurriculumImprovements()` — ranks improvement suggestions by confidence
- `CurriculumDraftHelpers` — draft creation from DONNA suggestions

**The discovery gap:**
- DONNA's improvement suggestions are excellent when accessed, but the director must navigate to `?improve=[levelKey]` to trigger them — not discoverable
- No proactive "here are the 3 things that should improve this month" surface on any director page

**Score: 5/10** — Improvement mechanism exists and is well-designed; discoverability is poor.

---

## Role 2: Coach

**Core questions:**
1. What should I teach today?
2. What is the session goal?
3. What player priorities matter?
4. What should I report?

---

### 2.1 What should I teach today?

**What the coach sees today:**
- Session detail → block list (blocks from template, ordered by sequence)
- `CoachSessionFocusCard` — shows `session_focus_tag` if set by director
- `CoachSessionCurriculumPanel` — shows curriculum content items per block (requires migrations 045 + 062)
- `CoachSessionGapBriefPanel` — curriculum gap signals for the session's group

**Current reality:**
- Without migrations 045 + 062, the coach sees block names and types but no curriculum context
- No "today you should focus on [gate X] for [player Y]" guidance
- No connection between the session plan and the individual players' gates

**What the coach should see:**
- "This is an Orange Ball 2 session. The curriculum focus is backhand consistency (technical gate). Here are 3 drills from the curriculum for this block."
- "Lucas is close to clearing his cross-court gate. Watch for it today."

**Score: 3/10** — Session structure is visible; curriculum context is absent from live sessions.

---

### 2.2 What is the session goal?

**What exists:**
- `CoachSessionFocusCard` shows a pre-defined session focus tag
- Session name includes curriculum level if director included it
- Stage insight card shows the level's director goal

**Gap:**
- Session goal is set by the director at template creation time — if not set, the coach sees no goal
- No per-session DONNA brief: "Today's goal: 3 reps of cross-court forehand with 70% consistency for the Orange Ball group"

**Score: 4/10** — Session focus exists if director set it; no DONNA-generated session brief.

---

### 2.3 What player priorities matter?

**What the coach sees today:**
- `/coach/players/[playerId]` shows player IDP (coach view): open_gates, training_gaps, coach_watch_fors
- `CoachPlayerBriefCard` in coach home shows player brief for each roster player
- `CoachDailyBriefCard` — brief for today's session context

**What the coach does NOT see:**
- Which players in today's session are close to clearing a gate
- Which players have been flagged by the director as needing attention
- Whether any player's evidence is building toward a readiness signal

**Score: 5/10** — Player IDP exists with coach-relevant data; not surfaced in the session context.

---

### 2.4 What should I report?

**What exists:**
- `CoachWrapUpDrawer` — 6-question guided wrap-up (the clearest reporting flow in the app)
- Q4 of wrap-up: individual player notes
- `CoachObservationDraftReviewPanel` — shows which observations are in review

**The reporting friction:**
- Coach doesn't know which gates are "reportable" for each player — they record general observations, not gate-specific evidence
- Coach observation tags are optional — systematic tagging doesn't happen
- After submitting the wrap-up, coach has no visibility into what the director did with it

**Score: 6/10** — Wrap-up flow is good; evidence collection is not gate-specific.

---

## Role 3: Parent

**Core questions:**
1. What is my child learning?
2. Why does it matter?
3. How can I help safely at home?

---

### 3.1 What is my child learning?

**What the parent sees today:**
- `/parent` — IDP parent view: `current_level`, `current_stage`, `what_to_work_on`, `why_it_matters`
- `ParentSafeProgressPreview` — sanitized progress indicators
- Mission title if active (`player_mission_label`)

**What works:**
- The `buildRoleSpecificIdpView('parent')` produces parent-safe language
- `sanitizeParentFacingText()` removes internal terminology
- `parentSafeResponseRules.ts` blocks deficit language, comparisons, raw coach notes

**What the parent cannot see:**
- The specific drills their child is working on (drills are coach-only)
- The gate criteria their child needs to meet (not parent-visible by default)
- Whether their child attended all sessions this month (attendance data is shown but with limited context)

**Score: 6/10** — Core parent question answered. Curriculum detail appropriately hidden.

---

### 3.2 Why does it matter?

**What exists:**
- `why_it_matters` field on the IDP parent view — describes why the current focus matters
- Learning modules have `why_it_matters` content — but learning modules are director-preview only, not wired to parent portal
- `parent_guidance` content type exists in the curriculum model — but parent guidance creation has no dedicated workflow

**What the parent does NOT see:**
- The curriculum-level reasoning for why Orange Ball 2 exists
- The connection between today's session and long-term development
- DONNA-generated explanations in parent-safe language

**Score: 5/10** — "Why it matters" content exists on IDP but is not enriched by curriculum depth.

---

### 3.3 How can I help safely at home?

**What exists:**
- `buildParentSupportGuide()` from `src/lib/parent/parentSupportGuide.ts` — generates home support guidance
- Learning module `parent_support_tip` field — per-module parent tips
- `IdpParentView.parent_support_guidance` — guidance in the IDP

**What doesn't work:**
- Parent support guidance is generated from the IDP — if the IDP is thin (few gates, no missions), guidance is generic
- Learning module parent tips are not connected to the parent portal
- No DONNA brief for parents: "This week, encourage your child to practice [specific thing]. Here's why: [parent-safe reason]."

**Score: 4/10** — Guidance exists but is generic without rich curriculum data flowing through.

---

## Role 4: Player

**Core questions:**
1. What is my mission?
2. What skill am I building?
3. What unlocks the next level?

---

### 4.1 What is my mission?

**What exists:**
- `PlayerHomeHeroCard` — shows current level, progress ring
- `PlayerAssignedMissionsSection` — shows missions from `player_mission_blueprints` or assigned missions
- `PlayerMissionPreview` — mission detail
- `buildPlayerMissionCopy()` — player-facing mission language
- 12 mission definitions covering progress, attendance, skills, mental, assessment goals

**What works:**
- Mission system is well-designed — short-term, motivating, clearly named
- `missionEngine.ts` ranks eligible missions for a player based on their state
- Missions are player-visible and parent-visible (selected missions)

**What doesn't work:**
- Mission is shown but its connection to curriculum gates is not visible to the player
- "Complete your first requirement" mission → player doesn't know what "requirement" means in their context
- No "here's what completing this mission does for your advancement" explanation

**Score: 7/10** — Mission display is good. Curriculum connection is implicit, not explained.

---

### 4.2 What skill am I building?

**What exists:**
- `buildRoleSpecificIdpView('player')` — shows `current_level`, `next_target_level`, `what_to_work_on`
- Skill Path tab on player profile (director preview) — but player does not see the director's Skill Path view
- `LevelProgressRing` — visual progress indicator

**What the player sees:**
- "You are working on [mission]."
- Level name (e.g., "Orange Ball 2")
- Progress percentage toward level completion

**What the player does NOT see:**
- The specific skill domain they are in (technical / tactical / fitness / mental)
- Which drills they are working on
- Which gate they are closest to clearing
- "You need 3 more observed cross-court shots to clear this gate"

**Score: 5/10** — Mission shows direction; specific skill and gate progress not surfaced.

---

### 4.3 What unlocks the next level?

**What exists:**
- Level progress ring shows completion percentage
- `IdpPlayerView.next_target_level` — player can see what level comes next
- `PlayerCurriculumIntersection.nextLevelPreview` — next level name, stage, unlock status

**What doesn't work:**
- "What unlocks the next level" is not explained to the player
- Gates are not player-visible by default (requires `is_player_visible` flag)
- No "Your next level is Orange Ball 3. To get there, you need [clear and specific criteria]"
- The gate model has excellent structure but zero player-facing exposure

**Score: 3/10** — Next level name is shown; advancement criteria are invisible to the player.

---

## Role Consumption Summary

| Role | Q1 | Q2 | Q3 | Q4 | Avg | Primary gap |
|---|---|---|---|---|---|---|
| Director | 4/10 | 2/10 | 3/10 | 5/10 | **3.5** | Can't verify what's taught; bottleneck blocked |
| Coach | 3/10 | 4/10 | 5/10 | 6/10 | **4.5** | Curriculum context absent from sessions |
| Parent | 6/10 | 5/10 | 4/10 | — | **5.0** | Support guidance is generic |
| Player | 7/10 | 5/10 | 3/10 | — | **5.0** | Gate advancement criteria invisible |

---

## Cross-Role Curriculum Visibility Map

| Content | Director | Coach | Player | Parent |
|---|---|---|---|---|
| Level name | ✓ | ✓ | ✓ | ✓ |
| Stage goal | ✓ | Partial | No | No |
| Gates / criteria | ✓ | ✓ | Only if flagged | No |
| Drills | ✓ | ✓ | Player-visible only | No |
| Coach cues | ✓ | ✓ | No | No |
| Missions | ✓ | ✓ | ✓ | Selected |
| Badges | ✓ | ✓ | ✓ | ✓ |
| Parent guidance | ✓ | No | No | ✓ |
| Evidence/readiness | ✓ | Partial | No | No |
| Learning modules | ✓ (preview) | No | No | No |
| Improvement suggestions | ✓ (DONNA) | No | No | No |

**The curriculum visibility model is correct in design. The problem is that most curriculum content never reaches players and parents because:**
1. Template-level connection is broken (migrations pending)
2. Learning modules are not wired to the player/parent portal
3. Gate advancement criteria are not surfaced with player-friendly language
4. Parent guidance content type exists but has no creation workflow
