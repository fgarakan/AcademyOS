# Academy Onboarding 10/10 Blueprint
**Sprint:** Mega Sprint 1685–1714  
**Date:** 2026-06-10  
**Depends on:** `ACADEMY_ONBOARDING_SEAM_AUDIT_1685.md`  
**Status:** Design only. No code changes.

---

## Purpose

Design the final onboarding experience for AcademyOS — from a director's first login to the moment the academy is live. This blueprint closes all 11 seams identified in the audit, satisfies all 14 design requirements, and produces a single authoritative spec that future sprints can build against.

---

## Design Principles (non-negotiable)

1. **One question, one answer.** Never ask the same question twice across phases.
2. **Every answer must change something.** If a field has no downstream effect, it is not asked.
3. **Defaults for everything.** Required fields should have smart defaults the director can accept or override — never a blank box demanding an answer.
4. **Big shapes first.** Academy classification comes before coaching style. Coaching style comes before session blocks. The big decision constrains all smaller ones.
5. **DONNA guides, director decides.** DONNA explains each section before questions appear, then stays present as a side panel. DONNA never marks steps complete.
6. **Required vs. optional is always explicit.** Every step has a "Required to launch" or "Optional — add later" label.
7. **Nothing is permanent until launch.** Every answer is a draft. The director can go back. The "Launch Academy" button is the only irreversible action.
8. **Setup mode is a different product than live mode.** The director dashboard looks and behaves differently before and after `onboarding_completed_at`.

---

## The Unified Flow: 7 Phases

The four current surfaces (A, B, C, D) collapse into one unified experience:

| Phase | Name | Closes Seam | Required to launch |
|---|---|---|---|
| 0 | Orientation | 5 (deck handoff) | No — skippable |
| 1 | Academy Classification | 1, 2, 6, 9 | Yes |
| 2 | Coaching Identity | 1, 4, 8 | Yes (min 1 style) |
| 3 | Curriculum Foundation | 1, 8 | Yes (min 1 level) |
| 4 | Session Blueprint | 1 | Yes (min 1 block) |
| 5 | Team Setup | 1 | Yes (min 1 coach, 1 group) |
| 6 | Parent & Player Experience | 7 | Yes (defaults accepted = complete) |
| 7 | Launch Review | 3, 9, 10 | Yes — this is the launch gate |

Per-player onboarding (Surface C) remains separate but is upgraded with academy DNA context (closes Seam 4). It runs after Phase 7.

---

## Phase 0 — Orientation
**Route:** `/director/onboarding` (first visit, no data)  
**Required:** No — has a "Skip to Setup" link  
**Replaces:** First-Run Deck overlay  
**Time:** ~90 seconds

### Purpose
Give the director a clear mental model of what AcademyOS is before asking any questions. The current first-run deck is correct in intent but fires as an overlay on the dashboard, creating three competing "what to do" surfaces. This phase moves that content into the setup flow where it belongs.

### Content
Three slides (same animation style as the existing AOSDeck):

**Slide 1 — What you're building**
> AcademyOS is your academy's operating system. By the end of setup, your coaching philosophy, curriculum, session templates, and parent experience will be connected and working together. DONNA runs the intelligence layer — she learns from your decisions and gets better over time.

**Slide 2 — What DONNA does**
> DONNA is your Director of Operations. She reads your academy's data, explains what's happening, drafts recommendations, and flags risks — but every decision stays with you. She never activates a player, moves a level, or sends a communication without your approval.

**Slide 3 — What setup produces**
> Seven phases, starting with the biggest decisions. Estimated time: 15–20 minutes. You can pause and resume any time — everything is saved as a draft. The academy goes live only when you click "Launch Academy" at the end.

**CTA:** "Start Setup →" (primary) | "Skip orientation →" (secondary, goes directly to Phase 1)

### DONNA panel (during orientation)
> "I'll be here throughout setup — you can ask me anything in this panel. Let's start with the biggest decisions first."

### System effect
- Marks `settings.onboarding.deck_seen_at` (replaces the `hasSeenDeck` boolean)
- No redirect to the full dashboard until Phase 7 is complete

---

## Phase 1 — Academy Classification
**Route:** `/director/onboarding/classification`  
**Required:** Yes  
**Time:** ~3 minutes

### Purpose
The academy classification is the single most important decision in onboarding. Everything that follows — default curriculum levels, level gate strictness, session block ratios, parent visibility defaults, DONNA's recommendation weights, and the coaching voice — derives from this choice. Get it right here and the rest of setup is largely confirmation.

### DONNA introduction (shown before questions)
> "This is the most important decision in setup. Your academy model tells me how to think about players, curriculum, and development — it shapes every default I'll suggest from here on. Take your time here. You can change it later from Settings, but it's easier to get it right now."

### Questions

**Q1.1 — Academy Name** *(required)*
- Text input
- Pre-populated from `academies.name` if already set

**Q1.2 — Primary Model** *(required)*  
One selection from:

| ID | Label | Description | When to pick this |
|---|---|---|---|
| `high-performance` | High Performance | Elite junior training, competition calendar, performance metrics | You coach tournament players with clear level-up goals |
| `junior-development` | Junior Development | Long-term player development, structured progression, all ages | You run a multi-level junior program, not purely elite |
| `recreational` | Recreational Program | Fun, fitness, retention, adult or social tennis | The primary goal is enjoyment and staying in the game |
| `dual-track` | Dual Track | Both high-performance and recreational tracks coexist | You have elite players and recreational players at the same facility |
| `private-coaching` | Private & Semi-Private | Individual and small-group lessons, no class structure | You coach individuals rather than groups |

**Q1.3 — Age Groups Active** *(required, multi-select)*  
- Red Ball (5–8) / Orange Ball (8–10) / Green Ball (9–11) / Yellow Ball (10+) / High Performance / Adult

**Q1.4 — Location Count** *(optional)*  
- "1 location" (default) / "2–3 locations" / "4+ locations"
- Shown with "(optional — you can update this in Settings)"

### System effects of Q1.2 (Academy Classification)

Every downstream default derives from this value. The model sets a `defaultProfile` that propagates through Phases 2–6.

