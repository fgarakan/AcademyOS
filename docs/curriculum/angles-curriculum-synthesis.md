# Academy OS — Product-Agnostic Curriculum Synthesis

**Created:** 2026-05-02
**Status:** DRAFT — pending master spine creation
**Owner:** Farshad Garakani, Founder — Angles / Academy OS
**Exclusion reference:** `docs/curriculum/product-tool-exclusion-decision.md`

---

## 1. Product-Agnostic Curriculum Decision

The Academy OS core curriculum is intentionally and permanently independent from any Angles physical product, hardware device, or proprietary app. This is not a gap to be filled later — it is a deliberate architectural decision made before the first data model sprint.

**Why this matters at the system level:** Gates must be evaluable by direct coach observation using standard tennis equipment. Technical criteria must be describable in plain stroke and movement terms. Drills must be runnable with court, balls, racquet, and cones. Coach language must be intelligible without knowing what any Angles product is. Any academy — whether they use Angles tools or not — must be able to run the full curriculum, progress players, and operate AOS successfully.

**What this does not mean:** The Angles coaching *philosophy* — Learn • Train • Play, intention → action → skill, court mapping, decision-tree progression, dual-track development, evidence-based gates, positive coaching language — is embedded throughout the curriculum at every stage. Philosophy is not a product. It is a pedagogical position.

**The future optional layer:** Angles physical products and proprietary apps may later become an opt-in integration on top of the core curriculum. This optional layer — described in Section 6 — is additive. It does not replace or gate the core. It enriches the evidence record for academies that choose it.

---

## 2. Source File Map

### PRIMARY SOURCES — import-ready or high-confidence content

**`AOS_Curriculum_Matrix.xlsx`** (Piece 1)
The 15-stage × 8-domain developmental spine. 4 sheets: README, Stage Index (15 rows), Domain Index (8 rows), Matrix (15 rows × 8 domain columns = 120 cells). Each cell is dense coach-actionable prose. The Stage Index provides one-line summaries per stage. The Domain Index defines each of the 8 domains. This is the foundational document — every other piece cross-references it. If the Matrix says something, it is the curriculum specification. **Import-ready:** Stage Index and Domain Index can seed `curriculum_stages` and `curriculum_domains` tables directly. The Matrix cells require synthesis into the master spine before import.

**`AOS_Curriculum_Gates.xlsx`** (Piece 2)
57 measurable level-up gate criteria covering 15 transitions (Red 1 → Red 2 through HP 3 → Out). 3 sheets: Gate Spec Format (schema documentation), Gate Library (57 rows × 12 columns), Summary (transitions + totals). Each gate has a structured ID (`RED1__RED2__01`), from/to stages, domain, criterion text, type (RATE / COUNT / OBSERVATION / TIME_WINDOW / CHECKLIST / RESULT), specific threshold, recording method, evidence window, evaluator, and cadence. **Import-ready:** The Gate Library is the most database-ready file in the set. Minor `[PROPOSED:]` flags appear in the Notes column only — these are informational and do not affect gate criteria.

**`AOS_Curriculum_Tactics.xlsx`** (Piece 4)
The court-mapping vocabulary and tactical progression engine. 6 sheets: README, Zone Atlas (6 zones × 7 cols), Decision Trees (30 stage/situation rows), Pattern Progression (8 patterns), Bisector Recovery, Court Diagram. The six zones — middle, crosscourt, short angle, line, transition, endgame — are defined with precision and applied stage-by-stage in a growing decision tree. No product dependencies. **High-confidence, import-ready** as taxonomy reference. Decision Trees and Pattern Progression require synthesis.

**`AOS_Curriculum_Drills.xlsx`** (Piece 5)
152 drills with complete database schema. 5 sheets: README, Schema (15 field definitions), Drill Library (152 rows × 16 columns), Stage Coverage (pivot), Tags Index (227 tag entries). Each drill has: `drill_id`, `name`, `stage_min`, `stage_max`, `domain`, `session_block`, `objective`, `setup`, `procedure`, `coaching_cues` (in Doing Well / Working On / Current Focus / Next Step format), `progression_easier`, `progression_harder`, `success_criteria`, `duration_minutes`, `players_needed`, `tags`. Product-independent by explicit design. **Directly importable** as the `exercise_library` seed dataset.

**`AOS_Curriculum_CoachLanguage.xlsx`** (Piece 8)
The 4-phrase coaching language system for every stage × domain combination. 10 sheets: README, Coach Language (Long) — 120 full entries, plus 8 domain-specific sheets (Technical, Tactical, Movement, Competition, Mentality, Fitness, Recovery, Lifestyle), each with 15 stage rows. Zero product dependencies. Zero `[PROPOSED:]` flags. **Directly importable** as `curriculum_coach_language` seed data. The Coach Language (Long) sheet is the primary source; domain sheets are query-optimized views of the same content.

**`AOS_Curriculum_StressTest.xlsx`** (Piece 10)
Validation and requirements layer. 4 sheets: README, Archetypes (8 archetypes), Trace (120 rows), Failure Modes (14 failure modes). The 8 player archetypes (A1–A8) and 14 failure modes are engineering requirements — they describe what the data model and UI must handle, not what should be handled if convenient. 4 CRITICAL, 6 HIGH, 4 MEDIUM failure modes. **Treat as requirements backlog**, not optional guidance.

### SUPPORTING SOURCES — informative, verify before direct import

**`AOS_Curriculum_Competition.xlsx`** (Piece 6)
The parallel Competition Track. 4 sheets: Competition Progression (15 stages × 11 cols), Tournament Types (10 types), Behaviors Progression (15 stages). Match format, scoring, opponent pool, tournament cadence, win/loss target, competition behaviors, parent role, coach role, and transition signal — at each of the 15 stages. USTA-specific tournament naming (Level 1–7) is present but clearly labeled; non-US academies substitute their federation equivalent. **High-quality content.** Import as `curriculum_competition_track` after confirming federation-localization approach.

**`AOS_Curriculum_Fitness.xlsx`** (Piece 7)
Off-court physical preparation architecture. 4 sheets: Fitness Progression (15 stages × 12 cols), Energy Systems (3 rows), Strength Progression (6 band rows). Phases: Physical Literacy (Red), Athletic Foundation (Orange), Sport Performance (Green), High Performance (Yellow/HP). Energy Systems and Strength Progression sheets are especially clean and can be imported as taxonomy reference tables. Key physical tests per stage (broad jump, 10m sprint, plank hold, etc.) could feed an athlete testing module. No product dependencies.

**`AOS_Curriculum_Volume.xlsx`** (Piece 9)
Weekly volume guidance and load management reference. 4 sheets: Volume Progression (15 stages × 11 cols), Progression Rate (15 transitions), Load Distribution (6 bands). Provides: weekly total hours, on/off court split, sessions per week, session duration, typical stage duration in months, reassessment cadence, ACR target range, deload cadence, overload flags. The Progression Rate sheet gives typical duration + faster/slower conditions per transition — directly useful for the Director Dashboard stage timeline view. **ACR definition requires confirmation** before this data is imported into any load management module (see Section 14).

**`AOS_Curriculum_Matrix_Companion.md`**
Design rationale document for the Matrix. Explains stage count decisions, domain count decisions, `[PROPOSED:]` convention (now superseded by the product-tool exclusion decision), and cross-piece dependencies. Not importable data. Essential context for anyone writing the master spine or building the curriculum data model.

