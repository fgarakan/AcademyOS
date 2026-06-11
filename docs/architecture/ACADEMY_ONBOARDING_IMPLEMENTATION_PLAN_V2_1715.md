# Academy Onboarding — Implementation Plan V2
**Sprint:** Mega Sprint 1715–1744  
**Date:** 2026-06-10  
**Supersedes:** `ACADEMY_ONBOARDING_10_10_BLUEPRINT_1685.md`  
**Based on:** `ACADEMY_ONBOARDING_PRODUCT_REVIEW_1685.md`  
**Status:** Pre-implementation audit. No code written yet.

---

## Sprint 1715B Design Requirements (applied before implementation)

These five requirements were locked before implementation began. They override any earlier spec decision where there is a conflict.

### Req #1 — Conversational Memory
Every onboarding answer must be stored so DONNA can quote it back in conversation.
`academy_dna.onboarding_conversation.statements[]` stores a `donna_quote` per answer:
> "You told me during onboarding that Fun was the highest priority for Red Ball players."
> "You told me that technical development comes before competition."
> "You told me parents should have Transparent visibility."
See the `onboarding_conversation` schema in `ACADEMY_ONBOARDING_FINAL_SPEC.md`.

### Req #2 — Meet Your Academy: "What I Still Don't Know"
After all 7 confirmed sections in Phase 4, add:
**What DONNA now knows** (checkmarks) + **What I still don't know** (bullets).
- Prevents fake certainty. DONNA must feel honest.
- What DONNA still needs to learn: coach execution patterns, parent engagement, player progression, session quality, assessment patterns.

### Req #3 — Conversational UX, not form UX
Every phase and every question must include:
- DONNA introduction (why she is asking)
- What this changes (how the answer shapes recommendations)
- Can be changed later? (where in Settings)
- What if you answer differently? (one sentence)
All context text lives in `donnaOnboardingContextPack.ts`. The UI renders it; it never generates it.

### Req #4 — Low Cognitive Load Wins
Priority order when in conflict: Director clarity → DONNA understanding → Engineering elegance.
Deep system. Simple screen. DONNA handles complexity.

### Req #5 — Final Review Before Commit
Before committing Sprint 1715B, produce a complete review covering:
1. Exact onboarding flow (phase by phase)
2. Every director decision (all 10)
3. Every field persisted (full schema)
4. DONNA context pack structure
5. Meet Your Academy screen copy
6. What I Still Don't Know section
7. Certification results
Do not commit until reviewed by the director.

---

## Rule: Every Question Must Justify Its Existence

For each question: if no behavior changes, remove it. If DONNA can infer it, do not ask it.

---

## Full Question Audit

### Q0.x — Orientation Slides (Blueprint Phase 0)

| Question | Behavior change? | DONNA can infer? | Required? | Move post-launch? | Decision |
|---|---|---|---|---|---|
| "What is AcademyOS" slide | None | N/A | No | N/A | **REMOVE** — director signed up; they know |
| "What DONNA does" slide | None | N/A | No | N/A | **REMOVE** — DONNA's behavior during setup explains DONNA |
| Skip orientation link | None | N/A | No | N/A | **REMOVE** — training skip behavior on first interaction |

**Phase 0 outcome: eliminated entirely.** Replaced by one sentence at top of Phase 1.

---

### Q1.x — Academy Classification (Blueprint Phase 1)

| Question | Behavior change? | DONNA can infer? | Required? | Move post-launch? | Decision |
|---|---|---|---|---|---|
| Q1.1: Academy name | Yes — namespaces all DONNA output; appears in all communications and reports | No — only the director knows the name | **Yes** | No — everything is unnamed without it | **KEEP** |
| Q1.2: Model picker (5 options) | Yes — drives ALL default configuration | Partially — but self-classification is unreliable; directors over-index to "high performance" | No — behavioral proxy is more accurate | No | **REPLACE** with Q2 (player mix) + Q3 (family priorities) behavioral questions |
| Q1.2a (new): What does your player mix look like? | Yes — 0.6× weight toward model inference | No | **Yes** | No — launch defaults depend on this | **KEEP** (new behavioral proxy) |
| Q1.2b (new): What matters most to families? | Yes — 0.4× weight toward model inference | No | **Yes** | No — launch defaults depend on this | **KEEP** (new behavioral proxy) |
| Q1.3: Age groups coached | Yes — maps directly to active curriculum levels and pathway age floors | No — only director knows their program scope | **Yes** | No — curriculum levels can't be pre-built without this | **KEEP** |
| Q1.4: Location count | None in V1 | Yes (could ask later) | No | Yes — lives naturally in Settings | **REMOVE** — blueprint itself flagged as optional with no V1 effect |

