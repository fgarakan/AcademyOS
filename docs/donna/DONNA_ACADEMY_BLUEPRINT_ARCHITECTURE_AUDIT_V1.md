# DONNA Academy Blueprint — Architecture Audit V1

**Sprint:** Mega Sprint 2741–2770A  
**Date:** 2026-06-15  
**Status:** AUDIT COMPLETE — No implementation. No migrations. No UI. Architecture only.

---

## Executive Summary

The Academy Blueprint vision is sound. The problem it solves — "90% academy configuration in under 10 minutes" — is real and important. The current onboarding requires too many decisions across too many phases.

**The critical finding: Most of what the Blueprint vision describes already exists.**

| Blueprint Vision | What Already Exists | Gap |
|---|---|---|
| Academy Blueprint (4 types) | `InferredModel` in `donnaOnboardingContextPack.ts` | Better naming + fewer types needed |
| Style Preset (6 options) | `DONNA_DEFAULT_RANKINGS` + `StagePriorityState` | Named presets need to be formalized |
| DONNA asks "What makes you different?" | Phase 1 `Q_INTRO` free-text question (already built) | Already built |
| Academy Philosophy Profile generation | `AcademyIdentityProfile` in `academyIdentityProfile.ts` | Display only needed |
| Operating Model generation | `DEFAULTS_BY_MODEL` + stage priorities (already exists) | Display wrapper needed |
| Director approves | `proposed_actions` pipeline (already built) | Wire Blueprint → existing approval |

**The risk to avoid:** Building parallel systems that duplicate what is already certified and working.

**The recommendation:** Blueprint is not a new system. It is a named configuration entry point into the existing DNA + Philosophy engine. Build a fast, clear UI. Do not build new data infrastructure.

---

## Part 1 — Blueprint Audit

### What "Academy Blueprint" Should Be

The sprint vision names four blueprints:
- 12U Foundation Academy
- 12+ Performance Academy
- College Placement Academy
- Club Growth Academy

These map directly to configurations already representable in the existing system:

| Blueprint | Existing InferredModel | Active Age Groups | Primary Priority |
|---|---|---|---|
| 12U Foundation Academy | `junior_development` | red_ball, orange_ball | Games → Movement → Technique |
| 12+ Performance Academy | `high_performance` | green_ball, yellow_ball, high_performance | Technique → Tactics → Competition |
| College Placement Academy | `high_performance` (variant) | yellow_ball, high_performance | Competition → Tactics → Mental |
| Club Growth Academy | `dual_track` / `recreational` | all | Fun → Games → Movement |

### Architecture Recommendation

**Blueprint is a TypeScript configuration, not a database model.**

```typescript
// src/lib/blueprint/academyBlueprintLibrary.ts
type AcademyBlueprintId =
  | '12u_foundation'
  | 'performance_12plus'
  | 'college_placement'
  | 'club_growth'

interface AcademyBlueprintDefinition {
  id: AcademyBlueprintId
  label: string
  description: string
  tagline: string
  inferredModel: InferredModel            // maps to existing donnaOnboardingContextPack.ts
  defaultAgeGroups: AgeGroup[]            // maps to existing AgeGroup type
  defaultSessionDuration: SessionDuration // maps to existing SessionDuration type
  defaultAdvancementApproval: AdvancementApproval
  defaultParentTransparency: ParentTransparency
  recommendedStylePresets: StylePresetId[]
}
```

**Storage:** `academies.settings.academy_blueprint_id` (string). No new table. No migration.

**Versioning:** Blueprint definitions live in TypeScript source. Adding a new blueprint = adding a new entry to the library constant. No database migration.

**Why not a database model?** Blueprints are not academy-specific data. They are product-level templates. Putting them in the DB adds RLS, migration, and seed data complexity with no benefit — directors don't create blueprints, they select from a product-defined library.

---

## Part 2 — Philosophy Engine Audit

### What Already Exists

`src/lib/donna/philosophy/` is a **complete, certified system** (Mega Sprint 1746–1775):

| File | What It Does |
|---|---|
| `academyIdentityProfile.ts` | 10-dimension identity profile with Reality → Evidence → Memory → Philosophy hierarchy |
| `academyPhilosophyMemory.ts` | Learns from director behavior (curriculum decisions, action decisions) |
| `academyPreferenceExtractor.ts` | Extracts preferences from accumulated philosophy memory |
| `academyDecisionPatterns.ts` | Identifies decision pattern archetypes from behavior |
| `academyEvolutionTimeline.ts` | Tracks how the academy's philosophy evolves over time + detects drift |
| `academyEvolutionQuestions.ts` | 10 standard evolution questions with evidence-backed answers |