**`AOS_Handoff_Prompt.md`**
Session-continuity prompt from the prior AI build session covering Pieces 1–4. Documents the naming convention (color.sub-stage), the drill schema brief that Drills.xlsx then implements, and the 10-piece build sequence. Not importable data. Confirms internal consistency between Pieces 1–5.

### EXCLUDED SOURCE

**`AOS_Curriculum_TechModel.xlsx`** (Piece 3)
Excluded from the core curriculum per `docs/curriculum/product-tool-exclusion-decision.md`. File is present in repo and must not be deleted or modified. Content is deferred to the optional Angles Tools Integration Layer. See Section 6.

---

## 3. Confirmed Curriculum Architecture

### 3.1 The 15-Stage Structure

The curriculum is organized as 5 color bands × 3 sub-stages, producing 15 named stages:

| Band | Stage 1 | Stage 2 | Stage 3 | Sub-stage type |
|---|---|---|---|---|
| Red | Red 1 | Red 2 | Red 3 | Foundation / Intermediate / Matchplay |
| Orange | Orange 1 | Orange 2 | Orange 3 | Foundation / Intermediate / Matchplay |
| Green | Green 1 | Green 2 | Green 3 | Foundation / Intermediate / Matchplay |
| Yellow | Yellow 1 | Yellow 2 | Yellow 3 | Foundation / Intermediate / Matchplay |
| HP | HP 1 | HP 2 | HP 3 | Foundation / Intermediate / Matchplay |

This extends Tennis Australia's Hot Shots sub-stage logic — which TA applies through Yellow only — across all five bands including High Performance. The result is a consistent three-tier internal structure at every band: Foundation builds the new vocabulary, Intermediate consolidates under pressure, Matchplay applies reliably in competitive settings.

There are 14 in-curriculum transitions (Red 1 → Red 2 through HP 2 → HP 3) plus a 15th exit transition (HP 3 → Living-as-a-Pro readiness). Each transition except the HP 3 exit has exactly 4 gate criteria.

### 3.2 Foundation / Intermediate / Matchplay Logic

Each sub-stage within a color band has a defined purpose:
- **Foundation (.1):** Introduce the vocabulary and tools of the new band. Player is learning the language and building initial competencies under coach guidance and feed conditions.
- **Intermediate (.2):** Consolidate under live pressure. Player executes reliably in peer play, drill conditions, and low-stakes competitive settings. Tactical vocabulary is active.
- **Matchplay (.3):** Apply and compete. Player takes the band's full competency set into structured match play and sanctioned events appropriate to the band. Gate criteria at this sub-stage include competition results, not just drill execution.

### 3.3 Evidence-Based Gates, Not Time-Served Promotion

Players advance when they meet observable, evidence-backed criteria — not when they have spent a set amount of time at a stage. Stage duration is a guide (typically 6–12 months per stage depending on band and individual) not a target. A player who meets all gate criteria in 4 months advances. A player who spends 18 months consolidating a stage is not "behind."

This principle protects against two failure modes: (a) premature promotion of technically clean players who lack tactical or competition readiness (FM-01 CRITICAL), and (b) arbitrary holds that demotivate long-tenure players who have genuinely met every criterion.

### 3.4 Skill Track and Competition Track: Separate but Connected

A player has two stage positions simultaneously:
- **Skill Track stage:** Where the player is in the 15-stage technical/tactical/movement/mentality developmental spine.
- **Competition Track stage:** Where the player is in competitive readiness — match format, scoring exposure, opponent pool, tournament cadence, and competitive behavior maturity.

These tracks advance independently. A player can be technically at Green 2 but only at Orange 3 in competition readiness. Both positions are tracked, displayed, and gated separately. Convergence is expected but not enforced — the curriculum accommodates players who develop unevenly across the two tracks.

The Skill Track stage is the primary record. The Competition Track stage is a parallel dimension on the same player record.

### 3.5 Fitness Path as a Connected Support Layer

The Fitness Path is not a prerequisite for Skill Track advancement (with one exception noted below). It is a parallel development architecture that:
- Phases from Physical Literacy (Red) → Athletic Foundation (Orange) → Sport Performance (Green) → High Performance (Yellow/HP)
- Provides weekly off-court volume targets, key fitness tests, and overload flags per stage
- Contributes one gate criterion each at Yellow 2→Yellow 3 (physical preparation without fatigue-driven losses) and both HP transitions (ACR in safe range, no overuse injuries)

Outside of these specific HP-band gates, fitness evidence is informative to the coach and director but does not block Skill Track promotion.

### 3.6 The Tactical Vocabulary: Locked

The court-mapping vocabulary is defined and locked. These six zones are the language of the entire tactical model:

| Zone | Where | When to use |
|---|---|---|
| **Middle** | Deep, central — default rally target | Out of position, defensive, resetting |
| **Crosscourt** | Diagonal rally direction — primary rally ball | Setup, first ball of most patterns |
| **Short Angle** | Sharp diagonal inside service box | Opens court, sets up next ball into open court |
| **Line** | Straight sideline — change of direction | After crosscourt pattern, opponent leaning |
| **Transition** | Midcourt, player has moved forward | Short ball trigger — act now or concede the advantage |
| **Endgame** | Opponent is wide or behind baseline | Finish or reset — the pattern has reached its conclusion |