**Phase 1 decisions: 4 (name, player mix, family priorities, age groups)**

---

### Q2.x — Coaching Identity (Blueprint Phase 2)

| Question | Behavior change? | DONNA can infer? | Required? | Move post-launch? | Decision |
|---|---|---|---|---|---|
| Q2.1: Coaching style picker (8 options) | Yes — shapes session template structure and wrap-up interpretation | Yes — inferred from model; pre-selection table in blueprint confirms this | No | Yes — visible in Settings | **REPLACE with DONNA assertion** — show pre-selected style, allow edit, default = agreement |
| Q2.2: Development priority stack (10 items, rank 3–5) | Yes — shapes pathway weighting vector | Mostly — model + coaching style constrain the plausible stack. The high-signal edge (tech vs tactical) is NOT predictable | No | Yes — fine-tunable in Settings | **REPLACE** with single forced-choice: "When a player struggles technically AND tactically, which do you address first?" |
| Q2.2 forced-choice (new): Technical vs tactical vs coach judgment | Yes — captures high-signal edge of pathway weighting vector. Distinguishes two HP philosophies. | No | **Yes** | No — this is the one signal the model can't produce on its own | **KEEP** (Q5 in final flow) |
| Q2.3: Coach communication voice (structured/conversational/data-driven) | Yes — affects wrap-up format defaults | Yes — maps almost entirely to inferred model. HP → data-driven, RecDev → structured, Rec → conversational | No | Yes — post-launch Settings | **REMOVE** — derivable; surfaces in Settings |

**Phase 2 decisions: 1 (technical vs tactical priority edge)**  
Plus DONNA assertion of coaching style (editable, not a question)

---

### Q3.x — Curriculum Foundation (Blueprint Phase 3)

| Question | Behavior change? | DONNA can infer? | Required? | Move post-launch? | Decision |
|---|---|---|---|---|---|
| Q3.1: Curriculum spine picker | Yes — shapes level count and node structure | Yes — model + age groups fully determine the right spine | No | Yes | **REMOVE as question** — DONNA asserts the spine; director sees it as a confirmation |
| Q3.2: Active levels (confirm checkboxes) | Yes — defines which levels exist and accept players | Partially — DONNA pre-selects from model + age groups; director may have a custom subset | **Yes** — director must confirm | No — placement and curriculum depend on this | **KEEP as confirmation** (pre-selected by DONNA, director adjusts) |
| Q3.3: Level gate strictness picker (strict/balanced/flexible/director-only) | Yes — defines how automatic advancement is | No — preference varies widely even within same model type | **Yes** — but rephrase as behavioral | No | **REPLACE** with behavioral question: "Who makes the advancement call?" |
| Q3.3 behavioral (new): Who makes the advancement call? | Yes — directly maps to gate strictness level | No | **Yes** | No — gates are set on launch | **KEEP** (Q7 in final flow) |
| Q3.4: Assessment cadence | Yes — affects assessment reminder cadence | Partially — model gives a default | No | Yes — varies by season/calendar | **DEFER** — set to classification default; director adjusts in Settings after launch |

**Phase 3 decisions: 1 (advancement approval)**  
Plus curriculum level confirmation (pre-selected, director adjusts)

---

### Q4.x — Session Blueprint (Blueprint Phase 4)

