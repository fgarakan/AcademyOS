# Player Portal Prototype Alignment Audit

**Sprint 1067**
**Date:** 2026-05-19
**Source:** `prototype-reference/academyos-player-portal.zip`
**Unzipped to:** `/tmp/player-portal` (not staged, not committed)

---

## Scope

Workflow and information architecture (IA) extraction only. No code, fonts, color tokens, routing conventions, or animation patterns copied from the prototype.

AcademyOS branding, design system (dark/lime, `Card`/`CardHeader`/`CardContent`, `label-xs`, `btn-lime`, Inter + JetBrains Mono fonts), and App Router architecture apply to all Player Portal pages.

---

## Screens reviewed

| # | Screen | File |
|---|---|---|
| 1 | PlayerHome — My Training Path | `PlayerHome.tsx` |
| 2 | MissionMap — Development Journey | `MissionMap.tsx` |
| 3 | MissionDetail — Current Mission | `MissionDetail.tsx` |
| 4 | SkillPath — Technical Development | `SkillPath.tsx` |
| 5 | CompetitionPath — Match Skills | `CompetitionPath.tsx` |
| 6 | FitnessPath — Body Development | `FitnessPath.tsx` |
| 7 | LevelUp — Next Unlock | `LevelUp.tsx` |
| 8 | PracticeHome — At-Home Practice | `PracticeHome.tsx` |
| 9 | Celebration — Mission Complete | `Celebration.tsx` |
| 10 | AskDonna — Player AI Guide | `AskDonna.tsx` |

---

## Screen-by-screen IA extraction

### Screen 1 — PlayerHome

**Workflow:** Landing screen after login. Player sees their mission, level, and entry points to each path.

**Information hierarchy:**
1. Greeting with player first name, subtitle
2. Hero Mission Card: current mission quote, current level name + next level name, level progress indicator, streak indicator, active mission count, "Continue Mission" CTA
3. 6 path entry cards: Skill Path, Competition, Fitness, My Missions, Practice, Level Up — each with a directional progress indicator
4. DONNA panel: "Want help understanding what to work on?" + 5 quick question chips linking to AskDonna

**What the prototype shows that we keep (IA only):**
- Current mission as the dominant hero element
- Level name displayed prominently (current → next)
- Path entry cards as a 2-col mobile / 3-col desktop grid
- DONNA quick questions on the home screen for discoverability

**What the prototype shows that we do NOT add:**
- Progress percentage bars on path cards (we have no percentage score; use observation count + gate status instead)
- Streak counter (no sessions-attended signal in player portal yet)
- "3 missions active" count (only show current mission; multi-mission count requires future data)

---

### Screen 2 — MissionMap

**Workflow:** Player sees all missions on their development path, organized by status.

**Information hierarchy:**
1. Header: "Your Development Journey"
2. Section: Current Mission (status = active) — full card with CTA
3. Section: Next Mission (status = next up) — preview card, no CTA
4. Section: Future Missions (status = locked) — dimmed cards, prerequisite note
5. Section: Completed Missions — checkmarked cards

**Per-mission card fields:**
- Status badge (ACTIVE / COMPLETE / NEXT UP / LOCKED)
- Mission name + subtitle
- Progress indicator (active missions only)
- Evidence requirement string (e.g., "Coach observation needed")
- Reward badge name (e.g., "Recovery Badge")
- CTA button (active: "Continue Mission"; next: "Coming Up Next" non-interactive; completed: no button)

**Data source:** Active priorities ordered by `priority_rank`. Locked missions = future priorities or un-started gates.

**What we keep:** Status sections, mission card layout with evidence requirement string, locked/unlocked visual hierarchy.

**What we do NOT add:** Progress percentage on mission cards (use observation count as evidence signal instead). Reward badges as earned/claimed mechanics (badge display is cosmetic only; no gamification database writes).

---

### Screen 3 — MissionDetail

**Workflow:** Full detail of the current active mission. Player reads and optionally starts practice or asks DONNA.

**Information hierarchy:**
1. Back link to Mission Map
2. Hero card: mission name, description, progress indicator, "Start Practice" CTA, "Ask DONNA" CTA
3. Section cards (6):
   - **Mission Goal** — plain description of what the skill is and why it matters
   - **Why It Matters** — rationale in accessible, non-pressure language
   - **What To Do** — numbered action steps (max 4)
   - **Coach Watch-For** — what the coach is observing (from approved parent-safe requirements only)
   - **How To Know You Improved** — 4 success criteria (observable, not percentage-based)
   - **Evidence Needed** — mini progress rows: practice sessions logged / coach observation / match application