```
high-performance defaultProfile:
  curriculum_spine: 'itf-pathway-extended'
  levels_to_activate: [3, 4, 5, 6]          ← higher levels by default
  level_gate_strictness: 'strict'            ← 4/5 domains required for promotion
  session_block_defaults: ['technique-blocks', 'point-play', 'assessment']
  session_block_ratios: { technique: 0.30, live-ball: 0.25, point-play: 0.25, assessment: 0.10, fitness: 0.10 }
  parent_visibility_defaults: { show_scores: true, show_competition: true, show_rankings: false }
  donna_voice: 'data-driven'
  pathway_weights: { technical: 0.30, tactical: 0.25, competition: 0.25, physical: 0.15, mental: 0.05 }
  coach_permission_level: 'standard'

junior-development defaultProfile:
  curriculum_spine: 'itf-pathway-standard'
  levels_to_activate: [1, 2, 3, 4]
  level_gate_strictness: 'balanced'          ← 3/5 domains required
  session_block_defaults: ['live-ball-heavy', 'constraint-games', 'point-play']
  session_block_ratios: { live-ball: 0.35, constraint: 0.25, point-play: 0.20, technique: 0.15, fitness: 0.05 }
  parent_visibility_defaults: { show_scores: true, show_competition: false, show_rankings: false }
  donna_voice: 'process-focused'
  pathway_weights: { technical: 0.25, tactical: 0.20, movement: 0.20, emotional: 0.20, competition: 0.15 }
  coach_permission_level: 'standard'

recreational defaultProfile:
  curriculum_spine: 'beginner-to-intermediate'
  levels_to_activate: [1, 2, 3]
  level_gate_strictness: 'flexible'          ← any 2 domains
  session_block_defaults: ['constraint-games', 'live-ball-heavy', 'fitness-integrated']
  session_block_ratios: { constraint: 0.35, live-ball: 0.30, fitness: 0.20, technique: 0.10, point-play: 0.05 }
  parent_visibility_defaults: { show_scores: false, show_competition: false, show_rankings: false }
  donna_voice: 'engagement-focused'
  pathway_weights: { technical: 0.20, movement: 0.20, consistency: 0.30, emotional: 0.30 }
  coach_permission_level: 'open'

dual-track defaultProfile:
  → applies high-performance profile to HP track
  → applies junior-development profile to development track
  → DONNA routes placement recommendations by track

private-coaching defaultProfile:
  curriculum_spine: 'custom'
  levels_to_activate: []                     ← director defines levels manually
  level_gate_strictness: 'director-only'     ← no automatic gate checks
  session_block_defaults: ['technique-blocks', 'live-ball-heavy']
  parent_visibility_defaults: { show_scores: true, show_competition: true, show_rankings: false }
  donna_voice: 'individual-focused'
  pathway_weights: { technical: 0.35, tactical: 0.25, movement: 0.20, mental: 0.20 }
```

### DONNA panel during Phase 1
After the director picks a model:
> "Good choice. [Model name] means I'll default to [key implication]. For example, [specific consequence for their selection — e.g., 'level promotion will require a director review rather than happening automatically']. You can adjust any of these defaults in the following steps."

### DB write at end of Phase 1
```ts
academies.settings.onboarding.classification = {
  model: 'high-performance',
  age_groups: ['yellow-ball', 'high-performance'],
  location_count: 1,
  completed_at: ISO,
}
academies.settings.academy_dna = {  // canonical key — fixes Seam 6
  source: 'onboarding_phase_1',
  version: 2,
  model: 'high-performance',
  ...
}
```

---

## Phase 2 — Coaching Identity
**Route:** `/director/onboarding/coaching`  
**Required:** Yes (min 1 coaching style)  
**Time:** ~3 minutes

### Purpose
The director's coaching philosophy shapes how DONNA interprets session wrap-ups, how coaches are guided during sessions, how assessment domains are weighted, and how DONNA talks to coaches vs. directors. This is the "how we coach" declaration.

### DONNA introduction
> "Now I want to understand how your coaches actually work. These choices shape how I interpret session data, what I flag as a good session, and how I talk to your coaches. Pick the styles that best describe what a great session looks like at your academy — not what you aspire to, but what you actually do."

### Questions

**Q2.1 — Coaching Styles** *(required, pick 1–3)*  
Options from existing `COACHING_STYLES` list (8 options).  
Pre-selected default: derived from academy classification.

| Classification | Pre-selected defaults |
|---|---|
| `high-performance` | `high-performance-discipline`, `tactical-first` |
| `junior-development` | `fundamentals-first`, `game-based` |
| `recreational` | `joy-retention`, `game-based` |
| `dual-track` | `fundamentals-first`, `high-performance-discipline` |
| `private-coaching` | `player-centered`, `fundamentals-first` |

**Q2.2 — Development Priority Stack** *(required, ordered top 3–5)*  
Options from existing `DEV_PRIORITIES` list (10 options).  
Director selects and drags into priority order.  
Pre-selected and ordered based on coaching style selection.

**Q2.3 — Coach Communication Voice** *(required, pick 1)*
- `structured` — "I expect detailed, consistent wrap-ups with domain scores and specific observations"
- `conversational` — "I want coaches to capture the feel of the session in their own words"
- `data-driven` — "I want metrics and measurable outcomes, and I'll interpret them myself"

Default: derived from academy classification (`high-performance` → `data-driven`; `recreational` → `conversational`).

### Pathway Weighting Model

The development priority stack (Q2.2) combined with the academy classification (Phase 1) produces the **Pathway Weighting Vector** — the core algorithm behind every DONNA placement recommendation, progression suggestion, and insight.

**Weight derivation:**

```
For each active DEV_PRIORITY:
  base_weight = 1.0 / number_of_selected_priorities  (equal base)
  position_bonus = (max_position - position_index) * 0.05  (rank 1 gets +0.20, rank 5 gets 0)
  classification_multiplier = defaultProfile.pathway_weights[domain] / 0.20  (relative to flat 20%)
  final_weight = (base_weight + position_bonus) * classification_multiplier
  normalized across all priorities to sum = 1.0
```

