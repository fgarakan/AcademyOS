# Parent Portal Prototype Alignment Audit

**Date:** 2026-05-19
**Prototype source:** `prototype-reference/academyos-parent-portal.zip` (extracted to `/tmp` only — not staged)
**Audit scope:** Information architecture and workflow extraction from 10 prototype screens
**Purpose:** Identify which IA patterns to adopt, which to reject, and what safety guardrails apply to each

---

## How to use this document

This audit is **IA-only**. It extracts workflow and information architecture from the prototype and maps each element against AcademyOS safety rules, existing implementation, and platform conventions. No code, styles, fonts, routing, or UI components are borrowed from the prototype.

---

## Prototype screens reviewed

| Screen | File | Flow position |
|---|---|---|
| Home | `Home.tsx` | Entry point |
| Snapshot | `Snapshot.tsx` | Child overview detail |
| Skill Path | `SkillPath.tsx` | Technical development view |
| Competition Path | `CompetitionPath.tsx` | Tactical development view |
| Fitness Path | `FitnessPath.tsx` | Movement & fitness view |
| Next Steps | `NextSteps.tsx` | Parent action guide |
| Request Lesson | `RequestLesson.tsx` | Lesson request form |
| Coach Selection | `CoachSelection.tsx` | Coach chooser step |
| Confirmation | `Confirmation.tsx` | Request submitted state |
| Message | `Message.tsx` | DONNA-assisted Q&A |

---

## Current state of `/parent` portal

The existing portal (`src/app/parent/page.tsx`) is a single scrollable page with:
- Level card (current + next level)
- `ParentSafeProgressPreview` — doing well, working on, next step
- IDP parent view — why it matters, how to support, what to say after practice, what not to over-focus on
- Parent Support Guide — praise, at-home idea, practice language, avoid overcoaching, when to ask coach
- Session Consistency — attendance over 60 days with recent session list
- Latest Coach Update — empty state
- Messages & Updates — empty state
- Private Lesson Request Card + most-recent request status

All data passes through `parentSafeResponseRules.ts` and the `buildRoleSpecificIdpView` parent filter. The architecture is sound. The gap is **navigation structure and content depth per topic**.

---

## Screen-by-screen IA extraction

### Screen 1 — Home

**Prototype IA:**
- Welcome header with child's name
- Hero snapshot card (child name + level badge, progress to next level label, coach-approved summary, 3-stat grid, recommended action strip)
- 4 path cards: Skill Path / Competition Path / Fitness Path / Next Steps
- 2 action cards: Request Private Lesson / Message the Academy
- Coach-approved footer note with last-updated date

**What to adopt:**
- Navigation structure: path cards as entry points into sub-views (Skill, Competition, Fitness, Next Steps). The current single-scroll page should evolve into a hub + sub-pages model.
- Hero card concept: a single above-the-fold card showing child name, current level, and coach-approved summary is better IA than the current scattered card stack.
- 3-stat grid (Current Focus, Attendance, Sessions This Month) — good summary pattern, all three fields already exist in the data layer.
- "All information reviewed and approved by coaching team" footer note — currently exists as `parentView.approved_data_note` and should remain visible on every path view, not just the home.
- Two-action layout: Request Lesson + Message Academy — both already partially built, improved surfacing is warranted.

**What NOT to adopt:**
- Hardcoded progress percentage (62% in prototype) — progress to next level cannot be a percentage unless the director has explicitly set advancement milestones. Never infer or auto-calculate this for parents.
- "On track" status label next to progress bar — this is a level-movement claim. Only show if director has approved a readiness signal.
- "Recommended:" action strip on the hero card — must come from `player_priorities.parent_message` or a director-approved recommendation object, never from AI inference alone.

---

### Screen 2 — Snapshot

**Prototype IA:**
- Level card: current level (large), next level (right-aligned), progress bar, descriptive progress sentence
- Main Priority card + Secondary Priority card (side by side)
- Evidence Summary card
- Coach-Approved Progress Note (labeled with checkmark icon)
- Stats grid: Last Assessment date, Attendance rate, Sessions this month
- CTA: Request a Private Lesson