**Safety note:** "Coach Watch-For" and "Coach Note" sections must come from approved `parentSafeRequirements` data only — never from raw coach observations. Raw coach observations are internal-only and must never appear on player-facing screens.

**Data source:** Active priority with highest `priority_rank`, coach observations count by category, curriculum gate requirements for this priority's category.

**What we keep:** 6-section card structure, evidence needed mini-tracker rows (observation count vs. required count).

**What we do NOT add:** Raw coach note text in any section. Internal director comments. Assessment scores.

---

### Screen 4 — SkillPath

**Workflow:** Player sees their technical skill areas, current focus, and connection to their active mission.

**Information hierarchy:**
1. Header: "Technical Development"
2. Overall summary card: current level name (no percentage score)
3. 6 skill area cards (2-col grid): Forehand, Backhand, Serve, Volley, Movement/Footwork, Preparation
   - Per card: skill name, sub-component tags, status badge (Strong / Active Focus / Developing), observation count (not %), coach-approved note snippet (max 1 sentence from approved summary)

**Status derivation (safe, no percentage):**
- Strong = 3+ skill-type observations in the evidence window
- Active Focus = current mission is in this skill category
- Developing = 1-2 observations or no current mission link

**What we keep:** 6 skill area breakdown, status labels (Strong/Active Focus/Developing), CTA to active mission at bottom.

**What we do NOT add:** Progress percentage bars. Raw coach note text. Overall skill score.

---

### Screen 5 — CompetitionPath

**Workflow:** Player sees their competition/match skill areas and current competition focus.

**Information hierarchy:**
1. Header: "Match Skills"
2. Current competition focus highlight card: focus label + supportive tip + observation count
3. Overall observation count row (not percentage)
4. 6 competition skill cards (2-col grid): Rally Decisions, Target Choice, Scoring Awareness, Pressure Response, Match Routines, Tournament Readiness
   - Per card: name, description, observation count, status badge, supportive tip (approved text only)
5. CTA: "Ask DONNA how to prepare for a match"

**What we keep:** Focus highlight card, 6 skill areas, DONNA CTA.

**What we do NOT add:** Progress percentage bars. Rankings. Win/loss record. UTR display. Coach notes not approved for player view.

---

### Screen 6 — FitnessPath

**Workflow:** Player sees fitness area breakdown connected to their active mission.

**Information hierarchy:**
1. Header: "Body Development"
2. Current body focus highlight card: directional focus statement, focus area tags
3. Fitness area list (7 items): Mobility, Coordination, Speed, Agility, Strength, Recovery, Tennis Transfer
   - Per item: name, description, observation count, "Focus" badge if linked to active mission

**Circular progress ring:** The prototype uses an SVG ring. In AcademyOS we use a simple progress bar or count badge — no SVG ring animation required.

**What we keep:** 7 fitness area breakdown, focus highlight, mission linkage.

**What we do NOT add:** Percentage circles. Fabricated fitness scores. Fitness data not in AcademyOS schema.

---

### Screen 7 — LevelUp

**Workflow:** Player sees what they are building toward for the next curriculum level.

**Information hierarchy:**
1. Header: "Your Next Unlock"
2. Level comparison card: Current Level name → Next Level name (locked icon), completed/total gate count, progress indicator (gates passed count, not percentage)
3. "What You're Building" requirements list:
   - Each gate requirement: label (approved requirement title), detail (gate criterion text), done/not-done state based on `playerGateStatus`
4. Encouragement text referencing their specific progress
5. CTA to current mission

**Safety note:** Gate requirement labels shown to the player must use the `criterion` field from `curriculum_gate_requirements`, not internal evaluator notes or director comments.

**What we keep:** Level comparison display, gate requirements list with done/not-done, encouragement copy, mission CTA.

**What we do NOT add:** Progress percentage. Assessment scores. Director gate comments. Automatic unlock notification.

---

### Screen 8 — PracticeHome

**Workflow:** Player sees a short at-home practice session linked to their current mission. Local check-off only.

**Information hierarchy:**
1. Header: "At-Home Practice"
2. Session summary: "Linked to: [Mission Name]", estimated time, exercise completion progress (local state)
3. Exercise checklist (5 items): label, reps, time estimate, category badge, tap to check done
4. "Angles App — Coming Soon" placeholder panel (do not build or reference)
5. "Homework Focus" card: coach-set focus text for the week from approved development summary

