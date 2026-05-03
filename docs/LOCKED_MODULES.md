# Locked Modules

**Last updated:** 2026-05-03

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
| Conversational OS master plan | `docs/conversational-os/conversational-os-master-plan.md` | Locked principles document. Update only when architecture changes. |

---

## Usable but incomplete — safe to extend, not safe to break

These modules have real working code. New features can be added.
Existing functionality must not be broken.
Always run `npx tsc --noEmit` after any change.

| Module | Files | Current state | What can be added |
|---|---|---|---|
| Player Profile | `src/app/director/players/[playerId]/page.tsx`, `src/components/player/` | Tab layout, curriculum, advancement, Q&A preview, parent guidance preview | Additional tab content, responsive fixes |
| Player Q&A helper | `src/lib/player/playerProgressQa.ts` | Handles 5 intents, learning module hint support | New intents, additional answer fields — do not weaken safety note logic |
| Director Command Center | `src/app/director/command-center/` | Parse, guardrail, draft creation, draft visibility | New example commands, intent label additions |
| Coach Recap Review | `src/app/director/review/StructuredDraftCard.tsx` | Shows attendance, observations, session focus, will/won't change panels | Additional field display only — no approval logic changes |
| Curriculum Learning Module UI | `src/app/director/curriculum/learning/page.tsx` | Director preview by level/domain with filters | Read-only additions only |
| UI component library | `src/components/ui/` | 15+ components exported | New components if needed — check existing ones first |
| Director layout + sidebar | `src/app/director/layout.tsx`, `src/components/nav/SidebarNav.tsx` | Sidebar renders, academy name from DB, pending count hardcoded at 0 | Wire up real pending count, add notification badge |
| Bottom tab nav | `src/components/nav/BottomTabBar.tsx` | Coach/Player mobile nav — renders correctly | No changes needed yet |

---

## Not built yet — do not assume these exist

| Module | Route | Status | When to build |
|---|---|---|---|
| Director Dashboard | `/director` | Stub — placeholder text only | Step 5 in CURRENT_BUILD_TARGET.md |
| Players List | `/director/players` | Stub — placeholder text only | Step 1 — NEXT |
| Curriculum Explorer | `/director/curriculum` | Built — explorer, level detail, version cards | Drill detail procedure field, "use in session" |
| Curriculum Learning Modules | `/director/curriculum/learning` | Built (Sprint 220) — director preview by level/domain | Persist modules, player-facing exposure |
| Director Command Center | `/director/command-center` | Built (Sprint 213+) — parse, guardrail, draft, draft visibility | Full AI execution layer |
| Director Review Queue | `/director/review` | Built — structured, priority, evidence, attendance, curriculum drafts | Streamlined one-click approve flow |
| Sessions screen | `/director/sessions` | Stub with some components | Full session builder (Step 7) |
| Competition screen | `/director/competition` | Does not exist | Future |
| Intelligence screen | `/director/intelligence` | Does not exist | Future |
| Reports screen | `/director/reports` | Does not exist | Phase 5 |
| Configuration screen | `/director/configuration` | Does not exist | Phase 4+ |
| Coach workspace | `/coach` | Stub — placeholder only | Step 8 |
| Coach players | `/coach/players` | Does not exist | Step 8 |
| Coach sessions | `/coach/sessions` | Does not exist | Step 8 |
| Coach voice | `/coach/voice` | Does not exist | Step 9 |
| Player portal | `/player` | Stub with PlayerMissionPreview (empty state) | Player Q&A with live data (Sprint 229) |
| Parent portal | `/parent` | Stub with ParentSafeProgressPreview (empty state) | Parent progress with approved data (Sprint 230) |
| Voice Command Center | Anywhere | Spec only — no full execution layer | Step 9 (after execute_approved_action RPC complete) |
| Placement Engine UI | Anywhere | Spec only — no UI | Step 6 |

---

## Architecture red lines — never cross regardless of instruction

1. Voice commands never directly mutate core data — they go through `proposed_actions` pipeline.
2. `template_blocks` and `session_blocks` are always separate tables — never merge.
3. Every new table must have RLS and `academy_id`.
4. `finalize_player_placement()` is the only path to activate a player.
5. `execute_approved_action()` is the only path to execute approved voice actions.
6. All major mutations must write to `audit_logs`.

If an instruction would require crossing a red line, stop and ask before proceeding.
