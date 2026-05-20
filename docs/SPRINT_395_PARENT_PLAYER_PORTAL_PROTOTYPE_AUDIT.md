# Sprint 395 — Parent + Player Portal Prototype Audit V1

Prototype source: `prototype-reference/academyos-player-portal.zip` and `prototype-reference/academyos-parent-portal.zip`
Audit method: zips extracted to `/tmp` only, read-only. Not staged.

---

## 1. Executive Summary

| Signal | Score |
|---|---|
| Player portal parity | 5 / 10 |
| Parent portal parity | 4 / 10 |
| Data readiness | 8 / 10 |
| Safety readiness | 9 / 10 |

**Biggest player portal mismatch:** Navigation paradigm. Prototype has a 10-item sidebar with all paths accessible from persistent nav. AcademyOS has a 3-tab BottomTabBar (Home, Missions, Ask DONNA). Skill Path, Competition Path, Fitness Path, Level Up, Practice, and Celebration are only reachable via home card grid — invisible to a first-time director or player.

**Biggest parent portal mismatch:** Three dedicated path pages are missing. Prototype has standalone parent-safe SkillPath, CompetitionPath, and FitnessPath pages. AcademyOS collapses all path content into a single Progress tab and the Home page, which diverges significantly from the prototype's content hierarchy. The 3-step lesson request flow (Request → Coach Selection → Confirmation) is also missing; the existing inline card is a simplified single-step form.

**Highest-impact next sprint:** Sprint 396 — Player Portal Shell + Nav Upgrade. Fixing navigation reach is a prerequisite for all path visual sprints.

---

## 2. Prototype Route / Page Map

### Player Prototype Pages

| Screen | Route | Description |
|---|---|---|
| Player Home | `/` | Hero mission card, level progress, streak, 6-card path grid, DONNA chips |
| Mission Map | `/mission-map` | Gamified cards: completed / active / next / locked with progress, evidence, rewards |
| Mission Detail | `/mission-detail` | Deep dive: goal, why it matters, what to do, coach watch-for, success criteria, evidence tracking |
| Skill Path | `/skill-path` | Technical skills grid (Forehand/Backhand/Serve/Volley/Movement/Preparation) with status and progress bars |
| Competition Path | `/competition-path` | Competition skills grid, current focus highlight card, overall progress |
| Fitness Path | `/fitness-path` | Circle progress rings for 7 fitness areas, focus highlight, at-home guidance |
| Level Up | `/level-up` | Current level vs. next level comparison card with requirement checklist (done/not done) |
| Practice Home | `/practice` | At-home drill checklist keyed to active mission category |
| Celebration | `/celebration` | Achievement unlock moment, badge display, next mission reveal |
| Ask DONNA | `/ask-donna` | Chip-based player DONNA with 5 suggested questions and context-aware responses |

### Parent Prototype Pages

| Screen | Route | Description |
|---|---|---|
| Home | `/` | Welcome header, child snapshot hero card (name/level/progress/summary/stats), 4 path cards, 2 action cards, coach-approved note |
| Development Snapshot | `/snapshot` | Level card, development priorities, last assessment, progress note, what to say after practice |
| Skill Path | `/skill-path` | Parent-safe: current skill focus, what improving, why it matters, evidence collected, what parents should notice |
| Competition Path | `/competition-path` | Tactical development, situational awareness, match behavior, competition readiness guidance |
| Fitness Path | `/fitness-path` | Movement focus, at-home suggestion, readiness note, tennis transfer explanation |
| Next Steps | `/next-steps` | Best support this month (numbered), optional home practice, when to request lesson, when to play matches, what not to over-focus on |
| Request Lesson | `/request-lesson` | Multi-field form: player name, focus, preferred coach, day/time, lesson type, notes |
| Coach Selection | `/coach-selection` | 5 coach cards with specialty, why recommended, availability, lesson types |
| Confirmation | `/confirmation` | Booking confirmation with details and academy response note |
| Message | `/message` | Free-text message form to academy |

Layout: Sidebar left (10-item nav + player identity) + main content + DONNA fixed right panel on desktop. Hamburger + DONNA bottom sheet on mobile.

---

## 3. Current AcademyOS Route Map

### Player Portal