Zone vocabulary introduces progressively: middle enters at Red 3, crosscourt at Orange 1, line and transition at Green 1, short angle and endgame at Green 2. No zone is used without explicit introduction in the curriculum. The bisector recovery principle (recover to the midpoint of the opponent's available angles after every shot) is introduced at Orange 2 as a coached habit and confirmed as a gate criterion at Orange 3.

### 3.7 The Coach Language Format: Locked

Every stage × domain combination has a 4-phrase coaching language entry:
- **Doing Well:** what is already solid and reliable — acknowledged first
- **Working On:** the active development area
- **Current Focus:** the specific thing the player should think about this session or this week
- **Next Step:** what comes after the current focus — the horizon

This format applies in every coach-facing and AI-facing context: session notes, player profile summaries, parent updates, AI suggestion drafts. The format is never abbreviated below these four phrases. The source of truth is `AOS_Curriculum_CoachLanguage.xlsx`.

### 3.8 Drills Are Product-Independent

The 152 drills in `AOS_Curriculum_Drills.xlsx` were explicitly scoped to be runnable by any coach at any academy using standard equipment (court, ball, racquet, cones). No drill requires an Angles product to execute. The `coaching_cues` field in each drill uses the Doing Well / Working On / Current Focus / Next Step format — philosophy embedded, products absent.

### 3.9 AI Suggestions Recommend, They Do Not Auto-Change Records

AI-generated coaching suggestions, session recaps, and level-up recommendations flow through the `proposed_actions` pipeline. A director or head coach must approve before any player record change is executed. AI may draft a gate-advancement proposal; only a human can confirm it. This is a hard architectural rule, not a preference.

---

## 4. What the Public Frameworks Contribute

### USTA — American Development Model / Net Generation

USTA contributes the color-band equipment progression (red/orange/green/yellow ball and court scaling), the philosophy of non-elimination early competition formats, and the principle of "maximum participation at the right ball color" over rushing to yellow. The Net Generation PlayTracker model — accumulating play points across participation, not just wins — validates the philosophy that competition exposure and match volume matter, not just tournament results. AOS adopts the ball-color band structure and the non-elimination early competition logic directly.

USTA's framework is weakest on: internal sub-stage structure (AOS adds Foundation/Intermediate/Matchplay within each band), tactical vocabulary precision (AOS replaces vague "directional control" language with the 6-zone court mapping system), and dual-track development (AOS separates Skill Track from Competition Track; USTA treats them as one).

### Tennis Canada — Whole Player Development Pathway / LTAD

Tennis Canada contributes the most rigorous long-term athlete development framing of the three frameworks. The 3:1 win-loss ratio target (used directly in the Competition Track), the "5 Cs" of coaching culture (Character, Confidence, Connection, Competence, Culture — mapped to the Mentality/Learning Behavior domain), and the explicit warning that the Training-to-Train stage is where careers are made or broken inform the Green-band stage design. Tennis Canada's emphasis on perception skills as foundational to long-term success validates the intention → action → skill model.

Tennis Canada's framework is weakest on: tactical specificity at early stages and stage-internal progression structure. AOS extends both.

### Tennis Australia — Hot Shots / Player Pathway

Tennis Australia contributes the Foundation / Intermediate / Matchplay sub-stage logic — the most direct structural input to the 15-stage design. The Hot Shots program defines these three internal levels within Red, Orange, and Green, which AOS extends through Yellow and HP. Tennis Australia's emphasis on fundamental movement skills before tennis-specific skills at Red band, and the explicit sequencing of cooperative → modified → structured competition formats, directly informs the early-stage Competition and Movement columns.

Tennis Australia's framework is weakest on: high-performance pathway specificity and the dual-track model. AOS extends both.

### General Best Practice — Bisector Principle

The bisector recovery principle is validated by 2024 peer-reviewed research (Hawk-Eye / Scientific Reports), which confirmed Henri Cochet's century-old theory of recovery angles using modern tracking data. This makes bisector recovery a research-backed, coach-observable, product-independent gate criterion — not an opinion or a brand concept.

---

## 5. What Academy OS Adds

Without any product tools, the Academy OS / Angles philosophy contributes the following that no public framework currently provides at the same level of specificity:

**Learn • Train • Play as a daily structure.** Every session is organized into three functional blocks: Learn (new content, coach-led instruction), Train (deliberate practice with feedback), Play (competition-like application under pressure). This structure makes the session design principle explicit and consistent across all 15 stages. The Drills.xlsx `session_block` field directly implements this (values: Warm-Up, Focus, Train, Play, Game).

**Intention → action → skill framing.** Technical cells in the Matrix describe shots in the context of what the player is trying to accomplish tactically — not as isolated mechanics. A forehand is not "forehand technique"; it is "the shot that sets up the crosscourt pattern." This framing aligns with motor learning research on perception-action coupling and prevents the common failure mode of technically clean players who cannot execute in match play.

**Court mapping as the tactical language.** The 6-zone vocabulary (middle, crosscourt, short angle, line, transition, endgame) provides a precise, shared language that scales from Red 3 through HP 3. Decision trees at every stage use this vocabulary as the operating logic. This replaces vague "directional control" and "tactical awareness" language in public frameworks with specific, coach-observable criteria.

**Skill Track and Competition Track separation.** Public frameworks treat skill and competition as one progressive track. AOS explicitly separates them. A player can be technically advanced and competitively immature, or competitively experienced and technically limited. Both positions are tracked, displayed, and gated independently. This protects against premature competition exposure and against holding back competitively confident players on technical grounds alone.

**Fitness Path as a connected support layer.** The Fitness Path phases from Physical Literacy through Athletic Foundation to Sport Performance and High Performance — a complete off-court architecture that runs parallel to but does not control Skill Track progression (except at specific HP-band gates). This is more complete than any public framework's fitness guidance at the academy implementation level.

**Evidence-based level movement.** Gate criteria are observable, specific, and threshold-defined. No criterion is time-served. The Gate Library includes recording method, evidence window, evaluator, and cadence for each criterion — this is not a checklist for coaches to interpret, it is a structured evidence protocol.

**Positive coaching language at every stage and domain.** The Doing Well / Working On / Current Focus / Next Step system provides a consistent, growth-focused communication format for every coaching interaction across 15 stages and 8 domains. This prevents coaching language from drifting into deficit-framing, and gives parents and players a consistent communication standard.

**Human-reviewed AI suggestions.** The AOS architecture routes all AI-generated suggestions through the `proposed_actions` pipeline with mandatory human approval. This means AI supports coaching intelligence without bypassing coach authority. AI can draft gate-advancement proposals, session recaps, parent updates, and tactical focus suggestions — none execute without director or head coach sign-off.

---

## 6. Excluded Product Tool Layer

`AOS_Curriculum_TechModel.xlsx` is excluded from the core curriculum per `docs/curriculum/product-tool-exclusion-decision.md`. It contains the Angles proprietary technical model including product-specific diagnostic systems and coaching methodologies. The entire file is deferred.

The excluded content may be revisited in the following optional future layers, all of which are additive and do not affect core curriculum gates, data model, or progression rules:

**Angles Tools Integration Layer** — An academy-level feature flag (`tools_integration_enabled: boolean`, default false) that, when enabled, surfaces tool-specific volume guidance per stage, diagnostic zone overlays on technical assessments, and tool-specific failure mode alerts. Powered by TechModel.xlsx content after Farsh has reviewed and confirmed all `[PROPOSED:]` flags in that file.

**Angles App Skill Homework Layer** — A player-level opt-in that assigns diagnostic sessions as between-session tasks, tracks outputs over time via integration, and allows that data to optionally satisfy specific gate criteria. The gate remains fully satisfiable by direct coach observation without the app. App data enriches but never replaces coach evidence.

**Optional External Evidence Integration** — A general mechanism (not Angles-specific) allowing external app data from any source to supplement gate evidence records. Device/app data enriches but never becomes the sole path to advancement.

No feature, gate, data field, or UI element in the core curriculum build should reference these layers. They do not exist yet and will not be scoped until the core curriculum is live.

---

## 7. Stage System Summary

### Red 1 — Foundation
First contact with the racquet. The court is a playground, not a tactical board. Development is multi-sport and locomotor-first: tracking a slow ball, basic catching and throwing, holding the racquet, and striking a stationary ball. The primary social skills are listening for 30–60 seconds, taking turns, and trying again after a miss. No scoring against peers; cooperative rally games with the coach. Gates focus on basic physical competencies and sustained engagement.

### Red 2 — Intermediate
Self-feed and rally with coach begins. Target zones are introduced physically (cones, marked areas). Players begin to drop-hit to a zone and serve over a modified net. Modified cooperative scoring ("how many in a row?") introduces the concept of counting without win/loss pressure. Split-step is introduced as a "bounce" on coach contact. The first Working On language enters: trying again after a miss, cheering for partners.

### Red 3 — Matchplay
Mini-rally with peers and first structured match play. "Middle" enters as the default target — the safe, deep, central ball. Modified red-ball matches with round-robin formats; players self-call "in/out" with coach observation. Between-point composure (handling a lost point without disengaging, naming an emotion) is introduced as a gated behavior. Warm-up and cooldown routines are consolidated and repeatable.

### Orange 1 — Foundation
Recognizable forehand and backhand with structure. "Middle" and "crosscourt" are both named and targeted in rally drills. Split-step timing and recovery steps are coached deliberately. Modified Orange-ball matches on 60ft courts. Session focus: sustaining attention across 45–60 minutes and beginning coach-prompted self-assessment. Bodyweight strength patterns and structured warm-up (activation + movement prep) enter the weekly routine.

### Orange 2 — Intermediate
Rallying with movement begins to consolidate. The first real decision tree activates: middle vs. crosscourt as a function of opponent position. Bisector recovery is introduced as a coached habit. Open-stance forehand begins. Singles and doubles formats are both played weekly. Players begin self-naming a "Current Focus" at session start and reporting on it at session end. The session warm-up extends to 10 minutes with tennis-specific prep. Cooldown protocol (stretch + hydration + reflection) becomes a fixed expectation.

### Orange 3 — Matchplay
Sustained rallies under pressure, and the first repeatable pattern: crosscourt forehand setup. Line is introduced as a "change-up" shot, not a default. Sanctioned Orange-ball events (where available). The pre-match routine is introduced as a 5-minute predictable sequence. Between-point reset language becomes explicit ("walk, breathe, reset"). Pattern execution can be counted in coached rally blocks — the first numeric tactical metric.

### Green 1 — Foundation
Full-court engagement begins. All six tactical zones are now active vocabulary: middle, crosscourt, short angle, line, transition, and endgame are all named and targeted. Spin emerges (recognizable topspin on at least one wing). Approach-volley as a connected unit is introduced. Green-ball sanctioned events with best-of-three short sets. Structured strength work begins (1–2 sessions per week, technique-first). Pre-match routine is player-owned; between-point reset is becoming automatic.

### Green 2 — Intermediate
Three-shot patterns become technically reliable: one-to-one (crosscourt rally), one-to-two (crosscourt setup + line), and two-to-one (crosscourt setup + short angle). Short-ball trigger is active — player recognizes and acts on short balls in 60%+ of opportunities. Pattern execution is observable and countable in match play. Sanctioned Green-ball events at regional level; a healthy 45–55% win rate over 12 weeks is the competition target. Strength 2–3 sessions per week.

### Green 3 — Matchplay
Personal style emerging. The player can name their preferred pattern and execute it in match play. Endgame execution (closing out a point from an advantage position) is introduced. Multi-day Green-ball tournaments; recovery between matches is part of the daily plan. Tactical identity — player names their game style — is the key Green 3 gate. Mid-match adjustments are player-initiated. Periodized weekly load (hard/easy/recovery days) begins.

### Yellow 1 — Foundation
Standard ball, full court. Stroke production is refined for pace and spin. The full pattern library is active, and crosscourt-line discrimination is automatic. Yellow-ball sanctioned events with best-of-three full sets; a ~50% win rate at age-appropriate events is the competition target. First-serve percentage and points won on first serve enter the assessment picture. The player self-manages a pre-match routine. ACR is tracked formally. Strength 3 sessions per week.

### Yellow 2 — Intermediate
Tactical maturity emerging. Multi-shot patterns under pressure (cross-cross-line, line-cross-line). Serve+1 and Return+1 patterns are deliberate. Endgame awareness — recognizing when and how to finish a point — is an explicit tactical focus. Regional and beginning-national events. A single-periodized year structure (preseason, in-season, post-season blocks) enters the training plan. Mid-match tactical adjustments are self-initiated. The key gate at this transition requires identifying a personal game style and demonstrating it in match play.

### Yellow 3 — Matchplay
A personal game style with intentional variation. Pattern play with tactical variation tied to opponent profile. National-level competition; beginning serious tournament planning. Performance routines (pre, during, post) are all self-managed. The physical gate at this transition is meaningful: physical preparation must match competitive demands, and no fatigue-driven losses should be visible in the last 3 months of match data. Single-periodized year approaching double-periodization.

### High Performance 1 — Foundation
Year-round tennis-specific training. All technical fundamentals at competition intensity; weapon identification — what is this player's primary point-winning shot? — becomes an explicit focus. Full tactical literacy: anti-pattern play, opponent profiling. Year-round national competition; first exposure to ITF or equivalent international events. ACR is tracked as a formal safety metric. Match results at national and beginning-international level drive the evidence record. A clean single-periodized year with no overtraining flags is a prerequisite for HP 2 advancement.

### High Performance 2 — Intermediate
Weapon refinement under all conditions. Opponent-modeling: practice patterns are designed to mimic specific opponent profiles. Double-periodized competitive year — two main competitive blocks with development blocks between. Tournament travel autonomy is demonstrated (player has self-managed 3+ tournament trips). Tactical adjustments mid-match are sophisticated across multiple simultaneous layers: pattern, pace, spin, positioning. The HP 2 → HP 3 gate requires a double-periodized year successfully managed with no major injury and demonstrated tournament travel autonomy.

### High Performance 3 — Matchplay
Triple-periodized. Performance-on-demand. Tactical patterns deployed based on full opponent dossiers. Full ownership of preparation, performance, and recovery. Self-coaching during matches within the ruleset. The exit gate is deliberately singular: triple-periodized year successfully managed, tournament travel fully self-managed, living-as-a-professional readiness demonstrated across a 12-month review window. The HP 3 exit gate is a product direction decision, not a curriculum design decision — see Section 14.

---

## 8. Gate System Summary

### How Gates Drive Progression

The 57 gates in `AOS_Curriculum_Gates.xlsx` are the operating mechanism of the evidence-based progression system. No player advances to the next stage without meeting all gate criteria for that transition. Gates are visible to the player on their dashboard, recorded and confirmed by the coach in the app, and must be approved through the `proposed_actions` pipeline before a promotion is executed.

**Gate structure — required fields:**

| Field | Description |
|---|---|
| `gate_id` | Structured ID. Format: `FROM__TO__NN` (e.g., `RED1__RED2__01`) |
| `from` / `to` | Stage names using the locked naming convention |
| `domain` | Which of the 8 domains this gate belongs to |
| `criterion` | Plain-language statement of what the player must demonstrate |
| `type` | RATE / COUNT / OBSERVATION / TIME_WINDOW / CHECKLIST / RESULT |
| `threshold` | Specific numeric or checklist threshold (e.g., "7/10 attempts", "≥50% W rate over 12 weeks") |
| `recording_method` | How the coach records evidence in AOS (tap-counter, checkbox, clip, binary per session) |
| `evidence_window` | How much time/session data counts (e.g., "last 4 sessions", "12-week window") |
| `evaluator` | Who owns the gate evaluation (Coach / Director / S&C) |
| `cadence` | How often this gate is assessed (each session, weekly, monthly) |

**Gate types:**
- `RATE` — a percentage or ratio (7/10, 60%+)
- `COUNT` — a discrete count achieved × times (3+ consecutive shots × 3 sessions)
- `OBSERVATION` — coach judgment against a defined standard
- `TIME_WINDOW` — sustained behavior over a duration
- `CHECKLIST` — all items in a defined list must be present
- `RESULT` — competition result over a rolling window (≥50% W rate over 12 weeks)

**Transition coverage:**

| Transition | Gate count | Domains covered |
|---|---|---|
| Red 1 → Red 2 | 4 | Movement/Athletic, Technical, Mentality/Learning Behavior × 2 |
| Red 2 → Red 3 | 4 | Technical × 2, Competition, Mentality/Learning Behavior |
| Red 3 → Orange 1 | 4 | Technical × 2, Competition, Mentality/Learning Behavior |
| Orange 1 → Orange 2 | 4 | Technical × 2, Tactical, Competition |
| Orange 2 → Orange 3 | 4 | Technical × 2, Tactical, Movement/Athletic |
| Orange 3 → Green 1 | 4 | Competition, Tactical, Mentality/Learning Behavior, Movement/Athletic |
| Green 1 → Green 2 | 4 | Technical × 2, Technical (approach-volley), Competition |
| Green 2 → Green 3 | 4 | Tactical × 2, Movement/Athletic, Competition |
| Green 3 → Yellow 1 | 4 | Competition, Tactical, Technical, Mentality/Learning Behavior |
| Yellow 1 → Yellow 2 | 4 | Technical × 2, Competition, Mentality/Learning Behavior |
| Yellow 2 → Yellow 3 | 4 | Tactical × 2, Technical, Fitness Support |
| Yellow 3 → HP 1 | 4 | Competition, Mentality/Learning Behavior × 2, Tactical |
| HP 1 → HP 2 | 4 | Competition, Fitness Support, Tactical, Mentality/Learning Behavior |
| HP 2 → HP 3 | 4 | Fitness Support, Mentality/Learning Behavior, Tactical, Competition |
| HP 3 → Out | **1** | Competition only |

### Known Gate Risks

**FM-04 CRITICAL — Yellow 3 → HP 1 gate under-specification.**
The current 4 criteria at this transition cover competition results, psychological readiness, player ownership of the plan, and game style durability under fatigue. The StressTest (FM-04) flags that HP 1 entry evidence is under-specified for the Performance-Oriented archetype (A3) and risks defaulting to "wins matches" as the sole driver. The fix: the Yellow 3 → HP 1 gate must require multi-domain evidence including pattern execution under pressure, fitness readiness (ACR in range, no overuse flags), and a minimum match volume over the evidence window — not just win rate. This gate must be reviewed and reinforced before HP-band players are managed in AOS.

**HP 3 → Out: single gate, single domain.**
The exit transition has only 1 gate criterion in the Competition domain: "Triple-periodized year managed successfully; tournament travel fully self-managed; living-as-a-professional readiness demonstrated." This is deliberately minimal — the curriculum recognizes that "living-as-a-pro readiness" is not a curriculum question but a performance management and career decision. However, the single-gate structure creates the risk of premature exit if a player meets only the competition condition while having fitness, lifestyle, or mentality deficits. This gate should either be expanded before HP 3 players exist in AOS, or it should carry a required director sign-off narrative (not just a checkbox).

**Drill-to-gate cross-reference gap.**
No drill in `AOS_Curriculum_Drills.xlsx` cites which gate criteria it helps satisfy. There is no `drill_id → gate_id` mapping. This means the AOS drill recommendation engine — "which drills should this player work on to advance to the next stage?" — cannot be built automatically from existing data. A `drill_gate_mappings` join table must be constructed during the data model sprint, either manually curated or AI-assisted (with human review). The `success_criteria` field in each drill provides the natural mapping anchor: success criteria describe observable behaviors that often mirror gate thresholds.

**Recovery and Lifestyle as domains.**
`AOS_Curriculum_CoachLanguage.xlsx` covers 8 coaching domains: Technical, Tactical, Movement, Competition, Mentality, Fitness, Recovery, and Lifestyle. The Matrix.xlsx covers 8 domains: Technical, Tactical, Movement, Competition, Mentality, Fitness Support, Assessment, and Level-Up Gates. Recovery and Lifestyle are present in the coach language system but are not first-class domains in the Matrix or the gate system. A product decision is needed: are Recovery and Lifestyle first-class player profile domains with dedicated gate criteria, or are they supporting sub-dimensions of Fitness Support? This affects the data model structure. See Section 14.

---

## 9. Drill Library Summary

### What the Drill Library Is

`AOS_Curriculum_Drills.xlsx` contains 152 drills organized in a consistent 16-column schema, one row per drill. It is the executable layer of the curriculum — the bridge between the developmental spine (what a player should master) and the coaching floor (what the coach runs in a session). It is product-independent by explicit design. Every drill is runnable with standard tennis equipment.

### Schema Fields

| Field | Type | Purpose |
|---|---|---|
| `drill_id` | String | Unique ID. Format: `DRILL_<STAGE>_<DOMAIN3>_<NUM>` |
| `name` | String | Short human-readable name |
| `stage_min` | String | Earliest appropriate stage |
| `stage_max` | String | Latest appropriate stage (same value set) |
| `domain` | String | Technical / Tactical / Movement / Competition / Mentality / Fitness |
| `session_block` | String | Warm-Up / Focus / Train / Play / Game |
| `objective` | String | One sentence — the coaching intention |
| `setup` | String | Court layout, equipment, player count |
| `procedure` | String | Numbered coach instructions |
| `coaching_cues` | String | Doing Well / Working On / Current Focus / Next Step |
| `progression_easier` | String | How to scale down |
| `progression_harder` | String | How to scale up |
| `success_criteria` | String | Observable evidence of "good" — maps toward gate thresholds |
| `duration_minutes` | Integer | Expected duration |
| `players_needed` | Integer | Minimum player count |
| `tags` | String | Comma-separated tag list (e.g., crosscourt, bisector, first-strike) |

### Library Characteristics

- **Coverage:** 152 drills distributed across all 15 stages and all 6 domains. The Tags Index confirms 227 distinct tag entries covering tactical intent, movement pattern, competition format, equipment, and stage band.
- **Session block coverage:** All 5 session blocks (Warm-Up, Focus, Train, Play, Game) are represented.
- **Stage distribution:** Heavier at Orange and Green (higher volume, longer stage durations). Thinner at Red (simpler drills, shorter) and HP (fewer standardized drills, more individualized work).
- **`coaching_cues` format:** Every drill's coaching_cues field uses the Doing Well / Working On / Current Focus / Next Step format — making this the coaching language system's implementation in practice, not just in reference.

### Import Plan

This file should become the primary seed dataset for the `curriculum_drills` table (or the existing `exercise_library` pattern if that table is already established in AOS). No preprocessing is required for the core fields. The `tags` field will need comma-splitting at import time if stored in a separate `curriculum_drill_tags` table. The `success_criteria` field is the natural anchor for the drill-to-gate mapping work described in Section 8.

---

## 10. Coach Language Summary

### What the Coach Language System Is

`AOS_Curriculum_CoachLanguage.xlsx` is the 4-phrase coaching language reference for every stage × domain combination. It provides pre-written, coach-ready language for the most common coaching communication contexts — and it is the AI suggestion engine's primary lookup backbone.

**Structure:** 10 sheets.
- **Coach Language (Long):** 120 rows — every combination of 15 stages × 8 domains (note: domains here are Technical, Tactical, Movement, Competition, Mentality, Fitness, Recovery, Lifestyle — 8, not 6). This is the comprehensive source.
- **Domain sheets (8):** One per domain, 15 stage rows each. These are query-optimized views of the Long sheet — useful for filtering by domain when generating AI suggestions for a specific development area.

**Zero product dependencies. Zero `[PROPOSED:]` flags.** This is the cleanest file in the set.

### How This Drives AOS Features

**Coach briefings.** Before a session, a coach can pull up a player's current Skill Track stage and see the pre-written 4-phrase summary for any domain. The Current Focus phrase becomes the session's tactical or technical cue. No improvisation required.

**Player profiles.** The Doing Well phrase appears on the player profile as a positive anchor. The Next Step phrase sets the horizon. Together they frame the player's development status without deficit language.

**Parent-safe summaries.** The full 4-phrase entry per domain gives parents a structured, positive update format. The Working On phrase communicates areas of growth without implying failure. The Next Step phrase gives parents a forward-looking narrative.

**AI suggestion drafts.** When an AI suggestion is generated (e.g., for a session recap or coaching note), the system queries the CoachLanguage lookup by `(stage, domain)` and uses the 4-phrase entry as the scaffolding for the draft. The coach then reviews, adjusts, and approves before the suggestion is applied to the player record.

**Class intelligence and group session planning.** If a group has mixed stages, the CoachLanguage entries for each represented stage can be surfaced side-by-side to help the coach differentiate instruction.

**Session recap summaries.** Post-session AI summaries use the Doing Well / Working On framing as the narrative structure. Factual observations from the session fill in the details; the CoachLanguage entry provides the scaffolding.

---

## 11. Competition / Fitness / Volume Summary

### Competition Track (`AOS_Curriculum_Competition.xlsx`)

The Competition Track is a complete 15-stage parallel developmental system with 11 dimensions per stage: match format, scoring system, point density, opponent pool, tournament cadence, win/loss target, competition behaviors, parent role, coach role, and transition signal toward the next stage. A companion Behaviors Progression sheet tracks the single primary competition behavior at each stage (from "engagement" at Red 1 through "performance routine ownership" at HP) plus its failure mode.

The Competition Track implements the dual-track architecture by tracking the player's competitive maturity independently from their Skill Track stage. Key tournament types (Internal Round-Robin, Local Red/Orange Ball, Sectional Junior, National Level 4-5, National Level 1-3, ITF Junior, ITF Pro Circuit) are mapped to the stages they serve.

**USTA-localization note:** Tournament type names and level designations (USTA Level 1–7) are present throughout. Non-US academies will substitute their federation-equivalent event names. The underlying cadence logic (monthly internal events, quarterly external events at early stages, progressively more frequent as stage advances) is universal.

### Fitness Path (`AOS_Curriculum_Fitness.xlsx`)

The Fitness Path provides off-court physical preparation architecture across 15 stages in 4 phases:

| Phase | Stages | Focus |
|---|---|---|
| Physical Literacy | Red 1–3 | FMS, coordination, locomotor variety, no external load |
| Athletic Foundation | Orange 1–3 | Tennis-specific movement, eccentric strength, alactic base |
| Sport Performance | Green 1–3 | Periodization begins, strength 2-3x/week, agility and speed circuits |
| High Performance | Yellow 1 – HP 3 | Full periodization, barbell work, HRV tracking, pro-volume management |

Three energy systems are defined (Alactic/ATP-PCr, Lactic/Glycolytic, Aerobic) with the stages at which each is formally trained. Strength Progression is organized by equipment band: bodyweight only (Red), bodyweight + medicine ball (Orange), bodyweight + light resistance (Green 1-2), resistance + barbell technique (Green 3), strength block with barbell compound lifts (Yellow+), pro-periodized (HP).

Key fitness tests are specified per stage (broad jump, 10m sprint, lateral 5-5-5, plank hold, med ball throw distance, vertical jump, 1RM estimates at Yellow+). These could seed an `athlete_testing` module in AOS if that feature is in scope.

### Volume Guidance (`AOS_Curriculum_Volume.xlsx`)

Volume guidance covers weekly total hours, on/off court split, sessions per week, session duration, typical stage duration in months, reassessment cadence, ACR target range, deload cadence, and overload flags — for all 15 stages.

**Key volume thresholds:**

| Band | Weekly Total | Sessions/Week | Session Duration | Typical Stage Duration |
|---|---|---|---|---|
| Red 1–3 | 1.5–5 hrs | 1–3 | 45–60 min | 6–12 months |
| Orange 1–3 | 4–8 hrs | 3–5 | 60–90 min | 6–9 months |
| Green 1–3 | 7–14 hrs | 4–6 | 75–105 min | 6–12 months |
| Yellow 1–3 | 12–22 hrs | 5–7 | 90–120 min | 6–12 months |
| HP 1–3 | 18–30 hrs | 6–7 | 90–180 min | 12–24+ months |

**ACR definition flag:** The "ACR Target" column in Volume.xlsx shows values ranging from `0.8-1.2` (Red band) to `0.8-1.3` (Orange through HP). "ACR" is not defined in the column header. This almost certainly refers to the **Acute:Chronic Workload Ratio** — a validated load management metric where values in the 0.8–1.3 range represent the "sweet spot" associated with minimized injury risk. If confirmed, this maps directly to a load management safety algorithm in AOS: flag any player whose rolling 7-day load divided by their 28-day average falls outside 0.8–1.3. **This must be confirmed before ACR data is used in any load management feature.** See Section 14.

**Stage duration is a guide, not a target.** Volume.xlsx and Matrix_Companion.md both state explicitly that typical stage durations are reference ranges, not promotion criteria. A player who meets all gate criteria in 4 months advances. A player who takes 18 months is not behind. This must be communicated clearly in any UI that surfaces stage duration to coaches or parents.

---

## 12. Stress Test / Failure Mode Requirements

The following table contains all 14 failure modes from `AOS_Curriculum_StressTest.xlsx`. These are **product and system requirements**, not optional guidance. Every CRITICAL and HIGH item must be addressed before Phase 1 launch.

| ID | Severity | Stage | Archetype | Risk | Required Response | Affects |
|---|---|---|---|---|---|---|
| **FM-01** | **CRITICAL** | Orange 3 → Green 1 | A1 Early Developer | Tactical / decision-making gate can be bypassed when ball-striking quality is high. Coach promotes on technique alone. | Tactical gate at Orange 3 → Green 1 must be a hard database block — cannot be overridden by technical evidence alone. Separate approval required. | Gates (Piece 2), Tactical (Piece 4), AOS UI |
| **FM-02** | HIGH | Orange 1 entry | A2 Late Developer, A8 Gap-Year | Color-band label causes dignity injury for players whose entry age is well past the typical color band. "Orange 1" on a 14-year-old's profile is demoralizing. | AOS player-facing UI suppresses the color-band label when `entry_age > 12`. Surfaces sub-stage type only ("Foundation tier"). | AOS UI, player record (`entry_age`) |
| **FM-03** | HIGH | Orange 1 → Orange 2 | A2 Late Developer | Technical column at Orange 2 assumes 6–12 months of prior Red exposure. Late developer enters Orange 1 without that foundation. | Volume guidance must include archetype-aware modifiers. Late-developer Orange 1 gets extended session duration and reduced weekly volume ramp. | Volume guidance, player record (`archetype_tag`) |
| **FM-04** | **CRITICAL** | Yellow 3 → HP 1 | A3 Performance-Oriented | HP 1 entry evidence is under-specified. Risk of defaulting to "wins matches" as the sole driver. | Yellow 3 → HP 1 gate must require multi-domain evidence: pattern execution under pressure, fitness readiness (ACR in range, no overuse), and minimum match volume over the evidence window. Gate must be rewritten before HP-band players exist in AOS. | Gates (Piece 2), Competition Track |
| **FM-05** | HIGH | Yellow 2 → Yellow 3 | A3 Performance-Oriented, A5 High-Pressure Family | Mentality column observables for pressure tolerance are not specified at Yellow stages. | Mentality gates at Yellow 1–3 must include explicit observables: between-point routine adherence, post-match review completions, and pressure-scenario performance counts. | Gates (Piece 2), Matrix Mentality column |
| **FM-06** | HIGH | Orange 3 → Green 1, Green 3 → Yellow 1 | A4 Recreation-Oriented | Competition column gates require match volume that recreation players don't generate. Gates stall a player who has met all skill criteria but isn't competing. | AOS player record carries a `recreation_flag`. When set, Competition gates are recalibrated to internal academy events only. Director must confirm flag. | Competition Track, AOS data model |
| **FM-07** | MEDIUM | Green 3 (terminal for archetype) | A4 Recreation-Oriented | No explicit "Healthy Plateau" state exists. A recreation player who caps at Green 3 is indistinguishable from a player who is stuck. | AOS player record carries a `healthy_plateau_state`, distinct from "stalled" or "active progression." Director-set, reviewed termly. | AOS data model, Director Dashboard |
| **FM-08** | **CRITICAL** | Green 2, Green 3, Yellow 1 | A5 High-Pressure Family | Director must defend promotion-hold decisions against aggressive parent pressure. If gate scores are borderline, director needs an evidence paper trail. | Every promotion request requires evidence citation against the specific gate criteria — not just a coach checkbox, but linked observation records. Director approval must be logged to `audit_logs`. | Gates (Piece 2), AOS workflow, audit_logs |
| **FM-09** | HIGH | Intake (any stage) | A6 Transfer-In | Intake assessment is not protocolized. "See where they fit" is subjective and exposes the director to coaching style bias. | An intake assessment protocol must be defined and implemented as a structured workflow in AOS — not free-form notes. Stage placement at intake is a gate evaluation, not a judgment call. | AOS intake module, Gates |
| **FM-10** | MEDIUM | Green 1, Green 2 | A6 Transfer-In | Mid-stage transfers may need a "tightening of the foundation" phase that reads as demotion if not framed correctly. | Coach-facing translation must include specific language for re-grounding phases. Coach Language system should have "re-entry" framing variants. | Coach Language (Piece 8) |
| **FM-11** | **CRITICAL** | Any stage (return-to-play) | A7 Injury-Return | Skill Track gates rely on rally volume and match volume evidence that the returning player cannot generate during recovery. Standard gate progress stalls. | AOS Load Management module must include an explicit `return_to_play_state` — separate from normal active progression. Gate evidence windows are paused; return-to-play gates are substituted. | AOS data model, Fitness (Piece 7), Load Management module |
| **FM-12** | HIGH | Orange 1 → Green 1 (accelerated) | A8 Gap-Year / Late-Start | Volume thresholds in Volume.xlsx are calibrated for color-band age groups. A late-start adult-adjacent player can physically handle higher volumes but needs accelerated movement through stages. | Volume guidance must include archetype-aware modifiers for A8. Late-start players get different volume ramp and accelerated gate evidence windows. | Volume guidance, player record |
| **FM-13** | MEDIUM | Pre-Green 1 | A8 Gap-Year / Late-Start | Opening Competition Track too early for a late-starter with immature motor patterns creates negative match experiences that harm retention. | Competition Track for A8 opens only at Skill Track Green 1 or later — not at Orange 1 entry. This is a system rule, not a coach judgment. | Competition Track, AOS system rules |
| **FM-14** | MEDIUM | All stages | All archetypes | The 15-stage matrix does not surface archetype context to the coach by default. Coach must independently manage archetypes. | AOS player record includes a primary `archetype_tag` (A1–A8) and optional secondary. Surfaced in the coach view and director view for context. Not restrictive — informational. | AOS data model (cross-cutting) |

**Summary counts: 4 CRITICAL, 6 HIGH, 4 MEDIUM, 0 LOW.**

**Player archetypes referenced:**

| Tag | Name | Entry stage | Primary curriculum protection |
|---|---|---|---|
| A1 | Early Developer | Red 2 | Decision-making gates enforced regardless of ball-striking quality |
| A2 | Late Developer | Orange 1 | Dignity (label suppression), volume modifiers |
| A3 | Performance-Oriented | Yellow 1 | Honest evidence, ACR safety, mentality observables |
| A4 | Recreation-Oriented | Orange 2 | Recreation flag, healthy plateau state, recalibrated competition gates |
| A5 | High-Pressure Family | Green 1 | Gate objectivity, evidence paper trail, audit logging |
| A6 | Transfer-In Mid-Stage | Green 2 (claimed) / Green 1 (validated) | Structured intake assessment, re-grounding language |
| A7 | Injury-Return | Any | Return-to-play state, gate evidence pause, substitute gates |
| A8 | Gap-Year / Late-Start | Orange 1 (motor) | Dignity, accelerated volume, delayed Competition Track opening |

---

## 13. Data Model Implications

The following tables and player record extensions are required by the curriculum architecture. Tables marked with a gate/FM reference have a direct traceability link to Section 8 or Section 12.

### New Curriculum Tables

| Table | Row count | Primary source | Notes |
|---|---|---|---|
| `curriculum_stages` | 15 | Matrix.xlsx — Stage Index | Stage name, sub-stage type, color band, one-line summary |
| `curriculum_domains` | 8 (+ 2) | Matrix.xlsx — Domain Index | 8 Matrix domains + Recovery/Lifestyle from CoachLanguage |
| `curriculum_gates` | 57 | Gates.xlsx — Gate Library | All 12 fields per gate. RLS required. |
| `curriculum_drills` | 152 | Drills.xlsx — Drill Library | All 16 fields per drill. Import-ready. RLS required. |
| `curriculum_drill_tags` | ~227 | Drills.xlsx — Tags Index | Normalized tags. Join to curriculum_drills. |
| `curriculum_stage_priorities` | TBD | Matrix.xlsx — Matrix (synthesized) | Priorities per stage/domain cell. Synthesis required. |
| `curriculum_coach_language` | 120 | CoachLanguage.xlsx — Long sheet | 15 stages × 8 domains × 4 phrases. Import-ready. RLS. |
| `curriculum_competition_track` | 15 | Competition.xlsx | Stage, match format, scoring, behaviors, parent/coach roles. |
| `curriculum_fitness_guidance` | 15 | Fitness.xlsx — Fitness Progression | Stage, phase, energy system, strength phase, key tests. |
| `curriculum_volume_guidance` | 15 | Volume.xlsx — Volume Progression | Stage, weekly hours, sessions, ACR target, overload flags. |
| `curriculum_archetypes` | 8 | StressTest.xlsx — Archetypes | A1–A8 profiles. Informational, surfaced in director/coach UI. |
| `curriculum_failure_modes` | 14 | StressTest.xlsx — Failure Modes | Severity, stage, archetype, fix. Used as feature requirements. |
| `drill_gate_mappings` | TBD | Constructed during sprint | drill_id → gate_id many-to-many. Must be built manually or AI-curated with human review. |

### Player Record Extensions

| Field | Type | Purpose | FM reference |
|---|---|---|---|
| `skill_track_stage_id` | FK → curriculum_stages | Current Skill Track position | Core |
| `competition_track_stage_id` | FK → curriculum_stages | Current Competition Track position | Core |
| `fitness_path_state` | Enum | Active / Paused / Return-to-Play | FM-11 |
| `archetype_tag` | Enum (A1–A8) | Primary player archetype | FM-14, FM-02, FM-03 |
| `archetype_secondary_tag` | Enum (A1–A8), nullable | Optional secondary archetype | FM-14 |
| `recreation_flag` | Boolean | Recalibrates Competition gates | FM-06 |
| `healthy_plateau_state` | Boolean | Marks intentional plateau, not stall | FM-07 |
| `return_to_play_state` | Boolean | Pauses gate evidence windows | FM-11 |
| `entry_age` | Integer | Age at first AOS record | FM-02 (label suppression) |
| `current_focus` | Text, nullable | Player's active stated focus | CoachLanguage Current Focus phrase |
| `open_gate_evidence` | JSONB or join table | In-progress evidence for current transition | Gates, FM-08 |

All new tables must have Row Level Security enabled. All player record mutations must write to `audit_logs`. All stage promotions must go through the `proposed_actions` pipeline.

---

## 14. Missing Information Before Data Model Sprint

The following must be resolved or explicitly decided before the Supabase tables and seed files sprint begins:

1. **ACR definition confirmation.** Volume.xlsx uses "ACR Target" values of 0.8–1.2 (Red band) and 0.8–1.3 (Orange through HP). This is almost certainly the Acute:Chronic Workload Ratio — but it must be confirmed before any load management algorithm is built. If it is the ACWR, the formula (7-day rolling load ÷ 28-day average load) and the injury-risk interpretation (sweet spot 0.8–1.3, spike risk >1.5) must also be confirmed. If it is something else, the correct definition must be provided.

2. **HP 1 entry gate refinement.** FM-04 (CRITICAL) requires that the Yellow 3 → HP 1 gate be rewritten to include multi-domain evidence requirements before HP-band players are managed in AOS. The revised gate criteria must be confirmed before the `curriculum_gates` table is seeded.

3. **HP 3 exit gate decision.** The HP 3 → Out gate currently has 1 criterion. A product decision is needed: expand it to 4 criteria (parallel to all other transitions), leave it as 1 criterion with a mandatory director narrative field, or handle it outside the gate system entirely. This decision affects the `curriculum_gates` seed and the promotion workflow UI.

4. **Doubles tactical progression.** Competition.xlsx references doubles from Orange 1 onward. Volume.xlsx includes doubles in session counts. No dedicated doubles tactical decision tree exists in Tactics.xlsx — Pattern Progression is singles-only. A product decision is needed: scope doubles tactical content for Phase 1 (requires creating supplemental content), or explicitly mark doubles as Phase 2 and handle it in the Competition Track only for now.

5. **Drill-to-gate mapping strategy.** The 152 drills do not cite which gates they help satisfy. A `drill_gate_mappings` join table must be built. Confirmed approach needed: (a) manual curation by Farsh or the coaching team, (b) AI-assisted mapping using `success_criteria` text vs gate `criterion` text, with human review, or (c) not built in Phase 1 (drill recommendations use stage/domain filtering only). The approach affects scope and timeline of the data model sprint.

6. **Recovery and Lifestyle domain status.** CoachLanguage.xlsx includes Recovery and Lifestyle as coaching domains (15 stage rows each). Matrix.xlsx does not include them as named domains — they are implied within Fitness Support and Mentality. A product decision is needed: are Recovery and Lifestyle first-class domains with dedicated player profile sections and gate criteria, or are they supporting sub-dimensions surfaced only in coaching language? This affects `curriculum_domains` table structure and player profile UI.

7. **Archetype tag population strategy.** The `archetype_tag` field on the player record requires that each player be tagged A1–A8. A product decision is needed: is this field set by the director at intake, set by the system based on intake data, or deferred? The intake protocol (FM-09, HIGH) is also unresolved.

8. **Product tool layer exclusion confirmation standing.** Before the data model sprint, confirm explicitly that no field, table, gate criterion, or UI reference to Swinget, The Angle, or SwingCheck will be included in any sprint deliverable. This confirmation should be on record in the sprint brief.

---

## 15. Recommended Next Build Sequence

### Step 1 — Create `docs/curriculum/angles-master-spine.md` *(next step)*

Synthesize the 15-stage canonical reference document from Matrix.xlsx, Tactics.xlsx, CoachLanguage.xlsx, and Volume.xlsx. One section per stage, each containing: volume band, technical summary, tactical summary (with active zone vocabulary), movement summary, competition summary, mentality summary, coach says (4-phrase entry), gate to advance, and failure mode alerts. This document replaces any prior stage descriptions in the codebase and becomes the AI context injection source for curriculum features.

### Step 2 — Create curriculum data model and seed pack *(Supabase sprint)*

Build the tables listed in Section 13 with RLS. Seed: `curriculum_stages` (15 rows), `curriculum_domains`, `curriculum_gates` (57 rows), `curriculum_drills` (152 rows), `curriculum_coach_language` (120 rows), `curriculum_competition_track` (15 rows), `curriculum_volume_guidance` (15 rows), `curriculum_archetypes` (8 rows). Resolve Section 14 items before this sprint begins. Add player record extensions. Ensure all mutations route through `proposed_actions` and write to `audit_logs`.

### Step 3 — Build the premium curriculum explorer UI *(director + coach views)*

Director view: stage distribution heatmap across the academy, promotion queue with gate evidence, archetype breakdown, failure mode alerts (CRITICAL and HIGH). Coach view: player stage card with 4-phrase coach language, drill recommendations by stage/domain, gate progress tracker with recording affordances (tap-counter, checkbox, binary per session). Player view: stage progress with FM-02 label suppression for entry age > 12, current focus statement, next milestone. Parent view: stage progress narrative in plain language, competition pathway timeline.

### Step 4 — Connect curriculum gates to the player profile

Gate evidence recording UI in the coach session view. Gate progress display on the player profile. Proposed promotion workflow: AI drafts a gate-advancement proposal when all criteria are met → routes to `proposed_actions` → director/head coach approves → `execute_approved_action()` executes the stage change → `audit_logs` records the evidence citations and approver. FM-08 (CRITICAL) audit trail requirement is satisfied here.

### Step 5 — Connect curriculum to AI suggestions and adaptive session planning

AI suggestion engine queries `curriculum_coach_language` by `(skill_track_stage_id, domain)` to generate coaching note drafts. Drill recommendation engine filters `curriculum_drills` by player's current stage and open gate criteria, surfacing 3–5 drills per session block. Session recap AI uses the 4-phrase format as scaffolding. All AI outputs route through `proposed_actions` with mandatory human approval. Load management alerts use `curriculum_volume_guidance` ACR targets to flag at-risk players on the Director Dashboard.

### Step 6 — Optional: create Angles Tools Integration Layer *(future, separate sprint)*

After the core curriculum is live and validated with at least one academy, revisit `AOS_Curriculum_TechModel.xlsx`. Farsh reviews and resolves all `[PROPOSED:]` flags. Design the `tools_integration_enabled` academy-level feature flag. Build the optional overlay as an additive layer on top of the core curriculum, with no changes to the core tables, gate criteria, or player record structure.

---

*End of synthesis document. Do not begin the master spine or any Supabase sprint until Section 14 open items are confirmed.*
