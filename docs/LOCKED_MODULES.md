# Locked Modules

**Last updated:** 2026-05-04

This file defines what can and cannot be touched in any given session.
Read before writing any code.

---

## Locked — do not touch unless explicitly instructed

These modules are stable, compile cleanly, and must not be modified.
A task description must name the specific file to unlock it.

| Module | Files | Reason locked |
|---|---|---|
| Supabase backend foundation | `src/lib/backend/*.ts` | Compiles cleanly. Stable runtime. All queries typed. |
| Database types | `src/lib/supabase/database.types.ts` | Generated file — do not edit by hand. Regenerate after migrations. |
| Supabase migrations | `supabase/migrations/*.sql` | Applied to live database. Do not modify applied migrations. |
| Auth / login / signout | `src/app/login/`, `src/app/api/auth/signout/` | Working. Role routing depends on this. |
| Middleware role routing | `src/middleware.ts` | Auth and role enforcement for the entire app. |
| Supabase client setup | `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts` | Stable. Do not change cookie/session handling. |
| Voice spec types | `src/lib/voice/voice-command-types.ts`, `src/lib/voice/voice-command-examples.ts` | Spec-only. Do not modify without an explicit voice architecture decision. |
| Placement spec types | `src/lib/placement/placement-types.ts` | Spec-only. |
| Proposed action validator | `src/lib/actions/proposed-action-validator.ts` | Stable validation logic. |
| Server actions | `src/lib/actions/curriculum.ts` | Stable. |
| Utility functions | `src/lib/utils.ts` | Stable. Do not add to this without a specific need. |
| DB type alias | `src/lib/types/db.ts` | One-liner. Do not touch. |
| Parent-safe response rules | `src/lib/communications/parentSafeResponseRules.ts` | Stable. Defines allowed/blocked parent-facing content. Do not weaken safety rules. |
| Curriculum learning modules | `src/lib/curriculum/learningModules.ts` | Pure helper. No DB calls. No AI. All outputs are deterministic. Do not add external dependencies. |
| Role guardrails | `src/lib/commands/roleGuardrails.ts` | Stable permission model. Do not add permissions without explicit sprint authorization. |
| Voice role guardrails | `src/lib/voice/voiceRoleGuardrails.ts` | Voice intent permission matrix. Do not weaken role restrictions without explicit sprint authorization. |
| Voice intake types | `src/lib/voice/voiceIntakeTypes.ts` | Canonical type definitions for voice intake system. All voice modules depend on this. |
| Conversational OS master plan | `docs/conversational-os/conversational-os-master-plan.md` | Locked principles document. Update only when architecture changes. |
| Voice intake architecture | `docs/conversational-os/voice-intake-architecture.md` | North star document for Sprints 240–249. Update only when V2 architecture decisions are made. |

---

## Usable but incomplete — safe to extend, not safe to break

These modules have real working code. New features can be added.
Existing functionality must not be broken.
Always run `npx tsc --noEmit` after any change.

| Module | Files | Current state | What can be added |
|---|---|---|---|
| Player Profile | `src/app/director/players/[playerId]/page.tsx`, `src/components/player/` | Tab layout, curriculum, advancement, Q&A preview, parent guidance preview | Additional tab content, responsive fixes |
| Player Q&A helper | `src/lib/player/playerProgressQa.ts` | Handles 5 intents, learning module hint support | New intents, additional answer fields — do not weaken safety note logic |
| Director Command Center | `src/app/director/command-center/` | Parse, guardrail, draft creation, draft visibility, voice structuring, review draft button | New example commands, intent label additions |
| Voice intake structurer | `src/lib/voice/structureVoiceIntake.ts` | Deterministic structuring, safety flags, NEVER_AUTOMATIC invariants, role-guardrail filtering | New intent patterns, entity extractors — do not weaken safety flag detection |
| Voice destination router | `src/lib/voice/voiceDestinationRouter.ts` | 14 destination definitions, role restrictions, risk levels | New destinations if sprints add new modules |
| Voice Intake Panel | `src/components/voice/VoiceIntakePanel.tsx` | Controlled text/voice input with role badge and safety note | Props additions only |
| Voice Intake Review Card | `src/app/director/review/VoiceIntakeDraftCard.tsx` | Display card + decision controls for voice intake review queue | Field additions, display polish |
| Coach Recap Review | `src/app/director/review/StructuredDraftCard.tsx` | Shows attendance, observations, session focus, will/won't change panels | Additional field display only — no approval logic changes |
| Curriculum Learning Module UI | `src/app/director/curriculum/learning/page.tsx` | Director preview by level/domain with filters | Read-only additions only |
| UI component library | `src/components/ui/` | 15+ components exported | New components if needed — check existing ones first |
| Director layout + sidebar | `src/app/director/layout.tsx`, `src/components/nav/SidebarNav.tsx` | Sidebar renders, academy name from DB, pending count hardcoded at 0 | Wire up real pending count, add notification badge |
| Bottom tab nav | `src/components/nav/BottomTabBar.tsx` | Coach/Player mobile nav — renders correctly | No changes needed yet |

