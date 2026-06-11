# Academy Onboarding — Final Specification
**Sprint:** Mega Sprint 1715A — Academy Onboarding Final Product Lock V1  
**Date:** 2026-06-10  
**Status:** LOCKED — updated pre-implementation by Sprint 1715B amendment (Q6 rank-all redesign)  
**Supersedes:** All prior onboarding design docs  
**Implements:** `ACADEMY_ONBOARDING_QUESTION_AUDIT_FINAL.md` + `DONNA_ONBOARDING_CONVERSATION_PACK.md`

---

## Core Principle

Maximum academy understanding. Minimum director effort.

Every question changes system behavior. Every question is impossible to infer. Every question creates long-term value.

**The director should feel: "DONNA understands my academy and is building the operating system with me."**

---

## Priority Principle

When implementation details conflict, resolve in this order:

1. **Director clarity** — the screen must never feel like a form or overwhelm the director.
2. **DONNA understanding** — the system must build an accurate model of the academy from the answers given.
3. **Engineering elegance** — if something is harder to build but produces better clarity or understanding, build the harder thing.

> Deep system. Simple screen. DONNA handles complexity.

---

## Conversational Design Principles (Req #3 — Sprint 1715B)

Onboarding must feel like a conversation, not a form.

Every phase and every question must include:
- **DONNA introduction** — why she is asking this
- **What this changes** — how this answer shapes recommendations
- **Can be changed later?** — where in Settings to find it post-launch
- **What if different?** — one sentence on what changes if they answer the other way

Example exchange:

> Director: "Why are you asking this?"
>
> DONNA: "Because this changes how I evaluate player development and recommend curriculum adjustments. If you tell me your players are mostly competitive juniors, I'll build a higher-intensity pathway with more competition prep. If you say recreational, I'll focus on engagement and retention."

All DONNA context text is provided by `donnaOnboardingContextPack.ts` — the UI renders it, it does not generate it.

---

## Conversational Memory Requirement (Req #1 — Sprint 1715B)

Every onboarding answer must be stored in a structure that DONNA can reference in later conversation.

Not: "academy_dna exists."

But: DONNA can say:
- "You told me during onboarding that Fun was the highest priority for Red Ball players."
- "You told me that technical development comes before competition."
- "You told me parents should have Transparent visibility."

This is achieved by writing an `onboarding_conversation` block to `academy_dna` at Launch. Each answer is stored as a `donna_quote` — a plain-language statement DONNA can retrieve and use verbatim.

See the `onboarding_conversation` schema in "What Launch Academy Writes" below.

---

## The 4-Phase Flow

```
Phase 1 — Your Academy   (~3 min)
Phase 2 — Your Program   (~5 min)
Phase 3 — Your Team      (~3 min)
Phase 4 — Meet Your Academy  (~2 min)
```

No orientation slides. No Phase 0. DONNA's competence is the orientation.

Total: ~10–13 minutes for a solo director. ~15 minutes if customizing stage weights and inviting coaches.

---

## Phase 1 — Your Academy

### DONNA Opener

> "Let's build your academy. Four quick questions — then I'll show you what I've built."

### Q1 — Academy Name

- **Type:** Text input
- **Required:** Yes
- **Validation:** Non-empty, trimmed
- **Behavior change:** Namespaces all DONNA output; appears in all communications and reports
- **DONNA inference:** None — only the director knows

### Q2 — Player Mix

- **Type:** Radio (pick 1 of 4)
- **Required:** Yes
- **Options:**
  - `competitive_juniors` — "Mostly competitive juniors aiming for tournaments"
  - `mixed` — "Mixed — some competitive, mostly developmental"
  - `recreational_adult` — "Mostly recreational or adult players"
  - `private_small_group` — "Primarily private or small-group lessons"
- **Behavior change:** 0.6× weight toward model inference (see inference table below)

### Q3 — What Families Care About

- **Type:** Radio (pick 1 of 4)
- **Required:** Yes
- **Options:**
  - `results_rankings` — "Results, rankings, and clear level progression"
  - `development_enjoyment` — "Development, improvement, and enjoying the game"
  - `fitness_fun` — "Fitness, fun, and staying active"
  - `individual_attention` — "Individual attention and personalized feedback"
- **Behavior change:** 0.4× weight toward model inference

### Q4 — Age Groups