| Route | Component | Status |
|---|---|---|
| `/player` | `src/app/player/page.tsx` | Exists — hero card, 4-card grid, DONNA section, full IDP |
| `/player/missions` | `src/app/player/missions/page.tsx` | Exists — active/next/future priority cards |
| `/player/missions/[priorityId]` | `src/app/player/missions/[priorityId]/page.tsx` | Exists — goal, what to do, evidence, how to know sections |
| `/player/skill-path` | `src/app/player/skill-path/page.tsx` | Exists — 6 skill areas with real observation counts |
| `/player/competition-path` | `src/app/player/competition-path/page.tsx` | Exists — competition skills with focus from active priorities |
| `/player/fitness-path` | `src/app/player/fitness-path/page.tsx` | Exists — fitness areas |
| `/player/level-up` | `src/app/player/level-up/page.tsx` | Exists — gates checklist, current/next level |
| `/player/practice` | `src/app/player/practice/page.tsx` | Exists — drill checklist by mission category |
| `/player/celebration` | `src/app/player/celebration/page.tsx` | STUB — placeholder card only |
| `/player/ask-donna` | `src/app/player/ask-donna/page.tsx` | Exists — 7 chips, context-aware responses |
| Layout | `src/app/player/layout.tsx` | 3-tab BottomTabBar: Home, Missions, Ask DONNA |

### Parent Portal

| Route | Component | Status |
|---|---|---|
| `/parent` | `src/app/parent/page.tsx` | Exists — IDP, attendance, lesson request, support guide |
| `/parent/development` | `src/app/parent/development/page.tsx` | Exists — mission context, why it matters, support guide |
| `/parent/progress` | `src/app/parent/progress/page.tsx` | Exists — domain observation counts, level, gates passed |
| `/parent/wins` | `src/app/parent/wins/page.tsx` | Exists — positive highlights, session counts, streak |
| `/parent/updates` | `src/app/parent/updates/page.tsx` | Exists — coach-approved dev summaries |
| `/parent/ask-donna` | `src/app/parent/ask-donna/page.tsx` | Exists — 6 parent chips, context-aware responses |
| Layout | `src/app/parent/layout.tsx` | 5-tab BottomTabBar: Home, Progress, Wins, Updates, DONNA |

**Missing from AcademyOS vs prototype:**
- No dedicated parent SkillPath page
- No dedicated parent CompetitionPath page
- No dedicated parent FitnessPath page
- No dedicated NextSteps page (content scattered across Home and Development)
- No CoachSelection page
- No multi-step lesson request flow (single inline card instead)
- No standalone Message page

---

## 4. Player Portal Page-by-Page Parity Table

### Player Home

| Item | Detail |
|---|---|
| Prototype page | Player Home — `PlayerHome.tsx` |
| AcademyOS route | `/player` |
| Match score | 6 / 10 |
| Keep from prototype | Hero mission card with gradient border glow, level progress bar from current to next level, streak badge, 6-card path grid, DONNA chip section at bottom |
| Keep from AcademyOS | Real curriculum level name, real mission from priorities, real session history, IDP cards (What to Practice, What to Understand, Requirements to Move Up), safety shield note |
| Required changes | Upgrade hero card to match prototype gradient + glow + progress bar animation. Expand path grid from 4 cards to 6 (add Level Up and Practice). Replace streak badge with real attendance data. |
| Data needed | Attendance streak count (currently not derived — add from session_attendance). Progress pct toward next level (can be gates_passed / gates_total). |
| Safety notes | Do not show internal coach notes. Do not show percentage scores not derived from real gate data. |
| Priority | HIGH — first visible screen |

### Mission Map

| Item | Detail |
|---|---|
| Prototype page | Mission Map — `MissionMap.tsx` |
| AcademyOS route | `/player/missions` |
| Match score | 5 / 10 |
| Keep from prototype | Status badge treatment (ACTIVE / NEXT UP / FUTURE / LOCKED with color coding), progress bar per mission, evidence text, reward/badge concept, section headers per status group |
| Keep from AcademyOS | Real priority data, real category labels, real urgency, no fake completion %, priority_rank drives ordering |
| Required changes | Add visual progress bar per mission (use urgency/rank as proxy — no fake %). Add evidence required text from gate count. Add "locked" visual treatment for lower-ranked missions. Add section headers: Current Mission / Next Mission / Future Missions. |
| Data needed | Gate requirements from `curriculum_gates` to show "X observations needed" as evidence requirement |
| Safety notes | No fake % progress. No completion badges triggered automatically. |
| Priority | HIGH |

### Mission Detail

| Item | Detail |
|---|---|
| Prototype page | Mission Detail — `MissionDetail.tsx` |
| AcademyOS route | `/player/missions/[priorityId]` |
| Match score | 7 / 10 |
| Keep from prototype | Section cards: Mission Goal, Why It Matters, What To Do, Coach Watch-For, How To Know You Improved, Evidence Needed — each with icon, color, prose |
| Keep from AcademyOS | Real priority title/description, real category, static coaching content keyed to category, no raw coach notes, real gate evidence tracking |
| Required changes | Add "Coach Watch-For" section (currently missing — derive from category-specific coaching language). Add "Evidence Needed" section with gate progress bars. Upgrade card visual to match prototype gradient/glow header. |
| Data needed | Curriculum gate statuses from `player_curriculum_gate_statuses` to show evidence progress bars |
| Safety notes | No raw coach notes. "Coach Watch-For" must use static curriculum language, not stored observations. |
| Priority | HIGH |