---

## Partially built — exist but incomplete

| Module | Route | Status | What remains |
|---|---|---|---|
| Director Dashboard | `/director` | **Built** — Command Center, Priority Queue, Alerts, Sessions, AI Suggestions | Sidebar pending count now live (Sprint 27) |
| Players List | `/director/players` | **Built** — directory with search, status filter, curriculum badge | Bulk actions, group filter |
| Curriculum Explorer | `/director/curriculum` | **Built** — explorer, level detail, version cards, voice override panel | Drill `procedure` field, guided customization assistant |
| Curriculum Learning Modules | `/director/curriculum/learning` | **Built** — director preview by level/domain | Not persisted to DB; player-facing exposure not built |
| Director Command Center | `/director/command-center` | **Built** — parse, guardrail, draft, draft visibility | Full AI execution layer |
| Director Review Queue | `/director/review` | **Built** — all 8 tab types with count badges | Voice intake execution routing |
| Sessions screen | `/director/sessions` | **Built** — list + full session detail | Session builder/generator |
| Coach workspace | `/coach` | **Built** — real data from coachWorkspace, today's sessions, observations | Full wrap-up persistence (Sprint 28) |
| Coach sessions | `/coach/sessions` | **Built** — list + full session detail with wrap-up | Two recap UIs coexist (Sprint 28 fix) |
| Coach players | `/coach/players` | **Built** — player list with deep link to `/coach/players/[playerId]` | Notes list, gamification |
| Player portal | `/player` | **Built** — live IDP, what to work on, mini challenge, Q&A | Requires profile_id linkage; progress history; gamification |
| Parent portal | `/parent` | **Built** — live IDP parent view, why it matters, how to support | Requires guardian linkage; attendance data (Sprint 33) |

## Not built yet — do not assume these exist

| Module | Route | Status | When to build |
|---|---|---|---|
| Competition screen | `/director/competition` | Does not exist | Future |
| Intelligence screen | `/director/intelligence` | Does not exist | Future |
| Reports screen | `/director/reports` | Does not exist | Phase 5 |
| Configuration screen | `/director/configuration` | Does not exist | Phase 4+ |
| Coach voice | `/coach/voice` | Does not exist | Future |
| Placement Engine UI | `/director/placement` | Scaffolded; not complete | Step 6 |
| Voice Intake Execution Routing | Anywhere | Foundation complete. Execution layer not yet built. | Sprint 250+ |
| Gap Class Modules | Anywhere | Architecture only (Sprint 25) | Requires schema approval |
| Curriculum Customization Assistant | `/director/curriculum` | Architecture only (Sprint 26) | Sprint 27+ build sequence |

---

## Architecture red lines — never cross regardless of instruction

1. Voice commands never directly mutate core data — they go through `proposed_actions` pipeline.
2. `template_blocks` and `session_blocks` are always separate tables — never merge.
3. Every new table must have RLS and `academy_id`.
4. `finalize_player_placement()` is the only path to activate a player.
5. `execute_approved_action()` is the only path to execute approved voice actions.
6. All major mutations must write to `audit_logs`.

If an instruction would require crossing a red line, stop and ask before proceeding.
