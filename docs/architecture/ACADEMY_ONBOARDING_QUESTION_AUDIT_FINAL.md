# Academy Onboarding — Question Audit Final
**Sprint:** Mega Sprint 1715A — Academy Onboarding Final Product Lock V1  
**Date:** 2026-06-10  
**Status:** LOCKED — this document is the audit source of truth for Sprint 1715B implementation  
**Supersedes:** `ACADEMY_ONBOARDING_IMPLEMENTATION_PLAN_V2_1715.md`

---

## Audit Criteria

Every onboarding question must pass all three tests:

1. **Changes system behavior** — DONNA or AcademyOS behaves measurably differently based on the answer.
2. **Impossible or difficult for DONNA to infer** — the answer cannot be derived from any other collected signal.
3. **Creates long-term value** — the answer improves DONNA's quality for the life of the academy, not just at launch.

Fail any one criterion → remove or defer.

---

## Full Question Audit — All Versions

Every question that appeared in any onboarding version (original sprint spec, blueprint, product review) is audited below.

---

### GROUP A — Academy Identity

| Question | Why it exists | Behavior changes? | DONNA can infer? | Required? | Move post-launch? | Decision |
|---|---|---|---|---|---|---|
| **Academy name** | Namespaces all DONNA output; appears in every communication, report, and parent message | Yes — everything is unnamed without it | No — only the director knows the name | Yes | No — launch-day content is named | **KEEP** |
| **Model picker (5 options: HP/JunDev/Rec/Dual/Private)** | Drives ALL default configuration | Yes — if answered correctly | No — but this is where the problem is: directors self-classify upward toward HP; self-classification is the most unreliable onboarding signal | No — behavioral proxy is more accurate and more honest | Yes (in theory) | **REMOVE** — replaced by behavioral inference from Q2 + Q3 |
| **Player mix** *(new behavioral proxy)* | Describes actual program reality, not aspirational identity | Yes — 0.6× weight in model inference; drives curriculum level defaults, assessment defaults, template structure | No — only director knows their actual program | Yes | No — model shapes all recommendations from launch | **KEEP** |
| **What families care about** *(new behavioral proxy)* | Second behavioral axis for model inference | Yes — 0.4× weight in model inference | No — only director knows what drives their parent base | Yes | No — model shapes all recommendations from launch | **KEEP** |
| **Age groups coached** | Determines which curriculum stages are active; pathway age-floor adjustments | Yes — critical: without this, DONNA cannot know which levels to build | No — only director knows their program scope | Yes | No — curriculum structure is built from this | **KEEP** |
| **Location count** | Administrative metadata | None in V1 | Yes (can ask later or infer from groups) | No | Yes — lives naturally in Settings | **REMOVE** — blueprint itself flagged as optional with no V1 effect |
| **Academy timezone** *(from old DNA shell)* | Session scheduling, daily briefing timestamps | Yes — real effect on scheduling | No | No — can be inferred from director's browser locale or asked at account creation, not onboarding | Yes — can be set in Settings | **DEFER** — not an onboarding decision; set at account creation or Settings |

---

### GROUP B — Coaching Identity and Program Emphasis

