# Current Build Target

**Last updated:** 2026-05-15
**Current phase:** Phase 1 — Donna COO Foundation Layer COMPLETE (Mega Sprint 359–378 complete)

---

## Active target

**Donna COO Foundation Layer — Mega Sprint 359–378 COMPLETE (2026-05-15)**

Donna has been built out from a class-template assistant into an executive assistant / COO foundation layer. All 20 sprints complete and pushed.

Next up: Sprint 379+ — Director-initiated Donna workflows or Production readiness pass.

---

## Donna COO Foundation Layer — COMPLETE (Sprints 359–378)

| Sprint | Deliverable | Status |
|---|---|---|
| 359 | Draft Persistence (sessionStorage) | COMPLETE |
| 360 | Version History Panel | COMPLETE |
| 361 | Audit Trail (in-memory) | COMPLETE |
| 362 | Approval Contract | COMPLETE |
| 363 | Role Permission Matrix | COMPLETE |
| 364 | Protected Action Registry | COMPLETE |
| 365 | Execution Adapter + Registry | COMPLETE |
| 366 | Communication Draft + Card | COMPLETE |
| 367 | Parent-Safe Rules + Content Filter | COMPLETE |
| 368 | Message Review Panel | COMPLETE |
| 369 | Daily Brief (API route + card) | COMPLETE |
| 370 | What Needs Attention Engine | COMPLETE |
| 371 | Coach Brief Workflow | COMPLETE |
| 372 | Attendance Exception Workflow | COMPLETE |
| 373 | Review Queue Badge Integration | COMPLETE |
| 374 | Recommendation Object Model | COMPLETE |
| 375 | Rule-Based Recommendation Engine + Card | COMPLETE |
| 376 | Learning Feedback Signals | COMPLETE |
| 377 | Preference Memory (localStorage) | COMPLETE |
| 378 | COO Command QA + Demo Readiness | COMPLETE |

---

## Build order — current state

### AI Note Structuring MVP — COMPLETE (Sprint 100)
- `src/lib/ai/structureCoachNote.ts` — Anthropic Claude integration; JSON schema output; confidence score; graceful fallback when `ANTHROPIC_API_KEY` absent
- `src/lib/actions/notes.ts` — `generateNoteDraftAction`; staff membership gate (director/head_coach/coach only); note text never reaches API unless gate passes
- `src/components/player/AIDraftPanel.tsx` — draft UI: textarea input, "Draft with AI" button, confidence badge, warnings, overwrite guard, 5-field editable form, "Apply Draft to Summary" button
- `src/app/director/players/[playerId]/NotesAIDraftSection.tsx` — glue: AIDraftPanel + CoachObservationsFeed with "Use for Draft →" per observation
- Notes tab in player profile wired: observations prefill draft panel; applying draft writes `player_development_summary` with `source='ai_draft'`, `show_to_student=false`, `show_to_parent=false`
- **Activation:** set `ANTHROPIC_API_KEY` in `.env.local`; feature degrades gracefully (orange warning) when key absent

---

### Voice Intake OS Foundation — COMPLETE (Sprints 240–249)
- Architecture audit + north star document (`docs/conversational-os/voice-intake-architecture.md`)
- `VoiceIntakePanel` component — controlled voice/text input with role badge, safety note, examples
- `VoiceIntakeTypes` — full typed model for `VoiceIntakeDraft`, intents, destinations, safety flags
- `structureVoiceIntake()` — deterministic structuring; intent detection, entity extraction, safety flags, confidence
- Coach voice structuring wired into `CoachRecapCommandPanel`
- `voiceDestinationRouter.ts` — 14 destination definitions, role restrictions, risk levels
- `createVoiceIntakeDraftAction` — proposed_actions pipeline integration; always `pending_review`
- Voice Intake tab in Director Review Queue with `VoiceIntakeDraftCard` and decision controls
- `voiceRoleGuardrails.ts` — explicit intent permission matrix; defense-in-depth filtering in structurer
- Demo flow and QA documentation