The 10 identity dimensions already defined:
`technique_focus`, `tactical_focus`, `game_based_learning`, `competition_emphasis`, `assessment_rigor`, `coach_autonomy`, `parent_transparency`, `long_term_development`, `retention_focus`, `player_wellbeing`

The intelligence hierarchy already enforced:
- Reality (player evidence) — weight 4 — highest authority
- Evidence (behavior patterns) — weight 3
- Memory (decision history) — weight 2
- Philosophy (DNA / Blueprint stated values) — weight 1
- Inference (defaults) — weight 0 — fills gaps only

### What Blueprint Adds to the Philosophy Engine

Blueprint selection → stores `statedScore` for each identity dimension.  
This is the Philosophy layer (weight 1 in the hierarchy).

Over time, director behavior produces observed scores (weight 2-4), which override the Blueprint's stated values.

Blueprint is the **starting point** of the philosophy engine, not a parallel system.

### Architecture Recommendation

```
Blueprint selected at onboarding
        ↓
Maps to AcademyDnaSummary (existing)
        ↓
Stored in academies.settings.onboarding_conversation_statements (existing)
        ↓
AcademyIdentityProfile.dimensions[n].statedScore populated (existing)
        ↓
Over time: observed behavior overrides stated scores (existing pipeline)
        ↓
AcademyIdentityProfile = live Philosophy Profile (existing)
```

**Do not build a new Philosophy Profile system.** The existing `AcademyIdentityProfile` is the Philosophy Profile. Build a display component that surfaces it.

### Permissions

| Actor | Can See Philosophy Profile | Can Edit |
|---|---|---|
| Platform Owner | Yes (read-only) | No (observes, does not configure) |
| Director | Yes | Via Settings → Academy DNA (update blueprint/preset, re-run onboarding questions) |
| Head Coach | No | No |
| Coach | No | No |
| Player / Parent | No | No |

---

## Part 3 — Curriculum Impact Audit

### What Blueprint Should Generate (Curriculum)

From the Blueprint + Style Preset, the following curriculum configurations are implied:

| Configuration Item | Blueprint Drives | Editable After? |
|---|---|---|
| Active curriculum levels (which stages to use) | Yes — from `defaultAgeGroups` | Yes — director adds/removes in Curriculum Explorer |
| Domain weights per level (what to emphasize) | Yes — from Style Preset | Yes — Curriculum Setup Types already handle this |
| Curriculum source choice (AOS starter vs import) | No — director decides | Yes |
| Individual drills/skills per level | No — remains coach/director authored | Yes |
| Parent guidance content | No | Yes |
| Assessment criteria per domain | No | Yes |

### What Blueprint Should NOT Generate

- Individual curriculum nodes, drills, or content items — these are academy-authored
- Specific gate thresholds — these require director judgment
- Level names (academies often rename levels)

### Integration with Existing Curriculum System

`src/lib/curriculum/curriculumSetupTypes.ts` already defines `CurriculumSetupState`:
- `spine_status` — which levels are approved
- `domains_status` — which domains are selected
- `curriculum_source_status` — starter vs import

**Blueprint populates these initial choices as defaults.** The director then walks through Curriculum Setup with pre-filled recommendations from the Blueprint. No new curriculum tables needed.

---

## Part 4 — Template Impact Audit

### Template Relationship to Blueprint