**Example (high-performance, priorities: tactical-iq #1, technical-foundation #2, competitive-toughness #3):**
```
tactical-iq:          (0.33 + 0.20) * 1.25 = 0.66 → normalized: 0.32
technical-foundation: (0.33 + 0.15) * 1.50 = 0.72 → normalized: 0.35
competitive-toughness:(0.33 + 0.10) * 1.25 = 0.54 → normalized: 0.26
physical:             (implicit from model)   0.15 → normalized: 0.07
```

This vector is stored as `academies.settings.academy_dna.pathway_weights` and read by:
- `StepDonnaRecommendation` (placement)
- `donnaBlindSpotDetector` (insight engine)
- Progression eligibility scoring
- Player development summaries

### System effects of Phase 2

| Captured value | System effect |
|---|---|
| Coaching styles | Session template block preset (Phase 4 pre-fill) |
| Coaching styles | Coach wrap-up instructions default text |
| Coaching styles | DONNA coaching session commentary tone |
| Dev priority stack | Pathway Weighting Vector (stored in `academy_dna`) |
| Dev priority stack | Assessment domain emphasis in curriculum nodes |
| Coach communication voice | Wrap-up field structure (detailed/narrative/numeric) |
| Coach communication voice | Director review queue summary format |

### DONNA panel during Phase 2
After coaching styles selected:
> "Good. [Style 1] + [Style 2] means I'll expect sessions to [concrete implication]. I'll flag it as a concern if a coach's wrap-up consistently shows something different. You can always adjust what I flag from the Director Dashboard."

---

## Phase 3 — Curriculum Foundation
**Route:** `/director/onboarding/curriculum`  
**Required:** Yes (min 1 level)  
**Time:** ~3 minutes

### Purpose
The curriculum defines what players learn at each level, what progression looks like, and what coaches deliver. This phase replaces both the Surface A `curriculumStartingPoint` question and the Surface B `/director/onboarding/curriculum` sub-step. The director answers the curriculum question exactly once.

### DONNA introduction
> "Your curriculum is the backbone of everything. It tells coaches what to teach, tells DONNA what to assess, and tells players what they're working toward. I've pre-selected the best starting point for your academy model — you can confirm it or customize it."

### Questions

**Q3.1 — Curriculum Spine** *(required, pick 1)*  
Pre-selected based on academy classification:

| Classification | Pre-selected spine | Description |
|---|---|---|
| `high-performance` | ITF Pathway Extended | Standard ITF stages + HP extension levels (6 levels) |
| `junior-development` | ITF Pathway Standard | Standard ITF stages (4 levels: Red/Orange/Yellow/Full) |
| `recreational` | Beginner to Club Player | 3-level pathway (Beginner/Improver/Club) |
| `dual-track` | ITF Standard (shown twice — HP track + Dev track) | Director configures each track separately |
| `private-coaching` | Custom | Director defines levels manually |

**Q3.2 — Active Levels** *(required, multi-select)*  
Shows levels from the selected spine.  
Pre-selected based on `age_groups` from Phase 1 (if "Red Ball" selected → Level 1 pre-checked).  
Director confirms or adjusts.

**Q3.3 — Level Gate Strictness** *(required, pick 1)*  
Pre-selected from `defaultProfile.level_gate_strictness`:
- `strict` — Player must meet the threshold in 4/5 assessed domains to advance
- `balanced` — Player must meet the threshold in 3/5 domains
- `flexible` — Player must meet the threshold in 2/5 domains, with director discretion
- `director-only` — DONNA suggests advancement, but director always decides manually with no threshold check

**Q3.4 — Progression Assessment Cadence** *(optional)*  
How often formal assessments should occur:
- Monthly / Every 6 weeks / Quarterly / Director-triggered only  
Default: derived from classification (`high-performance` → Every 6 weeks; `recreational` → Quarterly).

### System effects of Phase 3

| Captured value | System effect |
|---|---|
| Curriculum spine | Activates pre-built level records in `curriculum_levels` table |
| Active levels | `curriculum_levels.is_active = true` for selected levels |
| Level gate strictness | `level_gates` table records per level with threshold config |
| Assessment cadence | `academies.settings.academy_dna.assessment_cadence` |
| Curriculum spine | Pre-fills `/director/curriculum` (Surface B sub-step replaced) |
| Curriculum spine | Sets assessment domain defaults per level |

**Key correction (Seam 8):** The curriculum question is asked exactly once here, and the result directly activates DB records. The Surface B `/director/onboarding/curriculum` sub-step is retired and replaced by this phase. The director never sees this question again.

### DONNA panel during Phase 3
After spine selected and levels confirmed:
> "Your curriculum now has [N] active levels. [Level name] to [Level name] is your current pathway. I'll use this to assess where each new player starts and when they're ready to advance. Coaches will see level-appropriate cues in their session plans."

---

## Phase 4 — Session Blueprint
**Route:** `/director/onboarding/session-blueprint`  
**Required:** Yes (min 1 block selected)  
**Time:** ~2 minutes

### Purpose
The session blueprint defines what a default session at this academy looks and feels like. It produces the first class template in the DB — not just a preference, but an actual usable template coaches can deploy from day one.

### DONNA introduction
> "A session blueprint is what I use when a coach runs a session without a specific template. Think of it as your academy's default. I've pre-built a starting template based on your coaching style — adjust it to match what you actually run."

### Questions

**Q4.1 — Session Block Selection** *(required, multi-select, ordered)*  
Options from existing `SESSION_BLOCKS` list.  
Pre-selected and ordered based on coaching styles from Phase 2.

Coaching style → block presets:
- `fundamentals-first` → [technique-blocks, live-ball-heavy, point-play]
- `game-based` → [constraint-games, live-ball-heavy, point-play]
- `high-performance-discipline` → [technique-blocks, point-play, assessment, fitness-integrated]
- `player-centered` → [constraint-games, live-ball-heavy, stations]
- `tactical-first` → [constraint-games, point-play, live-ball-heavy]
- `movement-first` → [technique-blocks, fitness-integrated, live-ball-heavy]
- `competition-ready` → [point-play, technique-blocks, assessment]
- `joy-retention` → [constraint-games, live-ball-heavy, stations]

**Q4.2 — Default Session Duration** *(required, pick 1)*  
- 45 min / 60 min / 75 min / 90 min / 2 hours  
Default: 60 min.

**Q4.3 — Include Fitness Template?** *(optional)*  
"Yes, build a default fitness template" / "No — I'll create one later"  
If yes: shows a simplified block picker for warm-up / movement / strength / cool-down.

### System effects of Phase 4

| Captured value | System effect |
|---|---|
| Session blocks | Creates first `class_templates` record (status: `draft`) |
| Block order | Populates `template_blocks` records with sequence and default duration |
| Session duration | Sets `template.total_minutes` |
| Fitness template | Creates `fitness_templates` record (status: `draft`) if opted in |

**Key connection (Seam 1, 3):** This phase produces an actual DB-backed template. The "Create Class Template" card in the old `ActivationChecklistStep` (pointing to `/director/class-templates/new`) is now pre-fulfilled by onboarding. The director still reviews and publishes the template — it is a draft — but the skeleton exists from day one.

### DONNA panel during Phase 4
> "I've built your first session template from your coaching style choices. It's a draft — you can customize every block from `/director/curriculum`. You can create additional templates for different session types after launch."

---

## Phase 5 — Team Setup
**Route:** `/director/onboarding/team`  
**Required:** Yes (min 1 coach, min 1 group)  
**Time:** ~3 minutes

### Purpose
The system cannot run without at least one coach and one group. This phase creates those records. It replaces both Surface B `/director/onboarding/coaches-permissions` and `/director/onboarding/programs-groups`.

### DONNA introduction
> "Before you can run sessions, you need at least one coach and one player group. Add the main ones now — you can always add more later. Permissions can be fine-tuned after launch."

### Section 5A — First Coach (required)

**Q5A.1 — Coach Name, Email, Role** *(required, at least 1)*  
- Display name + email
- Role: `head_coach` / `coach`
- "Add another coach" link (repeatable)

**Q5A.2 — Coach Permissions** *(required, pick 1 per coach)*  
Three preset bundles (reduces cognitive load vs. per-permission toggles):
- `standard` — Can run sessions, submit wrap-ups, view their players. Cannot see other coaches' notes.
- `senior` — All standard permissions + can view all players, flag placement concerns.
- `limited` — Session entry and wrap-up only. No player profile access.

Default: `standard`.

**Q5A.3 — Coach Wrap-Up Expectations** *(optional, pick 1)*  
Pre-selected from Phase 2's `coach_communication_voice`:
- Shown as a preview of what coaches will see on their wrap-up form
- Director can adjust the emphasis: `detailed` / `narrative` / `quick`

### Section 5B — First Group (required)

**Q5B.1 — Group Name + Track** *(required, at least 1)*  
- Name: text input (e.g. "Yellow Ball Monday", "Junior Elite")
- Track: dropdown of active level names from Phase 3
- "Add another group" link (repeatable)

**Q5B.2 — Primary Coach for this Group** *(optional)*  
Picker from coaches added in 5A.

### System effects of Phase 5

| Captured value | System effect |
|---|---|
| Coach email + role | Creates `profiles` invite + `academy_memberships` record |
| Coach permissions | Sets permission flags per coach in `academy_memberships` |
| Wrap-up expectations | Configures `academies.settings.academy_dna.coach_recap_format` |
| Group name + track | Creates `groups` record with `is_active = true` |
| Coach-group assignment | Sets `groups.primary_coach_id` |

### DONNA panel during Phase 5
> "Once coaches accept their invitation, they'll see their sessions and players in the coach portal. They won't need any setup — their view is ready based on your choices here."

---

## Phase 6 — Parent & Player Experience
**Route:** `/director/onboarding/portals`  
**Required:** Yes (defaults accepted = complete — no blank answer possible)  
**Time:** ~2 minutes

### Purpose
Defines what parents and players see. This is the only phase where the current Surface A captures something useful (`parentVisibilityRules`, `playerMissionStyle`) but never wires it to the portals. This phase fixes that. Every answer here writes to a DB location the portals actually read.

### DONNA introduction
> "Parent and player portals are live from day one — so you need to decide what they can see before you launch. I've set conservative defaults based on your academy model. Review them and adjust."

### Questions

**Q6.1 — Parent Communication Style** *(required, pick 1)*
- `progress-focused` — "I want parents to understand their child's development journey"
- `outcome-focused` — "I want parents to see clear results, scores, and advancement"
- `minimal` — "I prefer to communicate with parents directly — keep the portal simple"

Default: derived from classification (`high-performance` → `outcome-focused`; `recreational` → `minimal`).

**Q6.2 — Parent Visibility Rules** *(required, confirm or adjust 5 rules)*  
Displayed as a list of toggles with plain-language labels.  
Pre-set defaults derived from academy classification:

| Rule | `high-performance` default | `junior-development` default | `recreational` default |
|---|---|---|---|
| Show detailed domain scores | ON | ON | OFF |
| Show competition history | ON | OFF | OFF |
| Show DONNA's assessment recommendations | OFF | OFF | OFF |
| Show raw coach session notes | OFF | OFF | OFF |
| Show player ranking vs. group | OFF | OFF | OFF |

Director can override any toggle. DONNA flags if a rule is turned ON that has trust/safety implications:
> "Showing raw coach notes to parents means coaches' unedited observations will be visible. I recommend keeping this OFF unless your coaches know to write parent-safe notes in every session."

**Q6.3 — Player Mission Style** *(optional, pick 1)*  
- `challenge-based` — "Give players missions that push their limits"
- `progress-focused` — "Show players how far they've come"
- `competition-driven` — "Motivate players through rankings and achievements"
- `intrinsic` — "Focus on effort, habits, and growth mindset"

Default: `progress-focused`.

### System effects of Phase 6 — the fix for Seam 7

Phase 6 closes Seam 7 by writing visibility rules to a location the portals actually read.

| Captured value | Written to | Read by |
|---|---|---|
| Parent visibility rules | `academies.settings.portal_rules.parent` | `/parent` page server component |
| Parent communication style | `academies.settings.academy_dna.parent_communication_style` | DONNA parent report builder |
| Player mission style | `academies.settings.portal_rules.player.mission_style` | `/player` page server component |

**New key structure in `academies.settings`:**
```json
{
  "portal_rules": {
    "parent": {
      "show_domain_scores": false,
      "show_competition_history": false,
      "show_donna_recommendations": false,
      "show_raw_coach_notes": false,
      "show_rankings": false
    },
    "player": {
      "mission_style": "progress-focused"
    }
  }
}
```

The parent and player portal server components read from `settings.portal_rules` first (Phase 6 output), then fall back to `parentSafeResponseRules.ts` hardcoded values for any rule not explicitly set.

### DONNA panel during Phase 6
> "These rules are live from day one. Parents and players can only see what you've enabled. You can adjust them any time from Director Settings — changes take effect immediately."

---

## Phase 7 — Launch Review
**Route:** `/director/onboarding/launch`  
**Required:** Yes — this is the launch gate  
**Time:** ~2 minutes

### Purpose
This is the single authoritative "are you ready?" moment. It replaces the `ActivationChecklistStep` (Surface A) and the `OnboardingProgressCard` (Surface B). After the director clicks "Launch Academy," the system writes `onboarding_completed_at` and the dashboard switches from setup mode to live mode.

### DONNA introduction
> "You're ready to review before launching. Below is everything you've set up — required items must be green to launch. Optional items can be completed after launch from the Director Dashboard."

### Readiness Checklist

**Required — cannot launch without these:**

| # | Check | Source | Pass condition |
|---|---|---|---|
| 1 | Academy name set | Phase 1 | `academies.name` is non-empty |
| 2 | Academy model selected | Phase 1 | `settings.academy_dna.model` is set |
| 3 | At least 1 curriculum level active | Phase 3 | ≥1 `curriculum_levels` with `is_active = true` |
| 4 | At least 1 class template (draft OK) | Phase 4 | ≥1 `class_templates` record |
| 5 | At least 1 coach invited | Phase 5 | ≥1 `academy_memberships` with coach role |
| 6 | At least 1 group created | Phase 5 | ≥1 `groups` with `is_active = true` |
| 7 | Parent visibility rules set | Phase 6 | `settings.portal_rules.parent` exists |

**Optional — shown as enrichment:**

| # | Item | Status | Route to complete |
|---|---|---|---|
| A | Players added and placed | `N players activated` or `0 — add after launch` | `/director/players` |
| B | Level gates configured | From Phase 3 gate strictness | `/director/curriculum/levels` |
| C | Fitness template created | From Phase 4 | `/director/fitness/templates` |
| D | Director interview completed | N/A — replaced by Phase 2 coaching DNA | — |
| E | Coaches accepted invitations | Pending email acceptance | Director notified when accepted |

### DONNA Launch Assessment

Before the launch button appears, DONNA shows a readiness summary:

```
[If all required checks pass:]
"Your academy is ready to launch. Required setup is complete. I've built your starting
curriculum, session template, and team structure. I'll learn from your first sessions
and give you better recommendations over time.

What happens when you launch:
→ Your coaches receive their portal invitations (if not already sent)
→ The director dashboard switches to live mode
→ DONNA's daily brief activates based on your academy's data
→ Player onboarding becomes available from /director/players"

[If any required checks are missing:]
"[N] required items are not complete. Go back to [phase name] to finish them.
Nothing is launched until all required items are green."
```

### The Launch Button

```
[Launch Academy →]
```

- Disabled until all 7 required checks pass
- Clicking shows a confirmation:  
  > "Launch [Academy Name]? This switches your director dashboard to live mode. You can continue refining settings after launch."
- Two CTAs: "Launch →" (primary) | "Not yet — keep reviewing" (secondary)

### DB write at launch — the single source of truth (closes Seam 9)

```ts
// Written atomically when the director confirms launch
academies.settings.onboarding = {
  completed_at: new Date().toISOString(),   // THE authoritative completion timestamp
  completed_by: user.id,
  classification: 'high-performance',
  setup_mode: 'guided',
  phases_completed: [
    'orientation', 'classification', 'coaching_identity',
    'curriculum', 'session_blueprint', 'team_setup', 'parent_experience'
  ],
  pathway_weights: { technical: 0.35, tactical: 0.25, competition: 0.25, physical: 0.15 },
  optional_items_at_launch: {
    players_added: 0,
    fitness_template: false,
    level_gates_detailed: false,
  },
}
```

Every "is onboarding done?" check across the codebase reads `settings.onboarding.completed_at`. If it exists and is a valid ISO timestamp, onboarding is complete. All other inferred signals (`isAcademyLive`, `OnboardingProgressCard` flags, local draft state) are replaced or made redundant by this single field.

---

## Academy Classification Model (Full Spec)

The 5 academy models set a `defaultProfile` that propagates into every phase. This is the classification decision that makes defaults feel intelligent.

```
Classification: high-performance
Purpose: Elite juniors, competition-track players, performance metrics
Curriculum: ITF Pathway Extended (6 levels)
Level gates: Strict (4/5 domains)
Template blocks: Technique → Point Play → Assessment (ratio: 30/25/25/10/10)
Parent visibility: Scores ON, Competition ON, Rankings OFF, Coach notes OFF
DONNA voice: Data-driven and direct
Pathway weights: { technical: 0.30, tactical: 0.25, competition: 0.25, physical: 0.15, mental: 0.05 }
Coach permissions: Standard
Wrap-up format: Detailed (domain scores + specific observations required)
Assessment cadence: Every 6 weeks

Classification: junior-development
Purpose: Multi-level juniors, long-term development, structured progression
Curriculum: ITF Pathway Standard (4 levels)
Level gates: Balanced (3/5 domains)
Template blocks: Live Ball → Constraint Games → Point Play (ratio: 35/25/20/15/05)
Parent visibility: Scores ON, Competition OFF, Rankings OFF, Coach notes OFF
DONNA voice: Process-focused and encouraging
Pathway weights: { technical: 0.25, tactical: 0.20, movement: 0.20, emotional: 0.20, competition: 0.15 }
Coach permissions: Standard
Wrap-up format: Narrative (written summary + flag option)
Assessment cadence: Every 6 weeks / Quarterly

Classification: recreational
Purpose: Adult or social tennis, fun and fitness, retention-focused
Curriculum: Beginner to Club Player (3 levels)
Level gates: Flexible (2/5 domains or director discretion)
Template blocks: Constraint Games → Live Ball → Fitness (ratio: 35/30/20/10/05)
Parent visibility: All minimized by default
DONNA voice: Engagement-focused and warm
Pathway weights: { technical: 0.20, movement: 0.20, consistency: 0.30, emotional: 0.30 }
Coach permissions: Open (more read access by default)
Wrap-up format: Quick (minimal required fields)
Assessment cadence: Quarterly / Director-triggered

Classification: dual-track
Purpose: HP and development tracks at the same facility
Curriculum: ITF Extended (HP track) + ITF Standard (Dev track)
Level gates: Strict for HP / Balanced for Dev
Template blocks: Separate defaults per track
Parent visibility: HP: Scores ON / Dev: Scores ON, Competition OFF
DONNA voice: Context-aware (switches by player's track)
Pathway weights: Set separately per track
Assessment cadence: HP: Every 6 weeks / Dev: Quarterly

Classification: private-coaching
Purpose: Individual and small-group lessons, no class structure
Curriculum: Custom (director defines manually)
Level gates: Director-only
Template blocks: Technique → Live Ball (director-adjustable)
Parent visibility: Scores ON, Competition ON (parents expect detailed individual feedback)
DONNA voice: Individual-focused
Pathway weights: { technical: 0.35, tactical: 0.25, movement: 0.20, mental: 0.20 }
Coach permissions: Standard (usually director is the coach)
```

---

## Pathway Weighting Model (Full Spec)

The Pathway Weighting Vector is the mathematical backbone of DONNA's placement and progression intelligence. It answers: "Given this academy's philosophy, how should I score a player against available groups?"

### How the vector is derived

```
Input:
  1. Academy classification → baseline weights (from defaultProfile above)
  2. Director's dev priority stack (Phase 2) → position-based adjustment
  3. Active age groups (Phase 1) → age-based floor on emotional/movement weights

Computation:
  For each domain in [technical, tactical, movement, competition, emotional, consistency]:
    base = classification_default[domain]
    rank_bonus = if domain appears in priority stack:
                   (max_rank - rank_index) * 0.04   (rank 1 adds 0.16; rank 5 adds 0)
                 else: 0
    age_floor = if age_groups includes ['red-ball','orange-ball']:
                  max(0.15, base) for movement and emotional
                else: base
    raw = base + rank_bonus + age_floor_adjustment
  
  Normalize: divide each raw value by sum of all raw values → sum = 1.0

Output:
  pathway_weights: { technical: N, tactical: N, movement: N, competition: N, emotional: N, consistency: N }
  Stored in: academies.settings.academy_dna.pathway_weights
```

### How the vector is used

**1. StepDonnaRecommendation (Surface C — player placement)**
```
For each available group:
  group_score = avg assessment score of existing players, weighted by pathway_weights
  candidate_score = player's assessment scores, weighted by pathway_weights
  match_score = 1 - abs(candidate_score - group_score) / group_score
  rank groups by match_score descending
  recommend top match
```

**2. Progression eligibility**
```
For each assessment domain score:
  weighted_score = raw_score * pathway_weights[domain]
aggregate = sum(weighted_score for all domains)
Compare against level gate threshold (which is also weighted)
```

**3. Insight engine (donnaBlindSpotDetector)**
```
When a pattern is detected (e.g., assessment_gap):
  Check if gap is in a high-weight domain → flags as critical
  Check if gap is in a low-weight domain → flags as low priority
```

**4. Player portal progress indicators**
```
Progress bar = aggregate weighted assessment score / maximum weighted score
Top "what to work on" message = lowest-weighted-score domains that are highest-weight
```

---

## Player Movement Edge Cases

These cases must be handled by the placement stepper (Surface C) with clear, non-alarming DONNA guidance. Each case defines: detection condition, DONNA message, allowed actions.

### Case 1 — No group at the right level

**Condition:** Assessment recommendation maps to Level 3, but no active `groups` have `track` = Level 3.  
**DONNA message:** "My recommendation is Level 3, but you don't have an active Level 3 group. Options: place in the closest available group, or create a Level 3 group first."  
**Director actions:** [Place in Level 2 group] [Place in Level 4 group] [Create Level 3 group →]  
**Audit log:** Notes "placed in adjacent level — no target group available at assessment level"

### Case 2 — Assessment spans multiple levels (domain conflict)

**Condition:** 3 domains score Level 3; 2 domains score Level 5.  
**DONNA message:** "Most scores point to Level 3, but [domain] and [domain] are significantly higher. This player may need Level 3 technical development while being ready for Level 5 competition intensity."  
**Director actions:** [Recommend Level 3] [Recommend Level 5] [Flag for detailed review]  
**Audit log:** Notes the specific domain split

### Case 3 — Director overrides 2+ levels up (level skip)

**Condition:** Director selects a group 2 or more levels above the DONNA recommendation.  
**DONNA message:** "This is a significant jump — [N] levels above my recommendation. This is allowed. I'll note it in this player's development record and monitor their progress closely."  
**Director actions:** [Confirm level skip] [Use my recommendation instead]  
**Audit log:** `director_override` flag + specific levels involved  
**Monitoring:** DONNA flags if skip player's assessment scores don't show matching progress within 90 days

### Case 4 — Age-level mismatch

**Condition:** Player is 9 years old but assessment scores place them at Level 5 (High Performance).  
**DONNA message:** "Assessment scores are high, but this player is [age]. Developmentally, early exposure to HP training can accelerate growth for some players and create burnout risk for others. The placement decision is yours — I'm flagging it so you're aware."  
**Director actions:** [Place in HP group as recommended] [Place in age-appropriate group instead]  
**Note:** DONNA never blocks this placement. It is flagged, not rejected.  
**Audit log:** Notes age-level mismatch + director's decision

### Case 5 — Target group is at capacity

**Condition:** Recommended group has reached its configured maximum player count.  
**DONNA message:** "My recommended group ([name]) is at capacity ([N] players). Here are the next best options: [ranked alternatives with match scores]."  
**Director actions:** [Place in alternative group] [Expand group capacity] [Add to waitlist]  
**Waitlist behavior:** Creates a `group_waitlist` record; DONNA surfaces when a spot opens

### Case 6 — No assessment completed (director skipped Step 3)

**Condition:** Director navigates to Step 4 (DONNA recommendation) without completing Step 3.  
**DONNA message:** "I don't have assessment data for this player. My recommendation is based on the default starting level for your academy model ([level]) and this player's age ([age]). Complete an assessment for a more precise recommendation."  
**Director actions:** [Accept default recommendation] [Go back and assess first]  
**Audit log:** Notes recommendation was based on defaults, not assessment data

### Case 7 — Returning player (existing records found)

**Condition:** New placement is started for a player who has prior `assessments` or `placement_recommendations` records (e.g., re-enrollment after a gap).  
**DONNA message:** "This player has prior records from [date range]. Last assessment: [summary]. Last placement: [group/level]. Use prior data as a starting point, or start fresh?"  
**Director actions:** [Pre-fill from prior data] [Start fresh (blank assessment)]  
**Pre-fill behavior:** If "prior data" selected, populates Step 3 with the last known assessment scores; director can adjust before saving

---

## Curriculum Connection (Full Map)

How each onboarding answer flows into the curriculum system:

| Phase | Captured value | Curriculum effect | Table / field |
|---|---|---|---|
| 1 | `academyModel` | Sets default curriculum spine | `curriculum_spines.template_id` |
| 1 | `ageGroups` | Maps age groups to suggested levels | Phase 3 pre-fill |
| 2 | `developmentPriorities` | Sets domain emphasis weights per level | `curriculum_levels.domain_weights` (new field) |
| 2 | `coachingStyles` | Sets default coach cue language per curriculum node | `curriculum_nodes.default_cue_style` |
| 3 | `curriculumSpine` | Activates spine template levels | `curriculum_levels.is_active = true` |
| 3 | `activeLevels` | Activates specific levels | `curriculum_levels` records |
| 3 | `levelGateStrictness` | Sets promotion threshold per level | `level_gates.required_domain_count` |
| 3 | `assessmentCadence` | Sets assessment due-date triggers | `academies.settings.academy_dna.assessment_cadence` |
| 4 | `sessionBlocks` | Populates default template → curriculum delivery | `template_blocks` records |

**The curriculum is not empty on launch day.** After Phase 3, the director goes to `/director/curriculum` and sees a pre-populated curriculum appropriate to their model, with levels, gates, and domain emphasis already configured. They can add/remove/customize — but they don't start from blank.

---

## Template Connection (Full Map)

How onboarding flows into the default session template:

| Phase | Captured value | Template effect | Table / field |
|---|---|---|---|
| 1 | `academyModel` | Selects session duration default | `class_templates.total_minutes` |
| 2 | `coachingStyles` | Selects block preset | `template_blocks` records |
| 4 | `sessionBlocks` | Creates block records | `template_blocks` |
| 4 | `blockOrder` | Sets sequence | `template_blocks.sequence` |
| 4 | `sessionDuration` | Sets total time budget | `class_templates.total_minutes` |
| 4 | `fitnessTemplate` | Creates fitness template if opted in | `fitness_templates` record |

**Template status:** All templates created during onboarding start with `status = 'draft'`. They become usable by coaches when the director publishes them from `/director/curriculum`. DONNA surfaces the "review and publish your first template" task on the dashboard on launch day.

---

## Coach Connection (Full Map)

How onboarding flows into the coach experience:

| Phase | Captured value | Coach effect | Table / field |
|---|---|---|---|
| 2 | `coachCommunicationVoice` | Sets wrap-up form field defaults | `academies.settings.academy_dna.coach_recap_format` |
| 2 | `coachingStyles` | Sets DONNA's coaching session commentary tone | DONNA brain context |
| 5 | `coachEmail` + `coachRole` | Creates profile invite + membership | `academy_memberships` |
| 5 | `coachPermissions` | Sets `can_view_all_players`, `can_edit_curriculum`, etc. | `academy_memberships.permissions` |
| 5 | `coachGroupAssignment` | Sets `groups.primary_coach_id` | `groups` |
| 5 | `wrapUpExpectations` | Configures required fields in wrap-up form | `academies.settings.academy_dna.required_wrapup_fields` |
| 7 | Launch | Sends coach invite emails | Triggered by `onboarding_completed_at` write |

**Coach experience from day one:** When a coach accepts their invitation and logs in, they see:
- Their assigned group(s) already populated
- Session templates (draft) in their view
- Wrap-up form pre-configured to the director's expectations
- DONNA panel with coaching tone matching the academy's philosophy

---

## Parent Connection (Full Map)

How onboarding flows into the parent portal — the fix for Seam 7:

| Phase | Captured value | Parent portal effect | Location |
|---|---|---|---|
| 1 | `academyModel` | Sets default parent visibility bundle | Phase 6 pre-fill |
| 6 | `parentCommunicationStyle` | Configures DONNA report tone | `settings.academy_dna.parent_communication_style` |
| 6 | `parentVisibilityRules` | Gates what parents see | `settings.portal_rules.parent.*` |
| 6 | `playerMissionStyle` | Configures player portal mission display | `settings.portal_rules.player.mission_style` |

**How the parent portal server component reads these rules:**
```ts
// In /parent/page.tsx (server component)
const portalRules = settings.portal_rules?.parent ?? DEFAULT_PARENT_RULES
// DEFAULT_PARENT_RULES = all-OFF (conservative fallback)
// Specific display components check portalRules.show_domain_scores etc. before rendering
```

**No more `parentSafeResponseRules.ts` as the sole gate.** That file defines what is *structurally* never safe (e.g., raw coach notes about a player's behavioral issues). The new `portal_rules.parent` layer controls what the director *chooses* to show. The two work in tandem:
- `parentSafeResponseRules.ts` — structural safety (hardcoded OFF for risky content types)
- `portal_rules.parent` — director preference (configurable per academy)

If `portal_rules.parent.show_raw_coach_notes = true` AND `parentSafeResponseRules.ts` blocks raw coach notes → `parentSafeResponseRules.ts` wins. Safety is never defeatable by a director preference toggle.

---

## Today Page — Setup Mode vs. Live Mode

The director dashboard behaves differently before and after `onboarding_completed_at`.

### Setup Mode (before `onboarding_completed_at`)

**What renders:**

```
/director page (setup mode)

[DONNA Setup Brief]
  "Academy setup is in progress. [N of 7] phases complete. [Phase name] is next."
  → [Continue Setup →] button — routes to /director/onboarding/[current_phase]

[Setup Progress Rail]
  Phase 1 ✓ Phase 2 ✓ Phase 3... [current phase indicator]
  Estimated time remaining: ~[N] minutes

[Nothing else renders]
```

**What does NOT render in setup mode:**
- KPI grid
- Attention queue
- Priority list
- Risk cards
- Decisions needed
- DONNA prompts card (replaced by setup brief)

**Rationale:** A director who has just created their academy has no data. Rendering empty KPI cards creates the impression that the dashboard is broken. Setup mode replaces the dashboard entirely until the academy is live.

### Live Mode (after `onboarding_completed_at`)

Full dashboard renders — greeting, KPIs, priorities, risks, decisions, DONNA prompts.

**Launch day additions (shown for 7 days after launch):**

```
[Launch Complete banner — shown for 7 days]
  "Your academy is live. First actions: publish your class template, invite your
  first players, review DONNA's first brief."
  → [Dismiss]

[Three quick-action cards]
  1. Publish your class template → /director/curriculum/templates
  2. Add your first player → /director/players/new
  3. Preview coach portal → [preview mode link]
```

**`OnboardingProgressCard` retirement:**  
The `OnboardingProgressCard` is retired after the new unified flow ships. It is replaced by:
- During setup: the `Setup Progress Rail` above
- After launch: the `Launch Complete banner` (7 days) then nothing

---

## Final Launch Review — Detailed Spec

The final launch review (Phase 7) must accomplish three things:
1. Verify all required items are in place
2. Give DONNA the chance to flag anything surprising before launch
3. Write the single authoritative completion record

### Pre-launch DONNA scan

Before the readiness checklist renders, DONNA runs one automated scan:

```
Checks (in order):
1. Any curriculum level has 0 curriculum nodes active? 
   → FLAG: "Level [X] has no curriculum content. Players placed at this level will have nothing to work from."
   
2. Any coach was added but has no groups assigned?
   → FLAG: "Coach [name] has no assigned group. They'll see an empty session list when they log in."
   
3. Parent visibility rules are all OFF (no scores, no competition, nothing visible)?
   → NOTE: "Parent portal will show very limited information. Parents may feel disconnected. Consider enabling at least basic progress visibility."
   
4. The pathway weights are heavily skewed to one domain (>40% in one domain)?
   → NOTE: "Your pathway weights heavily favor [domain]. DONNA's recommendations will prioritize this dimension strongly. Adjust in Settings if this wasn't intentional."
   
5. No players have been added?
   → NOTE (not flag): "No players added yet. You can add them after launch from /director/players. DONNA's data-driven features activate once players are in the system."
```

DONNA flags are shown as warning cards above the checklist. None of them block launch — they are advisory only.

### Readiness summary card

```
[Academy Name] — Launch Readiness

Required items (7/7 ✓):
  ✓ Academy name: Dabul Tennis Academy
  ✓ Academy model: High Performance
  ✓ Curriculum: ITF Extended — 4 levels active
  ✓ Class template: "Standard HP Session" (draft)
  ✓ Coach: Brian Dabul (head_coach) — invite pending
  ✓ Group: Junior Elite (Level 4)
  ✓ Parent rules: Configured

Optional items (shown, not blocking):
  ○ Players added: 0 — add after launch
  ○ Fitness template: not created
  ○ Detailed level gates: using defaults

DONNA's launch note:
  "Everything required is in place. First priority after launch: publish your 
  class template so Brian can run sessions immediately."
```

### Post-launch redirect

After `onboarding_completed_at` is written:
→ Redirect to `/director`
→ Dashboard renders in live mode
→ Launch Complete banner shown
→ DONNA brief shows launch-day priorities

---

## DB State Produced By Onboarding (Complete Picture)

After a director completes all 7 phases, the following records exist in the database:

| Table | Records created | Phase |
|---|---|---|
| `academies` | `settings.academy_dna` populated | 1, 2, 3 |
| `academies` | `settings.portal_rules` populated | 6 |
| `academies` | `settings.onboarding.completed_at` written | 7 |
| `curriculum_levels` | N levels activated | 3 |
| `level_gates` | 1 record per activated level | 3 |
| `class_templates` | 1 draft template | 4 |
| `template_blocks` | N blocks per template | 4 |
| `fitness_templates` | 1 draft (if opted in) | 4 |
| `academy_memberships` | N coaches added (pending invite acceptance) | 5 |
| `groups` | N groups created | 5 |

Nothing is created in: `players`, `assessments`, `placement_recommendations`, `sessions`, `proposed_actions`, `audit_logs` (player operations are post-launch).

---

## Migration Required

The blueprint requires one migration. This is the only schema change needed:

**No new tables.** All new data writes to existing `academies.settings` JSONB (new keys under existing column).

**One new read path:** Parent portal server component reads from `settings.portal_rules.parent` instead of only `parentSafeResponseRules.ts`.

**No migration needed** for this read path change — it reads from a JSONB key that may or may not exist; if it doesn't exist, the component falls back to `DEFAULT_PARENT_RULES`.

**The `academy_dna` key fix (Seam 6):** Write `academyOperatingLens` content into `academy_dna` key going forward. Existing academies that have `academyOperatingLens` populated can have it aliased at read time by checking both keys.

---

## What This Blueprint Does NOT Design

These are explicitly deferred to future sprints:

1. **Bulk player import** — CSV upload during onboarding. Deferred: high complexity, low V1 priority. Players added one-at-a-time via Surface C after launch.
2. **Multi-location configuration** — Requires a separate data model for locations. Not designed here.
3. **Consultant setup mode** — Requires platform-owner features. Not designed here.
4. **Automated coach email send at launch** — The `onboarding_completed_at` write should trigger a notification to invited coaches. Deferred: requires email infrastructure review.
5. **Onboarding resume on mobile** — The onboarding flow is desktop-first (director flow). Mobile coaching portal is a separate concern.

---

## Open Decisions (require product input before building)

| # | Decision | Options | Impact |
|---|---|---|---|
| D1 | Does Phase 3 (Curriculum) directly write `curriculum_levels` records, or generate a "setup draft" for the director to approve? | Direct write (simpler) vs. draft + approve (safer but extra step) | Build complexity + director cognitive load |
| D2 | Does the `OnboardingShell` remain as a resumable path for Directors who started Surface A but never launched? | Migrate them into the new flow at their current step / Start them over / Keep both flows temporarily | Migration complexity |
| D3 | At Phase 5 (Team Setup), do coaches receive their invitation email immediately, or only at launch? | Immediately (coaches may arrive before academy is ready) vs. at launch (cleaner) | Coach experience at signup |
| D4 | Should `dual-track` classification be a V1 feature or deferred? | Build it (complex, 2 curriculum spines) vs. defer (simplify V1) | Sprint scope |
| D5 | What is the exact Surface B retirement plan? | Remove all 7 sub-routes after new flow ships / Keep them as edit paths after launch | Existing data in `*_completed` flags |