| Question | Why it exists | Behavior changes? | DONNA can infer? | Required? | Move post-launch? | Decision |
|---|---|---|---|---|---|---|
| **Coaching style picker (8 options)** | Shapes session template structure and wrap-up interpretation | Yes | Yes — almost entirely derived from inferred model; blueprint's own pre-selection table proves this | No | Yes — can be adjusted in Settings | **REMOVE as question** — DONNA asserts the style as a statement; director edits if wrong |
| **Development priority stack (10 items, rank 3–5)** | Shapes pathway weighting vector | Yes — if the ranking contains genuine signal | Mostly — model + coaching styles constrain the plausible stack. The only non-derivable signal is the technical vs tactical edge | No — too high cognitive load for the marginal signal gain | Yes — full ranking is a Settings-level preference | **REMOVE** — replaced by Q7 (forced-choice on the one non-derivable edge) |
| **Technical vs tactical priority edge** *(forced choice)* | Captures the one non-derivable edge of the pathway weighting vector; distinguishes two HP philosophies | Yes — combined with stage weights, determines whether DONNA emphasizes technique or tactics in assessments, curriculum suggestions, and progression recommendations | No — this preference varies even within the same inferred model | Yes | No — shapes assessment and progression for the life of the academy | **KEEP** |
| **Stage weighting (per-stage sliders, original spec)** | Per-stage emphasis distribution (Red/Orange/Green/Yellow/HP × 7 categories) | Yes — drives curriculum emphasis, assessment scoring weights, DONNA explanations per stage | Partially — DONNA can generate strong defaults from the inferred model, but the director's actual priorities per stage carry genuine signal the model can't fully capture | No — in the slider form (too much cognitive load). **Yes in a confirm-defaults form.** | Partially — refinement belongs post-launch; initial signal belongs at onboarding | **REDESIGN** — see Stage Weighting Resolution below |
| **Coach communication voice (structured/conversational/data-driven)** | Sets wrap-up format defaults | Yes | Yes — maps almost entirely to inferred model | No | Yes — post-launch Settings | **REMOVE** — triple derivation of same signal |
| **Wrap-up expectations** | Sets default wrap-up format details | Marginal | Yes — third derivation (model → coaching style → wrap-up) | No | Yes | **REMOVE** |

---

### GROUP C — Curriculum

| Question | Why it exists | Behavior changes? | DONNA can infer? | Required? | Move post-launch? | Decision |
|---|---|---|---|---|---|---|
| **Curriculum spine picker (ITF Extended/Standard/Beginner-Club/Custom)** | Determines which curriculum framework structures the levels | Yes — defines level count and node structure | Yes — fully determined by inferred model + age groups. Blueprint pre-selection table confirms this. | No | Yes | **REMOVE as question** — DONNA asserts the spine; director confirms which levels are active |
| **Active levels (checkboxes)** | Director confirms which levels apply to their academy | Yes — defines which levels accept players; placement and curriculum depend on this | Partially — DONNA pre-selects from model + age groups; director may have custom subset | Yes — director must confirm | No — active levels are a foundational data structure | **KEEP as confirmation** — DONNA pre-selects; director adjusts if needed |
| **Curriculum starting point (AcademyOS / Import / Partner)** | Determines whether DONNA builds curriculum content on launch day or waits for upload | Yes — major behavioral fork: AcademyOS → working curriculum day one; Import → DONNA enters mapping mode; recommendations are lower confidence until mapped | No — this is a binary operational decision only the director can make | Yes | No — this affects the director's entire week-one experience | **KEEP** |
| **Assessment cadence** | Sets assessment reminder frequency | Yes — affects when DONNA surfaces assessment prompts | Partially — model gives a default | No | Yes — varies by season and competition calendar | **DEFER** — set to model default; director adjusts in Settings |
| **Fitness template toggle** | Adds a pre-built fitness session template | Marginal | No | No | Yes | **DEFER** |

---

### GROUP D — Sessions and Advancement

| Question | Why it exists | Behavior changes? | DONNA can infer? | Required? | Move post-launch? | Decision |
|---|---|---|---|---|---|---|
| **Session blocks picker (8 options)** | Defines default session structure (warm-up blocks, drill ratios, etc.) | Yes | Yes — fully determined by coaching style, which is determined by inferred model | No | Yes | **REMOVE as question** — DONNA shows the block preview as a visual; not a choice |
| **Session duration** | Sets `total_minutes` for all session templates; affects coach time budget | Yes — templates are built from this; coach scheduling is built from this | No — depends on court schedule, facility constraints, and program type — all unknown to DONNA | Yes | No — templates are built on launch day from this value | **KEEP** |
| **Level gate strictness picker (strict/balanced/flexible/director-only)** | Defines how automatic player advancement is | Yes — one of the most consequential operating decisions | No — governance preference varies widely even within the same model | Yes — but the language is DONNA-internal, not director language | No — gates are set on launch | **REMOVE as question** — replaced by behavioral question: "who makes the advancement call?" |
| **Advancement approval behavioral** *(replacement)* | Same behavioral outcome as gate strictness, asked in director language | Yes — maps directly to gate strictness; determines who triggers player advancement for all active levels | No — preference varies; cannot be inferred | Yes | No | **KEEP** |

