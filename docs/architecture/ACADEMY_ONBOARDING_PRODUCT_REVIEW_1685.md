# Academy Onboarding — Final Product Review
**Sprint:** Mega Sprint 1685–1714  
**Date:** 2026-06-10  
**Reviews:** `ACADEMY_ONBOARDING_10_10_BLUEPRINT_1685.md`  
**Status:** Design challenge only. No code changes.

---

## Executive Verdict

The blueprint is well-structured engineering. It closes all 11 seams and every system connection is correctly mapped. But it still thinks like a form, not like an operating system.

The core problem: **the blueprint asks directors to classify themselves.** Self-classification is the most unreliable signal in onboarding. Every question that asks a director to describe their academy in abstract terms (model type, coaching style label, priority ranking) is a question where the answer is more aspirational than behavioral, more self-image than ground truth.

A director who says "high performance" and one who says "junior development" may run nearly identical programs. A director who picks "fundamentals first" coaching style may actually run mostly game-based sessions because that's what keeps 9-year-olds engaged. The labels directors choose tell you who they want to be. The questions they answer behaviorally tell you how they actually operate.

**The goal is maximum academy understanding with minimum director effort.**  
That requires replacing classification questions with inference-enabling questions.

Count: the blueprint has **19 questions across 7 phases**. After this review, the target is **8 director decisions** that generate equivalent or richer model depth.

---

## Phase 0 — Orientation

### Challenge
Phase 0 is three slides explaining what the software does. The director signed up for it. They know what it does.

The orientation content is defensive — it anticipates misunderstanding rather than demonstrating competence. A product that opens by explaining itself signals uncertainty. A product that opens by immediately showing value signals confidence.

More damaging: the "Skip orientation →" link trains the most action-oriented directors — the ones you most want to serve quickly — to start by clicking Skip. The first interaction with AcademyOS becomes an opt-out.

The "what DONNA does" slide is also premature. Explaining DONNA's boundaries before she's done anything teaches nothing — the director will forget it. DONNA's behavior during setup is the best explanation of DONNA.

### Verdict
**Remove Phase 0 entirely.** Replace with a single sentence at the top of Phase 1:

> "Let's build your academy. DONNA will turn your answers into a starting curriculum, session template, and portal configuration — ready to run on day one."

One sentence. The word "one" disappears from the phase count. 6 phases remain.

---

## Phase 1 — Academy Classification

### Challenge 1: The model picker is self-classification

The blueprint's Q1.2 asks directors to pick from 5 models: High Performance, Junior Development, Recreational, Dual Track, Private Coaching.

This is the foundational decision that drives every subsequent default. It is also the question most likely to be answered incorrectly.

Why directors misclassify:
- "High Performance" is aspirational. Most academies have 3–5 HP players and 30 recreational ones. The director picks HP because those 3 players define the academy's identity, even though 85% of their revenue and 100% of their operational complexity is recreational.
- "Junior Development" is where directors land when they don't fit a clearer category. It becomes a catch-all.
- "Dual Track" requires a director to think in a conceptual framework (tracks) they may not use internally.
- "Private Coaching" is clear and accurate for who it fits.

The result: the model picker introduces systematic upward bias (directors over-classify toward HP and under-classify toward recreational), which sets wrong defaults for the majority of academies that use the product.

**The fix:** don't ask directors to classify themselves. Ask two behavioral questions that generate the classification as an inference:

**Q1.2a — "What does your player mix look like?"** *(pick the closest)*
- "Mostly competitive juniors aiming for tournaments"
- "Mixed — some competitive, mostly developmental"
- "Mostly recreational or adult players"
- "Primarily private or small-group lessons"

**Q1.2b — "What matters most to your players' families?"** *(pick the closest)*
- "Results, rankings, and clear level progression"
- "Development, improvement, and enjoying the game"
- "Fitness, fun, and staying active"
- "Individual attention and personalized feedback"

These two questions are concrete, behavioral, and ego-neutral. A director can answer them honestly without any self-image at stake. DONNA infers the model internally from the combination — the director never sees or chooses the model label.

| Q1.2a × Q1.2b | Inferred model |
|---|---|
| Competitive + Results | `high-performance` |
| Competitive + Development | `junior-development` |
| Mixed + Development or Results | `junior-development` or `dual-track` (use age groups as tiebreaker) |
| Recreational + Fun | `recreational` |
| Private + Individual | `private-coaching` |