### Skill Path

| Item | Detail |
|---|---|
| Prototype page | Skill Path — `SkillPath.tsx` |
| AcademyOS route | `/player/skill-path` |
| Match score | 6 / 10 |
| Keep from prototype | 6 skill areas (Forehand/Backhand/Serve/Volley/Movement/Preparation), sub-components (Preparation/Contact/Finish), status chips (Strong/Active Focus/Developing), progress bars per area, current note text |
| Keep from AcademyOS | Real observation count-based status derivation, real active focus from priorities, real curriculum level name, no fake % scores |
| Required changes | Upgrade card layout to match 2-column grid. Add sub-component chips. Derive progress bar from observation counts normalized to max reasonable obs count (e.g. 5 obs = 100%). Add overall progress summary card at top. |
| Data needed | Coach observation counts by domain already loaded |
| Safety notes | Show counts, not content of observations. |
| Priority | MEDIUM |

### Competition Path

| Item | Detail |
|---|---|
| Prototype page | Competition Path — `CompetitionPath.tsx` |
| AcademyOS route | `/player/competition-path` |
| Match score | 5 / 10 |
| Keep from prototype | Current focus highlight card (gradient, larger text, current focus tip), competition skills grid (Rally Decisions / Target Choice / Scoring Awareness / Pressure Response / Match Routines / Tournament Readiness), focus badge on active skill, overall progress bar |
| Keep from AcademyOS | Real active priority as competition focus, real category derivation, no fake match results |
| Required changes | Add current focus highlight card with gradient matching prototype. Add competition skill grid with 6 items mapped to AcademyOS competition domain data. Add focus badge on active item. |
| Data needed | Competition domain observation counts from `coach_observations` |
| Safety notes | No match results, no rankings, no external tournament data |
| Priority | MEDIUM |

### Fitness Path

| Item | Detail |
|---|---|
| Prototype page | Fitness Path — `FitnessPath.tsx` |
| AcademyOS route | `/player/fitness-path` |
| Match score | 5 / 10 |
| Keep from prototype | Circle SVG progress rings per fitness area, 7 fitness areas (Mobility/Coordination/Speed/Agility/Strength/Recovery/Tennis Transfer), focus highlight card, at-home guidance, overall ring |
| Keep from AcademyOS | Real focus area from active priorities, static drills by category, safety-appropriate content |
| Required changes | Add circle SVG progress component. Map 7 fitness areas to AcademyOS data. Add focus highlight card. Add tennis transfer explanation. |
| Data needed | Fitness observation counts from `coach_observations` |
| Safety notes | No overtraining claims, no intensity prescriptions |
| Priority | MEDIUM |

### Level Up

| Item | Detail |
|---|---|
| Prototype page | LevelUp — `LevelUp.tsx` |
| AcademyOS route | `/player/level-up` |
| Match score | 7 / 10 |
| Keep from prototype | Current level vs. next level side-by-side comparison card with gradient + progress bar, requirement list with check/circle icons, "done" vs. "not done" states, percentage completion |
| Keep from AcademyOS | Real gate data from `curriculum_gates`, real gate statuses, real level names, coach approval as a gate item |
| Required changes | Add side-by-side current→next level comparison card at the top. Add overall progress bar (gates_passed / gates_total). Upgrade requirement row layout to match prototype. |
| Data needed | `player_curriculum_gate_statuses` to show real done/not-done state |
| Safety notes | Never show automatic level movement. Coach approval must remain a listed gate. |
| Priority | HIGH — this is a key trust signal for players |

### Practice Home

| Item | Detail |
|---|---|
| Prototype page | PracticeHome — `PracticeHome.tsx` |
| AcademyOS route | `/player/practice` |
| Match score | 7 / 10 |
| Keep from prototype | Drill checklist keyed to mission category, numbered drill items, duration labels, session progress indicator |
| Keep from AcademyOS | Real category from active priorities, PracticeChecklist client component, no DB writes |
| Required changes | Add duration labels to each drill item. Add session header showing active mission category. Minor layout polish. |
| Data needed | None — static drills by category |
| Safety notes | No session logging without coach observation. Checklist is local state only. |
| Priority | LOW |

### Celebration

| Item | Detail |
|---|---|
| Prototype page | Celebration — `Celebration.tsx` |
| AcademyOS route | `/player/celebration` |
| Match score | 2 / 10 |
| Keep from prototype | Badge display, achievement name, next mission reveal, motivating copy |
| Keep from AcademyOS | Safety note that celebration is director-triggered, no auto-completion |
| Required changes | Build celebration view with badge and next mission reveal. Wire trigger from director-confirmed mission complete (proposed_actions pipeline). |
| Data needed | Mission completion event from `proposed_actions` or `audit_logs` |
| Safety notes | Never auto-trigger. Director must mark complete. No fake badges. |
| Priority | LOW — build after core paths |