---

### GROUP E — Team Setup

| Question | Why it exists | Behavior changes? | DONNA can infer? | Required? | Move post-launch? | Decision |
|---|---|---|---|---|---|---|
| **Group name + track** | Groups are required for session scheduling and player assignment | Yes — without groups, sessions cannot be organized and players cannot be placed | No | Yes — min 1 group required | No | **KEEP** (operational, not a preference question) |
| **Add more groups** | Director may have multiple training groups | Same as above | No | No — 1 is minimum | Partially — can add groups post-launch | **KEEP as optional add** |
| **Coach name + email** | Creates membership invite | Yes — non-director coaches must have accounts | No | No — solo director's own membership satisfies the requirement | Partially — can invite post-launch | **KEEP with solo escape**: "Are you the only coach?" → Yes skips this section |
| **Coach permission preset** | Defines what coaches can approve and see | Yes — affects approval flows and data access | No | No — only appears if inviting coaches | Partially | **KEEP** (only shown if inviting coaches) |

---

### GROUP F — Parent Experience

| Question | Why it exists | Behavior changes? | DONNA can infer? | Required? | Move post-launch? | Decision |
|---|---|---|---|---|---|---|
| **Parent communication style (progress/outcome/minimal)** | Sets update tone and frequency | Yes | Yes — maps directly to inferred model | No | Yes — director adjusts in Settings | **REMOVE** |
| **Parent visibility toggles (5 individual flags)** | Defines exactly what parents see in portal | Yes | No — director preference | Yes — but wrong UX: directors don't have context to make 5 specific decisions in their first 10 minutes | No — portal is live on day one | **REMOVE as 5 toggles** — replaced by single abstraction question |
| **Parent transparency level (Minimal/Standard/Transparent)** *(replacement)* | Sets all 5 portal visibility flags via preset bundle | Yes — parents see different data from day one depending on this choice | No — director preference; model gives a default but director may actively disagree | Yes | No — parent relationship starts on day one | **KEEP** |
| **Player mission style (challenge/progress/competition/intrinsic)** | Affects player portal tone | Marginal | No | No | Yes — has no effect until players are added | **DEFER** — default to `progress_focused` |

---

## Stage Weighting Resolution

### Should AcademyOS support per-stage weighting?

**Yes.** The reasons:

1. **Different stages are genuinely different programs.** Red Ball is 80% play-based pedagogy. HP is 70% technical-tactical. These differences drive real curriculum decisions, real assessment scoring, and real DONNA recommendations. A single academy-level weight vector cannot express this variation.

2. **Model inference alone is insufficient.** The inferred model gives academy-level defaults. Stage weights add per-stage granularity. Two academies with identical model inferences can have meaningfully different stage priorities — a Junior Development academy with "Games + Fun" emphasis at Red Ball is building a different Red Ball program than one with "Technique + Movement" at Red Ball.

3. **DONNA uses stage weights throughout.** Every assessment summary, curriculum suggestion, and progression recommendation is filtered through stage-appropriate emphasis. If the weights are wrong for a stage, DONNA's outputs for players in that stage are systematically off.

### Why not 28 manual sliders?

28 sliders (4 stages × 7 categories) requires:
- Understanding what all 7 categories mean in practice
- Knowing how to allocate percentages that sum to 100%
- Having enough operational experience to make these decisions reliably
- ~20 minutes of focused effort

A director in their first onboarding session has none of these things. The sliders capture precise values with low accuracy — directors will guess, the guesses will be wrong, and DONNA will operate from bad data.

### Recommended Approach: Confirm-or-Swap Defaults

DONNA generates default stage weights from the inferred model + age groups. These defaults are grounded in sports science research and established developmental pedagogy (ITF play-learn-compete framework as baseline). They are shown to the director before they answer anything.

**The director's interaction:**
For each active stage, DONNA shows:
> "For [Stage], I've set [Category A] and [Category B] as the main focus. [One-line consequence]."