The model label is an internal system concept. The director never needs to know it.

### Challenge 2: Location Count adds nothing

Q1.4 (Location Count) has no downstream system effect in V1. The blueprint itself says "(optional — you can update this in Settings)." If it's optional and has no V1 effect, it does not belong in onboarding. **Remove Q1.4.**

### Challenge 3: Phase 1 now contains 3 questions, not 4

After removing Q1.2 (model picker) and replacing with Q1.2a + Q1.2b, and removing Q1.4:

- Q1.1: Academy name *(required)*
- Q1.2a: Player mix *(required)*
- Q1.2b: What families care about *(required)*
- Q1.3: Age groups *(required)*

Four fields. Under 90 seconds. Proceeds to a DONNA confirmation:
> "Based on what you told me, I've set up [inferred model description]. Your curriculum will start with [N] levels for [age ranges]. Everything below is pre-built — confirm or adjust."

---

## Phase 2 — Coaching Identity

### Challenge 1: The coaching style picker is redundant with Phase 1

The blueprint's pre-selection table shows exactly the problem:

| Classification | Pre-selected defaults |
|---|---|
| `high-performance` | `high-performance-discipline`, `tactical-first` |
| `junior-development` | `fundamentals-first`, `game-based` |
| `recreational` | `joy-retention`, `game-based` |

If the model pre-selects the styles, and the model is derived from Phase 1, then Phase 2 Q2.1 is asking the director to confirm something the system already knows. This is not a new question — it is a review step wearing the costume of a question step.

Confirmation UI is appropriate. A 8-option picker is not the right tool for confirmation.

**The fix:** Show the pre-selected coaching styles as a DONNA statement, not a question:

> "Your coaching style looks like: [style 1] + [style 2]. I'll use this to configure your session templates and interpret coach wrap-ups. If this doesn't sound right, adjust below."

The director edits if wrong. No editing = confirmation. The cognitive default is agreement, which is appropriate when the pre-selection is right 80% of the time.

### Challenge 2: The development priority stack is the heaviest UI in the flow

Q2.2 asks directors to: read 10 options, select 3–5, then drag to rank them. This is the most complex interaction in the entire onboarding. It should only exist if its output is genuinely not predictable from other answers.

Is it predictable? Largely yes — the coaching styles and academy model strongly constrain the plausible priority stack. A high-performance, tactical-first academy will almost always rank `tactical-iq` and `technical-foundation` at the top. A recreational, joy-retention academy will almost always rank `consistency` and `emotional-regulation` high.

But "largely predictable" is not the same as "fully predictable." The priority stack does carry some signal the model and coaching styles don't capture — specifically, the edge between domains that co-vary with the model. For HP academies, whether `competition` outranks `technical` is a real distinction between two different HP philosophies.

**The minimum version of this question:**

Replace the 10-option ranked list with a single forced-choice question that captures the high-signal edge:

**Q2.2 — "When a player struggles technically AND tactically at the same time, which do you address first?"**
- Technical (grips, contact, stroke mechanics)
- Tactical (patterns, decisions, court geometry)
- Whichever their coach judges is limiting them most right now

This single question distinguishes the two dominant HP philosophies, contributes meaningfully to the pathway weighting vector, and takes 5 seconds to answer. Combined with the model inference from Phase 1, it produces a pathway weighting vector that is 85% as accurate as the 10-item stack with 5% of the cognitive load.

Optional enrichment: after launch, the director can fine-tune the full priority stack from Academy Settings. Onboarding captures the signal needed to start.

### Challenge 3: Coach Communication Voice is derivable, not new information

Q2.3 (structured / conversational / data-driven) maps almost entirely to the academy model:
- HP → data-driven
- Junior Dev → structured
- Recreational → conversational

The blueprint pre-selects based on model. If the default is right most of the time and the director can change it in Settings, this is not a required onboarding question. **Remove Q2.3 from the required path.** Let DONNA infer it from the model. Surface it as an adjustable setting post-launch.

### Revised Phase 2

Phase 2 collapses to:
- DONNA confirmation of inferred coaching styles (editable, not a picker)
- One forced-choice question: technical vs. tactical priority

Under 60 seconds.

