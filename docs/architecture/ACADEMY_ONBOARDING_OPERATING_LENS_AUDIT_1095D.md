# Academy Onboarding Operating Lens Audit
**Sprint:** 1095D
**Date:** 2026-06-01
**Type:** Audit only — no code changes, no schema changes, no runtime behavior changes

---

## Summary

AcademyOS has a rich 10-step onboarding flow that captures the academy's coaching philosophy, session design, development priorities, and parent communication style — but none of this data is ever saved to the database. DONNA cannot access any of it after the browser tab is closed. The older sub-route onboarding system does save to the database, but captures only 7 freetext interview answers and limited operational choices.

The gap is not about missing questions — the questions are excellent. The gap is that answers live in `localStorage` and never reach DONNA.

---

## 1. Current Onboarding Flow Structure

### Two separate onboarding systems coexist

**System A — The NEW 10-Step DNA Shell** (primary, used by most directors)
- Entry points: `/onboarding`, `/director/onboarding`
- Component: `AcademyDnaLanding` → `OnboardingShell`
- Steps:
  1. Welcome + setup mode selection (fast-start | guided | full | import | consultant | multi)
  2. Academy Basics — name, age groups (6 options), academy model (6 options)
  3. Coaching Philosophy (DNA) — coaching styles (8 options, select up to 3, ranked)
  4. Coach Communication — primary and secondary communication voice (6 options each)
  5. Session Design — session block types (7 options, multi-select)
  6. Player Development — development priorities (10 options, select up to 5, ranked)
  7. Parent Communication — parent style (7 options) + 5 always-on safety rules
  8. DNA Summary — review all selections
  9. DONNA Adjustment — freetext adjustments to draft
  10. Final Activation — checklist + links to next setup tasks

**System B — The OLD Sub-Route Onboarding** (still exists, still functional)
- Routes:
  - `/director/onboarding/interview` — 7-question voice/text interview
  - `/director/onboarding/curriculum` — curriculum starter choice
  - `/director/onboarding/level-gates` — approval model + evidence + portal visibility
  - `/director/onboarding/coaches-permissions` — coach setup
  - `/director/onboarding/programs-groups` — program/group structure
  - `/director/onboarding/players-placement` — player placement activation
- These all have working server actions that save to `academies.settings` JSON

**Also exists:**
- `/director/settings` — Academy identity form (name, country, timezone, logo, website, description)
- `DONNA_ONBOARDING_STEPS` in `donnaOnboardingFlow.ts` — a 2-step DONNA micro-intro (director name + first action) — this is separate from both systems above and is not a setup flow

---

## 2. Current Onboarding Questions

### 10-Step DNA Shell captures (never saved to DB):

| Step | Field | Question |
|---|---|---|
| 1 | `setupMode` | Fast Start / Guided / Full / Import / Consultant / Multi |
| 2 | `academyName` | Academy name (text) |
| 2 | `ageGroups` | Primary age groups (Red/Orange/Green/Yellow/High Performance/Adult) |
| 2 | `academyModel` | Academy model (junior-development, high-performance, adult-program, private-coaching, multi-location, consultant-setup) |
| 3 | `coachingStyles` | Up to 3 coaching styles ranked: Fundamentals First, Game-Based Learning, High-Performance Discipline, Player-Centered Coaching, Tactical First, Movement First, Competition-Ready, Joy + Retention |
| 4 | `primaryCommunication` | Primary coaching voice: Direct+Clear, Encouraging+Positive, Question-Led, High-Energy, Calm+Precise, Standards-Based |
| 4 | `secondaryCommunication` | Secondary coaching voice (same options) |
| 5 | `sessionBlocks` | Session block types: Technique, Live Ball Heavy, Constraint Games, Point Play, Stations, Assessment Moments, Fitness Integrated |
| 6 | `developmentPriorities` | Up to 5 priorities ranked: Technical Foundation, Tactical IQ, Movement Quality, Competitive Toughness, Emotional Regulation, Consistency, Aggressive Identity, All-Court, Serve+Return, Independence |
| 7 | `parentStyles` | Parent communication style: Informed Partner, Development-Focused, Competition-Aware, Minimal Interference, High Involvement, Emotion-Safe, Data-Driven |
| 7 | `parentVisibilityRules` | 5 always-on booleans (raw notes hidden, director notes hidden, rankings hidden, comparisons hidden, unapproved AI hidden) |
| 9 | Free text | Director requests adjustments to any section via DONNA chat |