| Question | Behavior change? | DONNA can infer? | Required? | Move post-launch? | Decision |
|---|---|---|---|---|---|
| Q4.1: Session blocks picker (8 options) | Yes — defines default session structure | Yes — fully determined by coaching style, which is determined by model | No | Yes | **REMOVE as question** — DONNA shows the block preview as part of Phase 2 confirmation |
| Q4.2: Session duration | Yes — sets `total_minutes` for all templates; affects coach time budget | No — depends entirely on court schedule, not on model | **Yes** | No — templates are built from this | **KEEP** (Q6 in final flow) |
| Q4.3: Fitness template | Marginal — adds a pre-built fitness session template | No | No | Yes | **DEFER** — not a launch-day requirement |

**Phase 4: eliminated as a separate phase.**  
Duration question folds into Phase 2 (Your Program). Block picker becomes DONNA's visual preview inside Phase 2.

---

### Q5.x — Team Setup (Blueprint Phase 5)

| Question | Behavior change? | DONNA can infer? | Required? | Move post-launch? | Decision |
|---|---|---|---|---|---|
| Q5.1: Group name + track | Yes — groups are required for session scheduling and player assignment | No | **Yes** — min 1 group required | No | **KEEP** |
| Q5.2: Add another group | Same as above | No | No — 1 is minimum | Yes | **KEEP as optional add** |
| Q5A.1: Coach name + email | Yes — creates membership invite | No | No — solo director's own membership counts | Partially — can invite post-launch | **KEEP with modification**: "Are you the only coach? Yes = skip" |
| Q5A.2: Coach role + permission preset | Yes — defines what coaches can approve/see | No | No — solo director skips | Partially | **KEEP** (only appears if inviting coaches) |
| Q5A.3: Wrap-up expectations | Marginal — sets default wrap-up format | Yes — third derivation of the same signal (model → coaching style → wrap-up) | No | Yes | **REMOVE** — triple derivation |

**Phase 3 group + team decisions: group name required; coach invite optional with solo escape**

---

### Q6.x — Parent & Player Experience (Blueprint Phase 6)

| Question | Behavior change? | DONNA can infer? | Required? | Move post-launch? | Decision |
|---|---|---|---|---|---|
| Q6.1: Parent communication style (progress-focused/outcome-focused/minimal) | Yes — affects update tone and frequency | Yes — maps directly to model: HP → outcome-focused, JunDev → progress-focused, Rec → minimal | No | Yes | **REMOVE** — derivable; director adjusts in Settings |
| Q6.2: Parent visibility toggles (5 individual flags) | Yes — defines what parents see in portal | No — preference, not derivable | **Yes** — but replace with abstraction | No | **REPLACE** with single transparency level question |
| Q6.2 replacement (new): How transparent do you want to be with parents? | Yes — maps to preset bundle of all 5 toggles | No | **Yes** | No — portal is live on day one | **KEEP** (Q8 in final flow) |
| Q6.3: Player mission style | Marginal — affects player portal tone | No | No | Yes — has no effect until players are added | **DEFER** — default to `progress-focused`; set in player portal settings post-launch |

**Phase 3 parent decision: 1 (transparency level)**

---

### Q7.x — Meet Your Academy (Blueprint Phase 7)

| Question | Behavior change? | DONNA can infer? | Required? | Move post-launch? | Decision |
|---|---|---|---|---|---|
| 7-item required checklist | Yes — gates the Launch button | N/A | Yes | No | **KEEP** |
| DONNA pre-scan for gaps | Yes — surfaces incomplete or missing items before launch | N/A | Yes | No | **KEEP** |
| Launch Academy button | Yes — writes `onboarding_completed_at`, activates the academy | N/A | Yes | No | **KEEP** |
| DONNA classification summary | Yes — director confirms the inferred model | N/A (output only) | No | No — this is the moment the classification is revealed | **ADD** — shown as DONNA output, not a question |

**Phase 4: unchanged. No new questions.**

---

## Final Decision Summary