---

### Conversational OS Foundation — COMPLETE (Sprints 219–228)
- Curriculum learning module model + UI preview (`/director/curriculum/learning`)
- Role-aware chat guardrails (`src/lib/commands/roleGuardrails.ts`)
- Director Command Center with guardrails + draft visibility
- Parent guidance preview (director-side, not sent)
- Coach recap review improvements
- Player Q&A learning module integration
- Conversational OS master plan documented

---

### IDP + Gap Engine — COMPLETE (Sprints 229–238)
- `IndividualDevelopmentPlan` model + role-specific views
- Player portal live development plan (`/player`)
- Parent portal approved development plan (`/parent`)
- Training gap detection (`detectTrainingGaps`)
- Knowledge gap detection (`detectKnowledgeGaps`)
- Role-specific gap guidance (`buildDirectorGapGuidance`, `buildCoachGapGuidance`)
- `GapGuidanceSummaryCard` wired into director player profile Skill Path tab
- `CoachSessionGapBriefPanel` wired into coach session workspace
- `execute_approved_action()` RPC expanded from 5 → 11 of 15 action types

---

### Step 1 — Players List `/director/players` — COMPLETE
Full player directory with search, status filter, curriculum level badge, assessment dates, advancement indicator.

---

### Step 2 — Player Profile responsive layout — COMPLETE
`max-w-5xl p-4 sm:p-6` layout. No fixed-width column grid. Back link points to `/director/players`.

---

### Step 3 — Player Profile tab structure — COMPLETE
5 tabs: Overview · Skill Path · Competition · Fitness / Load · Notes

---

### Step 4 — Player Profile tab content — IN PROGRESS

| Tab | Status |
|---|---|
| Overview | Complete — curriculum snapshot, domain counts, development summary |
| Skill Path | Complete — level picker, assignment card, gap guidance, advancement, gates, Q&A preview |
| Notes | Complete — observations feed, priorities, evidence timeline, voice note, parent guidance preview |
| Fitness / Load | Complete (Sprint 239) — volume, domain mix, intensity, fatigue risk, trend, overload alert |
| Competition | Complete (Sprint 250) — UTR profile, trend chart, match results, insights |

Data available:
- `src/lib/backend/utr.ts` — UTR history, insights
- `src/lib/backend/assessments.ts` — assessment history

---

### Step 5 — Director Dashboard `/director` — COMPLETE
Academy Vital Signs, Priority Queue, Alerts, Today's Sessions, Pending Placements, active sessions feed.

---

### Step 6 — Placement Engine
New student onboarding flow.

Flow: New Player form → 5-dimension Assessment → AI Recommendation review → Approve/Override/Reject → Activate

Backend: `src/lib/backend/assessments.ts` has `createAssessment()` and `finalizePlacement()`.

---

### Step 7 — Templates and Sessions
Session template library and session builder.

Backend: `src/lib/backend/sessions.ts` is ready.

---

### Step 8 — Coach Workspace
Coach home, live session runner, outcome recording.

Route: `/coach` — coach sessions workspace partially built (Sprints 237–238).

---

### Step 9 — Voice Command Center (execution layer)
Voice Intake OS Foundation (Sprints 240–249) is complete — inputs, structuring, routing, review queue, and safety guardrails are all built.

Remaining work before full voice execution:
- Extend `execute_approved_action()` RPC to cover voice intake action types (currently 11 of 15 total action types)
- Sprint 250+ — voice intake execution routing: approved voice intake drafts trigger specific downstream actions
- See `docs/conversational-os/approved-action-execution-coverage-plan.md` for remaining action types
- See `docs/conversational-os/voice-intake-demo-flow.md` for V1 limitations and AI/STT integration path

---

## How to confirm the current target before starting

Read this file. The active step is the Competition tab unless this file has been updated.