### Old Sub-Route Interview captures (saved to DB):

| Field | Question |
|---|---|
| `philosophy` | When a parent describes your academy to a friend, what do you want them to say you are great at? |
| `player_focus` | For the young players at your academy, what matters most in the early stages? |
| `development_priorities` | How do you usually group players for training — and what should coaches prioritise in each session? |
| `competition_approach` | How early do you want players starting to build real match habits? |
| `parent_communication_style` | What do you want parents to understand about how progress works at your academy? |
| `coach_operating_style` | How direct should coaches be when giving feedback to players? |
| `ninety_day_success` | What would make the first 90 days of Academy OS feel like a real win for you? |

### Old Sub-Route operational choices (saved to DB):

| Source | Field | Options |
|---|---|---|
| Level Gates | `approval_model` | Coach recommend + director approve / Director only / Coach and director both |
| Level Gates | `evidence_required` | Skill assessment, coach observations, session performance, match behavior, attendance, fitness, home practice |
| Level Gates | `portal_visibility` | Show simple requirements / Show progress only / Internal only |
| Curriculum Setup | `starter_option` | academy_os_starter / customize_starter / upload_existing_later / blank_structure |
| Academy Settings | `name`, `country`, `timezone`, `description` | Text fields |

---

## 3. What Onboarding Stores Today

### Stored in `academies.settings` JSON (accessible at runtime):
- `director_interview` object: 7 freetext fields + updated_at
- `curriculum_setup` object: starter_option + notes
- `level_gates` object: approval_model + evidence_required[] + portal_visibility + notes
- `coaches_permissions` object (if coaches step completed)
- `programs_groups` object (if programs step completed)
- `players_placement` object (if placement step completed)
- `academy_identity_completed: true` (completion flag)
- `director_interview_completed: true` (completion flag)
- `curriculum_setup_completed: true` (completion flag)
- `level_gates_completed: true` (completion flag)
- `programs_groups_completed: true` (completion flag)
- `coaches_permissions_completed: true` (completion flag)
- `players_placement_completed: true` (completion flag)
- DONNA preferences: `summaryStyle`, `parentSummaryTone`, `usesCustomLevelNames`, `customTerminology`, `preferredCoachLanguage`, `saturdaySessionDefault`, `defaultSessionDurationMin`, `hiddenKpiIds`, `donnaGreetsWithName`, `donnaDefaultConfidenceThreshold`

### Stored in `academies` table columns:
- `name`, `country`, `timezone`

### Stored in `localStorage` ONLY (never reaches DB):
- All 10-step DNA Shell data: `setupMode`, `academyModel`, `ageGroups`, `coachingStyles`, `primaryCommunication`, `secondaryCommunication`, `sessionBlocks`, `developmentPriorities`, `parentStyles`, `parentVisibilityRules`, `playerMissionStyle`
- Storage key: `academyos_onboarding_draft_v2`
- Draft is auto-saved to localStorage on every change. Never sent to a server action. Lost when browser storage is cleared or when the director uses a different browser or device.

---

## 4. What DONNA Can Currently Access After Onboarding

DONNA's context is assembled by `buildAcademyProfileFromLiveData()` in `donnaAcademyProfileContext.ts`.

**Fields DONNA can access:**