- **Type:** Multi-select checkboxes (min 1 required)
- **Required:** Yes (min 1)
- **Options:**
  - `red_ball` — "Red Ball (5–8)"
  - `orange_ball` — "Orange Ball (8–10)"
  - `green_ball` — "Green Ball (9–11)"
  - `yellow_ball` — "Yellow Ball (10+)"
  - `high_performance` — "High Performance"
  - `adult` — "Adult"
- **Behavior change:** Determines which curriculum stages are active; Q6 shows only these stages; curriculum levels pre-selected from this set

### DONNA Inference Display (after Q4)

DONNA computes `inferred_model` from Q2 + Q3 (see inference table).

DONNA shows:

> "Based on what you told me, [Academy Name] looks like a **[inferred model description]**.
>
> I've pre-built:
> - [N] curriculum levels across [active stage names]
> - A default session template ([coaching style label])
> - Parent portal settings ([parent transparency default])
>
> Everything below is a confirmation. Adjust anything that doesn't look right."

No input required from the director at this point. Display only.

---

## Phase 2 — Your Program

### DONNA Opener

> "Here's what I've pre-built for your program."
>
> "Confirm what's right. Change what isn't."

### Curriculum Levels Confirmation (DONNA Assertion)

DONNA pre-selects active levels from inferred model + Q4 age groups.

Director sees checkboxes — pre-selected. Director can uncheck levels that don't apply or add levels DONNA missed.

**This is a confirmation step, not a question.** If director makes no changes, it counts as confirmed.

### Q5 — Curriculum Starting Point

- **Type:** Radio (pick 1)
- **Required:** Yes
- **Options:**
  - `academyos_curriculum` — "Start with AcademyOS Curriculum" — *(Recommended)* I'll build your curriculum content now. Customizable any time.
  - `import_curriculum` — "Import My Curriculum" — Upload or paste your existing curriculum. I'll map it to your levels after launch.
  - `partner_curriculum` — "Partner Curriculum" — Coming soon. *(DISABLED — visually present, not selectable)*
- **Behavior change:**
  - `academyos_curriculum` → DONNA generates curriculum nodes, drill banks, and skill progressions on save. Working curriculum on day one.
  - `import_curriculum` → DONNA creates level structure only. Curriculum content is in mapping-pending state. All early recommendations marked lower confidence until mapping complete.
- **No "Build Later" option** — a curriculum baseline is required.

### Coaching Style Assertion (DONNA Assertion, Editable)

DONNA shows the inferred coaching style as a statement:

> "Your coaching approach looks like: **[Coaching style label]**."
> "[One-sentence description]."
> "I'll use this to configure your session templates and interpret coach wrap-up notes."
> [Edit ↗]

If director clicks Edit: show a plain-language description list (not technical labels). Director picks the description that fits best.

**This is not a question.** Default = no change.

### Session Block Preview (DONNA Assertion, Read-Only)

DONNA shows a visual block diagram of the default session structure.

No input. No picker. Informational only. Director customizes individual sessions after launch.

### Q6 — Stage Priorities

- **Type:** Rank-all (drag-to-reorder or numbered chips) per active stage
- **Required:** Yes for each active stage; accepting DONNA's default counts as confirmed (1 click)
- **Shown stages:** Only stages matching Q4 selections. `adult` stage deferred to Settings.
- **7 categories:** Technique · Tactics · Games · Competition · Movement · Mental · Fun
- **Constraints:** Director ranks **all 7 categories** — no sliders, no manual percentage entry during onboarding, no top-2-only restriction. Rankings are mandatory; percentage adjustment is optional.

**Interaction per stage:**