Templates should NOT be auto-generated from Blueprint at onboarding. This creates:
1. Template debt (directors inherit templates they didn't ask for)
2. False confidence (auto-generated templates look complete but aren't calibrated to the academy)

### Recommended Architecture: Recommendations, Not Generation

Blueprint informs **template recommendations** — not template creation:

```
Blueprint (12U Foundation) + Style Preset (Game-Based)
        ↓
DONNA recommends: "For Orange 1 (60 min), consider: 10 min warm-up, 25 min skill, 20 min games, 5 min cool-down"
        ↓
Director clicks "Create from recommendation" → existing template builder opens pre-populated
        ↓
Director approves → template created via existing server action
```

This uses the **existing template builder flow** with Blueprint-informed defaults. No new template generation system.

### Block Structure Recommendations by Blueprint

| Blueprint | Recommended Block Ratio |
|---|---|
| 12U Foundation | 15% warm-up, 30% technique, 35% games/play, 20% cool-down/fun |
| 12+ Performance | 10% warm-up, 40% technique/tactics, 30% competitive play, 20% fitness |
| College Placement | 10% warm-up, 30% tactics/patterns, 40% match-play, 20% mental/physical |
| Club Growth | 15% warm-up, 20% technique, 45% games/social play, 20% cool-down |

These ratios should live as TypeScript constants in the Blueprint library, not as DB records.

---

## Part 5 — Assessment Impact Audit

### How Blueprint Affects Assessments

| Assessment Dimension | Blueprint Impact | Governance |
|---|---|---|
| Domain weighting (technical vs tactical vs fitness) | Blueprint suggests starting weights via Style Preset | Director editable |
| Assessment cadence | Blueprint → `DEFAULTS_BY_MODEL.assessment_cadence` | Director editable |
| Gate standards (what counts as evidence) | NOT Blueprint-driven — remains academy-specific | Director + Head Coach |
| Placement rubric | NOT Blueprint-driven — existing placement assessment system | Director + Head Coach |
| Level advancement thresholds | NOT Blueprint-driven — existing gate system | Director + Head Coach |

### Which Standards Become Blueprint-Driven

Blueprint suggests assessment **cadence** and **domain emphasis**, not specific thresholds. The 4-domain assessment rubric (Technical, Competition, Fitness, Mental) already exists — Blueprint weights these domains differently per style preset.

Example: "Technical First" preset → technical domain weighted at 40% of overall score recommendation vs "Game-Based" preset → game pattern recognition at 35%.

These are **recommendations only** — never automatic gate changes.

---

## Part 6 — DONNA Impact Audit

### How DONNA Currently Uses Academy DNA

DONNA currently reads `academies.settings` to find `onboarding_conversation_statements` (stored DNA answers) which produce `AcademyDnaSummary` — used across:
- Curriculum architect and evolution engine
- Identity profile scoring (stated values)
- Director briefing framing
- Philosophy drift detection
- COO operating layer

### How Blueprint Extends DONNA

Blueprint becomes the **foundation layer** of DONNA's understanding of the academy:

```
academies.settings.academy_blueprint_id → AcademyBlueprintDefinition
        ↓
→ inferredModel, defaultAgeGroups, defaultAdvancementApproval, etc.
        ↓
→ populates AcademyDnaSummary.hasDna = true (even before full interview)
        ↓
DONNA can give better initial recommendations from day 1
```

Without Blueprint, DONNA waits for the full interview to have any stated philosophy. With Blueprint, DONNA has enough to make useful recommendations from the moment the director selects a blueprint.

### DONNA Comparison: Blueprint vs Reality

The existing philosophy system already implements this — it is the "drift detection" system:
- `driftWarning` on `IdentityDimension` fires when stated (Blueprint) vs observed (behavior) diverge ≥ 20 points
- `RealityOverrideAnalysis` surfaces cases where player evidence contradicts stated philosophy

DONNA's role: compare what the Blueprint says the academy is vs what the data shows the academy actually does. This is already built. Blueprint just gives DONNA a richer starting point.

### Morning Brief / Next Best Action

Blueprint influences DONNA's initial recommendation framing:
- 12U Foundation → DONNA emphasizes player enjoyment and retention signals
- 12+ Performance → DONNA emphasizes assessment compliance and advancement pipeline
- College Placement → DONNA emphasizes UTR tracking and competition entry windows
- Club Growth → DONNA emphasizes enrollment trends and new member onboarding

Implementation: Blueprint ID stored in settings → loaded by `academyKnowledge/index.ts` → influences briefing templates. No new DONNA engine needed.

---

## Part 7 — Setup Flow Audit

### Current Onboarding State

There are **three separate onboarding flows** currently in the codebase:

| Flow | Route | Status | Coverage |
|---|---|---|---|
| Account onboarding | `/onboarding` | Built — AOS deck | Pre-app introduction |
| Director setup | `/director/onboarding` | Built — 7-step wizard | Identity, interview, curriculum, groups, coaches, placement, gates |
| DONNA DNA Shell | `AcademyDnaLanding` in `/director/onboarding` | Built — 4-phase questionnaire | Player mix, family priorities, age groups, stage priorities, governance |

The 4-phase DNA Shell (`donnaOnboardingContextPack.ts`) already asks:
- Academy name (Q1)
- Player mix (Q2 — maps to Blueprint player type)
- Family priorities (Q3 — maps to Blueprint philosophy)
- Age groups (Q4 — maps to Blueprint active levels)
- Stage priorities per level (Q6 — maps to Style Preset)
- Session duration (Q8)
- Advancement approval (Q9)
- Parent transparency (Q10)
- Director challenge (Q_CHALLENGE)

This is essentially the same data the Blueprint + Preset selection would capture, just in a different order and framing.

### What Blueprint Onboarding Replaces

**Blueprint first, details second:**

| Current Question | Blueprint Replacement |
|---|---|
| "What does your player mix look like?" (Q2) | Inferred from Blueprint selection |
| "What matters most to families?" (Q3) | Inferred from Blueprint selection |
| "Which levels are active?" (Q4) | Default from Blueprint + confirm/adjust |
| "How do you rank priorities per stage?" (Q6 — 7 decisions × up to 5 stages) | Inferred from Style Preset + one confirmation per stage |

**Questions that remain (cannot be eliminated):**
- Academy name → still needed
- "What makes your academy different?" → the new free-text question
- Session duration → no default can be safe without asking
- Advancement approval → governance decision; cannot infer
- Parent transparency → privacy decision; cannot infer

**Questions that become confirmations (not fresh questions):**
- Age groups → shown as Blueprint defaults, director confirms or adjusts
- Stage priorities → shown as Style Preset defaults, director confirms or adjusts

### Proposed Final Onboarding Flow (Blueprint-First)

```
STEP 1 — Blueprint Selection (≤ 2 minutes)
  Show 4 Blueprint cards with descriptions.
  Director selects one.
  System: sets inferredModel, defaultAgeGroups, default governance.

STEP 2 — Style Preset (≤ 1 minute)
  Show 6 preset cards with category rankings preview.
  Director selects one.
  System: sets stage priority rankings across all active levels.

STEP 3 — DONNA Question (≤ 2 minutes)
  DONNA asks: "What makes [AcademyName] different from a standard [Blueprint label]?"
  Director types or speaks. Free text.
  System: stores as differentiator context for DONNA's understanding.

STEP 4 — DONNA Generates Academy DNA Summary (displayed, ≤ 1 minute to review)
  Shows: inferred model, active levels, top priorities per stage, governance defaults.
  Director confirms or makes one-tap adjustments.

STEP 5 — DONNA Generates Operating Model (displayed, ≤ 1 minute to review)
  Shows: assessment cadence, coach comm format, parent communication defaults, KPI focus areas.
  Director confirms or adjusts.

STEP 6 — Director Approves (≤ 1 minute)
  Summary card. One approve button.
  System: writes to academies.settings via existing server action pattern.
  
TOTAL: ≤ 7 minutes.
```

### What Disappears From the Current Interview

| Current multi-step | Blueprint replacement |
|---|---|
| 7 stage × priority drag-and-drop rankings | One Style Preset card tap → shows auto-rankings → director adjusts one if needed |
| Player mix dropdown + family priorities dropdown → model inference | Blueprint selection → model is the selection |
| Age groups multi-select | Blueprint shows default age groups → director adds/removes |
| 18-phase onboarding architecture | Entry point only (Blueprint flow) — remaining phases activated as needed |

---

## Part 8 — Permissions Audit

### Who Can Do What

| Action | Platform Owner | Director | Head Coach | Coach | Player | Parent |
|---|---|---|---|---|---|---|
| Create Blueprint library entry | Yes (code deploy) | No | No | No | No | No |
| Select Blueprint at onboarding | No | Yes | No | No | No | No |
| Modify Blueprint selection post-onboarding | No | Yes (Settings → Academy DNA) | No | No | No | No |
| Override Style Preset per stage | No | Yes | No | No | No | No |
| View Philosophy Profile | Yes | Yes | No | No | No | No |
| Edit Philosophy Profile dimensions | No | Yes (indirectly via curriculum decisions and DNA updates) | No | No | No | No |
| Publish Blueprint to other academies | Yes (code deploy) | No | No | No | No | No |
| Version Blueprint library | Yes (code deploy) | No | No | No | No | No |

### Governance Model

Blueprint Library = Platform Owner governs via code deploy. No in-app creation by directors.  
Blueprint Selection = Director-only decision. Academy-scoped. Stored in `academies.settings`.  
Philosophy Profile = Director can trigger re-evaluation via Settings. DONNA builds it automatically from behavior.  
Style Preset Override = Director can override any stage's category ranking in Curriculum Setup.

---

## Part 9 — Blueprint Library Audit

### V1 Blueprint Library: 4 Entries

#### 12U Foundation Academy
- `inferredModel`: `junior_development`
- Active levels: Red Ball 1-3, Orange Ball 1-3
- Primary philosophy: Long-term player development, enjoyment-first
- Assessment cadence: Every 6 weeks
- Parent transparency: Standard
- Default advancement: `donna_flags_director_confirms`
- DONNA focus: Player retention, enjoyment signals, coach engagement

#### 12+ Performance Academy
- `inferredModel`: `high_performance`
- Active levels: Orange Ball 3, Green Ball 1-3, Yellow Ball 1-3, High Performance 1-2
- Primary philosophy: Competitive readiness, structured assessment
- Assessment cadence: Monthly
- Parent transparency: Standard → Transparent optional
- Default advancement: `director_only`
- DONNA focus: Assessment compliance, advancement pipeline, competition readiness

#### College Placement Academy
- `inferredModel`: `high_performance` (specialized variant)
- Active levels: Yellow Ball 2-3, High Performance 1-3
- Primary philosophy: Result-driven, tournament tracking, college recruiting pipeline
- Assessment cadence: Monthly + event-triggered
- Parent transparency: Transparent
- Default advancement: `director_only`
- DONNA focus: UTR trends, competition entry windows, recruiting timeline

#### Club Growth Academy
- `inferredModel`: `dual_track`
- Active levels: All levels (Red through Yellow) — flexible mix
- Primary philosophy: Retention, community, enjoyment, growth
- Assessment cadence: Quarterly
- Parent transparency: Minimal to Standard
- Default advancement: `coach_recommends_notified`
- DONNA focus: Enrollment trends, retention signals, new member readiness

### Architecture: Hardcoded vs Config-Driven vs Database

**Recommendation: Hardcoded TypeScript constants.**

| Option | Pros | Cons | Decision |
|---|---|---|---|
| Hardcoded TypeScript | Zero migration, type-safe, version-controlled | Can't change without deploy | ✅ V1 |
| Config-driven JSON | Easy to update | Need schema, loader, validation | No benefit in V1 |
| Database-driven | Director can create custom blueprints | Migration, RLS, admin UI, versioning | V3+ only |

V1: 4 hardcoded blueprints. V2: Platform owner can add via config file without code change. V3: Directors can create custom blueprints (requires new tables).

---

## Part 10 — Style Preset Audit

### V1 Style Preset Library: 6 Entries

Each preset is a `StageCategory[]` ranking that overrides the blueprint's default for all stages.

#### Balanced
All 7 categories distributed roughly equally. Technique (22%), Movement (17%), Tactics (17%), Games (15%), Mental (13%), Competition (10%), Fun (6%). No dominant category.

#### Technical First
Technique anchors at #1 across all stages. Then adjusts by level maturity: younger → games follow technique; older → tactics follow technique.

#### Game-Based
Games ranks #1 for Red and Orange Ball. Gradually transitions: games → tactics at Green Ball and above. Matches LTAD game-based learning principles.

#### Competition First
Competition ranks #1 starting from Green Ball. Below Green Ball, technique/games still lead — you cannot compete-first before players have basic strokes.

#### Athletic First
Movement ranks #1 or #2 at every stage. This is the "build the athlete first" philosophy.

#### Mental First
Mental ranks in top 3 at every stage. Emphasizes composure, resilience, and focus as the core teaching emphasis alongside technical development.

### Architecture

```typescript
interface StylePresetDefinition {
  id: StylePresetId
  label: string
  tagline: string
  description: string
  categoryRankings: Record<string, StageCategory[]>  // keyed by stage (maps to DONNA_DEFAULT_RANKINGS structure)
}
```

**Important constraint:** Style Presets are stored as a preset ID in settings, not as the full ranking array. The ranking array is computed at runtime from the library constant. This means platform owner can update preset definitions without migrating existing academy data.

```json
// academies.settings
{
  "academy_blueprint_id": "12u_foundation",
  "academy_style_preset": "game_based"
}
```

---

## Part 11 — Operating Model Generation Audit

### What the Operating Model Is

The Operating Model is the complete set of operational defaults that flow from Blueprint + Preset + Philosophy. It is NOT a new data object. It is the **display of existing computed values**.

### What Gets Generated From Blueprint + Preset + Philosophy

| Output | Source | Where Stored |
|---|---|---|
| Curriculum priority weights | Style Preset → `rankingToWeights()` | `academies.settings.onboarding_conversation_statements[stage_priority_*]` |
| Assessment cadence | Blueprint → `DEFAULTS_BY_MODEL.assessment_cadence` | `academies.settings` |
| Coach communication format | Blueprint → `DEFAULTS_BY_MODEL.coach_comm_format` | `academies.settings` |
| Parent communication tone | Blueprint + Transparency → `DEFAULTS_BY_MODEL.parent_comm_tone` | `academies.settings` |
| Player mission style | Blueprint → `DEFAULTS_BY_MODEL.player_mission_style` | `academies.settings` |
| Coaching style description | Blueprint → `COACHING_STYLE_BY_MODEL` | Displayed, not stored separately |
| Parent portal visibility flags | Blueprint + Transparency → `PORTAL_RULES_BY_TRANSPARENCY` | `academies.settings.portal_visibility` |
| DONNA focus areas | Blueprint → DONNA briefing template | Computed at runtime |
| KPI priority weights | Blueprint → DONNA COO emphasis | Computed at runtime |
| Template block ratios | Blueprint → recommendation constants | Not stored — recommendations only |

All of this already exists. The "Operating Model" is a **display surface** over existing data, not new data infrastructure.

---

## Part 12 — Lowest Cognitive Load Review

### Could Onboarding Be Simpler?

**Yes.** The key insight: the Director does not need to understand what a "Stage Priority" is at onboarding. They need to pick a Blueprint and a Style. DONNA does the translation.

#### Current Cognitive Load Points (to eliminate in V1)

1. **7-category drag-and-drop per stage** (up to 35 ranking decisions) → ELIMINATED by Style Preset
2. **Player mix + Family priorities → infer model** (2 decisions to get 1 output) → ELIMINATED by Blueprint selection
3. **Age group multi-select** (up to 6 choices) → REDUCED to confirming Blueprint defaults
4. **"What is a curriculum starting point?"** confusion → ELIMINATED (Blueprint implies AOS curriculum starter)
5. **Phase navigation** (7 named phases the director must track) → REDUCED to 6 linear steps

#### Could DONNA Infer More?

DONNA can infer more **after** the first session, not before. With zero data, DONNA should ask fewer questions, not try to infer from context. Blueprint-first is the right approach.

One inference DONNA CAN make at selection time: If the director types "Dabul Tennis Academy" and the Blueprint is "12U Foundation," DONNA can pre-suggest "junior_development" and ask the director to confirm the free-text summary rather than asking a separate question.

#### Could Director Answer Fewer Questions?

The minimum viable questions at onboarding:
1. Blueprint selection — cannot infer
2. Style Preset — cannot infer without coaching history
3. "What makes you different?" — human judgment required
4. Session duration — safety requires asking
5. Advancement approval — governance decision; cannot default

That is 5 touchpoints. The current DONNA DNA Shell is 10+ questions. Blueprint reduces this by ~50%.

---

## Part 13 — Final Recommendation

### Recommended Architecture

```
Blueprint Library (TypeScript constants)
  + Style Preset Library (TypeScript constants)
  + One free-text differentiator question
         ↓
AcademyDnaSummary (existing type)
         ↓
academies.settings (existing JSON storage)
         ↓
AcademyIdentityProfile (existing philosophy engine)
         ↓
DONNA recommendations (existing engines)
```

**No new tables. No new migrations. No parallel systems.**

### Recommended Data Model

Add to `academies.settings` JSON (no migration):
```json
{
  "academy_blueprint_id": "12u_foundation",
  "academy_style_preset": "game_based",
  "academy_differentiator": "We use the Mouratoglou method for orange ball players.",
  "blueprint_onboarding_completed_at": "2026-06-15T10:00:00Z",
  "onboarding_method": "blueprint_v1"
}
```

All downstream effects use existing settings fields (`onboarding_conversation_statements`, `portal_visibility`, etc.).

### Recommended Permissions

- Blueprint Library: Platform Owner via code deploy
- Blueprint Selection: Director at onboarding and in Settings
- Philosophy Profile: Director read/update; not editable by coaches
- Operating Model: Director read; DONNA generates dynamically

### Recommended Onboarding Flow

6 steps, under 7 minutes:
1. Blueprint selection (2 min)
2. Style Preset selection (1 min)
3. DONNA differentiator question (2 min)
4. Academy DNA review + confirm (1 min)
5. Operating Model review + confirm (1 min)
6. Approve (< 30 sec)

### Recommended DONNA Integration

Blueprint populates `AcademyDnaSummary.hasDna = true` immediately on completion. This unlocks:
- Morning brief with blueprint-informed framing
- DONNA's initial recommendations weighted by Blueprint
- Philosophy drift detection (comparing Blueprint's stated values to observed behavior)

### Recommended V1 Scope

**Build:**
- `src/lib/blueprint/academyBlueprintLibrary.ts` — 4 Blueprint definitions (pure TypeScript)
- `src/lib/blueprint/stylePresetLibrary.ts` — 6 Style Preset definitions (pure TypeScript)
- `src/lib/blueprint/blueprintToDna.ts` — maps Blueprint + Preset → AcademyDnaSummary (pure TypeScript)
- Blueprint selection UI (Step 1 of new onboarding)
- Style Preset selection UI (Step 2 of new onboarding)
- Academy DNA display (Step 4 — reads from existing `academyIdentityProfile` structure)
- Operating Model display (Step 5 — reads from `DEFAULTS_BY_MODEL` + current settings)
- Update `/director/onboarding` to use Blueprint flow first

**Do not build in V1:**
- No new database tables
- No blueprint versioning system
- No platform-owner blueprint editor UI
- No template auto-generation from blueprints
- No assessment standard generation
- No custom director-created blueprints
- No blueprint library browsing page

### Recommended V2 Scope

- Blueprint → Template block ratio recommendations (surfaced in template builder as suggestions)
- Blueprint → Assessment domain weight recommendations (surfaced in assessment setup as suggestions)
- Blueprint → DONNA morning brief customization (blueprint-specific briefing templates)
- `blueprintToDna.ts` → feeds into DONNA's `academyKnowledge/index.ts` for richer context
- Platform-owner config file for blueprint definitions (no code change required to add blueprints)

### Recommended V3 Scope

- Director-created custom blueprints (requires new DB table, RLS, versioning)
- Blueprint inheritance (a custom blueprint extends a library blueprint)
- Blueprint marketplace (share blueprints between academies on the platform)

---

## Part 14 — Risk Register

### Duplicate System Risks

| Risk | Severity | Detail | Mitigation |
|---|---|---|---|
| Parallel onboarding flows | HIGH | Blueprint flow + existing DONNA DNA Shell both capturing the same data | Blueprint flow REPLACES the DNA Shell for new academies. Existing academies keep their current settings. |
| Blueprint "Blueprint" vs Player "Blueprint" naming collision | HIGH | `src/lib/blueprint/` already contains player-level blueprint files (`blueprintGenerator.ts`). The term "Blueprint" now means two different things. | Rename academy-level blueprints to avoid collision. Options: `AcademyProfile`, `AcademyTemplate`, `AcademyType`. Or rename player blueprints to `PlayerDevelopmentPlan`. MUST RESOLVE before building. |
| Duplicate philosophy systems | MEDIUM | Building new Philosophy Profile system when `academyIdentityProfile.ts` already exists | Explicitly document that Blueprint → Philosophy Profile = `AcademyIdentityProfile`. No new system. |
| Duplicate InferredModel types | LOW | Blueprint Library defines 4 types; `InferredModel` already defines 5 types. Overlap and divergence. | Blueprint library maps explicitly to `InferredModel`. No new model type. |
| Settings JSON becoming unwieldy | MEDIUM | `academies.settings` is already used for onboarding_state, portal_visibility, director_interview, philosophy_memory, identity_profile, etc. | Blueprint adds only 4 keys. Acceptable for V1. V2 should promote critical keys to typed columns. |
| Onboarding state machine conflict | MEDIUM | Existing `onboarding_state` machine has 10 states + 18 phases. Blueprint adds a new entry path. | Blueprint onboarding sets `onboarding_state = 'director_interview'` on completion (maps to existing state machine). Not a new state. |

### Architecture Debt Risks

| Risk | Detail | Resolution |
|---|---|---|
| Blueprint affects templates | Director selects "Game-Based" but has no game-based templates | Blueprint → template recommendations (V2), not auto-generation |
| Blueprint affects assessments but assessment rubric is fixed | The 4-domain assessment rubric is hardcoded. Blueprint weighting preferences can't change the rubric. | Blueprint only weights recommendations, not the rubric itself. Rubric changes are a separate decision. |
| Blueprint selection does not explain consequences | Director picks "Technical First" without understanding what stage priorities that implies | Show a preview of the resulting priority rankings in the Style Preset UI before confirming |

---

## Gap Analysis

### Current State → Future State

| Area | Current State | Future State (V1) | Delta |
|---|---|---|---|
| Onboarding entry point | DONNA DNA Shell (10+ questions) | Blueprint selection + Style Preset + 1 question = 6 steps | -50% cognitive load |
| Academy model | `InferredModel` from Q2+Q3 inference | `AcademyBlueprintId` → `InferredModel` mapped directly | Clearer to director |
| Stage priorities | 35 ranking decisions | 1 Style Preset tap → auto-rankings → director adjusts | -90% effort |
| Philosophy Profile storage | `academies.settings.donna_identity_profile` (built from behavior) | Same + Blueprint provides initial stated values immediately | Better initial quality |
| DONNA initial recommendations | Requires behavior history before useful | Blueprint gives useful recommendations from day 1 | Faster time to value |
| Naming clarity | Player "Blueprint" ≠ Academy "Blueprint" (collision) | Must resolve naming before building | Action required |

---

## Confidence Score

**Overall Audit Confidence: 94/100**

| Dimension | Score | Notes |
|---|---|---|
| Existing system coverage | 98 | Thoroughly audited — all key files read, all systems mapped |
| Recommendation correctness | 95 | Architecture is sound; Blueprint-as-config is the right call |
| Duplicate risk identification | 97 | Naming collision risk identified and flagged |
| V1 scope tightness | 90 | V1 scope is conservative; risk of scope creep in implementation |
| Sprint sequence clarity | 92 | Clear sprint path derived |
| Unknown risks | 85 | Some integration risks may only appear during implementation |

Remaining uncertainty: The exact naming collision resolution (player vs academy "blueprint") must be decided before implementation begins. This is a product-level naming decision, not a technical one.

---

## Recommended Sprint Sequence

| Sprint | Title | Files | Scope |
|---|---|---|---|
| 2771–2780 | Naming Resolution + Blueprint Library TypeScript | `src/lib/blueprint/academyBlueprintLibrary.ts`, `src/lib/blueprint/stylePresetLibrary.ts`, `src/lib/blueprint/blueprintToDna.ts` | Pure TypeScript constants. No UI, no DB. Resolve naming collision. |
| 2781–2790 | Blueprint Onboarding Steps 1–3 (UI) | `src/components/onboarding/steps/BlueprintSelectionStep.tsx`, `StylePresetSelectionStep.tsx`, `AcademyDifferentiatorStep.tsx` | Blueprint card UI, preset card UI, free-text DONNA question |
| 2791–2800 | Academy DNA Display + Operating Model Display (Steps 4–5) | `AcademyDnaReviewStep.tsx` (update), `OperatingModelDisplayStep.tsx` | Display components using existing data. No new data. |
| 2801–2810 | Blueprint → Settings Integration (Step 6) | Update existing onboarding server action to accept blueprint_id and style_preset_id | Wire to `academies.settings`. Use existing proposed_actions pattern. |
| 2811–2820 | DONNA Blueprint Integration | `donnaContextPacketBuilder.ts`, `academyKnowledge/index.ts` | Blueprint-informed DONNA context. Blueprint ID → richer DONNA framing. |

---

## Build / Don't Build List

### BUILD (V1)

- Blueprint Library TypeScript constants (4 blueprints)
- Style Preset Library TypeScript constants (6 presets)
- Blueprint → AcademyDnaSummary mapping function
- Blueprint onboarding UI (6 steps)
- Blueprint ID + preset ID storage in `academies.settings`
- Blueprint-informed DONNA context pack

### DON'T BUILD (V1)

- `academy_blueprints` database table — unnecessary; TypeScript constants are sufficient
- `philosophy_profiles` database table — already exists as `AcademyIdentityProfile` in settings
- `operating_models` database table — computed at runtime from existing data
- Template auto-generation — creates maintenance debt, use recommendations instead
- Assessment rubric changes from Blueprint — out of scope; assessment rubric is separate
- Custom director-created blueprints — V3 work
- Platform-owner blueprint editor UI — V2 work
- Blueprint versioning system — V2 work
- Blueprint library browsing page — V2 work
- Parallel philosophy engine — existing `academyIdentityProfile.ts` is the Philosophy Profile

### RESOLVE BEFORE BUILDING

- **Naming collision**: `src/lib/blueprint/` contains player-level blueprints (`blueprintGenerator.ts`). The Academy Blueprint system needs a different namespace or the player blueprints need renaming. Suggested resolution: rename the academy-level concept to `AcademyProfile` or rename player blueprints to `PlayerDevelopmentPlan`. This is a product decision that must be made before any V1 sprint begins.

---

*End of Architecture Audit V1 — Mega Sprint 2741–2770A*  
*No code was written. No database was changed. No migrations were created.*  
*All findings are based on reading existing source code and documentation.*