| Source | Available to DONNA |
|---|---|
| `academies.name` | Academy name |
| `academies.timezone` | Timezone |
| `academies.country` | Country |
| `academies.settings.director_interview.*` | 7 freetext interview answers (not structured) |
| `academies.settings.curriculum_setup.*` | Curriculum starter choice + notes |
| `academies.settings.level_gates.*` | Approval model, evidence types, portal visibility |
| `academies.settings.summaryStyle` | DONNA summary brevity preference |
| `academies.settings.parentSummaryTone` | Parent tone: encouraging / factual / balanced |
| `academies.settings.donnaGreetsWithName` | Whether DONNA uses the director's name |
| `academies.settings.donnaDefaultConfidenceThreshold` | Minimum answer confidence |
| Runtime: player count | Active player count |
| Runtime: coach count | Active coach count |
| Runtime: curriculum | Active version name + status |
| Runtime: ball levels | Ball level names in use |

**What the `AcademyProfileSummaryText` looks like for DONNA:**
> "Academy: Dabul Tennis Academy (United States). Director: Brian Dabul. 15 active players, 3 coaches. Curriculum: Orange Ball V2 (active). Ball levels: red, orange, green. Parent communication tone: balanced."

This summary has no coaching philosophy, no coaching style, no session design, no development priorities.

---

## 5. Academy Mission / Philosophy Gap

**What is captured:**
- `director_interview.philosophy` — freetext answer to: "When a parent describes your academy to a friend, what do you want them to say you are great at?"
- `academies.settings.description` — short description of the academy's mission

**What is missing:**
- No structured "academy mission" field (type of program: development, performance, recreational)
- No "what makes your academy different" question
- No "primary differentiator" structured field
- The philosophy answer is freetext — DONNA cannot pattern-match it to curriculum or session defaults
- The description field from Academy Settings is not included in DONNA's context summary

**Gap level: MEDIUM** — some philosophy data exists as freetext but is not structured enough for DONNA to act on it precisely.

---

## 6. Development Philosophy Gap

**What is captured:**
- `director_interview.player_focus` — freetext: "what matters most for young players"
- `director_interview.development_priorities` — freetext: "how you group players and what coaches prioritize"
- `director_interview.competition_approach` — freetext: competition philosophy

**What is missing:**
- The 10-step DNA Shell captures `developmentPriorities` as a structured, ranked array of up to 5 items — but this is never saved to DB
- No question about "what should never be sacrificed in development"
- No question about "what does a well-developed player look like at exit of each level"
- No structured development model type (skill_first | competition_first | balanced | fitness_first) — `academyPhilosophyProfile.ts` defines this but it's always derived from curriculum signal counts, not director input

**Gap level: HIGH** — the most relevant structured data (ranked development priorities) exists in the onboarding UI but never reaches DONNA.

---

## 7. Curriculum Lens Gap

**What is captured:**
- `curriculum_setup.starter_option` — which of 4 curriculum starting points was chosen
- `curriculum_setup.notes` — director notes about curriculum
- `level_gates.*` — promotion model and evidence requirements
- Active curriculum version + ball levels (runtime from DB)

**What is missing:**
- No question about "how should curriculum be organized" (by ball color, level, skill, age, competition readiness)
- No question about "how strict should level gates be" — the approval model exists but strictness preference is implicit
- No question about "what should a player look like before exiting each level" (outcome profiles)
- No question about "what are the non-negotiable skills before level movement"
- The Curriculum Director Insight View (Sprint 1095B) was built but is not connected to onboarding as a default explanation layer
- No "should DONNA use the Curriculum Insight View as its default curriculum explanation" preference

**Gap level: MEDIUM** — operational curriculum choices exist but the director's curriculum philosophy is not captured as a structured lens for DONNA.

---

## 8. Coach / Parent / Player Role Lens Gaps

### Coach lens:
**What is captured:**
- `director_interview.coach_operating_style` — freetext: "how direct should coaches be"

**What is missing:**
- Structured coaching style(s) — `coachingStyles` from DNA Shell is the best data but never saved
- Primary communication voice — `primaryCommunication` from DNA Shell never saved
- No question about "how much detail do you expect from coach recaps"
- No question about "what types of coach observations matter most"
- No question about "should DONNA ask coaches follow-up questions often or only when necessary"
- No question about "what should be escalated to the director automatically"