> **[Stage Name]**
> Here is how I'd prioritize this stage for your academy.
>
> 1. [Category]  2. [Category]  3. [Category]  4. [Category]  5. [Category]  6. [Category]  7. [Category]
>
> [✓ That's right]  [Reorder →]

After confirming or reordering:

> "Here is how I translated your priorities."
>
> Technique 25% · Movement 21% · Fun 18% · Games 14% · Mental 11% · Tactics 7% · Competition 4%
>
> [Adjust percentages ↗]

"Adjust percentages" opens editable percentage fields. All 7 fields are editable. Running total shown; Save is disabled until the sum equals 100%. Exiting without saving reverts to DONNA's conversion.

**Rank → percentage conversion (fixed lookup):**

Compressed decay so no category falls below 6% — every ranked category contributes meaningfully to the stage model. Directors never enter percentages manually during onboarding; ranking comes first and DONNA translates.

| Rank | Percentage |
|---|---|
| 1 | 24% |
| 2 | 20% |
| 3 | 17% |
| 4 | 14% |
| 5 | 11% |
| 6 | 8% |
| 7 | 6% |

- **Q7 enrichment:** After Q7 (technical vs tactical) is answered, if it conflicts with the ranking (e.g., Tactics is ranked above Technique but Q7 says "Technical first"), DONNA swaps Technique and Tactics positions in the affected stages and recomputes percentages. Director sees the updated ranking on the next pass. Manually adjusted percentages are not touched.

**DONNA default rankings for Q6 by inferred model:**

| Model | Stage | Default ranking (1 → 7) |
|---|---|---|
| `high_performance` | Red Ball | Technique · Movement · Fun · Games · Mental · Tactics · Competition |
| `high_performance` | Orange Ball | Technique · Tactics · Movement · Mental · Games · Fun · Competition |
| `high_performance` | Green Ball | Tactics · Technique · Movement · Mental · Games · Competition · Fun |
| `high_performance` | Yellow Ball | Tactics · Competition · Technique · Mental · Movement · Games · Fun |
| `high_performance` | High Performance | Competition · Tactics · Technique · Mental · Movement · Games · Fun |
| `junior_development` | Red Ball | Games · Fun · Movement · Technique · Mental · Tactics · Competition |
| `junior_development` | Orange Ball | Games · Movement · Technique · Fun · Mental · Tactics · Competition |
| `junior_development` | Green Ball | Technique · Games · Tactics · Movement · Mental · Fun · Competition |
| `junior_development` | Yellow Ball | Technique · Tactics · Movement · Mental · Games · Competition · Fun |
| `junior_development` | High Performance | Tactics · Technique · Competition · Mental · Movement · Games · Fun |
| `recreational` | Red Ball | Fun · Games · Movement · Mental · Technique · Tactics · Competition |
| `recreational` | Orange Ball | Fun · Movement · Games · Mental · Technique · Tactics · Competition |
| `recreational` | Green Ball | Games · Fun · Movement · Mental · Technique · Tactics · Competition |
| `recreational` | Yellow Ball | Games · Fun · Movement · Mental · Tactics · Technique · Competition |
| `private_coaching` | All stages | Technique · Movement · Tactics · Mental · Games · Fun · Competition |
| `dual_track` | Red Ball | Games · Fun · Movement · Technique · Mental · Tactics · Competition |
| `dual_track` | Orange Ball | Games · Movement · Technique · Fun · Mental · Tactics · Competition |
| `dual_track` | Green Ball | Technique · Games · Tactics · Movement · Mental · Fun · Competition |
| `dual_track` | Yellow Ball | Technique · Tactics · Movement · Mental · Games · Competition · Fun |
| `dual_track` | High Performance | Tactics · Competition · Technique · Mental · Movement · Games · Fun |

### Q7 — Technical vs Tactical Priority Edge

- **Type:** Radio (pick 1 of 3)
- **Required:** Yes
- **Options:**
  - `technical_first` — "Technical — fix stroke mechanics, grips, and contact before working on tactics"
  - `tactical_first` — "Tactical — work on patterns and decisions first; technique follows from game understanding"
  - `coach_judgment` — "Whichever their coach judges is most limiting for that player"
- **Behavior change:** Feeds into pathway weighting vector. Combined with Q6 stage priorities, determines whether DONNA emphasizes technique or tactics in assessments, curriculum suggestions, and progression recommendations. If conflicts with Q6 ordering, auto-adjusts stage top-2 order.

### Q8 — Session Duration

- **Type:** Radio (pick 1 of 5)
- **Required:** Yes
- **Options:** 45 min / 60 min / 75 min / 90 min / 2 hours
- **Behavior change:** Sets `total_minutes` for all session templates; affects coach time budgets; block ratios built from this

### Q9 — Advancement Approval

- **Type:** Radio (pick 1 of 4)
- **Required:** Yes
- **Options and mappings:**
  - `director_only` — "I want to approve every advancement personally" → `director_only` gate config
  - `donna_flags_director_confirms` — "DONNA flags it, I confirm quickly" → `strict` gate config
  - `coach_recommends_notified` — "Coaches can recommend, I'm notified" → `balanced` gate config
  - `assessment_driven` — "Make it automatic based on assessment data" → `assessment_driven` gate config
- **Behavior change:** Level gate strictness set for all active levels. Determines who triggers player advancement from day one.

---

## Phase 3 — Your Team

### DONNA Opener

> "Almost done. Your training groups and parent settings — then you're ready."

### Group Setup

- **Required:** Yes — min 1 group
- **Fields per group:**
  - Group name (text, required)
  - Level track — select from active levels confirmed in Phase 2 (required)
- **"Add another group" link** — director may create multiple groups
- **Behavior change:** Groups are the unit of session scheduling, player assignment, and coach workload tracking. No groups = no sessions.

### Coach Invites

- **Required:** No — director's own membership satisfies the active coach requirement
- **Entry point:** "Are you the only coach for now?" → Yes = skip; No = show invite form
- **Fields per coach:**
  - Full name (text, required if adding)
  - Email (required if adding)
  - Permission preset: Full access / Coaching only / View only (required if adding)
- **"Add another coach" link**
- **Permission preset behavior:**
  - Full access: Can do everything except Academy Settings
  - Coaching only: Can submit wrap-ups, run sessions, write player notes. Cannot approve placements or send parent communications.
  - View only: Read-only access to all player and session data
- **Invites are sent at Launch, not when entered here**

### Q10 — Parent Transparency

- **Type:** Radio (pick 1 of 3)
- **Required:** Yes
- **Options and portal bundles:**

| Choice | domain_scores | competition_history | donna_recommendations | raw_coach_notes | rankings |
|---|---|---|---|---|---|
| `minimal` | false | false | false | false | false |
| `standard` | true | false | false | false | false |
| `transparent` | true | true | true | false | true |

*Raw coach notes are never exposed to parents at any transparency level — protected by design.*

- **Display text:**
  - Minimal: "Basics only. Enrolment status, upcoming sessions, attendance. I'll manage communication directly."
  - Standard: "Progress updates and level milestones. Parents see development summaries — no raw scores or assessment details."
  - Transparent: "Detailed progress data. Parents see domain scores, development trends, and level position. No raw coach notes at any level."
- **DONNA shows what each choice means in plain language before the director chooses**
- **Behavior change:** All 5 parent portal visibility flags are set from this single choice. Director can override individual flags post-launch in Settings.

---

## Phase 4 — Meet Your Academy

### DONNA Opener

> "Here is what I know about [Academy Name]."
>
> "This is your starting model."

### Required Checklist (gates Launch button)

All 9 items must be green before "Launch Academy" button activates:

1. Academy name set
2. Curriculum levels confirmed (min 1 active)
3. Curriculum starting point selected
4. Stage priorities confirmed for all active stages
5. Technical vs tactical priority set
6. Session duration set
7. Advancement approval rule set
8. At least 1 group created
9. Active coach membership exists (director's own counts)

If any item is incomplete, Launch button is disabled. DONNA shows: "[Item name] is not set. [Fix it →] link."

### Meet Your Academy — Exact Screen Copy

---

**DONNA understands [Academy Name].**

*Here is your starting model.*

---

**Academy identity**

[Plain-language description based on Q2, e.g.: "Primarily competitive juniors aiming for tournaments."]

Academy type: **[Inferred model name — e.g., Junior Development Academy]**

---

**What matters most**

Families care most about: **[family priorities plain-language description from Q3, e.g., "Results, rankings, and clear level progression."]**

---

**How you develop players**

Your sessions run **[duration] minutes** using a **[coaching style description]** approach.

**[Technical / Tactical / Balanced]** priority when players are stuck between technical and tactical development.

Players advance when: **[advancement approval plain-language description]**

---

**Your stages**

| Stage | #1 | #2 | #3 |
|---|---|---|---|
| [Row for each active stage] | [Rank 1 category] | [Rank 2 category] | [Rank 3 category] |

*(Full 7-category ranking and derived percentages are stored in `academy_dna.stage_priorities`. The table shows top 3 for readability.)*

---

**Coach support style**

**[Coaching style label]** — [One-sentence coaching style description.]

I'll interpret coach wrap-up notes through this lens and surface session insights in their coaching format.

Coaches [role in advancement — e.g., "can recommend player advancement; you'll be notified before any level change takes effect." or "submit wrap-ups; you personally approve every advancement." — based on Q9.]

---

**Your curriculum**

[AcademyOS Curriculum — [N] levels built and ready to use.]
*OR*
[Import My Curriculum — Level structure ready. Curriculum content pending your import.]

Active levels: [list of level names]

---

**Parent communication style**

**[Minimal / Standard / Transparent]** visibility.

[One sentence: what parents can see + what they cannot.]

Communication tone: **[inferred parent communication tone — e.g., "Outcome-focused" / "Progress-focused" / "Minimal"]** — [one-sentence description of what this means for parent updates].

---

**Your team**

[N] training groups. [You are the solo coach. / [N] coaches invited.]

---

---

**What DONNA now knows**

✓ Academy philosophy — [inferred model description]
✓ Curriculum model — [AcademyOS built / Import pending]
✓ Promotion rules — [advancement approval description]
✓ Parent visibility — [transparency level]
✓ Session structure — [duration] min, [coaching style approach]
✓ Stage priorities — [N] stages configured

---

**What I still don't know**

I'll learn these from real data after you launch:

• Coach execution patterns — how your coaches actually run sessions vs the template
• Parent engagement patterns — how families respond to communications
• Player progression patterns — where players advance, stall, or need support
• Session quality patterns — attendance trends, wrap-up completion, observation depth
• Assessment patterns — how frequently the academy actually assesses vs the cadence I've assumed

*This is expected. DONNA's model improves with every session, every assessment, and every director decision.*

---

*Everything here can be adjusted from Academy Settings.*

---

**[ Launch [Academy Name] → ]**

---

### What "Launch Academy" Writes to the Database

Single server action. All writes happen atomically. Nothing is written before the director presses Launch.

```typescript
// academies.settings.academy_dna
{
  onboarding_version: 'v2',

  // Phase 1 — director answers
  academy_name: string,
  player_mix: 'competitive_juniors' | 'mixed' | 'recreational_adult' | 'private_small_group',
  family_priorities: 'results_rankings' | 'development_enjoyment' | 'fitness_fun' | 'individual_attention',
  age_groups: string[],

  // Phase 2 — director answers
  curriculum_starting_point: 'academyos_curriculum' | 'import_curriculum',
  stage_priorities: {
    [stage: string]: {
      ranking: string[],              // 7 category keys in director-confirmed order
      weights: Record<string, number>, // 7 keys, sum to 100 — DONNA-computed from ranking
      weights_manually_adjusted: boolean, // true if director used "Adjust percentages"
      confirmed_by_director: boolean,
    }
  },
  priority_edge: 'technical_first' | 'tactical_first' | 'coach_judgment',
  session_duration_minutes: 45 | 60 | 75 | 90 | 120,
  advancement_approval: 'director_only' | 'donna_flags_director_confirms' | 'coach_recommends_notified' | 'assessment_driven',

  // Phase 3 — director answers
  parent_transparency: 'minimal' | 'standard' | 'transparent',
  groups: { name: string; track: string }[],
  coaches_invited: boolean,

  // DONNA computed on save — never asked
  inferred_model: 'high_performance' | 'junior_development' | 'recreational' | 'private_coaching' | 'dual_track',
  inferred_coaching_style: string,
  pathway_weights: Record<string, number>,  // stage-weighted composite
  portal_rules: {
    parent: {
      domain_scores: boolean,
      competition_history: boolean,
      donna_recommendations: boolean,
      raw_coach_notes: boolean,  // always false — never exposed
      rankings: boolean,
    }
  },
  defaults: {
    assessment_cadence: string,
    coach_comm_format: string,
    parent_comm_tone: string,
    player_mission_style: string,
    level_gate_strictness: string,
  },

  // Launch metadata
  classification_shown_at_launch: string,  // exact label shown in Meet Your Academy

  // Conversational memory — DONNA retrieves these to quote back in conversation
  // "You told me during onboarding that Fun was the highest priority for Red Ball players."
  onboarding_conversation: {
    version: 'v2',
    saved_at: string,
    statements: Array<{
      key: string,           // 'player_mix' | 'family_priorities' | 'age_groups' | 'stage_priority_red_ball' | etc.
      question: string,      // The exact question DONNA asked
      answer_value: string,  // The raw value selected (enum key)
      answer_label: string,  // The human-readable option label
      donna_quote: string,   // "You told me that..." — DONNA uses verbatim in conversation
      affects: string[],     // System behaviors this answer shapes (for context in conversation)
    }>
  }
}

// academies.settings.onboarding
{
  onboarding_completed_at: string,  // ISO timestamp
  onboarding_version: 'v2',
}
```

---

## Setup Mode Behavior

### Condition for Setup Mode

```typescript
isSetupMode = !settings.onboarding?.onboarding_completed_at && !isAcademyLive
```

- **New academy (no onboarding, no live data):** Setup Mode ON
- **Academy that completes onboarding:** Setup Mode OFF (onboarding_completed_at is set)
- **Existing academy with live data (pre-this-feature):** Setup Mode OFF (backward-compatible — isAcademyLive protects existing users)

### What Setup Mode Shows

Setup Mode suppresses:
- Academy Health summary
- Top Priorities card
- Top Risks card
- COO recommendations
- Promotion recommendations
- Trend insights
- Dashboard insights

Setup Mode shows:
- Setup progress card (TodaySetupCard with step list)
- Setup steps pointing to `/onboarding` (not the old `/director/setup`)
- "Continue with DONNA" CTA on incomplete step
- Why setup matters (brief DONNA explanation of what each step unlocks)

### Setup Progress Steps (TodaySetupCard)

| Step | Complete condition | Action label | Action href |
|---|---|---|---|
| Academy identity set up | `settings.academy_dna` exists | Set up with DONNA | `/onboarding` |
| Players added | `activePlayers > 0` | Add first player | `/director/players/new` |
| Session templates created | `classTemplateCount > 0` | Create template | `/director/templates` |
| First session scheduled | `sessionsExist` | Schedule session | `/director/sessions` |

---

## DONNA Inference Tables

### Model Inference (Q2 + Q3)

| Player Mix (Q2) | Family Priorities (Q3) | Inferred Model |
|---|---|---|
| `competitive_juniors` | `results_rankings` | `high_performance` |
| `competitive_juniors` | `development_enjoyment` | `junior_development` |
| `competitive_juniors` | `fitness_fun` | `junior_development` |
| `competitive_juniors` | `individual_attention` | `private_coaching` |
| `mixed` | `results_rankings` | `junior_development` |
| `mixed` | `development_enjoyment` | `junior_development` |
| `mixed` | `fitness_fun` | `recreational` |
| `mixed` | `individual_attention` | `junior_development` |
| `recreational_adult` | `results_rankings` | `recreational` |
| `recreational_adult` | `development_enjoyment` | `recreational` |
| `recreational_adult` | `fitness_fun` | `recreational` |
| `recreational_adult` | `individual_attention` | `recreational` |
| `private_small_group` | `results_rankings` | `private_coaching` |
| `private_small_group` | `development_enjoyment` | `private_coaching` |
| `private_small_group` | `fitness_fun` | `private_coaching` |
| `private_small_group` | `individual_attention` | `private_coaching` |

Adult age group tiebreaker: if Q4 includes `adult` and model infers `junior_development` AND adult makes up >30% of player mix description, infer `dual_track` instead.

### Inferred Model Descriptions (shown in DONNA responses)

| Model | DONNA description |
|---|---|
| `high_performance` | "A competitive junior academy focused on tournament results and structured development" |
| `junior_development` | "A junior development academy focused on player improvement and long-term growth" |
| `recreational` | "A recreational academy focused on enjoyment, fitness, and player engagement" |
| `private_coaching` | "A private coaching program focused on individual attention and personalized development" |
| `dual_track` | "A dual-track academy running development and recreational programs in parallel" |

### Advancement Approval → Level Gate Strictness

| Q9 Answer | `level_gate_strictness` stored |
|---|---|
| `director_only` | `director_only` |
| `donna_flags_director_confirms` | `strict` |
| `coach_recommends_notified` | `balanced` |
| `assessment_driven` | `assessment_driven` |

### Parent Transparency → Portal Rules Bundle

| Q10 | domain_scores | competition_history | donna_recs | raw_coach_notes | rankings |
|---|---|---|---|---|---|
| `minimal` | false | false | false | false | false |
| `standard` | true | false | false | false | false |
| `transparent` | true | true | true | false | true |

### Inferred Coaching Style (from model)

| Model | Coaching style label | Plain-language description |
|---|---|---|
| `high_performance` | Performance-Technical | "Technical precision and tactical discipline — building toward competition readiness" |
| `junior_development` | Fundamentals-to-Game | "Technical fundamentals first, building toward tactical application as players develop" |
| `recreational` | Joy-Retention | "Play-first approach — keeping players engaged, active, and coming back" |
| `private_coaching` | Individual-Technical | "Highly personalized technical development — each player's program is unique" |
| `dual_track` | Split-Track | "Two parallel approaches: development-focused for competitive players, play-focused for recreational" |

### Inferred Default Parent Transparency (from model — shown before Q10)

| Model | Default shown to director |
|---|---|
| `high_performance` | `transparent` |
| `junior_development` | `standard` |
| `recreational` | `minimal` |
| `private_coaching` | `standard` |
| `dual_track` | `standard` |

Director may override at Q10. This default is displayed but not enforced.

### Inferred Defaults (set at save, not asked)

| Setting | Derivation |
|---|---|
| `defaults.assessment_cadence` | HP → `monthly`; JunDev → `every_6_weeks`; Rec → `quarterly`; Private → `director_triggered` |
| `defaults.coach_comm_format` | HP → `data_driven`; JunDev → `structured`; Rec → `conversational`; Private → `structured` |
| `defaults.parent_comm_tone` | HP → `outcome_focused`; JunDev → `progress_focused`; Rec → `minimal`; Private → `progress_focused` |
| `defaults.player_mission_style` | Always `progress_focused` (deferred setting) |
| `defaults.level_gate_strictness` | Derived from Q9 answer — same as `advancement_approval` mapping above |

---

## Academy Classification

### What It Is

A plain-language label DONNA generates from the full set of onboarding signals. Not a director input. Not stored as a separate field. Computed as a read-only summary label from `inferred_model` + key signals.

### When It Is Shown

**Only at Phase 4 (Meet Your Academy)**, as part of the summary. The director sees the classification for the first time here — as a DONNA output, never as a choice they made.

### Format at Meet Your Academy

> "Academy type: **[Classification label]**"

Where classification label = the human-readable model description shown in the inference table above (e.g., "Junior Development Academy").

### Director Response Options

None required. The classification is informational. If director disagrees, they can adjust their answers in Academy Settings post-launch, which will update the inferred model.

### Academy Classification Is Not:

- A question asked during onboarding
- A picker with 5 options
- Something the director self-selects
- A permanent label
- A field stored separately from the inferred model

---

## Curriculum Starting Point Behavior

### AcademyOS Curriculum

DONNA generates on launch:
- Curriculum nodes per active level
- Skill progression definitions per stage
- Default drill and activity bank entries per level
- Template blocks linked to stage priorities

Director's week-one experience: opens Curriculum section and sees a working structure they can immediately use and customise.

### Import My Curriculum

DONNA generates on launch:
- Level structure only (level names, tracks, gates)
- Placeholder curriculum nodes marked `pending_import`
- Import wizard queued as first post-launch task

Director's week-one experience: opens Curriculum section and sees the import flow as the first step. DONNA walks through mapping uploaded content to active levels. Recommendations are marked `lower_confidence` until import is mapped.

---

## What This Spec Does Not Cover (Deferred to Post-Launch)

| Item | Location post-launch |
|---|---|
| Academy timezone | Account / Settings |
| Full coaching style fine-tuning | Academy Settings → Coaching Identity |
| Specific assessment cadence | Academy Settings → Assessment |
| Parent visibility toggle overrides | Parent Portal Settings |
| Player mission style | Player Portal Settings |
| Adult stage priorities | Academy Settings → Stage Priorities |
| Fitness template creation | Templates section |
| Coach permission fine-tuning | Team Settings |
| Full priority stack ranking | Academy Settings → Pathway Weighting |
| V2 continuous spectrum model | Future sprint |
| Partner curriculum integration | Future sprint |

---

## Open Questions (from Product Review — status at time of lock)

| # | Question | V1 Decision |
|---|---|---|
| D1 | Phase 2 curriculum confirmation — draft or write? | All writes at Launch only. No partial DB writes during onboarding. |
| D2 | Existing directors with `academyOperatingLens` data | Existing users see Setup Mode; invited to complete new flow. Old key left in place. |
| D3 | Coach invites — send at Phase 3 or at Launch? | Invites collected at Phase 3; sent at Launch when director presses button. |
| D4 | Dual-track as V1? | Inferred `dual_track` in model. No special dual-track UI in V1. |
| D5 | Surface B completion flags retirement | Out of scope for this sprint. |
| D6 | V1 taxonomy vs V2 continuous spectrum | V1: 5-model taxonomy. V2 spectrum is a known limitation. |