| Original question | Decision | Reason |
|---|---|---|
| Academy name | Keep | Only the director knows it |
| Model picker (5 options) | Replace | Self-classification bias; behavioral proxies more accurate |
| Player mix (new) | Keep | Behavioral model inference input |
| Family priorities (new) | Keep | Behavioral model inference input |
| Age groups | Keep | Directly maps to curriculum levels |
| Location count | Remove | No V1 system effect |
| Coaching styles picker | Replace with assertion | Fully derivable from model |
| Dev priority stack (10-ranked) | Replace | One forced-choice captures the signal |
| Technical vs tactical (new) | Keep | High-signal edge; not predictable from model |
| Coach communication voice | Remove | Derivable from model |
| Curriculum spine picker | Remove as question | DONNA asserts; director confirms |
| Active levels confirmation | Keep | Director may have custom subset |
| Level gate strictness picker | Replace | DONNA terminology; use behavioral question |
| Advancement approval behavioral (new) | Keep | Not predictable from model |
| Assessment cadence | Defer | Season-dependent; no launch-day effect |
| Session blocks picker | Remove as question | DONNA visual preview; fully derivable |
| Session duration | Keep | Not predictable from model |
| Fitness template | Defer | No launch-day effect |
| Coach add | Keep with modification | Solo escape: director's own membership counts |
| Coach permissions | Keep | Only 3 presets; fast |
| Wrap-up expectations | Remove | Triple derivation of same signal |
| Group name + track | Keep | Required for session scheduling |
| Parent communication style | Remove | Derivable from model |
| Parent visibility toggles (5) | Replace | One abstraction question drives all 5 toggles |
| Player mission style | Defer | No effect until players exist |

**Before:** 19 director questions across 7 phases  
**After:** 8 director decisions across 4 phases  
**Removed:** 8 questions (no behavior change or fully derivable)  
**Deferred post-launch:** 4 questions (fine-tuning preferences with no launch-day effect)  
**Replaced with DONNA assertions:** 4 questions (confirmation UI, not choice UI)  
**Replaced with better questions:** 3 questions (behavioral proxies replace abstract labels)

---

## The 9 Required Director Decisions

| # | Question | Phase | What DONNA derives |
|---|---|---|---|
| Q1 | Academy name | 1 | Namespaces all DONNA output |
| Q2 | What does your player mix look like? | 1 | Model inference (0.6× weight) |
| Q3 | What matters most to families? | 1 | Model inference (0.4× weight) |
| Q4 | Which age groups are you coaching? | 1 | Active curriculum levels; pathway age floors |
| Q5 | Stage priorities — rank all 7 categories per active stage | 2 | Per-stage weight vector (DONNA converts ranking → percentages); director can override via "Adjust percentages" |
| Q6 | Technical vs tactical vs coach judgment | 2 | Pathway weighting edge; adjusts Q5 ranking if Technique/Tactics are out of order with this answer |
| Q7 | Session duration | 2 | Template `total_minutes`; coach time budget |
| Q8 | Who approves player advancement? | 2 | Level gate strictness for all active levels |
| Q9 | How transparent with parents? | 3 | Portal rules bundle (all 5 visibility toggles) |

Plus operational data: group name + track (required), optional coach invites.

---

## DONNA Inference Logic

### Model Inference (from Q2 + Q3)

| Q2 (player mix) | Q3 (family priorities) | Inferred model |
|---|---|---|
| competitive_juniors | results_rankings | `high_performance` |
| competitive_juniors | development_enjoyment | `junior_development` |
| mixed | results_rankings | `junior_development` |
| mixed | development_enjoyment | `junior_development` (age group tiebreaker → `dual_track` if adults present) |
| mixed | fitness_fun | `recreational` |
| recreational_adult | fitness_fun | `recreational` |
| recreational_adult | development_enjoyment | `recreational` |
| private_small_group | individual_attention | `private_coaching` |
| private_small_group | * | `private_coaching` |

### Derived Configuration (never asked)

| Derived value | Source | Where stored |
|---|---|---|
| Coaching style label | Inferred model | `academy_dna.inferred_coaching_style` |
| Pathway weighting vector | Q2 + Q3 + Q5 (technical/tactical edge) | `academy_dna.pathway_weights` |
| Assessment cadence default | Inferred model | `academy_dna.defaults.assessment_cadence` |
| Coach communication format | Inferred model | `academy_dna.defaults.coach_comm_format` |
| Parent communication tone | Inferred model | `academy_dna.defaults.parent_comm_tone` |
| Player mission style | Fixed default | `portal_rules.player.mission_style = 'progress_focused'` |