**Gap level: HIGH** — the richest structured coaching data (coaching styles, communication voice) exists in the DNA shell but is never persisted.

### Parent lens:
**What is captured:**
- `director_interview.parent_communication_style` — freetext
- `academies.settings.parentSummaryTone` — 3-way enum: encouraging / factual / balanced
- `level_gates.portal_visibility` — what gates parents can see

**What is missing:**
- Structured parent style (informed-partner, development-focused, etc.) — `parentStyles` from DNA Shell never saved
- No question about "what should parents never see automatically"
- No question about "what should parent updates emphasize: effort, progress, next steps, level readiness"
- The detailed 7-option parent style selection from the DNA Shell is the most actionable data — not persisted

**Gap level: MEDIUM** — some parent tone preference is stored but the structured style profile is not.

### Player lens:
**What is captured:**
- Nothing specifically about how DONNA should communicate with players

**What is missing:**
- `playerMissionStyle` from DNA Shell never saved
- No question about how to frame player progress (effort-focused, competition-focused, intrinsic)
- No question about how DONNA should explain level requirements to players

**Gap level: MEDIUM** — player portal exists but DONNA has no onboarding data about how to communicate with players.

---

## 9. DONNA Personality / Speaking Style Gap

**What is captured:**
- `summaryStyle` — short / standard / detailed
- `parentSummaryTone` — encouraging / factual / balanced
- `donnaGreetsWithName` — boolean
- `donnaDefaultConfidenceThreshold` — high / partial / low
- `customTerminology` — dictionary of terminology replacements
- DONNA's global voice persona is hardcoded: female British calm COO (in `donnaVoiceConfig.ts`)

**What is missing:**
- No per-academy choice of "should DONNA be concise or explanatory"
- No per-academy choice of "should DONNA act as COO, assistant, curriculum guide, or coaching coordinator"
- No per-academy choice of "should DONNA be proactive or wait for commands"
- No per-academy choice of "how direct should DONNA be about gaps"
- No per-role DONNA personality settings (different tone for directors vs. coaches vs. parents vs. players)
- The `donnaDefaultConfidenceThreshold` preference exists but there is no UI to set it during onboarding — directors would have to set it post-onboarding in a settings screen that doesn't fully expose all preferences

**Gap level: MEDIUM** — basic DONNA behavior preferences are available but DONNA's operating persona and per-role communication style are not director-configurable.

---

## 10. Safety / Approval Rule Gap

**What is captured:**
- `level_gates.approval_model` — who approves level movement (structured, 3 options)
- `level_gates.evidence_required` — what evidence is required (structured, 7 options)
- `level_gates.portal_visibility` — what players/parents see (structured, 3 options)
- Parent safety rules are hardcoded in the DNA Shell (not configurable — by design)

**What is missing:**
- No question about "who can approve curriculum changes" as a stored setting
- No question about "who can approve parent communication" as a stored setting
- No question about "what actions require director approval" beyond level movement
- No question about "what should never be sent automatically"
- The parent visibility rules in the DNA Shell (`parentVisibilityRules`) default to all-protected but the actual selections are never saved to DB — they're only shown in the UI

**Gap level: LOW for the critical safety rules** — core protection is hardcoded, which is correct. But director-controlled approval preferences for curriculum and communication are not captured.

---

## 11. Data Gaps vs. UX Gaps

### Data gaps (questions not asked anywhere):
- What age groups and levels do you primarily serve? (partially asked in DNA Shell as age groups, but never saved)
- What makes your academy different from others? (not asked)
- What should a player look like before exiting each level? (not asked)
- What are the non-negotiable skills before level movement? (not asked)
- Should DONNA be more proactive or wait for commands? (not asked)
- Should DONNA always recommend the next best action? (not asked)
- What should DONNA help directors, coaches, parents, players specifically with? (not asked per role)

### UX gaps (questions asked but answers not persisted or not accessible):
- All 10-step DNA Shell selections (most critical — rich structured data, never saved)
- Academy description from Settings is not in DONNA's context
- Director interview is stored but DONNA receives it as raw text, not structured facts