**What to adopt:**
- Dedicated snapshot sub-view with level + priorities in one place. Currently these are scattered across the home page card stack.
- Main Priority + Secondary Priority displayed as two sibling cards — maps to `player_priorities` (already queried, limit 3).
- Evidence Summary section — maps to the evidence timeline already built in the director profile. A parent-safe distillation of this (from `player_development_summary` where `show_to_parent = true`) belongs here.
- Coach-Approved Progress Note with explicit checkmark provenance label — this is the right pattern. The label must be literal ("Reviewed by coaching team") not implied.
- Stats grid: Last Assessment date is safe; attendance rate is safe (already shown in current portal); sessions this month is safe.

**What NOT to adopt:**
- Raw numeric progress percentage on the level card — same concern as Home. Omit unless director has set a milestone indicator.
- "Making steady progress toward [next level]" auto-generated language — this is a level-movement claim. Use curriculum coach language fields (`coach_language_current_focus`) instead of generated copy.
- Evidence Summary must not expose coach observation text, internal assessment scores, or comparative language. Only `player_development_summary` rows with `show_to_parent = true` are safe.

---

### Screen 3 — Skill Path

**Prototype IA:**
- Header: "Technical Development — what [child] is working on technically and how you can help"
- Hero card: Current Skill Focus (large text from coach language), descriptive what-improving sentence
- 4 info cards:
  - Why It Matters
  - Evidence Collected
  - Practice Recommendation
  - What Parents Should Notice
- Navigation row: → Competition Path | Request Lesson

**What to adopt:**
- Dedicated Skill Path sub-view is a clear improvement. Currently "Why It Matters" and "How to Support" are on the home page without a skill-specific framing.
- Current Skill Focus hero card — maps to `curriculum_coach_language.current_focus`, already sanitized.
- Why It Matters — already in `parentView.why_it_matters`, just needs its own page context.
- Practice Recommendation — maps to `curriculum_coach_language.next_step` or `parentSupportGuide.atHomeSupportIdea`.
- What Parents Should Notice — new field for the parent portal. Should be sourced from a director-approved field, not AI-generated. Good candidate for a new `curriculum_coach_language` column: `parent_observation_guidance`.
- Sequential navigation across the four path views is good UX — breadcrumb/next-path links.

**What NOT to adopt:**
- "Evidence Collected" on the parent-facing skill path view is risky. If it exposes raw coach observations or internal session notes, it violates the safety model. Only show this section if sourced from `player_development_summary` rows with `show_to_parent = true`. Do not surface `coach_notes` or internal observation text here.
- Do not label this section "Evidence Collected" for parents — reframe as "What the coaches have observed" or "Progress highlights" to avoid clinical/internal language.

---

### Screen 4 — Competition Path

**Prototype IA:**
- Header: "Tactical Development — how [child] is developing decision-making and match awareness"
- Hero card: Current Tactical Focus with a coach-voice italic note
- 4 info cards:
  - Situational Awareness
  - Decision-Making Theme
  - Match Behaviour Focus
  - Recent Competition Note
- Next Tournament / Match Readiness guidance card
- Navigation row: → Fitness Path | Request Lesson

**What to adopt:**
- Dedicated Competition Path sub-view — the current portal has no competition-focused parent view. This is a genuine gap.
- Tactical Focus framing (decision-making, awareness) is parent-safe and aligns with the platform's coaching language model.
- Match Behaviour Focus — maps to coach guidance on how to behave at/after matches; good parent-safe content.
- Situational Awareness and Decision-Making Theme — both can be sourced from curriculum coach language or director-approved competition notes.
- Next Tournament / Match Readiness guidance — safe if sourced from director-approved content, not AI-generated.

**What NOT to adopt:**
- UTR scores, win/loss records, or player rankings must never appear on this page. The competition path is about tactical development language only.
- "Recent Competition Note" must be a director/head-coach approved field, not a raw coach note or auto-generated AI summary. Do not create a new field for this without explicit sprint authorization and RLS.
- Do not show match results, opponent names, or tournament outcomes to parents. Internal competitive data stays internal.
- No comparative language ("better than peers," "ranked among academy players").

---

### Screen 5 — Fitness Path