### Parent Transparency Preset Bundles (from Q9)

| Q8 choice | domain_scores | competition_history | donna_recs | raw_coach_notes | rankings |
|---|---|---|---|---|---|
| `minimal` | false | false | false | false | false |
| `standard` | true | false | false | false | false |
| `transparent` | true | true | true | false | true |

Raw coach notes are never exposed to parents at any transparency level (protected by design).

### Advancement Approval Mapping (from Q8)

| Q8 answer | Level gate config |
|---|---|
| "I approve every move personally" | `director_only` |
| "DONNA flags it, I confirm quickly" | `strict` |
| "Coaches recommend, I'm notified" | `balanced` |
| "Automatic based on assessment data" | `assessment_driven` |

---

## The academy_dna Object (written on launch)

```typescript
interface AcademyDNA {
  // Phase 1 — director answers
  academy_name: string
  player_mix: 'competitive_juniors' | 'mixed' | 'recreational_adult' | 'private_small_group'
  family_priorities: 'results_rankings' | 'development_enjoyment' | 'fitness_fun' | 'individual_attention'
  age_groups: ('red_ball' | 'orange_ball' | 'green_ball' | 'yellow_ball' | 'high_performance' | 'adult')[]

  // Phase 2 — director answers
  stage_priorities: Record<string, {
    ranking: string[]               // 7 category keys in director-confirmed order
    weights: Record<string, number> // DONNA-computed from ranking; sum = 100
    weights_manually_adjusted: boolean
    confirmed_by_director: boolean
  }>
  priority_edge: 'technical' | 'tactical' | 'coach_judgment'
  session_duration_minutes: 45 | 60 | 75 | 90 | 120
  advancement_approval: 'director_only' | 'strict' | 'balanced' | 'assessment_driven'

  // Phase 3 — director answers
  parent_transparency: 'minimal' | 'standard' | 'transparent'
  groups: { name: string; track: string }[]
  coaches_invited: boolean

  // DONNA computed on save (never asked)
  inferred_model: 'high_performance' | 'junior_development' | 'recreational' | 'private_coaching' | 'dual_track'
  inferred_coaching_style: string
  pathway_weights: Record<string, number>
  portal_rules: {
    parent: {
      domain_scores: boolean
      competition_history: boolean
      donna_recommendations: boolean
      raw_coach_notes: boolean
      rankings: boolean
    }
  }
  defaults: {
    assessment_cadence: string
    coach_comm_format: string
    parent_comm_tone: string
    player_mission_style: string
    level_gate_strictness: string
  }

  // Metadata
  onboarding_version: 'v2'
  classification_shown_in_launch_review: string  // the label DONNA showed at Phase 4
}
```

Written to `academies.settings.academy_dna`.  
`academies.settings.onboarding.onboarding_completed_at` written at same time.

---

## The 4-Phase Flow

### Phase 1 — Your Academy (~3 min)

**DONNA opener:**  
> "Let's set up your academy. Four quick questions — then I'll build your starting system."

- **Q1** — Academy name *(text input, required)*
- **Q2** — What does your player mix look like? *(radio, required)*
  - Mostly competitive juniors aiming for tournaments
  - Mixed — some competitive, mostly developmental
  - Mostly recreational or adult players
  - Primarily private or small-group lessons
- **Q3** — What matters most to their families? *(radio, required)*
  - Results, rankings, and clear progression
  - Development, improvement, and enjoyment
  - Fitness, fun, and staying active
  - Individual attention and feedback
- **Q4** — Which age groups are you coaching? *(multi-select checkboxes, required, min 1)*
  - Red Ball (5–8) / Orange Ball (8–10) / Green Ball (9–11) / Yellow Ball (10+) / High Performance / Adult

**After Q4:** DONNA shows inferred model  
> "Your academy looks like a [inferred model description]. I've pre-built [N] curriculum levels, a default session template, and your parent portal settings. The rest is confirmation."

---

### Phase 2 — Your Program (~4 min)