---

## Phase 3 — Curriculum Foundation

### Challenge 1: The curriculum spine question should not exist

Q3.1 asks directors to pick a curriculum spine (ITF Extended / ITF Standard / Beginner to Club / Custom). The blueprint's pre-selection table shows DONNA already knows the right answer from the model and age groups.

This question has the same problem as the coaching style picker: it is masquerading as a decision when it is actually a confirmation.

**Remove Q3.1 as a question.** Replace with DONNA's assertion:
> "I've selected [spine name] for your academy. It includes [N] levels: [list]. Adjust the levels below if needed."

The spine selection is DONNA's recommendation. The director confirms the levels.

### Challenge 2: Level Gate Strictness uses technical language

"Strict / Balanced / Flexible / Director-only" are system concepts. Tennis directors don't think in these terms.

The question the director is actually answering is: "How automatic do you want player advancement to be?"

**Replace with:**

**Q3.3 — "When a player is ready to move up a level, who makes the call?"**
- "I want to approve every advancement personally" → `director-only`
- "DONNA flags it, I confirm quickly" → `strict` or `balanced` (use model as tiebreaker)
- "Coaches can recommend, I'm notified" → `balanced` or `flexible`
- "Make it automatic based on the assessment data" → `strict`

One concrete question. Maps directly to the strictness level. Director understands what they're agreeing to.

### Challenge 3: Assessment Cadence is not an onboarding decision

Q3.4 (Monthly / Every 6 weeks / Quarterly / Director-triggered) is a fine-tuning preference that varies by season, player age, and competition calendar. Directors won't know the right answer before they've run a single season.

**Remove from required path.** Set to classification default. Surface in Academy Settings after launch.

### Revised Phase 3

- DONNA assertion of pre-selected spine (editable link)
- Q3.2: Active levels (confirm checkboxes — pre-selected, director adjusts)
- Q3.3: Advancement behavioral question (1 choice, replaces strictness picker)

Under 90 seconds.

---

## Phase 4 — Session Blueprint

### Challenge: Phase 4 is a duration question wearing the costume of a design phase

By the time a director reaches Phase 4, DONNA has already:
1. Inferred the model (Phase 1 behavioral questions)
2. Confirmed coaching styles (Phase 2 DONNA assertion)
3. Computed the session block preset from the coaching style

The block selection (Q4.1) is therefore: the director looking at what DONNA already determined and clicking Continue. That is not a phase. That is a loading screen with extra clicks.

The only genuinely new information in Phase 4 is session duration (Q4.2). Duration is not predictable from any prior answer — a high-performance academy may run 60-minute or 90-minute sessions depending entirely on their court schedule.

**Collapse Phase 4:** session block selection becomes a DONNA-built preview shown inside Phase 3 ("Your program teaches this way / Your default session looks like this"). Duration becomes a single question at the bottom of Phase 3 or the top of Phase 5.

Fitness template (Q4.3) is optional and should not exist in the required path.

**Phase 4 is eliminated.** Its one genuinely new question (duration) is folded into the adjacent phase.

---

## Phase 5 — Team Setup

### Challenge 1: Wrap-Up Expectations is redundant

Q5A.3 (Wrap-Up Expectations) is pre-selected from Q2.3 (Coach Communication Voice), which is itself now inferred from the model. This question is the third derivation of the same underlying signal.

**Remove Q5A.3.** The wrap-up format is determined by the model and visible to the director in Settings.

### Challenge 2: The minimum required for launch is lower than the blueprint states

The blueprint requires "min 1 coach" and "min 1 group" to launch. This is the right requirement. But is the director required to add the coach *during onboarding?*

The challenge: a solo director who IS the only coach doesn't need to invite anyone. They are the coach. Requiring a coach invite creates a false blocker — the director enters their own email, creates a circular invite, receives an invitation for the account they're already logged into.

**The launch requirement should be: at least 1 active coach membership.** The director's own membership counts. The coach-add step in Phase 5 should be framed as "Do you have coaches to invite?" with "No — I'm the only coach for now" as a valid answer that satisfies the requirement.

### Revised Phase 5