### Architecture gaps (data exists but not wired):
- `academyPhilosophyProfile.ts` defines a `AcademyPhilosophyProfile` type with `developmentEmphasis`, `contentDomainPriorities`, etc. — but this is always **derived** from curriculum signal counts, never from director input
- `AcademyDonnaPreferences` has 10 fields but most are set to defaults because there is no UI for setting them during onboarding
- The `AcademyProfileContext` summary text does not include any coaching philosophy or development priority data

---

## 12. Does Onboarding Connect to the Curriculum Insight View?

No direct connection exists. The Curriculum Director Insight View (Sprint 1095B) is a post-onboarding tool that displays the 5-stage, 15-level curriculum structure with readiness gates. It was built as a standalone director insight tool, not as a component of the onboarding flow.

There is no preference captured for "should the Curriculum Insight View be DONNA's default curriculum explanation layer." DONNA's curriculum answering today uses its own curriculum intelligence (from `curriculumExplorer.ts` backend queries), not the Insight View.

---

## 13. Cognitive Load Problems

1. **Two onboarding systems.** A director who completed the 10-step DNA Shell may not know they also need to go to `/director/onboarding/interview` to complete the old sub-route steps. The `AcademyDnaLanding` shows the old steps as separate completion badges but the connection is unclear.

2. **Draft not persisted.** The DNA Shell says "Your Academy DNA is saved to your draft. Settings are applied when you complete setup in the Director Dashboard." This is misleading — the DNA draft is in localStorage, not the database. If the director navigates away and comes back on a different device, their DNA answers are gone.

3. **Activation step does not actually save to DB.** The Activation Checklist (step 10) sends directors to other pages (curriculum, templates, players) but does not have a "Save Academy DNA" action. The DNA data silently stays in localStorage.

4. **DONNA preferences have no visible UI.** The `AcademyDonnaPreferences` object has 10 fields, but there is no onboarding step or settings page where a director can see and set all of them. DONNA operates on defaults.

5. **Interview and DNA shell overlap.** Both systems ask about coaching style, parent communication, and development priorities — in different formats (freetext vs. structured selection). A director who completes both gets asked similar questions twice.

---

## 14. Missing Fields and Data

| Missing Piece | Priority | Location to Add |
|---|---|---|
| `academy_dna` object in `academies.settings` | CRITICAL | New server action: `saveAcademyDnaAction` |
| Structured coaching styles (ranked) | CRITICAL | DNA Shell → DB bridge |
| Structured development priorities (ranked) | CRITICAL | DNA Shell → DB bridge |
| Structured parent communication style | HIGH | DNA Shell → DB bridge |
| Academy model type | HIGH | DNA Shell → DB bridge |
| Primary age groups served | HIGH | DNA Shell → DB bridge |
| Primary communication voice | HIGH | DNA Shell → DB bridge |
| Session block design preferences | MEDIUM | DNA Shell → DB bridge |
| DONNA personality preferences UI | MEDIUM | Existing `AcademyDonnaPreferences` — needs UI |
| Per-role DONNA communication style | MEDIUM | New onboarding section (future sprint) |
| Player portal DONNA framing preferences | MEDIUM | New onboarding question (future sprint) |
| "What makes your academy different" | LOW | New question in DNA Shell (future sprint) |
| Per-stage player outcome profiles | LOW | New curriculum section (future sprint) |
| Curriculum-as-DONNA-context preference | LOW | New preference in DONNA settings |

---

## 15. What Can Be Solved Without Schema Changes

`academies.settings` is a flexible JSON column — any new fields can be added without a migration.

**Without schema changes:**
- Add a `saveAcademyDnaAction` server action that writes the full `OnboardingDraft` to `academies.settings.academy_dna`
- Wire `buildAcademyProfileFromLiveData()` to read `academy_dna` and surface coaching styles, session design, and development priorities
- Add `academy_dna` fields to `getAcademyProfileSummaryText()` so DONNA sees them in context
- Wire DONNA preferences UI so directors can set `summaryStyle`, `donnaGreetsWithName`, etc. during onboarding
- Include `academies.settings.description` in DONNA's context