**DONNA shows (not a question — assertions with edit link):**
- Pre-selected curriculum levels as checkboxes (director adjusts if needed)
- Inferred coaching style as a statement with "Edit" option
- Session block preview as visual (no picker)

**Director answers 4 questions:**
- **Q5** — Stage priorities *(rank-all per active stage)*
  - DONNA pre-populates a 7-item ranking per stage based on inferred model
  - Director confirms or reorders via drag/chips
  - Director ranks **all 7 categories** in order of importance — no sliders, no manual percentage entry, no top-2-only picking
  - DONNA converts ranking → percentages and shows: "Here is how I translated your priorities."
  - Optional: "Adjust percentages" opens editable fields; must sum to 100%
  - Categories: Technique · Tactics · Games · Competition · Movement · Mental · Fun
- **Q6** — When a player struggles technically AND tactically, which do you address first? *(radio)*
  - Technical (grips, contact, stroke mechanics)
  - Tactical (patterns, decisions, court geometry)
  - Whichever their coach judges most limiting
  - *If Q6 conflicts with Q5 ranking order for Technique/Tactics in any stage, DONNA auto-adjusts those two positions and recomputes weights. Director sees the update.*
- **Q7** — How long are your sessions? *(radio)*
  - 45 min / 60 min / 75 min / 90 min / 2 hours
- **Q8** — When a player is ready to move up, who makes the call? *(radio)*
  - I want to approve every advancement personally
  - DONNA flags it, I confirm quickly
  - Coaches can recommend, I'm notified
  - Make it automatic based on assessment data

---

### Phase 3 — Your Team (~3 min)

**Groups (required, 1 minimum):**
- Group name (text input, required)
- Group track — links to a level from confirmed levels (select, required)
- "Add another group" link

**Coaches (optional):**
- "Are you the only coach for now?" → Yes (skip) / No (add coaches)
- If No: name + email + permission preset (Full access / Coaching only / View only)

**Parent experience (1 question):**
- **Q9** — How transparent do you want to be with parents? *(radio, required)*
  - **Minimal** — Basics only. I'll manage communication myself.
  - **Standard** — Progress updates and milestones. No raw scores.
  - **Transparent** — Detailed progress, scores, and development data.

DONNA shows what each choice means in plain language before the director chooses.

---

### Phase 4 — Meet Your Academy (~2 min)