- Coach invite section: "Add coaches" (optional — director's own membership counts)
- Group creation: required (name + track from Phase 3 levels)
- Duration question from collapsed Phase 4: moved here as the first question

Under 90 seconds for a solo director. Under 3 minutes if adding multiple coaches.

---

## Phase 6 — Parent & Player Experience

### Challenge 1: Parent Communication Style is redundant

Q6.1 (progress-focused / outcome-focused / minimal) maps directly to the model:
- HP → outcome-focused
- Junior Dev → progress-focused
- Recreational → minimal

The blueprint's own default table confirms the model determines this. **Remove Q6.1 from required path.** Surface in Settings post-launch.

### Challenge 2: Five toggles are too much granularity for onboarding

Q6.2 presents 5 visibility toggles (domain scores / competition history / DONNA recommendations / raw coach notes / rankings). This is the Settings screen appearing inside onboarding.

A director in their first 10 minutes of using a product does not have the context to make informed decisions about 5 specific data visibility rules. They don't yet know what "domain scores" look like in the parent portal. They haven't seen the interface. They're making abstract decisions about abstract things.

**The right onboarding question is one level of abstraction higher:**

**Q6.2 — "How transparent do you want to be with parents?"** *(pick 1)*
- `minimal` — "Basics only. I'll manage parent communication myself."
- `standard` — "Progress updates and key milestones. No raw scores."
- `transparent` — "Detailed progress, scores, and development data."

Each choice maps to a preset bundle of the 5 toggles. Directors can customize the specific toggles in Settings after they've seen what the portal looks like.

This is one question, under 10 seconds, and captures equivalent information with dramatically less cognitive load.

### Challenge 3: Player Mission Style is optional and should be deferred

Q6.3 (challenge-based / progress-focused / competition-driven / intrinsic) is a player portal configuration that has no effect until players are added and activated. Players don't exist at the time of onboarding.

**Remove Q6.3 from required path.** Default to `progress-focused`. Director sets this from player portal settings after launch.

### Revised Phase 6

- DONNA assertion of parent communication default (based on inferred model) with edit option
- Q6.2: One transparency level question (1 pick: minimal/standard/transparent)

Under 60 seconds.

---

## Phase 7 — Launch Review

### Phase 7 is correctly designed

No changes. The 7-item required checklist is right. The DONNA pre-scan is right. The single "Launch Academy" button writing `onboarding_completed_at` is right.

One addition: the launch review should show DONNA's academy classification summary, so the director can confirm the model DONNA inferred from their behavioral answers:
> "Based on your setup, I've classified this as a [model name] academy. This shapes my recommendations — adjust in Academy Settings if needed."

This is the moment the director sees the classification for the first time. It's a summary, not a question.

---

## The Academy Classification Itself — Deeper Challenge

### The taxonomy has a precision problem at the edges

The 5-model taxonomy works well for clear cases: a pure HP academy and a pure recreational academy are genuinely different systems. But the majority of real academies live in between:

- An academy with 8 elite juniors and 45 recreational adults is "dual track," but the director thinks of it as "primarily junior development with an adult program on the side."
- An academy transitioning from recreational to competitive has no clean model label.
- A junior development academy that becomes HP for one cohort but not others doesn't fit any single model.

The classification produces brittle defaults for the edges, which may be where most real academies live.

**A more robust alternative:** instead of a taxonomy, use a **spectrum model**.

Two sliders, captured at Phase 1:

```
Competitive intensity: [ Recreational ←————————→ High Performance ]
Age focus:             [ Adults ←————————→ Juniors ]
```

These two axes define a continuous space. Every default profile becomes a function of position on these axes, not a category. An academy at 70% competitive + 80% junior gets defaults that are a blend of HP and junior-development — weighted appropriately — rather than forced into one box.

This is a more honest model of the real variance in tennis academies, produces better defaults for edge cases, and is just as fast to capture (two sliders).

The existing 5-model taxonomy can be preserved as a **view** (for labeling and communication purposes) while the underlying representation is continuous. DONNA could still say "you're a junior-development academy" as shorthand while the actual pathway weights reflect the precise position on the two axes.

**This is a V2 recommendation.** The 5-model taxonomy is acceptable for V1. But the product review flags this as a known limitation before the system is built.

---

## The Required Fields — Final Verdict

| Field | Blueprint | Verdict | Reason |
|---|---|---|---|
| Academy name | Required | **KEEP** | Everything is nameless without it |
| Model picker (5 options) | Required | **REPLACE** | Self-classification is unreliable; use behavioral inference |
| Player mix question (new) | Not in blueprint | **ADD** | Behavioral proxy for model classification |
| Family priority question (new) | Not in blueprint | **ADD** | Behavioral proxy for model classification |
| Age groups | Required | **KEEP** | Directly maps to curriculum levels |
| Location count | Optional | **REMOVE** | No V1 system effect |
| Coaching styles picker (8 options) | Required | **REPLACE with assertion** | Derivable from model; show DONNA's pick, allow edit |
| Dev priority stack (10 options, ranked) | Required | **REPLACE** | One forced-choice question captures high-signal edge |
| Coach communication voice | Required | **REMOVE** | Derivable from model; surfaces in Settings |
| Curriculum spine | Required | **REMOVE as question** | Fully derivable; show DONNA's selection with edit link |
| Active levels | Required | **KEEP as confirmation** | Director must confirm which levels apply |
| Level gate strictness (picker) | Required | **REPLACE** | Behavioral question: "who makes the advancement call?" |
| Assessment cadence | Optional | **DEFER** | No launch-day effect; move to Settings |
| Session blocks picker (8 options) | Required | **REMOVE as question** | Derivable from coaching style; show DONNA's template |
| Session duration | Required | **KEEP** | Not predictable from model; one quick pick |
| Fitness template | Optional | **DEFER** | No launch-day effect |
| Coach add (name + email) | Required | **KEEP with modification** | Solo director = no invite required |
| Coach permissions | Required | **KEEP** | 3 presets are appropriate |
| Wrap-up expectations | Optional | **REMOVE** | Triple derivation of same signal |
| Group add (name + track) | Required | **KEEP** | Must have at least 1 group to place players |
| Parent comm style | Required | **REMOVE** | Derivable from model |
| Parent visibility toggles (5) | Required | **REPLACE** | Single transparency level (minimal/standard/transparent) |
| Player mission style | Optional | **DEFER** | No effect until players added |

**Before:** 19 director questions  
**After:** 8 director decisions

---

## The Revised Minimum Onboarding Flow

Four phases. No orientation slide. No Phase 4.

---

### Phase 1 — Your Academy (3 min)

**DONNA opens:**
> "Let's set up your academy. Four quick questions — then I'll build your starting system."

**Q1 — Academy name** *(text input)*

**Q2 — What does your player mix look like?** *(pick 1)*
- Mostly competitive juniors aiming for tournaments
- Mixed — some competitive, mostly developmental
- Mostly recreational or adult players
- Primarily private or small-group lessons

**Q3 — What matters most to their families?** *(pick 1)*
- Results, rankings, and clear progression
- Development, improvement, and enjoyment
- Fitness, fun, and staying active
- Individual attention and feedback

**Q4 — Which age groups are you coaching?** *(multi-select)*
- Red Ball (5–8) / Orange Ball (8–10) / Green Ball (9–11) / Yellow Ball (10+) / High Performance / Adult

**DONNA response after Q4:** Shows the inferred model and what it implies:
> "Your academy looks like a [inferred model description]. I've pre-built [N] curriculum levels, a default session template, and your parent portal settings. Everything below is a confirmation."

---

### Phase 2 — Your Program (2 min)

This phase is mostly DONNA's work. The director confirms.

**DONNA shows:**
- The pre-selected curriculum levels (active levels checkboxes — director adjusts if needed)
- The inferred coaching style (shown as a statement, not a picker — editable)
- The inferred session template skeleton (shown as a visual block diagram — not a picker)

**Q5 — One forced-choice question:** *(pick 1)*
> "When a player struggles technically and tactically at the same time, which do you address first?"
- Technical (grips, contact, stroke)
- Tactical (patterns, decisions, geometry)
- Whichever their coach judges most limiting

**Q6 — How long are your sessions?** *(pick 1)*
- 45 min / 60 min / 75 min / 90 min / 2 hours

**Q7 — When a player is ready to move up, who makes the call?** *(pick 1)*
- I approve every move personally
- DONNA flags it, I confirm quickly
- Coaches recommend, I'm notified
- Automatic based on assessment data

---

### Phase 3 — Your Team & Portals (3 min)

**Groups (required):**
- Group name + track (from confirmed levels)
- "Add another group" link

**Coaches (optional — solo directors skip):**
- "Are you the only coach?" → Yes (skip) / No (add coaches)
- If No: name + email + role + permission preset per coach

**Parent experience (required, 1 question):**

**Q8 — How transparent do you want to be with parents?** *(pick 1)*
- **Minimal** — Basics only. I'll manage communication myself.
- **Standard** — Progress updates and milestones. No raw scores.
- **Transparent** — Detailed progress, scores, and development data.

DONNA shows what each choice means for parents in plain language.

---

### Phase 4 — Launch Review (2 min)

Required items checklist (same as blueprint Phase 7, unchanged).

DONNA summary:
> "Your [inferred model] academy is ready to launch. I've built [N] curriculum levels, [session duration]-minute sessions using a [style] template, and [parent level] parent visibility. Everything can be refined after launch."

"Launch Academy →" button.

---

## What 8 Questions Produce

| Question | What DONNA derives from it |
|---|---|
| Q1: Academy name | Namespacing; context for all DONNA output |
| Q2: Player mix | Primary model inference (0.6× weight) |
| Q3: Family priorities | Primary model inference (0.4× weight) |
| Q4: Age groups | Active curriculum levels; pathway age-floor adjustments |
| Q5: Technical vs. tactical | High-signal edge of pathway weighting vector |
| Q6: Session duration | Template `total_minutes`; coach time budget |
| Q7: Who approves advancement | Level gate configuration for all active levels |
| Q8: Parent transparency | `portal_rules.parent` bundle; all 5 visibility toggles set at once |

Plus operational data: group name+track, optional coach invites.

**Total required director effort:** 8 answers + group name + optional coaches = ~5 minutes end-to-end.

---

## What This Produces vs. Current Academy

**Before (current 4 surfaces, 11 seams):**
- DNA shell: 10 steps, 15–20 min, writes to unused key
- Sub-steps: 7 steps, no connection to DNA shell
- Nothing pre-populated from one surface to the next
- DONNA ignores all captured data for placement

**After (4 phases, 8 questions):**
- Unified: one flow, one hub, one completion record
- Academy model inferred behaviorally (no self-classification bias)
- Curriculum levels, class template, level gates, and portal rules created on launch day
- Pathway weighting vector computed and stored — drives placement, progression, insights
- DONNA's placement recommendation uses academy model + priority weights
- Parent portal reads real settings from day one
- Solo directors not blocked by a fake "add a coach" requirement

---

## What This Does Not Produce (and Shouldn't Try To)

Some information is better captured through use than through setup:

| Information | Why to defer | How it's captured post-launch |
|---|---|---|
| Detailed coaching style breakdown | Changes as coaches do, not stated once | Coach wrap-up pattern analysis (DONNA insight engine) |
| Specific curriculum node emphasis | Requires seeing what nodes exist | Director edits curriculum after launch |
| Coach-specific preferences | Varies per coach | Each coach's wrap-up history |
| Competition calendar | Unknown at setup time | Director adds sessions |
| Parent communication tone | Evolves with relationships | Director adjusts in settings |
| Player mission style | No effect until players exist | Set from player portal settings |

**The principle: capture signals, not encyclopedias.** Onboarding establishes the starting model. The model improves with every session, every assessment, every director decision. Trying to capture everything upfront creates cognitive load without proportional intelligence gain.

---

## Open Questions (unchanged from blueprint, confirmed still valid)

| # | Decision | Why it matters for this revised flow |
|---|---|---|
| D1 | Does Phase 2 (curriculum confirmation) directly write DB records or generate a draft? | Solo directors may want to launch before reviewing levels |
| D2 | Existing directors who used Surface A — migrate to new flow or keep both? | Depends on whether `academyOperatingLens` data is still useful |
| D3 | Coach invites at Phase 3 or at launch? | Affects what coaches see before launch |
| D4 | Dual-track as V1 feature or V2? | Affects Phase 2 curriculum display complexity |
| D5 | What happens to the 7 Surface B completion flags? | Still in DB; need retirement plan |

**New open question from this review:**

| # | Decision |
|---|---|
| D6 | V1: 5-model taxonomy or V2: continuous spectrum model (two sliders)? The taxonomy is simpler to build but produces brittle defaults for the edge cases where most real academies live. |