Director picks one of three responses:
- **"Yes, that's right"** — 1 click, confirms the default
- **"Swap one"** — replaces one of the two shown priorities with a different one from the 7 categories
- **"Swap both"** — replaces both shown priorities

**Why this works:**
- Confirming DONNA defaults is near-zero cognitive load
- Swapping is 2 clicks (remove one, add one)
- The director understands the stakes: they see a plain-language consequence statement
- Max cognitive effort: 4 stages × 2 swaps each = 8 decisions, all fast
- Min cognitive effort: 4 stages × 1 click each = 4 decisions (pure confirmation)

**The 7 categories:** Technique, Tactics, Games, Competition, Movement, Mental, Fun

**Weight distribution from top 2:**
- Priority 1: 30% of stage weight
- Priority 2: 22% of stage weight
- Categories 3–7: remaining 48% distributed from stage-default proportions (varies by stage and model)
- Sum: always 100%

**DONNA default top 2 priorities per stage, by inferred model:**

| Model | Red Ball | Orange Ball | Green Ball | Yellow Ball | High Performance |
|---|---|---|---|---|---|
| `high_performance` | Technique + Movement | Technique + Tactics | Tactics + Technique | Tactics + Competition | Competition + Tactics |
| `junior_development` | Games + Fun | Games + Movement | Technique + Games | Technique + Tactics | Tactics + Technique |
| `recreational` | Fun + Games | Fun + Movement | Games + Fun | Games + Fun | — |
| `private_coaching` | Technique + Movement | Technique + Games | Technique + Tactics | Technique + Tactics | Technique + Tactics |
| `dual_track` | Games + Fun (dev) / Technique + Movement (HP) | Games + Movement | Technique + Games | Technique + Tactics | Tactics + Competition |

Adult stage: deferred to post-launch Settings.

**Q7 enrichment:** If director picks "Technical first" at Q7 (tech vs tactical), any stage where Tactics > Technique in the default top 2 gets those two positions swapped. If director picks "Tactical first," the reverse. If "Coach judgment," defaults remain unchanged. Q7 therefore enriches stage weights without replacing them.

### Final Decision on Stage Weighting

Include in Phase 2 (Your Program) as a confirm-or-swap interaction, not a manual entry. Required in flow — confirming defaults is acceptable (1 click per stage). Redesigning from scratch requires swapping.

---

## Curriculum Starting Point Resolution

### Should onboarding include a curriculum starting point decision?

**Yes.** This decision creates materially different system behavior and cannot be inferred.

**Why it matters:**

| Choice | What DONNA does | Director's week-one experience |
|---|---|---|
| **AcademyOS Curriculum** | Builds complete curriculum nodes, templates, and assessments from inferred model + stage weights immediately on launch | Director sees a working curriculum on day one; can start placing players immediately |
| **Import My Curriculum** | Enters mapping mode; defers curriculum content generation until import is complete; all recommendations marked lower confidence until mapped | Director's first task post-launch is the import; curriculum builder is in mapping-pending state |
| **Partner Curriculum** *(disabled V1)* | TBD | — |

The week-one experience is fundamentally different. A director expecting a working curriculum and getting an empty mapping interface would correctly feel the system failed them.

### Where it belongs in the flow

After DONNA shows the pre-selected curriculum levels (Phase 2, confirmation step), before stage weighting. The director has just seen the levels — they know whether those levels match their existing curriculum or whether they need to start from scratch vs import.

### Options

1. **Start with AcademyOS Curriculum** — Recommended. DONNA builds it now. Customizable any time.
2. **Import My Curriculum** — Upload or paste. DONNA maps it to levels. Recommendations are lower confidence until complete.
3. **Partner Curriculum** — Coming Soon. (Shown disabled — visibility confirmed this is a real roadmap item.)

"Build Later" is not an option. DONNA needs a curriculum foundation to be useful. The director must pick a starting point.

### Final Decision

Include as **Q5** in Phase 2. Required. 2 active options + 1 disabled placeholder.

---

## Locked Question Set

### Final 10 Director Decisions