### Ask DONNA (Player)

| Item | Detail |
|---|---|
| Prototype page | AskDonna — `AskDonna.tsx` |
| AcademyOS route | `/player/ask-donna` |
| Match score | 8 / 10 |
| Keep from prototype | Chip-based question selection, DONNA identity header, response display area, context-aware copy |
| Keep from AcademyOS | 7 chips with context-aware responses, real mission title/category injected, no external AI, safety note |
| Required changes | Minor visual polish: match prototype DONNA header treatment. Ensure chips wrap correctly on mobile. |
| Data needed | None — context injected server-side |
| Safety notes | No external AI calls. No raw coach notes in responses. |
| Priority | LOW — already close |

---

## 5. Parent Portal Page-by-Page Parity Table

### Home

| Item | Detail |
|---|---|
| Prototype page | Home — `Home.tsx` |
| AcademyOS route | `/parent` |
| Match score | 6 / 10 |
| Keep from prototype | Child snapshot hero card (name/level/progress bar/"On track"/summary/3 stats/recommended action), 4 path cards grid, 2 action cards (Request Lesson / Message Academy), coach-approved note at bottom |
| Keep from AcademyOS | Real IDP data, real level name, real attendance, real lesson request status, sanitized coach language, approved_data_note, parent support guide, lesson request inline |
| Required changes | Upgrade hero snapshot card to match prototype (gradient left border, progress bar, 3-stat grid, recommended action row). Reorganize home to match: snapshot hero → path grid → action cards → safety note. Deduplicate IDP cards that can move to dedicated path pages. |
| Data needed | All currently loaded |
| Safety notes | All sanitized. No raw notes. Approved data only. |
| Priority | HIGH |

### Development Snapshot

| Item | Detail |
|---|---|
| Prototype page | Snapshot — `Snapshot.tsx` |
| AcademyOS route | `/parent/development` + `/parent/progress` (split across two tabs) |
| Match score | 4 / 10 |
| Keep from prototype | Level card (current/next), progress bar, last assessment date, 2 active priorities, coach-approved summary note, what to say after practice |
| Keep from AcademyOS | Real level, real priorities (sanitized), real last assessment date, parent safety rules, sanitized coach language |
| Required changes | Consolidate into a single "Development Snapshot" view or ensure the Home hero card covers it. The current split across Development + Progress tabs makes it hard to match prototype's unified snapshot experience. |
| Data needed | All currently loaded |
| Safety notes | No ranking. No comparisons. Sanitized only. |
| Priority | HIGH |

### Skill Path (Parent)

| Item | Detail |
|---|---|
| Prototype page | SkillPath — `SkillPath.tsx` (parent) |
| AcademyOS route | NOT IMPLEMENTED as dedicated page |
| Match score | 2 / 10 |
| Keep from prototype | Current skill focus, what improving, why it matters, evidence collected summary, practice recommendation, what parents should notice |
| Keep from AcademyOS | Real coach language fields (doing_well, working_on, current_focus) already sanitized |
| Required changes | Create `/parent/skill-path` page. Use sanitized `coachLangCurrentFocus`, `coachLangWorkingOn`, `coachLangDoingWell` to populate. Add "What Parents Should Notice" section. |
| Data needed | All already loaded in parent home — share data adapter |
| Safety notes | No raw observations. No technique prescriptions. Parent-observation guidance only. |
| Priority | HIGH |

### Competition Path (Parent)

| Item | Detail |
|---|---|
| Prototype page | CompetitionPath — `CompetitionPath.tsx` (parent) |
| AcademyOS route | NOT IMPLEMENTED as dedicated page |
| Match score | 2 / 10 |
| Keep from prototype | Tactical focus, situational awareness, match behavior, competition readiness note, "next readiness guidance" |
| Keep from AcademyOS | Real competition focus from active priorities, real readiness guidance from curriculum |
| Required changes | Create `/parent/competition-path` page. Populate from active competition-category priorities. Add "next competition readiness" guidance from curriculum coach language. |
| Data needed | Active competition priority and curriculum coach language |
| Safety notes | No tournament advice. No comparison to other players. |
| Priority | MEDIUM |

### Fitness Path (Parent)

| Item | Detail |
|---|---|
| Prototype page | FitnessPath — `FitnessPath.tsx` (parent) |
| AcademyOS route | NOT IMPLEMENTED as dedicated page |
| Match score | 2 / 10 |
| Keep from prototype | Movement focus, mobility focus, tennis transfer explanation, at-home suggestion, readiness note |
| Keep from AcademyOS | Parent support guide at-home content (already in parentSupportGuide), sanitized fitness language |
| Required changes | Create `/parent/fitness-path` page. Populate from parentSupportGuide (atHomeSupportIdea) + sanitized coach language. |
| Data needed | parentSupportGuide already built |
| Safety notes | No intensity prescriptions. "Keep it fun" framing. No training load claims. |
| Priority | MEDIUM |