**Prototype IA:**
- Header: "Movement & Fitness — how [child] is developing physically and how you can support"
- Hero card: Current Movement Focus with italic context note
- 4 info cards:
  - Mobility & Coordination Focus
  - Tennis Transfer (how movement work translates to court performance)
  - At-Home Support Suggestion
  - Readiness & Load Note
- Navigation row: → Next Steps | Request Lesson

**What to adopt:**
- Dedicated Fitness Path sub-view. Current portal has "At-Home Support Idea" buried in the support guide. A dedicated view with movement-specific context is an improvement.
- At-Home Support Suggestion — already in `parentSupportGuide.atHomeSupportIdea`.
- Readiness & Load Note — safe if sourced from a director-approved field. Maps conceptually to fatigue/load data available in the director profile but must be pre-approved before surfacing to parents.
- Tennis Transfer framing (how fitness work shows up in tennis) is excellent parent-safe language. Should be a curriculum coach language field.

**What NOT to adopt:**
- Readiness & Load Note must not expose raw fatigue scores or internal load metrics. Only a pre-approved parent-safe summary is acceptable.
- Do not auto-generate this section from session volume or intensity data. It must come from a director-reviewed source.

---

### Screen 6 — Next Steps

**Prototype IA:**
- Header: "How to Help [child] — simple, calm guidance for supporting development this month"
- Best Support This Month: numbered list (3–4 items)
- Optional Home Practice card
- When to Request a Private Lesson card
- When to Play Matches card
- What Not to Over-Focus On card
- CTAs: Ask the Academy | Request Lesson

**What to adopt:**
- Dedicated "How to Help" page consolidating all parent guidance into one actionable view. This is the best structural improvement in the prototype.
- Best Support This Month numbered list — already partially in `parentSupportGuide`. Structure as 3 numbered items from curriculum coach language.
- Optional Home Practice — maps to `parentSupportGuide.atHomeSupportIdea`.
- What Not to Over-Focus On — already in `parentView.what_not_to_over_focus_on` and `parentSupportGuide.avoidOvercoaching`.
- "When to Request a Private Lesson" guidance — new framing, good for surfacing when a private lesson makes sense. Source from a director-approved recommendation or curriculum language.
- "Ask the Academy" CTA — links into the Message flow.

**What NOT to adopt:**
- "When to Play Matches" must not be a blanket directive. Any competition readiness guidance must come from the coaching team, not be auto-generated based on session counts or level.
- Numbered list items must not be AI-generated at render time. They should be drawn from pre-approved curriculum fields or the support guide builder, which is already deterministic.

---

### Screen 7 — Request Private Lesson

**Prototype IA:**
- Player name (read-only, pre-filled)
- Development Focus (editable textarea, pre-filled from current priorities)
- Lesson Type selector (chip grid: Technical / Tactical / Physical / Mental / Match Play / Other)
- Preferred Coach (optional dropdown, "No preference — let AcademyOS suggest")
- Preferred Day (dropdown)
- Preferred Time (dropdown: Morning / Afternoon / Evening)
- Notes for Academy (optional textarea)
- Submit → goes to Coach Selection screen

**What to adopt:**
- Multi-step lesson request flow (form → coach selection → confirmation) is better UX than the current single-card form.
- Development focus pre-filled from player's current priorities is excellent — reduces cognitive load and keeps the request grounded in real coaching context.
- Lesson Type chip selector — adds useful context for the coaching team.
- Preferred Day + Time preference inputs — already partially in the current `requestPrivateLessonAction.ts` payload model.
- "No preference" as default coach option — respects that parents may not know which coach to request.
- Notes field — open text, goes to academy for review, not auto-acted upon.

**What NOT to adopt:**
- The flow must not auto-book or confirm a lesson at any point. Every step of the flow must reinforce that this is a request, not a booking.
- Coach list shown in the dropdown must be curated by the director, not pulled raw from the coaches table. Only coaches the director has marked as available for parent-requested lessons should appear.
- "AcademyOS will suggest the best coach options" language must not imply AI-based matching. The system surfaces options; the director approves the assignment.

---

### Screen 8 — Coach Selection

**Prototype IA:**
- List of coach cards with:
  - Avatar initials
  - Name
  - Role label
  - Specialty description
  - "Recommended" badge (for one coach)
  - Best Fit Reason (italic, in lime)
  - Available lesson types (pill chips)
  - Available times