| # | Question | Phase | Type | Behavior change |
|---|---|---|---|---|
| Q1 | Academy name | 1 | Text | Namespaces all DONNA output |
| Q2 | What does your player mix look like? | 1 | Radio (4) | 0.6× model inference weight |
| Q3 | What matters most to families? | 1 | Radio (4) | 0.4× model inference weight |
| Q4 | Which age groups are you coaching? | 1 | Checkboxes (6) | Active stages; curriculum levels |
| Q5 | Curriculum starting point | 2 | Radio (2 active + 1 disabled) | Build now vs import/map |
| Q6 | What matters most at each stage? | 2 | Confirm/swap per active stage | Per-stage emphasis; assessment weights; curriculum focus |
| Q7 | Technical vs tactical when both are struggling | 2 | Radio (3) | Pathway weighting edge |
| Q8 | Session duration | 2 | Radio (5) | Template total_minutes; coach time budget |
| Q9 | Who approves player advancement? | 2 | Radio (4) | Level gate strictness for all active levels |
| Q10 | Parent transparency level | 3 | Radio (3) | Portal visibility bundle for all 5 flags |

### Operational Data (Required, Not Preference Questions)

| Item | Phase | Required? |
|---|---|---|
| Group name + track (min 1) | 3 | Yes |
| Coach invites (solo escape available) | 3 | No — director's own membership satisfies requirement |

### Deferred to Post-Launch Settings

| Item | Default used at launch |
|---|---|
| Academy timezone | Browser locale |
| Assessment cadence | Model default |
| Coaching style label | DONNA assertion from model |
| Coach communication format | Model default |
| Parent communication tone | Model default |
| Player mission style | `progress_focused` |
| Fitness template | Not created |
| Full priority stack ranking | Derived from stage weights + Q7 |
| Specific parent visibility toggle overrides | Preset bundle from Q10 |
| Adult stage priorities | Default recreational weights |
| V2: continuous spectrum model (two sliders) | 5-model taxonomy used in V1 |

### DONNA Assertions (Shown, Not Asked)

| Item | Director's interaction |
|---|---|
| Inferred model description | Shown after Q4; no confirmation required |
| Curriculum spine selection | Shown before Q5; editable via "change" link |
| Coaching style statement | Shown in Phase 2; editable via "edit" link |
| Session block preview (visual) | Shown in Phase 2; not a question |
| Stage weight defaults | Shown per active stage in Q6; director confirms or swaps |

---

## Questions Removed — Final List

| Question | Removed because |
|---|---|
| Model picker (5 options) | Self-classification bias; replaced by behavioral Q2 + Q3 |
| Location count | No V1 system effect |
| Academy timezone | Not an onboarding decision; belongs at account creation |
| Coaching style picker | Derivable from model; DONNA assertion is sufficient |
| Development priority stack (10-ranked) | Most signal is derivable; non-derivable edge captured by Q7 |
| Coach communication voice | Derivable from model |
| Curriculum spine picker | Derivable from model + age groups; DONNA assertion + Q5 replaces it |
| Level gate strictness picker | Internal DONNA terminology; behavioral question (Q9) is equivalent |
| Assessment cadence | No launch-day effect; varies by season |
| Session blocks picker | Derivable from coaching style; DONNA visual preview replaces it |
| Fitness template | No launch-day effect |
| Wrap-up expectations | Third derivation of coaching style |
| Parent communication style | Derivable from model |
| Parent visibility toggles (5 individual) | Wrong abstraction level for new directors; Q10 preset bundle replaces it |
| Player mission style | No effect until players exist |
| Stage sliders (28 manual) | Too high cognitive load; confirm-or-swap replaces it with near-zero load version |

---

## Audit Result

**Before all audits:** 23+ questions across 7 phases  
**After final audit:** 10 director decisions + 2 operational items across 4 phases  
**Estimated onboarding time:** ~10 minutes (solo director confirming DONNA defaults) to ~15 minutes (director customizing stage weights and inviting coaches)  
**Removed:** 13+ questions (no behavior change, fully derivable, or wrong abstraction)  
**Deferred:** 9 items (fine-tuning preferences with no launch-day effect)  
**Redesigned:** 5 questions (abstract label replaced with behavioral equivalent)  
**Assertions instead of questions:** 4 (derivable from prior answers)
