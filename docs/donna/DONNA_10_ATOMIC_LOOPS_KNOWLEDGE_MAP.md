# DONNA — 10 Atomic Loops Knowledge Map

**Sprint:** 4359 — DONNA Knowledge Map for the Canonical 10 Atomic Loops
**Date:** 2026-07-03
**Source of truth (code):** `src/lib/donna/loopKnowledge.ts` (`LOOP_KNOWLEDGE`)
**Resolver:** `src/lib/donna/loopKnowledgeResolver.ts`
**Certification:** `src/lib/donna/certification/loopKnowledgeCertification.ts` — **278/278 checks (100%)**
**Taxonomy:** canonical 10 loops, matched to `atomicLoopUsabilityCertification.ts` `LOOPS[]` (drift-guarded by the cert).

---

## What this is

Structured operating knowledge so DONNA can **explain, guide, and answer questions** for each atomic loop. Each loop answers eight questions:

1. What is this? → `purpose`
2. Why do I need to do this? → `whyItMatters`
3. What is missing? → `missingStateChecks`
4. What should I do next? → `safeNextActions`
5. What happens after this? → `whatHappensAfter`
6. Who can see this? → `parentPlayerVisibilityRules`
7. Does this require approval? → `approvalRequirements`
8. Help me complete it → `completionCriteria` (+ the live `buildCompletionPath` at runtime)

> **Runtime status (Sprint 4360 — wired):** the resolver is now consulted by
> `processDonnaMessage` for **page guidance only**, deterministically and without any model:
> - **Step 7.65** answers loop-guidance questions (why / after / who-sees / approval / what /
>   next / missing) from loop knowledge when the route maps to a canonical loop.
> - **Step 7.6** ("what should I do here?") is enriched with *why this matters* + *what happens after*.
> - No loop resolved → existing behavior (fallback). **No writes, no navigation, no approvals, no
>   model calls.** Parent/player output is safety-filtered as defense in depth.
>
> Certified by `loopGuidanceWiringCertification.ts` (behavioral, drives the brain). This doc is
> maintained by hand from the code objects; keep it in sync when `loopKnowledge.ts` changes.

---

## Canonical 10 loops

| # | Loop | Plain English | Primary role | Primary route |
|---|---|---|---|---|
| 1 | Academy Setup | Set up your academy | director | `/director/onboarding` |
| 2 | Curriculum Setup | Build your curriculum | director | `/director/curriculum` |
| 3 | Class Template Setup | Create a class template | director | `/director/templates/class/create` |
| 4 | Session Creation | Create a session | director | `/director/sessions/new` |
| 5 | Coach Assignment & Session Readiness | Assign a coach and confirm readiness | director | `/director/coaches` |
| 6 | Coach Session Execution | Run the session on court | coach | `/coach/sessions/[sessionId]` |
| 7 | Coach Wrap-Up | Wrap up the session | coach | `/coach/sessions/[sessionId]/wrap-up` |
| 8 | Player Development & Evidence | Assess, log evidence, place | director | `/director/players/[playerId]`, `/director/placement` |
| 9 | Director Review & Approval | Review and approve | director | `/director/review` |
| 10 | Parent & Player-Safe Clarity | Parent and player updates | parent | `/parent`, `/player/ask-donna` |

---

## Loop details

### Loop 1 — Academy Setup
- **What:** Complete onboarding — DNA, first level, first group, coaches, first players.
- **Why:** DONNA cannot give academy-specific guidance until DNA is set; everything downstream depends on setup.
- **After:** Unlocks Curriculum Setup (2) and all downstream loops.
- **Approval:** None (director-direct writes + audit).
- **Who sees:** director only.
- **Missing checks:** `onboardingComplete`, `onboardingProgress`.

### Loop 2 — Curriculum Setup
- **What:** Define the curriculum spine and assign players to levels.
- **Why:** Players without a level can't be tracked; evidence is meaningless until the spine is active.
- **After:** Enables Class Template Setup (3), assessments, and player development (8).
- **Approval:** Review queue — edits become drafts.
- **Who sees:** director, coach (staff-only).
- **Missing checks:** `curriculumSpineActive`, `playersMissingCurriculumLevel`, `curriculumSetupStepsComplete`.

### Loop 3 — Class Template Setup
- **What:** Create/publish class templates (blocks + cues, tied to a level).
- **Why:** A level without a published template can't have aligned sessions.
- **After:** A published template is available in Session Creation (4).
- **Approval:** Review queue — draft → publish.
- **Who sees:** director, coach (staff-only).
- **Missing checks:** template completeness, level assignment (UI-local).

### Loop 4 — Session Creation *(enhanced)*
- **What:** Instantiate a published template for a group, coach, date, time.
- **Why:** A session is the unit coaches deliver; no session = no attendance, observations, or record.
- **After:** Appears on the coach's schedule → Execution (6) → Wrap-Up (7) → Review (9).
- **Approval:** None (director-direct write + audit).
- **Who sees:** director, coach (staff-only; not parent/player).
- **Missing checks:** `no_template_selected`, `no_coach_selected`, `no_group_selected`, `no_date_selected`, `unassignedSessions`, `coachCoverageIssues`.
- **Page intelligence:** added `/director/sessions/new` entry this sprint (Step 6) so page-intel + completion path both resolve.
- **Failure states:** no published template for level; no coach available; preview mode blocks the write.