### Next Steps

| Item | Detail |
|---|---|
| Prototype page | NextSteps — `NextSteps.tsx` |
| AcademyOS route | NOT IMPLEMENTED as dedicated page (content scattered in Home + Development) |
| Match score | 4 / 10 |
| Keep from prototype | "Best Support This Month" numbered list, optional home practice card, when to request lesson guidance, what not to over-focus on |
| Keep from AcademyOS | parentSupportGuide (whatToPraise, atHomeSupportIdea, avoidOvercoaching, whenToAskCoach) — maps almost 1:1 to prototype sections |
| Required changes | Create `/parent/next-steps` page. Pull from parentSupportGuide. Map: whatToPraise → "What to Praise This Month", atHomeSupportIdea → "Optional Home Practice", avoidOvercoaching → "What Not to Over-Focus On", whenToAskCoach → "When to Request a Lesson". |
| Data needed | parentSupportGuide already built — no new data needed |
| Safety notes | "Optional" framing throughout. No pressure language. |
| Priority | HIGH — this is the parent's most actionable page |

### Request Lesson

| Item | Detail |
|---|---|
| Prototype page | RequestLesson — `RequestLesson.tsx` |
| AcademyOS route | Inline `PrivateLessonRequestCard` on `/parent` page |
| Match score | 5 / 10 |
| Keep from prototype | Form fields: focus area, preferred day, preferred time, lesson type, notes. Navigates to coach selection on submit. |
| Keep from AcademyOS | `requestPrivateLessonAction.ts` writes to `proposed_actions` (correct pipeline), status tracking, safety note that academy reviews before confirming |
| Required changes | Extract inline card into `/parent/request-lesson` standalone page. Add lesson type selector. Wire to coach recommendation step. |
| Data needed | Lesson types static list. Coach list from `profiles`. |
| Safety notes | Must write to `proposed_actions`, not direct booking. No schedule mutation. |
| Priority | MEDIUM |

### Coach Selection

| Item | Detail |
|---|---|
| Prototype page | CoachSelection — `CoachSelection.tsx` |
| AcademyOS route | NOT IMPLEMENTED |
| Match score | 1 / 10 |
| Keep from prototype | Coach card with specialty, "why recommended" reason tied to player's current focus, availability, lesson types, recommended badge on best match |
| Keep from AcademyOS | Coach profiles from `profiles` table |
| Required changes | Build `/parent/coach-selection` page. Load coach profiles with roles. Match coach specialty to player's current priority category for "why recommended" copy. Route to confirmation on selection. |
| Data needed | `profiles` with `display_name` and role/specialty fields |
| Safety notes | No booking, no scheduling, no calendar writes. Recommendation only. |
| Priority | LOW |

### Confirmation

| Item | Detail |
|---|---|
| Prototype page | Confirmation — `Confirmation.tsx` |
| AcademyOS route | Status card on `/parent` (lesson request status) |
| Match score | 3 / 10 |
| Keep from prototype | Confirmation checkmark, lesson details summary, "what happens next" explanation, coach-approved note |
| Keep from AcademyOS | `proposed_actions` status tracking, parent-safe status labels |
| Required changes | Build `/parent/confirmation` page shown after lesson request submission. Show submitted details, status badge, "your director will follow up" note. |
| Data needed | latest `proposed_actions` row for this parent |
| Safety notes | No scheduling confirmation language. "Submitted for review" framing only. |
| Priority | LOW |

### Message

| Item | Detail |
|---|---|
| Prototype page | Message — `Message.tsx` |
| AcademyOS route | `/parent/updates` (different purpose — shows announcements, not outbound messages) |
| Match score | 2 / 10 |
| Keep from prototype | Free-text message form with subject, textarea, send button |
| Keep from AcademyOS | Updates page shows `player_development_summary where show_to_parent = true` — keep this, it is distinct |
| Required changes | Decide: add a "Message Academy" form that writes to `proposed_actions` with `target_module: 'parent_message'` — OR — document that parent messaging is out of scope for V1 and the Updates page covers inbound communication. Recommend V1: deprioritize outbound messaging. |
| Data needed | `proposed_actions` pipeline already exists |
| Safety notes | No direct sends. All messages must go through review queue. |
| Priority | LOW — deprioritize for V1 |

### Ask DONNA (Parent)

| Item | Detail |
|---|---|
| Prototype page | DonnaPanel — in `PortalLayout.tsx` (persistent right panel) |
| AcademyOS route | `/parent/ask-donna` |
| Match score | 7 / 10 |
| Keep from prototype | Quick action chips, free-text input, response display area, "academy-approved response required" disclaimer on custom questions |
| Keep from AcademyOS | 6 chips with context-aware responses, real child name/category injected, no external AI, safety language |
| Required changes | Match prototype: add "Academy-approved response required" disclaimer on custom input. Consider adding DONNA to a persistent panel position on parent desktop layout. |
| Data needed | None — context injected server-side |
| Safety notes | No external AI. No promise of real-time answers. Custom questions: "noted for review" framing only. |
| Priority | MEDIUM |

