# ACADEMY OS — MASTER ORGANIZATION DOCUMENT
**Version:** 1.0 | **Date:** 2026-04-27 | **Status:** ACTIVE SOURCE OF TRUTH

---

## 1. IDENTITY

**Academy OS** is a voice-driven academy planning and player development operating system for tennis academies.

It is not a dashboard. It is not a CRM. It is not a scheduling tool.

It is the operational brain of a tennis academy — the first system purpose-built for how elite development actually works.

### Core promise

> "I say what I want, and the OS builds it."

Directors and coaches should eventually be able to say:

- "Build next week's orange-ball technical block."
- "Reduce Thursday fitness intensity because matchplay is Saturday."
- "Group these players by forehand and movement readiness."
- "Create a 4-week progression focused on serve and confidence routines."
- "Flag overload where skills, competition, and fitness are all high."
- "Create a placement assessment for Mateo and recommend the right group."

Manual UI exists for: **review · edit · approve · inspect · override · audit**

---

## 2. LOCKED STRATEGIC DIRECTION

### Voice creates. UI confirms. Database structures. System executes.

This is the four-word architecture contract. Every feature decision must be measured against it.

**Voice-first does NOT mean voice-only.** Every object supports both human UI and voice-generated creation.

**AI/voice may:** recommend, draft, generate, propose.
**Humans must:** approve, override, activate, reject.

### Voice pipeline (locked, never shortcut)

```
Voice input
  → transcript
  → normalized intent
  → structured payload
  → proposed action
  → validation
  → clarification (if needed)
  → review UI
  → director approval
  → execution
  → audit log
```

Voice never directly mutates core data. Every action goes through approval.

---

## 3. UI REFERENCE POLICY

**Primary reference:** `https://angles-os-mbgpiq3v.manus.space/`

**Default rule:** Match the Manus UI direction wherever possible.

**Improve only when there is a clear reason:** usability, mobile, workflow, accessibility, or voice-first execution.

### Preserve from Manus UI
- Premium dark athletic minimal design
- Operating-system feeling
- Clean cards and panels
- Strong spacing and information hierarchy
- Director-focused workflow
- Split-pane desktop layouts where appropriate

### Improve vs. Manus UI when needed for
- Voice-first creation flows
- Proposed action approval surfaces
- Mobile usability (separate pages, not cramped panes)
- Placement workflow clarity
- Session/template editing
- Coach speed
- Accessibility
- Visible status states and clear CTAs

**Desktop:** Split-pane layouts encouraged when useful.
**Mobile:** Separate flows for builder vs. detail tasks.

---

## 4. ARCHITECTURE PRINCIPLES (LOCKED)

| Principle | Rule |
|---|---|
| Voice-first | Every major object supports UI and voice creation |
| Database as language | Every object is machine-readable, modular, relational, versioned |
| No direct AI mutation | Voice → transcript → intent → proposed action → approval → execution |
| Human approval central | AI recommends. Humans decide. Always. |
| Audit everything | Every change has a source_type, created_by, and audit log entry |

---

## 5. SOURCE OF TRUTH HIERARCHY

```
Level 1 — Master Direction
  ACADEMY_OS_MASTER_ORG.md         ← THIS FILE
  packages/01_PRODUCT_STRATEGY_AND_SCOPE/

Level 2 — Buildable System Specs
  packages/02_DATABASE_AND_SUPABASE_SCHEMA/
  packages/03_VOICE_FIRST_ARCHITECTURE/
  packages/04_NEW_STUDENT_PLACEMENT_ENGINE/
  packages/05_PLAYER_PROFILE_AND_DEVELOPMENT_PATHS/
  packages/06_SESSION_TEMPLATE_EXERCISE_SYSTEM/
  packages/07_COACH_NOTES_AND_ASSESSMENTS/

Level 3 — Execution
  packages/08_UI_UX_WIREFRAMES_AND_SCREEN_SPECS/
  packages/09_AI_WORKFLOW_AND_CLAUDE_PROMPTS/
  packages/10_IMPLEMENTATION_ROADMAP_AND_TESTING/

Level 4 — Reference Only
  packages/11_ARCHIVE_EXISTING_FILES_AND_REFERENCE/
```

---

## 6. PACKAGE INDEX

