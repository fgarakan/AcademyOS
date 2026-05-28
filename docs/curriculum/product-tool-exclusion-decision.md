# Product Tool Exclusion Decision
## Academy OS Core Curriculum

**Decision date:** 2026-05-02
**Decision owner:** Farshad Garakani, Founder — Angles / Academy OS
**Status:** LOCKED

---

## 1. Decision Summary

The core Academy OS curriculum does **not** depend on, reference, or require any Angles physical product, hardware device, or proprietary app.

The curriculum is a **product-agnostic tennis development spine.** Any academy — whether or not they use Angles tools — must be able to run the full curriculum, evaluate gates, track player progress, and use the coach language system without ever purchasing or using a Swinget, The Angle™, or the SwingCheck app.

This is a permanent architectural decision, not a deferral pending future work.

---

## 2. Why Product Tools Are Excluded from the Core Curriculum

**Adoption:** Academy OS is designed to serve multiple academies. Not all pilot or future clients will use Angles physical products. Tying the curriculum to product adoption would make AOS unsellable to any academy that does not buy into the full Angles hardware ecosystem.

**Integrity:** A curriculum gate that requires a specific device to evaluate is not a curriculum gate — it is a hardware sales prerequisite. Gates must be observable by any qualified coach using standard coaching practice.

**Trust:** Directors, head coaches, and parents must be able to read the curriculum and understand it without needing to know what Angles products are. The curriculum is a trust document. It must stand on its own.

**Sequencing:** The Angles tools integration is a separate value-add layer that may be introduced after a client is already using Academy OS and has built trust in the core curriculum. The core curriculum comes first.

**Source-file quality:** The only source file that covers Angles product integration (`AOS_Curriculum_TechModel.xlsx`) is almost entirely flagged `[PROPOSED:]` — meaning the content is inferred, not confirmed Angles IP. It cannot be treated as authoritative even if product integration were the goal.

---

## 3. What Remains Allowed from the Angles Philosophy

The following are **Angles coaching philosophy** elements, not product dependencies. They are present throughout the core curriculum and remain fully included:

| Element | Where It Appears |
|---|---|
| **Learn • Train • Play** daily session structure | Matrix, Volume, Drills session_block field |
| **Intention → action → skill** framing | Matrix Technical/Tactical cells, CoachLanguage |
| **Court mapping vocabulary** (middle / crosscourt / short angle / line / transition / endgame) | Tactics, Matrix Tactical column, Drills tags |
| **Decision-tree progression** | Tactics Decision Trees sheet |
| **Skill Track and Competition Track** (dual track) | Matrix, Competition, Gates, StressTest |
| **Fitness Path** (off-court physical support) | Fitness, Volume, Matrix Fitness Support column |
| **Evidence-based level movement** (gate-gated, not time-served) | Gates, Matrix Level-Up Gates column |
| **Positive coaching language** (Doing Well / Working On / Current Focus / Next Step) | CoachLanguage (all sheets), Drills coaching_cues |
| **Bisector recovery principle** | Tactics Bisector Recovery sheet |
| **Human-reviewed AI suggestions** | AOS proposed_actions pipeline (architecture) |

These are pedagogical and philosophical positions. They do not require any Angles product to observe, coach, or evaluate.

---

## 4. What Is Explicitly Excluded from the Core Curriculum

The following must not appear in any core curriculum synthesis document, data model table, gate criterion, drill instruction, or coach language entry:

| Excluded Item | Category |
|---|---|
| **Swinget** | Physical product (rotational training tool) |
| **The Angle™** | Physical product (arm-connection training device) |
| **SwingCheck** | Proprietary app (video/zone diagnostic tool) |
| **Three diagnostic zones** (Behind / Between Legs / Green Zone ✓) | Product-specific diagnostic framework |
| **6-stage Angle methodology** (SwingCheck → Guided Reps → Strap Mode → Hand Fed → Stances → Live Play) | Product-coupled coaching methodology |
| **Tool volume cadence** (e.g., "7–10 min Swinget daily") | Product usage recommendations |
| **Tool integration map** per stage | Product-stage coupling |
| **Strap Mode reps** or any device-specific rep protocols | Product-gated practice |
| Any gate criterion requiring a device or app to evaluate | Product-gated assessment |
| Any assessment that requires the SwingCheck zone output to record evidence | Product-gated evidence |