---

## 6. Shared Data Requirements

The following data adapter powers both portals. All fields are already available in the current data model.

| Field | Source | Player uses | Parent uses |
|---|---|---|---|
| player_id | `players.id` via `profile_id` link | Yes | Yes (via guardian chain) |
| player_first_name | `players.first_name` | Yes | Yes |
| academy_id | `profiles.academy_id` | Yes | Yes |
| current_level_name | `curriculum_levels.display_name` | Yes | Yes |
| current_level_stage | `curriculum_levels.stage` | Yes | Yes |
| next_level_name | `curriculum_levels` ordered by `sort_order` | Yes | Yes |
| ball_level | `curriculum_levels.stage` / mapped | Yes | Yes |
| active_priorities | `player_priorities` where `is_active = true` | Yes | Yes (sanitized) |
| current_focus_domain | `player_priorities.category` (rank 1) | Yes | Yes (sanitized) |
| coach_language | `curriculum_coach_language` all fields | Yes (player-safe fields only) | Yes (sanitized via `sanitizeParentFacingText`) |
| skill_path_progress | `coach_observations` counts by domain | Yes (counts only) | No |
| competition_path_progress | `coach_observations` where domain = tactical/competition | Yes (counts only) | No |
| fitness_path_progress | `coach_observations` where domain = fitness/movement | Yes (counts only) | No |
| missions / priorities | `player_priorities` ordered by `priority_rank` | Yes | Yes (title + category only) |
| gate_requirements | `curriculum_gates` where `from_level_id = current_level_id` | Yes | No |
| gate_statuses | `player_curriculum_gate_statuses` | Yes (done/not done) | No |
| parent_safe_summary | `player_development_summary.parent_summary` where `show_to_parent = true` | No | Yes |
| coach_approved_flag | `player_development_summary.show_to_parent` | No | Yes (gate) |
| attendance_rate | `session_attendance` aggregated | Yes (own sessions) | Yes (child's sessions) |
| lesson_request_status | `proposed_actions` where `target_module = parent_lesson_request` | No | Yes |
| parent_support_guide | `buildParentSupportGuide()` | No | Yes — already implemented |
| next_level_requirements | `curriculum_gates` | Yes | No |
| session_history | `sessions` + `session_attendance` | Yes | Yes |

---

## 7. Parent Safety Rules

These rules are non-negotiable and must be enforced at the data layer, not just the UI layer.

- **Approved data only.** Every piece of content shown to parents must come from `player_development_summary where show_to_parent = true`, or from sanitized `curriculum_coach_language` fields. Never show unsanitized strings.
- **No raw coach notes.** `coach_observations.notes`, `coach_notes.content`, internal director notes — none of these may appear in any parent view.
- **No internal director notes.** `audit_logs`, `proposed_actions.reasoning`, director dashboard data — none visible to parents.
- **No rankings.** No comparison of the child to other players in the academy. No position in group. No relative assessment language.
- **No comparisons.** No "above average" or "below average" language. No peer benchmarks.
- **No unapproved AI interpretations.** DONNA responses must be static or template-based. No external AI API calls. No AI-generated content presented as coaching guidance without explicit director approval.
- **No automatic sends.** Lesson requests go to `proposed_actions`, not to coaches or external calendars. No email or SMS triggered automatically.
- **No automatic booking.** No schedule write. No calendar mutation. No slot reservation.
- **No billing.** No payment processing, no invoice display, no fee discussion in any portal page.
- **No unapproved level movement claims.** Do not tell a parent their child is "ready to advance" or "approaching next level" unless director has marked `advancement_eligible = true`. Progress bars must come from real gate data, not estimated percentages.

---

## 8. Player Safety Rules

- **Mission-based language only.** All player-facing content must be tied to active priorities or curriculum level goals. No internal assessment score language.
- **Motivating but not childish.** Language should be athlete-appropriate: "Recover to the T" not "Good job!" Generic praise feels patronizing to competitive players.
- **No internal staff notes.** `coach_observations.notes`, director notes, internal IDP fields — never shown to players.
- **No parent-only messages.** Parent summary text, `show_to_parent` content — never shown in player portal even if it seems positive.
- **No fake completion.** Mission complete badge and celebration screen must only trigger on director confirmation via `proposed_actions` or `audit_logs`. Never based on UI-local state alone.
- **No unapproved level movement.** Level-up page must show "Coach confirms readiness" as a required gate item that is always shown as pending until director marks it done.
- **No private director notes.** Anything written by directors in the command center is off-limits in the player portal.

---

## 9. What Should Match Almost Identically

These prototype elements should be replicated as closely as possible in AcademyOS (using AcademyOS design tokens, not prototype colors):

| Element | Prototype treatment | AcademyOS translation |
|---|---|---|
| Player Home hero card | Gradient background, lime-border glow, mission quote in large text, progress bar from current level to next, streak badge, "Continue Mission" CTA | Same structure. Replace teal with `lime`. Use `bg-surface border-lime/25` for gradient. Mission text from active priority title. Level progress from `gates_passed / gates_total`. |
| Path card grid | 6 cards, 2-col grid (3-col on wide), icon + label + progress bar, hover lift | Expand from 4 to 6 cards. Add Level Up and Practice. Use `btn-ghost` hover. Keep lime accent. |
| Mission Map status treatment | ACTIVE (teal), NEXT UP (purple), FUTURE (muted/locked), COMPLETED (gold) | ACTIVE: lime. NEXT: status-blue. FUTURE: muted/locked. COMPLETED: status-green. |
| Mission card progress bar | Thin bar with glow on active mission | `bg-lime` bar with `shadow-[0_0_6px_rgba(200,255,0,0.4)]` on active. |
| Mission Detail section cards | Icon + color + label heading, prose body, distinct card per section | Match exactly. Sections: Mission Goal / Why It Matters / What To Do / Coach Watch-For / How To Know / Evidence Needed. |
| Skill area card | Name + sub-components as chips + status badge + progress bar + note | Match structure. Use AcademyOS `StatusBadge`. Use `bg-surface-raised` cards. |
| Fitness circle progress | SVG circle with stroke-dashoffset animation | Implement `CircleProgress` SVG component. `stroke: text-lime` for active, domain color for others. |
| Level Up comparison card | Current level | Next level side by side, dashed border on next, overall progress bar | Match structure exactly. Use `border-dashed border-lime/40` for next level. |
| Parent Home hero snapshot card | Left lime border, gradient bg, child name + level + progress + summary + 3 stats + recommended action | Match structure. Use `border-l-2 border-lime` + `bg-surface`. Real data from IDP. |
| Parent NextSteps page | Numbered support list + optional home practice card + what not to do | Match structure. Pull from `parentSupportGuide`. |
| Parent DONNA panel | Right-fixed panel on desktop, bottom sheet on mobile | On parent desktop layout: consider adding fixed right panel. On mobile: button launches bottom sheet. |
| Mobile nav | Bottom tabs (player: 3, parent: 5) | Keep. BottomTabBar is correct for mobile. |

---

## 10. What Must Intentionally Differ

| Element | Prototype | AcademyOS intentional difference |
|---|---|---|
| Accent color | Teal `oklch(0.76 0.14 175)` / aqua | `lime` (`#C8FF00`) — AcademyOS design system, non-negotiable |
| Progress percentages | Static hardcoded values (62%, 68%, etc.) | Real data: gates_passed / gates_total. Never fake. Show "N/A" if no gate data exists. |
| Footer | "Powered by AnglesOS" | "Powered by AcademyOS" |
| Font | Barlow Condensed + Space Grotesk | Inter + JetBrains Mono — no custom font changes |
| DONNA | Prototype implies potential real AI ("AI-Powered" badge) | Static/template only. Remove "AI-Powered" badge. Add "Coach-guided responses" instead. |
| Lesson request | Prototype navigates to CoachSelection → Confirmation (implies real booking) | Writes to `proposed_actions`. Label: "Request submitted — your director will follow up." No scheduling confirmation. |
| Level movement language | Prototype shows "62% to next level" as if guaranteed | AcademyOS: "X of Y requirements met" based on real gate data. Director must confirm. |
| Parent Skill/Competition/Fitness path data | Static data from `data.ts` | Real sanitized coach language + curriculum data. Content may be sparse if coach language not yet entered. |
| Class and curriculum labels | Prototype uses generic "Orange Ball 2 / Orange Ball 3" | AcademyOS uses real `curriculum_levels.display_name` values from the academy's curriculum spine. |
| Parent portal safety | Prototype shows "62% progress" as fact | AcademyOS: "On track" language only. Progress bar if gate data exists. "In development" if not. |

---

## 11. Sprint Plan Recommendation (Sprints 396–410)

| Sprint | Title | Scope | Outcome |
|---|---|---|---|
| 396 | Player Portal Shell + Nav Upgrade V1 | Add Skill Path, Competition Path, Fitness Path, Level Up, and Practice to player nav (expand BottomTabBar to 5 tabs or add secondary nav links from home). Update home path cards from 4 to 6. | All player pages reachable from nav |
| 397 | Player Hero Card Visual Upgrade V1 | Upgrade `PlayerHomeHeroCard` to match prototype: gradient border glow, level progress bar (gates_passed/gates_total), current mission as hero quote, "Continue Mission" CTA button. | Hero card matches prototype pattern |
| 398 | Player Mission Map Gamification V1 | Upgrade `/player/missions`: add status section headers, progress indicator per mission, locked visual treatment for future missions, evidence text from gate requirements. | Mission Map matches prototype gamification pattern |
| 399 | Player Mission Detail Visual Upgrade V1 | Add "Coach Watch-For" and "Evidence Needed" sections to `/player/missions/[priorityId]`. Add progress bars for gate evidence. Upgrade card visual to prototype section card pattern. | Mission Detail matches prototype richness |
| 400 | Player Skill + Competition Path Visual V1 | Upgrade `/player/skill-path` (2-col grid, sub-component chips, progress bars, overall summary card) and `/player/competition-path` (current focus highlight, skills grid). | Skill and Competition paths match prototype |
| 401 | Player Fitness Path + Level Up Visual V1 | Add SVG circle progress to `/player/fitness-path`. Upgrade `/player/level-up` with current→next comparison card + gates progress bars. | Fitness and Level Up match prototype |
| 402 | Player Celebration V1 | Build `/player/celebration` — badge display, next mission reveal. Wire trigger from `proposed_actions` where `action = mission_complete`. | Celebration page functional |
| 403 | Parent Shell + Home Snapshot Upgrade V1 | Upgrade parent Home hero card to match prototype snapshot card. Reorganize parent Home: snapshot hero → path grid (4 cards including Next Steps) → action cards → safety note. Add DONNA right panel stub on desktop. | Parent Home matches prototype pattern |
| 404 | Parent Skill + Competition + Fitness Pages V1 | Create `/parent/skill-path`, `/parent/competition-path`, `/parent/fitness-path` using sanitized coach language and parentSupportGuide data. Each page: focus → why it matters → evidence summary → what parents should notice. | Three missing parent path pages built |
| 405 | Parent Next Steps Dedicated Page V1 | Create `/parent/next-steps` page pulling from `parentSupportGuide`. Sections: Best Support This Month / Optional Home Practice / What Not to Over-Focus On / When to Request a Lesson. | Parent NextSteps page matches prototype |
| 406 | Parent Lesson Request Flow V1 | Extract `PrivateLessonRequestCard` into `/parent/request-lesson` standalone page. Add lesson type selector. Add `/parent/coach-selection` page with coach cards and "why recommended" copy. Route to confirmation. | Lesson request flow matches prototype 3-step pattern |
| 407 | Portal Data Integration QA V1 | Audit all portal pages: confirm empty states gracefully handle missing curriculum data, missing priorities, missing coach language. Add loading states. Verify parent safety filter is active on every parent page. | No broken states, no data leaks |
| 408 | Mobile QA V1 | Test all player and parent pages on mobile viewport. Fix nav overlap, card overflow, DONNA chip wrapping. Confirm BottomTabBar safe area. | Mobile experience matches design intent |
| 409 | Role Safety Final Audit V1 | Run role-permission-guard checklist. Confirm player cannot access parent routes, parent cannot access player routes, director preview does not contaminate live data, DONNA never shows raw coach notes. | Role safety sign-off |
| 410 | Prototype Parity Final Audit V1 | Re-run this audit against the prototype. Score each page again. Document final parity. Confirm data is real, not demo. | Parity audit complete before pilot |

---

## 12. Final Recommendation

**Build player first or parent first?**
Build **player first**. The player portal is closer to parity (5/10 vs 4/10), all pages exist, and the visual upgrades are additive rather than structural. Parent portal requires new pages to be created from scratch (3 dedicated path pages, NextSteps, multi-step lesson flow). The player experience also directly validates the data adapter before parent portal uses the same data. Additionally, Brian Dabul's pilot demo will likely include a player-facing demonstration.

**How many sprints until both look prototype-matched?**
Approximately 15 sprints (396–410) to reach prototype visual parity with real data and safety rules intact. This assumes 1 sprint per day at the current pace.

**What is the next exact sprint?**
**Sprint 396 — Player Portal Shell + Nav Upgrade V1**

Scope: Expand the player BottomTabBar from 3 tabs to 5 tabs (add Skill Path and Level Up). Add Practice and Celebrate links from the home path card grid. Update home path grid from 4 to 6 cards. No new page creation — all pages already exist. This makes the full player portal discoverable for the first time and is a prerequisite for all visual upgrade sprints.

---

## Safety and Audit Notes

- Both portal zips extracted to `/tmp/academyos-player-portal-audit/` and `/tmp/academyos-parent-portal-audit/` — not staged, not committed.
- `prototype-reference/` directory not staged.
- `data/player-import/academy_os_player_import_roster.csv` not staged.
- No prototype code was copied into AcademyOS source.
- No app UI changes were made in this sprint.
- No migrations, schema changes, or package changes.