### Loop 5 — Coach Assignment & Session Readiness *(enhanced)*
- **What:** Assign coaches to groups/sessions and confirm session readiness (coach + template + group + date).
- **Why:** A session with no coach can't be delivered; a group with no coach is a coverage gap.
- **After:** Coach delivers (6) then wraps up (7).
- **Approval:** None (director-direct write + audit).
- **Who sees:** director, coach (staff-only).
- **Missing checks:** `coachCoverageIssues`, `underfilledGroups`, `overfilledGroups`, `unassignedSessions`, readiness (UI-local).
- **Note:** "session readiness" is a **derived state**, not its own route. **No dedicated reassignment screen** (documented limitation).

### Loop 6 — Coach Session Execution
- **What:** Deliver a session on court, marking each block's status.
- **Why:** Execution is where the plan meets reality; block status grounds the wrap-up and record.
- **After:** Coach closes with a wrap-up (7) → Review (9).
- **Approval:** None (coach-direct write to `session_blocks.actual_status` + audit).
- **Who sees:** coach, director (staff-only).
- **Missing checks:** blocks not started, session pending wrap-up (UI-local).

### Loop 7 — Coach Wrap-Up
- **What:** Guided post-session recap — attendance, observations, reflection — submitted for review.
- **Why:** The wrap-up turns a session into a development record; without it the day leaves no evidence.
- **After:** Submitted as a draft (`proposed_actions`, pending_review) → Review (9). Nothing applied until approved.
- **Approval:** Review queue.
- **Who sees:** coach, director (coach-internal until director approves any parent-facing derivative).
- **Missing checks:** attendance unmarked, no observations (UI-local).

### Loop 8 — Player Development & Evidence
- **What:** Placement/activation, assessments, and gate evidence on one player-centric lifecycle.
- **Why:** The player's development record; level movement is always an explicit director decision — never automatic.
- **After:** Evidence/assessments feed gate status; a director may later approve level movement (9). Placement activates the player.
- **Approval:** Director approval — `finalize_player_placement()` is the only activation path.
- **Who sees:** director, coach, player (player-safe view only). **Blocked for player:** raw scores, verbatim observations, coach notes, other players' data, internal decisions, guardian comms, financials.
- **Missing checks:** `playersWithoutAssessment`, `playersWithoutPlacement`, `placementQueueCount`.

### Loop 9 — Director Review & Approval
- **What:** Review the single "needs attention" queue and approve/reject/apply each item.
- **Why:** The control point — nothing a coach or DONNA proposes changes real data until approved here.
- **After:** Approved items applied (writes + audit) via `execute_approved_action`; parent-visible items become what families see.
- **Approval:** Director approval — `proposed_actions → execute_approved_action()` (the only execution path).
- **Who sees:** director only.
- **Missing checks:** `pendingReviewCount`, `pendingParentApprovals`, `pendingCoachApprovals`.

### Loop 10 — Parent & Player-Safe Clarity
- **What:** Parent update drafts (director-initiated) + the parent/player portals.
- **Why:** Families need clarity, but only parent-safe, approved, sourced content may reach them — the trust line.
- **After:** A parent update is a draft → Review (9); once approved it becomes what the family sees.
- **Approval:** Director approval — `proposed_actions (parent_communication)` → review → dispatch.
- **Who sees:** parent, player, director (parent/player-safe). **Blocked for parent/player:** raw notes, internal scores, verbatim observations, other players' data, internal decisions, financials, guardian comms.
- **Missing checks:** `pendingParentApprovals`, unlinked parent/player account (UI-local).

---

## How the resolver is used (no runtime wiring yet)

`loopKnowledgeResolver.ts` exposes pure, never-throwing helpers:

- `getLoopKnowledgeById(id)` — by canonical loop id.
- `getLoopKnowledgeForRoute(pathname)` — segment-aware route match (most-specific wins).
- `getLoopsForRole(role)` — loops where the role is primary or supporting.
- `resolveLoopAnswer({ id?, route?, role, liveState? })` — composes the loop knowledge with `resolvePageIntelligence` + `buildCompletionPath` and role-scopes the result. **This is the shape `processDonnaMessage` will consume in a future, approved step — nothing imports it into the brain today.**

---

## Certification

`loopKnowledgeCertification.ts` (behavioral; `npx tsx …`) asserts: 10 loops present; names/ids match the atomic-loop cert; required fields present; `whyItMatters` and `whatHappensAfter` non-trivial; safe next actions are guidance-only; parent/player loops block ⊇ the role's blocked categories; no PII in static strings; `missingStateChecks` reference real `LivePageState` keys; resolver round-trips every route; loops 4 & 5 meet an enhanced bar. **Result: 278/278.**