**Checklist (required gates before Launch button unlocks):**
- [ ] Academy name set
- [ ] Curriculum levels confirmed (min 1 active)
- [ ] Stage priorities confirmed for all active stages
- [ ] Session duration set
- [ ] Advancement approval rule set
- [ ] At least 1 group created
- [ ] Parent transparency level chosen
- [ ] Active coach membership exists (director's own counts)

**Meet Your Academy screen — required sections (goal: "DONNA understands my academy"):**
1. **Academy identity** — what kind of academy this is; inferred model label
2. **What matters most** — family priorities in plain language (from Q3)
3. **Curriculum approach** — AcademyOS Curriculum built vs Import pending
4. **How players move up** — advancement approval rule in plain language
5. **Parent communication style** — inferred communication tone + visibility level
6. **Coach support style** — coaching approach label + how DONNA supports coach wrap-ups
7. **DONNA-generated academy classification** — the classification label DONNA reveals here for the first time

**DONNA summary (output, not input):**
> "Your [inferred model label] academy is ready. I've built [N] curriculum levels, [duration]-minute sessions using a [coaching style] template, and [transparency level] parent visibility. This is my starting model — it improves with every session."

**Classification reveal:**
> "Based on your setup, I'd describe this as a [classification label] academy. This shapes my recommendations. You can adjust your settings at any time."

**"Launch Academy →" button** — writes `academy_dna` and `onboarding_completed_at`.

---

## Implementation Plan — Files

### Files to Create

| File | Description |
|---|---|
| `src/app/onboarding/page.tsx` | Server component — fetches academy settings + name, renders OnboardingClient; redirects to `/director` if `onboarding_completed_at` already set |
| `src/app/onboarding/OnboardingClient.tsx` | Client component — 4-phase wizard; 10 director decisions; DONNA context panel (why/what changes/can change later/what if different); rank-all stage priorities; Meet Your Academy with "What I Still Don't Know"; Launch calls server action |
| `src/app/onboarding/actions.ts` | Server action `saveAcademyOnboarding()` — computes inferred model + pathway weights + coaching style + portal rules + defaults; builds `onboarding_conversation` with a `donna_quote` per answer; writes `academy_dna` + `onboarding.onboarding_completed_at` to `academies.settings` JSONB |
| `src/lib/donna/onboarding/donnaOnboardingContextPack.ts` | Pure TS — per-question conversational context: `whyAsking`, `whatChanges`, `canChangeLater`, `differentAnswer`; `donna_quote` templates per answer option; DONNA phase openers; inference labels; coaching style labels; "What I Still Don't Know" items |
| `docs/qa/ACADEMY_ONBOARDING_10_10_CERTIFICATION_1715.md` | 15 post-implementation validation checks |

### Files to Modify

| File | Change |
|---|---|
| `src/lib/donna/today/todayBriefEngine.ts` | Add `hasOnboardingComplete` to `TodayBriefInput`; update `isSetupMode()` to `!hasOnboardingComplete && !isAcademyLive` (backward-compatible); update `buildSetupSteps()` href to `/onboarding` |
| `src/app/director/page.tsx` | Read `settings.onboarding?.onboarding_completed_at` for `hasOnboardingComplete`; pass to `buildTodayBrief()` |
| `docs/CHANGELOG.md` | Sprint entry |
| `docs/certification/DONNA_CAPABILITY_SCORECARD.md` | Update scorecard |

### No Migration Needed

All writes to `academies.settings` JSONB (existing column).  
Key used: `academy_dna` — fixes Seam 6 (old shell wrote `academyOperatingLens`, director page reads `academy_dna`).

---

## Setup Mode Behavior After This Sprint

**Condition for Setup Mode:**  
`!settings.onboarding?.onboarding_completed_at && !isAcademyLive`

- New academies (no onboarding, no live data) → Setup Mode ON
- Academies that complete onboarding → Setup Mode OFF
- Existing academies with live data (pre-this-feature) → Setup Mode OFF (backward-compatible)

**Setup Mode suppresses:** Academy Health, priorities, risks, insights, COO recommendations, promotion recommendations.  
**Setup Mode shows:** Setup progress card, next required step, "Continue with DONNA" CTA, why setup matters.

---

## Deferred Post-Launch (not built in this sprint)

| Item | Lives in |
|---|---|
| Assessment cadence configuration | Academy Settings |
| Coaching style fine-tuning | Academy Settings |
| Coach communication voice | Academy Settings |
| Parent communication tone | Academy Settings |
| Player mission style | Player Portal Settings |
| Fitness template toggle | Academy Settings |
| Per-stage percentage fine-tuning beyond "Adjust percentages" | Academy Settings → Stage Priorities |
| Specific parent visibility toggles | Parent Portal Settings |
| V2: continuous spectrum model (two sliders) | Future sprint |

---

## Open Questions Inherited from Product Review

| # | Question | Impact |
|---|---|---|
| D1 | Does Phase 2 curriculum confirmation write DB records or generate a draft? | If draft: director can abort without partial state. If write: simpler but harder to undo. **V1 decision: all writes happen in one server action at Phase 4 (Launch). No partial DB writes during onboarding.** |
| D2 | Existing directors who used Surface A (`academyOperatingLens` data) — migrate? | `academyOperatingLens` data is not readable by the director page (reads `academy_dna`). Seam 6. V1 decision: existing users see Setup Mode and are invited to complete the new flow. Old key left in place, not deleted. |
| D3 | Coach invites at Phase 3 or at launch? | V1 decision: invites collected at Phase 3 but not sent until Launch button pressed. |
| D4 | Dual-track as V1? | V1: inferred model may produce `dual_track` but no special dual-track UI. DONNA treats it as `junior_development` with adult modifier. |
| D5 | 7 Surface B completion flags retirement | Out of scope for this sprint. |
| D6 | V1 taxonomy vs V2 continuous spectrum | V1: 5-model taxonomy. V2 spectrum flagged as known limitation. |