---

## 16. What Requires Schema Changes

| Change | Why Needed |
|---|---|
| `academy_philosophy` table | If philosophy data needs versioning, history, or multi-stage profiles beyond JSON |
| `director_preferences` table | Per-director DONNA behavior preferences (currently per-academy) |
| Role-specific communication templates | If DONNA needs different stored templates per role |

None of these are needed for the immediate gap. The `academies.settings` JSON bridge is sufficient for the next 3–5 sprints.

---

## 17. Recommended Next Sprint: Sprint 1095E

**Sprint 1095E — Academy DNA Persistence Bridge V1**

**Goal:** Write the 10-step DNA Shell data to the database so DONNA can access it in all future sessions.

**Files to create:**
- `src/app/director/onboarding/saveAcademyDnaAction.ts` — server action that writes `OnboardingDraft` to `academies.settings.academy_dna`

**Files to modify:**
- `src/components/onboarding/steps/ActivationChecklistStep.tsx` — call `saveAcademyDnaAction` when required DNA fields are complete
- `src/lib/donna/donnaAcademyProfileContext.ts` — extend `BuildAcademyProfileInput` and `AcademyProfileContext` to include `academyDna` fields
- `src/lib/donna/donnaAcademyProfileContext.ts` — update `getAcademyProfileSummaryText()` to include coaching styles, development priorities, and parent style when present

**No schema changes.** No migrations. Pure TypeScript.

**Acceptance:**
1. Completing the DNA Shell and clicking "Go to Director Dashboard" saves `academy_dna` to `academies.settings`
2. On next page load, DONNA's context includes the academy's coaching styles and development priorities
3. `npx tsc --noEmit` passes clean

---

## 18. What Should Not Be Built Yet

- Do not redesign the onboarding UX
- Do not add new onboarding questions
- Do not create a separate `academy_philosophy` table — the JSON column is sufficient
- Do not expose onboarding fields to coaches, parents, or players
- Do not wire the Curriculum Insight View as DONNA's curriculum source — that is a separate architectural decision
- Do not build per-role DONNA personality settings — wait until DNA bridge is working and tested
- Do not build director configuration screen for DONNA preferences — that is after the bridge is stable
- Do not merge the two onboarding systems yet — they serve different purposes

---

## Appendix A: File Map

| File | Role |
|---|---|
| `src/components/onboarding/OnboardingShell.tsx` | 10-step DNA Shell — draft only, localStorage, no DB |
| `src/components/onboarding/AcademyDnaLanding.tsx` | Landing page before DNA shell |
| `src/components/onboarding/OnboardingSaveStatus.tsx` | localStorage persistence hook — confirms no DB write |
| `src/components/onboarding/steps/*.tsx` | 10 step components |
| `src/app/director/onboarding/interview/interviewSteps.ts` | 7-question interview definition |
| `src/app/director/onboarding/interview/updateDirectorInterviewAction.ts` | Saves 7 interview fields to `academies.settings.director_interview` |
| `src/app/director/onboarding/curriculum/updateCurriculumStarterAction.ts` | Saves curriculum choice to `academies.settings.curriculum_setup` |
| `src/app/director/onboarding/level-gates/updateLevelGatesAction.ts` | Saves gate rules to `academies.settings.level_gates` |
| `src/app/director/settings/updateAcademySettingsAction.ts` | Saves name/country/timezone to `academies` table |
| `src/lib/donna/donnaAcademyProfileContext.ts` | DONNA context builder — does NOT read `academy_dna` (field doesn't exist yet) |
| `src/lib/donna/preferences/academyPreferences.ts` | DONNA preference schema — stored in `academies.settings` but no UI to set during onboarding |
| `src/lib/donna/llmOrchestration/academyPhilosophyProfile.ts` | Philosophy profile — derived from curriculum signals, never from director interview |
| `src/components/assistant/donnaOnboardingFlow.ts` | 2-step DONNA micro-intro — not a setup flow |