**Architecture:** Exercise check-off is client-side local state only. No DB write per sprint rules. No evidence is created by checking off items — evidence comes from coach observations in the director workflow.

**What we keep:** Session linked to mission, exercise list with category badges, homework focus from approved summary, local check-off UX.

**What we do NOT add:** Angles App reference. Rep count tracking to DB. Quality score submission. Any write that bypasses the evidence pipeline.

---

### Screen 9 — Celebration

**Workflow:** Player sees a milestone moment when a mission or gate is marked complete by the director.

**Information hierarchy:**
1. Header: "Mission Complete!"
2. Hero card: badge icon, badge name, completion text, session count stat (from observation count), days elapsed stat
3. Coach Note card: approved coach message (from `show_to_parent: true` development summary only), coach name
4. "Next Mission Unlocked" card: next priority title + description + "Start Next Mission" CTA

**Critical safety rules:**
- "Share with Family" button in prototype — do NOT build as a real send mechanism. Parent visibility is controlled by director approval only.
- Coach Note must come from `show_to_parent: true` development summary — never from raw coach observations.
- Celebration trigger must come from director-side action (gate passed, priority marked complete) — never automatic.

**What we keep:** Mission complete hero, approved coach note display, next mission card.

**What we do NOT add:** Share with Family send button. Confetti tied to automatic level movement. Stats calculated without real data.

---

### Screen 10 — AskDonna

**Workflow:** Player asks DONNA questions about their training. DONNA answers using only coach-approved data.

**Information hierarchy:**
1. Header: "Ask DONNA" + "always here" indicator
2. Guardrails notice: "DONNA shares coach-approved summaries only. No rankings, no pressure, no private notes."
3. Chat thread: DONNA avatar, message bubbles, typing indicator
4. Quick question chips (5): "What should I practice?", "What does my mission mean?", "How do I get to the next level?", "How do I prepare for a match?", "What did my coach say I should focus on?"
5. Text input + send button

**DONNA player-role constraints (hard rules):**
- Answers must draw only from: current mission (active priority), approved development summary, current level name, next level gate requirements, pathway observation counts
- Never reveal: raw coach observation text, internal director comments, assessment scores, benchmark comparisons, rankings, other players' data, UTR
- No unrestricted AI chat — responses are constrained to training-context questions