- Select coach → confirm button
- "No booking confirmed until academy responds" disclaimer

**What to adopt:**
- Coach card display with name, role, specialty, and available lesson types — all safe for parents to see if the director has curated this.
- "No booking confirmed until academy responds" disclaimer — this exact language must appear in the AcademyOS implementation. Reinforce it visually.
- The select-then-confirm pattern (not an immediate booking) is the right model and matches the `proposed_actions` pipeline.

**What NOT to adopt:**
- "Recommended" badge must not be algorithmically assigned. It can only appear if the director has explicitly flagged a coach as recommended for this player/focus area.
- "Best Fit Reason" (the italic explanation of why this coach fits) must not be AI-generated at the time of the parent request. It must be a pre-written field from the director's coach profile setup.
- Do not expose coach internal ratings, observation counts, or any internal coaching performance metrics.
- Coach list must only show coaches the director has enabled for parent-facing lesson requests (requires a director-controlled flag on the coach/profile record).

---

### Screen 9 — Confirmation

**Prototype IA:**
- Large checkmark icon with success heading: "Request Submitted"
- Subtitle: "Your request has been sent to the academy for review. You'll hear back within 1–2 business days."
- Status badge: "Request sent for academy review" (orange/warm tone, clock icon)
- Request Summary table: Player / Coach Requested / Coach Role / Development Focus / Lesson Type / Day / Time
- Important Note: "This is a request, not a confirmed booking. The academy team will review availability and contact you to confirm."
- CTAs: Send a Message to the Academy | Back to Home

**What to adopt:**
- The "request, not a booking" language must be preserved verbatim or equivalently in the AcademyOS implementation.
- Status badge with review-state language — matches the `proposed_actions` status model (pending_review → approved → applied).
- Request summary table — shows the parent what was submitted; all fields are already in the `proposed_payload`.
- "You'll hear back within 1–2 business days" — honest expectation-setting; include this or equivalent.
- Dual CTA (message + home) is the right exit pattern.

**What NOT to adopt:**
- Do not show a "confirmed" or "booked" state at this screen. The confirmation is always "submitted for review," never "booked."

---

### Screen 10 — Message (DONNA-Assisted Q&A)

**Prototype IA:**
- Header: "Ask the Academy — ask a question about [child]'s development"
- Subtitle: "DONNA can help draft a response, which will be reviewed by the academy team"
- Common Questions: 5 preset question buttons (selectable)
- DONNA Draft Response panel: shows AI-generated answer with "Academy-approved response required" badge
- Fine print: "This is a DONNA-generated draft. The academy team will review and send an approved response."
- Custom message textarea (clears DONNA draft when edited)
- Send button → success state: "Message sent to the academy. The team will review and send an approved response within 1–2 business days."

**What to adopt:**
- Common question shortcuts are excellent UX for parents who don't know how to articulate their question.
- DONNA Draft Response as a preview to help the parent understand what kind of answer to expect — good framing, as long as it is clearly not the final answer.
- "Academy-approved response required" badge on DONNA content — this is the right trust signal and must be preserved.
- The fine print ("DONNA-generated draft — academy team will review") must be visible whenever DONNA content is shown to parents.
- Message sent → review pipeline model (never auto-sent to coach or parent).

**What NOT to adopt:**
- DONNA's response to the parent must never be sent automatically. It goes through the director review queue first.
- The prototype shows DONNA's response in the parent UI immediately on question select. In AcademyOS, this is only acceptable if it is framed as "a preview of the kind of answer the academy can provide" — not as a response that will be sent as-is.
- DONNA must not answer questions about level progression ("Are they ready for the next level?") with definitive language. The prototype's DONNA says "Her coaches are tracking the key indicators" — this is acceptable framing. Any language that implies AI has assessed readiness is not.
- Do not show parent questions or DONNA drafts to the coach or player portals.
- Parent messages must route to `proposed_actions` with `target_module = 'parent_message_request'` and `pending_review` status. Never bypass the review queue.

---

## Summary: what to add vs. what to block

### Add — IA patterns to implement in future sprints