| # | Package | Purpose | Status |
|---|---|---|---|
| 01 | Product Strategy & Scope | Vision, roles, V1/V2/V3, business model | Draft |
| 02 | Database & Supabase Schema | Full SQL schema, RLS, functions, seed data | Draft |
| 03 | Voice-First Architecture | Lifecycle, intent taxonomy, guardrails | Draft |
| 04 | New Student Placement Engine | Assessment, recommendation, activation | Draft |
| 05 | Player Profile & Development Paths | Baselines, tracks, progress, reassessment | Draft |
| 06 | Session / Template / Exercise System | Templates, blocks, periodization, load | Draft |
| 07 | Coach Notes & Assessments | Notes, voice pipeline, parent updates | Draft |
| 08 | UI/UX Wireframes & Screen Specs | Design system, all screen specs | Draft |
| 09 | AI Workflow & Claude Prompts | AI workflow, all Claude prompts | Draft |
| 10 | Implementation Roadmap & Testing | Build order, sprints, QA, deployment | Draft |
| 11 | Archive & Reference | Existing files, prior work, screenshots | Archive |

---

## 7. BUILD ORDER

```
Phase 0 — Audit and organize (COMPLETE)
Phase 1 — Database cleanup and Supabase migration package
Phase 2 — New Student Placement Engine (V1 core feature)
Phase 3 — Player Profile and Development Paths
Phase 4 — Session / Template / Exercise System
Phase 5 — Coach Notes and Assessments
Phase 6 — Voice Command proposed-action layer (shell)
Phase 7 — UI polish based on Manus reference
Phase 8 — Testing, QA, deployment
```

---

## 8. V1 PRIORITIES (NON-NEGOTIABLE)

1. Database source of truth (Supabase, clean schema, RLS)
2. Player + group + placement schema working
3. `finalize_player_placement()` function
4. Placement screens (new student flow)
5. Player profile baseline view
6. Template / session system (create, view, edit)
7. Coach notes (written, then voice pipeline shell)
8. Proposed action architecture (database schema first)
9. Voice command UI shell (no live AI required in V1)

---

## 9. CURRENT REPO STATE

**Framework:** Static HTML (no framework)
**Database:** Not yet connected (Supabase planned)
**Auth:** Not yet implemented
**Files:** `index.html` (pitch deck) + `app.html` (functional prototype)

The `app.html` is a fully working frontend prototype using localStorage — it demonstrates every screen, role, and interaction without a backend. It is the canonical UX reference for building the real Supabase-backed app.

---

## 10. HOW TO USE THIS REPO WITH CLAUDE CODE

### Starting a session

1. Read `ACADEMY_OS_MASTER_ORG.md` first (this file)
2. Read `MISSING_ITEMS_AND_DECISIONS.md` to know what's unresolved
3. Read the relevant package README for the area you're working on
4. Use `generated/recommended_next_steps.md` for the immediate task list

### Working with Claude Code

- Begin every session: "Read ACADEMY_OS_MASTER_ORG.md and tell me current state"
- Never skip the voice pipeline stages — always build: intent → proposed → approval → execute
- Always update the package README when changing scope
- Always write to `DATABASE_CHANGELOG.md` when modifying schema
- Test after every major schema change

### Prompt pattern

```
Read [relevant package README].
I want to build [specific feature].
Respect locked architecture: voice-first, human approval, no direct AI mutation.
Use Manus UI as reference: [URL].
Create [specific output].
```

---

## 11. HOW TO USE ZIP PACKAGES

Run from `Academy_OS_Master_Build/`:

```bash
bash scripts/create-zips.sh
```

This produces one zip per package + one master zip.

Send individual zips to:
- **Supabase setup:** Package 02
- **Voice architecture review:** Package 03
- **Placement engine dev:** Package 04
- **UI/UX designer:** Package 08
- **AI/Claude prompt engineering:** Package 09
- **Project management:** Package 10

---

## 12. RISKS

| Risk | Severity | Status |
|---|---|---|
| No Supabase project connected | High | Unresolved |
| No auth system designed | High | Unresolved |
| Voice AI model not selected | Medium | Unresolved |
| Parent portal scope unclear | Medium | Unresolved |
| Multi-academy support scope unclear | Low | Deferred to V3 |
| RLS policy completeness unknown | High | Unresolved |

---

## 13. NEXT BEST ACTIONS

1. Resolve all items in `MISSING_ITEMS_AND_DECISIONS.md`
2. Create Supabase project and run Package 02 migrations
3. Build placement engine (Package 04) as first live feature
4. Wire `app.html` prototype flows to Supabase backend
5. Run Package 10 roadmap weekly sprint plan

---

*This file is the command center. When in doubt, come back here.*