---

## 5. How the Excluded TechModel File Should Be Treated

**File:** `docs/curriculum/source-files/extracted/AOS_Curriculum_TechModel.xlsx`

**Status:** PRESENT in repo, EXCLUDED from core curriculum synthesis.

Rules:
- Do not delete it.
- Do not modify it.
- Do not import any of its content into the core curriculum synthesis, master spine, data model, or seed pack.
- Do not create a `[PROPOSED:]` resolution checklist for this file in the synthesis document. Resolution is not the path — exclusion is the path.
- In the synthesis document, reference this file only in the "Excluded Product Tool Layer" section.

When referencing in docs: describe it as *"the Angles product integration reference — deferred to the optional tools layer."*

The file retains its value as a reference for future optional integration work. It should not be confused with confirmed curriculum content.

---

## 6. Future Optional Layer

When Academy OS has an established client base and when the decision is made to offer Angles tool integration as a premium add-on, the following layers can be built on top of the core curriculum. They are **additive** — they extend the core without replacing it.

### 6a. Angles Tools Integration Layer

A separate, opt-in configuration at the academy level that adds:

- Swinget warm-up volume guidance per stage (from TechModel Volume Cadence sheet)
- The Angle™ block cadence per session (from TechModel Tool Integration Map)
- Three-zone diagnostic overlay on technical assessments (Behind / Between Legs / Green Zone)
- Tool-specific failure modes (from TechModel Failure Modes sheet)

**Activation:** Academy-level feature flag in AOS (`tools_integration_enabled: boolean`). When false (default), none of this content surfaces in any coach or director view.

### 6b. Angles App Skill Homework Layer

An optional player-facing homework module that:

- Assigns SwingCheck diagnostic sessions as between-session tasks
- Tracks Green Zone % over time via SwingCheck app integration
- Surfaces zone trend data on the Director/Coach dashboard
- Allows SwingCheck evidence to optionally satisfy specific gate criteria (supplement to, not replacement for, standard coach observation)

**Activation:** Player-level opt-in, requires SwingCheck app connection.

### 6c. Optional Device/App Evidence Integration

A general mechanism (not Angles-specific) allowing external app data to satisfy gate evidence requirements — SwingCheck, GPS trackers, heart rate monitors, video analysis tools. The gate remains coach-observable without the device; the device data enriches the evidence record but is never the sole path to advancement.

---

## 7. The Core Rule

> **The curriculum must remain fully usable by an academy even if they never use any Angles physical product or app.**

Every gate must be evaluable by direct coach observation.
Every technical criterion must be describable in plain stroke/movement terms.
Every drill must be runnable with standard tennis equipment (court, balls, racquet, cones).
Every coach language entry must be intelligible without knowing what Swinget or The Angle is.

This rule is not revisable without a new explicit product decision.

---

## 8. Impact on Source Files in Use

| File | Status in Core Curriculum |
|---|---|
| `AOS_Curriculum_Matrix.xlsx` | INCLUDED — product references stripped in synthesis |
| `AOS_Curriculum_Gates.xlsx` | INCLUDED — [PROPOSED:] tool notes in Notes column are informational only, not gate criteria |
| `AOS_Curriculum_TechModel.xlsx` | **EXCLUDED** — entire file deferred to optional tools layer |
| `AOS_Curriculum_Tactics.xlsx` | INCLUDED — no product dependencies |
| `AOS_Curriculum_Drills.xlsx` | INCLUDED — explicitly scoped product-independent by design |
| `AOS_Curriculum_Competition.xlsx` | INCLUDED — no product dependencies |
| `AOS_Curriculum_Fitness.xlsx` | INCLUDED — no product dependencies |
| `AOS_Curriculum_CoachLanguage.xlsx` | INCLUDED — no product dependencies |
| `AOS_Curriculum_Volume.xlsx` | INCLUDED — references Swinget minutes in Swinget-specific columns only; core volume guidance is product-independent |
| `AOS_Curriculum_StressTest.xlsx` | INCLUDED — product tool FM notes are informational; core failure modes are product-independent |

---

*This document is a permanent product decision record. It should be read at the start of any curriculum synthesis sprint and referenced whenever a curriculum feature touches technical model, gate design, or assessment tooling.*