| Feature | Source screen | Implementation notes |
|---|---|---|
| Sub-page navigation (path cards hub model) | Home | Replace single-scroll with hub + 4 sub-views. Use `BottomTabBar` or in-page navigation cards. |
| Hero snapshot card on home (name, level, summary, 3-stat grid) | Home | Already has level card + progress cards; consolidate into a single above-the-fold hero. |
| Dedicated Snapshot sub-page | Snapshot | Level + priorities + coach-approved note + attendance stats. All data already queried. |
| Dedicated Skill Path sub-page | SkillPath | Current focus, why it matters, at-home practice, what to observe. Sources: curriculum coach language. |
| Dedicated Competition Path sub-page | CompetitionPath | Tactical focus, match behaviour guidance, readiness note. Director-approved content only. |
| Dedicated Fitness Path sub-page | FitnessPath | Movement focus, tennis transfer framing, at-home support, readiness note. |
| Dedicated Next Steps / How to Help sub-page | NextSteps | Consolidate all support guidance (already in parentSupportGuide) into one actionable page. |
| Multi-step lesson request flow (form → selection → confirmation) | RequestLesson / CoachSelection / Confirmation | Replace single-card form with 3-step flow routed through `proposed_actions`. |
| "Request not a booking" language on every lesson request step | Confirmation | Enforce at form submit, coach selection, and confirmation screens. |
| Common questions shortcut bar in message flow | Message | 5 preset questions; parent selects, message goes to review queue. |
| DONNA preview panel on message screen (with review badge) | Message | DONNA drafts a preview for the parent's context, clearly labeled as unreviewed. Actual response comes after director approval. |
| "All information approved by coaching team" footer | Home | Already in `parentView.approved_data_note`; surface on every sub-page, not just home. |

### Do not add — blocked by safety rules

| Feature | Reason |
|---|---|
| Progress percentage to next level (e.g., "62%") | Level movement claim. Only show if director has set an explicit milestone indicator. Never auto-calculate. |
| "On track" / readiness status label | Level movement claim. Requires explicit director approval per player. |
| AI-generated "Recommended" action on hero card | Must come from approved priority data, not runtime AI inference. |
| Raw coach observations in "Evidence Collected" | Internal data. Only `player_development_summary` rows with `show_to_parent = true` are safe. |
| UTR scores, win/loss records, match results | Competition data is for the director view only. Never shown to parents. |
| Player comparisons or percentile language | Explicitly blocked by `parentSafeResponseRules.ts` tone guidelines. |
| AI-assigned "Recommended" badge on coach cards | Must be a director-set field, not algorithmic. |
| AI-generated "Best Fit Reason" for coaches | Must be pre-written by the director in coach profile setup. |
| Auto-booking private lessons | No path in the system confirms a booking. All lesson requests go through `proposed_actions → pending_review`. |
| DONNA responses sent to parent without review | All DONNA drafts go to director review queue before any parent-facing output. |
| Parent messages auto-forwarded to coach | All parent messages route through `proposed_actions`. Coaches never receive raw parent messages. |
| Level movement claims without director approval | `finalize_player_placement()` is the only path to activate level changes. |
| Competition readiness claims ("ready for next level") | Definitive readiness language requires director-approved assessment, not DONNA inference. |
| Any field from `coach_notes` or internal observation tables | Never exposed to parents under any circumstances. |
| Billing, payment, or enrollment status | Not in scope. |

---

## Data mapping — prototype fields to AcademyOS sources