**Architecture decision required:** V1 DONNA for players may use deterministic template responses keyed to intent (matching the prototype's lookup pattern), escalating to real AI in a later sprint. This avoids API calls and maintains guardrail certainty.

**What we keep:** Chat UI with guardrails notice, 5 safe quick questions, DONNA avatar/identity.

**What we do NOT add:** Unrestricted free-text AI with no guardrails. Anything that surfaces raw coach notes. Rankings or competitor data.

---

## Navigation structure

Route prefix: `/player` (already partially built per LOCKED_MODULES.md)

| Screen | Route |
|---|---|
| PlayerHome | `/player` |
| MissionMap | `/player/missions` |
| MissionDetail | `/player/missions/[priorityId]` |
| SkillPath | `/player/skill-path` |
| CompetitionPath | `/player/competition-path` |
| FitnessPath | `/player/fitness-path` |
| LevelUp | `/player/level-up` |
| PracticeHome | `/player/practice` |
| Celebration | `/player/celebration` |
| AskDonna | `/player/ask-donna` |

Navigation chrome: existing `BottomTabBar` with tabs for Home, Missions, Ask DONNA.

---

## Data mapping

| Prototype field | AcademyOS source |
|---|---|
| Current mission quote | `active_player_priorities.description` (highest priority_rank) |
| Mission name | `active_player_priorities.title` |
| Current level name | `curriculum_level.level_name` |
| Next level name | `curriculum_spine` next level record |
| Gate requirements list | `curriculum_gate_requirements` for current level |
| Gate passed/not | `player_gate_status.status` |
| Evidence count | Coach observations by category (SKILL/COMPETITION/FITNESS obs type sets) |
| Coach watch-for | `parentSafeRequirements` from approved parent-safe summary |
| Homework focus | Approved `development_summary.things_to_work_on[0]` with `show_to_parent: true` |
| Coach note (Celebration) | Approved `development_summary` with `show_to_parent: true` |
| Progress % | NOT built — translate to observation count + gate pass status |
| Streak | NOT built — no sessions-attended signal in player portal yet |
| Reward badges | Cosmetic display only — no gamification database writes |

---

## Add table

| Feature | Screen | AcademyOS translation |
|---|---|---|
| Current mission hero card | PlayerHome | Active priority with highest priority_rank |
| Current → next level display | PlayerHome, LevelUp | curriculum_level → next level from curriculum_spine |
| Path entry cards (4) | PlayerHome | Static links: Skill, Competition, Fitness, Missions |
| DONNA quick question chips | PlayerHome | 5 safe preset questions; link to /player/ask-donna |
| Mission sections (Current / Next / Locked / Completed) | MissionMap | Priorities ordered by rank; gate status for locked/done |
| Mission card with evidence requirement | MissionMap | priority + observation count for that category |
| Mission detail 6-section layout | MissionDetail | priority description + parentSafeRequirements + observation counts |
| Evidence needed progress rows | MissionDetail | observation count vs. gate requirement threshold |
| 6 skill area cards with status | SkillPath | Skill-type observations + active priority category |
| Competition focus highlight | CompetitionPath | Competition-type active priority + competition observations |
| Fitness area breakdown | FitnessPath | Fitness-type observations + fitness active priority |
| Gate requirements list with done/not | LevelUp | curriculum_gate_requirements + player_gate_status |
| Level comparison card | LevelUp | current level + next level names + gate pass count |
| Practice exercise checklist (local state) | PracticeHome | Static exercises linked to current mission category |
| Homework focus text | PracticeHome | Approved development summary (show_to_parent: true) |
| Mission complete hero | Celebration | Completed priority + observation count |
| Approved coach note display | Celebration | show_to_parent: true development summary |
| Next mission unlocked card | Celebration | Next active priority by rank |
| DONNA chat with guardrails | AskDonna | Deterministic responses from approved data; safe quick questions |
| Guardrails notice in DONNA | AskDonna | Persistent "coach-approved summaries only" banner |

---

## Do not add table

| Feature | Reason |
|---|---|
| Progress percentage bars | No percentage score in AcademyOS; would require fabricated or arbitrary data |
| Streak counter | No sessions-attended data signal in player portal yet |
| "Share with Family" send button | Parent visibility controlled by director approval only; no direct player-to-parent send |
| Raw coach observation text in any player screen | Safety rule — raw observations are internal-only |
| Internal director comments in any player screen | Safety rule — internal notes never reach player/parent |
| Assessment scores, benchmark comparisons | Blocked for player/parent portals |
| Rankings or player comparisons | Blocked — no UTR, win-loss, or ranking display |
| Angles App integration | Separate product; do not reference |
| Automatic level unlock CTAs | Level movement requires director approval |
| Confetti tied to automatic level movement | Celebration is triggered only by director-confirmed gate pass |
| Reward badges as DB-written earned/claimed mechanics | Cosmetic only; no gamification schema writes without explicit sprint approval |
| DONNA with unrestricted AI chat | Player role is constrained; no free-form AI without guardrails |
| Multi-mission active count on home screen | Only current mission shown; multi-mission count requires future priority data structure |
| Circular SVG progress rings | UI element from prototype stack; adapt to AcademyOS progress bar pattern |
| Quality score submission | No evidence writes from player side without coach/director pipeline |

---

## Architecture decisions required before building

1. **Mission model:** Do active priorities map one-to-one to missions, or should multiple priorities within a category be grouped under one mission? Recommendation: one-to-one for V1 (simplest). Each priority is one mission.

2. **Evidence progress signal for player:** Which evidence counts does the player see? Recommendation: observation count from the same category as the priority (using SKILL/COMPETITION/FITNESS obs type sets from the evidence repository). No percentage — just a count vs. a threshold from the gate requirement.

3. **Player DONNA scope for V1:** Deterministic template responses (safe, no API calls) keyed to quick question intent. Real AI call in a later sprint. This matches the prototype's actual implementation and satisfies guardrails.

4. **Celebration trigger:** How does the player land on `/player/celebration`? Recommendation: director marks a gate as `passed` → player can view celebration for that mission on next login. No automatic redirect.

5. **Practice screen writes:** Exercise check-off remains local client state only. No evidence write from player side. Session evidence comes from coach observations in the director workflow.

---

## Files created

- `docs/PLAYER_PORTAL_PROTOTYPE_ALIGNMENT_AUDIT.md` — sprint doc

## Files modified

None.

## TypeScript

Clean.
