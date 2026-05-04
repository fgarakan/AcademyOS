# Current Build Target

**Last updated:** 2026-05-04
**Current phase:** Phase 1 — Director-facing player operating spine + Voice Intake OS Foundation (Sprints 219–249 complete)

---

## Active target

**Voice Intake OS Foundation** — Sprint 249 complete.

Next up: **Competition tab content** — UTR history, match results, tournament records.

---

## Build order — current state

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
| Competition | **← NEXT** — UTR history, match results, tournament records |

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