| Prototype field | AcademyOS source | Safety gate |
|---|---|---|
| `player.name` | `players.first_name` or `players.full_name` | Already used |
| `player.level` | `curriculum_levels.display_name` (via player_curriculum_states) | Already used |
| `player.nextLevel` | next curriculum level by `sort_order` | Already queried |
| `player.coachApprovedSummary` | `curriculum_coach_language.doing_well` (sanitized) | `sanitizeParentFacingText()` |
| `player.attendanceRate` | calculated from `session_attendance` | Already queried |
| `player.sessionsThisMonth` | count from `session_attendance` | Already queried |
| `player.nextRecommendedAction` | `player_priorities[0].title` (parent_message field) | `canShowParentField()` gate |
| `player.mainPriority` | `player_priorities[0]` | `canShowParentField()` gate |
| `player.secondaryPriority` | `player_priorities[1]` | `canShowParentField()` gate |
| `player.evidenceSummary` | `player_development_summary` where `show_to_parent = true` | Requires `show_to_parent` flag check |
| `player.progressNote` | `curriculum_coach_language.current_focus` (sanitized) | `sanitizeParentFacingText()` |
| `skillPath.currentFocus` | `curriculum_coach_language.current_focus` | Already sanitized |
| `skillPath.whyItMatters` | `parentView.why_it_matters` (from IDP build) | Already in IDP parent view |
| `skillPath.practiceRecommendation` | `parentSupportGuide.atHomeSupportIdea` | Already in support guide |
| `skillPath.whatParentsShouldNotice` | New field needed: `curriculum_coach_language.parent_observation_guidance` | Requires schema sprint |
| `competitionPath.*` | Director-approved competition notes field | Requires new schema sprint |
| `fitnessPath.movementFocus` | New field or coach language domain field | Requires schema sprint |
| `fitnessPath.atHomeSuggestion` | `parentSupportGuide.atHomeSupportIdea` | Already in support guide |
| `nextSteps.bestSupportThisMonth` | `parentSupportGuide` fields combined | Already in support guide |
| `nextSteps.whenToRequestLesson` | New curriculum language field | Requires schema sprint |
| `nextSteps.whatNotToOverFocus` | `parentView.what_not_to_over_focus_on` | Already in IDP parent view |
| Lesson request form | `requestPrivateLessonAction.ts` + `proposed_actions` | Already wired |
| Coach list for selection | Director-curated subset of coaches | Requires director flag on coach record |
| DONNA parent Q&A | New: parent-question route → director review queue | Requires new sprint |

---

## Architecture decisions required before building sub-pages

These are design decisions that must be made before any sprint touches the parent portal. They are not ready to implement yet.

1. **Navigation model**: Bottom tab bar (4 path tabs + home) vs. hub-and-spoke card navigation. The `BottomTabBar` exists but is currently minimal for the parent portal. A sprint must decide and spec this before building sub-pages.

2. **Schema additions**: Several prototype fields map to columns that do not yet exist (`parent_observation_guidance`, competition notes, movement focus). These require explicit migration sprints with RLS before any parent-facing sub-page can show real data.

3. **Director-controlled coach roster**: A flag on coach/profile records to mark coaches as available for parent lesson requests. Without this, the coach selection screen cannot be safely populated.

4. **DONNA parent Q&A pipeline**: Routing a parent question through DONNA → director review → parent response requires a new `proposed_actions` target module and a new review queue tab. This is a multi-sprint effort.

5. **`show_to_parent` flag on development summaries**: The evidence summary section requires that `player_development_summary` rows have explicit `show_to_parent` column enforcement, not just client-side filtering.

---

## DONNA language rules for the parent portal

When DONNA content appears in any parent-facing context:

- Always label with: "DONNA draft — reviewed by the academy before sending"
- Never display DONNA output as final or authoritative
- Never let DONNA claim certainty about level readiness
- Never let DONNA reference internal coach notes, assessment scores, or comparison data
- All DONNA-generated text must pass through `sanitizeParentFacingText()` before any parent display
- DONNA responses to parent questions must enter the `proposed_actions` review queue — no direct delivery

---

## Parent-safe language rules (from `parentSafeResponseRules.ts`)

The following tone rules from the existing safety module apply to all new parent portal content:

- Use the player's first name — never "your child" or "the player"
- Frame everything as a learning journey, not a deficit or ranking
- Reference specific skills (footwork, grip, serve) rather than character traits
- One growth area maximum per message — do not list multiple weaknesses
- Never compare the player to teammates or a generic standard
- Avoid raw scores, percentile ranks, or internal assessment language
- For absences: acknowledge without blame
- End with encouragement or a forward-looking statement
- If an observation is ambiguous or unclear, omit it entirely

These rules must be enforced at the data layer (before render) not at the display layer (styling alone).

---

*This document is IA-only. No code implementation should begin until sprint authorization is given and the architecture decisions above are resolved.*
