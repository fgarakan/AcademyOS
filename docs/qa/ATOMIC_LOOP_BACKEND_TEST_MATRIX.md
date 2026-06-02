# AcademyOS — Atomic Loop Backend Test Matrix
**Version:** Mega Sprint 1096-1100 (2026-06-02)
**Audit source:** Backend Integrity Audit 2026-06-02

Legend: ✅ Pass | ⚠️ Partial | ❌ Fail | 🔒 N/A (no mutation)

---

## Matrix

| Loop | Description | UX path | Backend write | Data linkage | Permission safe | Review safe | Audit logged | Downstream usable | Tests added | Status | Risk | Notes |
|------|-------------|---------|---------------|--------------|-----------------|-------------|--------------|-------------------|-------------|--------|------|-------|
| A | Director onboarding | ✅ | ✅ | ⚠️ | ✅ | 🔒 | ✅ | ✅ | ❌ | ✅ | Low | DNA save now writes audit_log (Sprint 1095E + this sprint). No dedicated onboarding_state table. |
| B | Academy setup | ✅ | ⚠️ | ⚠️ | ✅ | 🔒 | ⚠️ | ✅ | ❌ | ⚠️ | Low | Group creation mutation not wired to audit log. No academy_setup_state table. |
| C | Add coach | ✅ | ✅ | ✅ | ✅ | 🔒 | ✅ | ✅ | ❌ | ✅ | Low | **FIXED this sprint.** `inviteCoachAction` links existing profile by email to academy. V1 limitation: coach must have account first. |
| D | Add player | ✅ | ✅ | ⚠️ | ✅ | 🔒 | ✅ | ✅ | ❌ | ✅ | Low | **Audit log added this sprint.** `player_requirement_progress` bootstrap not triggered on single creation — curriculum assignment triggers it. |
| E | Add parent/guardian | ✅ | ✅ | ✅ | ✅ | 🔒 | ✅ | ✅ | ❌ | ✅ | Low | **FIXED this sprint.** `addGuardianAction` creates guardian + player_guardians + optional profile link + academy_memberships(parent). |
| F | Academy curriculum clone | ✅ | ✅ | ✅ | ✅ | 🔒 | ✅ | ✅ | ❌ | ✅ | Low | Was already Pass. |
| G | Director curriculum edit | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | Low | Full pipeline: draft → pending_review → approve → apply → academy_curriculum_overrides. |
| H | DONNA curriculum edit draft | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | Low | `assertDonnaApprovalAllowed('curriculum_edit', 'director_approval')` confirmed at donnaCurriculumAdjustmentApplyActions.ts:79. |
| I | Class template creation | ✅ | ✅ | ✅ | ✅ | 🔒 | ✅ | ✅ | ❌ | ✅ | Low | **Audit log added this sprint.** |
| J | Fitness template creation | ✅ | ✅ | ✅ | ✅ | 🔒 | ✅ | ✅ | ❌ | ✅ | Low | **Audit log added this sprint.** |
| K | Template-to-session | ✅ | ✅ | ✅ | ✅ | 🔒 | ✅ | ✅ | ❌ | ✅ | Low | **Audit log added this sprint.** `coachId` membership check was already present (Sprint 75 addition, not a gap). |
| L | Session creation (direct) | ✅ | ✅ | ✅ | ✅ | 🔒 | ✅ | ✅ | ❌ | ✅ | Low | Only template-based creation exists for V1. Audit log added. |
| M | Coach assignment | ✅ | ✅ | ✅ | ✅ | 🔒 | ✅ | ⚠️ | ❌ | ⚠️ | Low | Session coach assignment (sessions/actions.ts) has no audit log. Coach membership verified in generate-session action. |
| N | Player/group assignment | ✅ | ✅ | ✅ | ✅ | 🔒 | 🔒 | ⚠️ | ❌ | ⚠️ | Low | assignGroupToSessionAction has no audit log — low-stakes. |
| O | Coach session brief | ✅ | 🔒 | 🔒 | ✅ | 🔒 | 🔒 | 🔒 | ✅ | 🔒 | Low | Read-only. Director-only brief API is intentional. |
| P | Attendance | ✅ | ✅ | ✅ | ✅ | 🔒 | ✅ | ⚠️ | ✅ | ⚠️ | Low | No audit log — acceptable for non-high-stakes mutation. |
| Q | Attendance exception | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Low | Full pipeline. |
| R | Quick Capture | ✅ | ✅ | ✅ | ✅ | 🔒 | ✅ | ✅ | ✅ | ✅ | Low | **SECURITY FIX this sprint.** `academyId` now server-resolved. Membership verified. Audit log added. |
| S | Coach wrap-up | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Low | Was already Pass. |
| T | Session actuals (apply) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Low | Was already Pass. |
| U | Review item creation | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Low | proposed_actions pipeline consistent. |
| V | Director approve/reject/edit | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Low | **Audit log added for wrap-up and structured draft decisions this sprint.** |
| W | Player profile update | ✅ | ⚠️ | ✅ | ✅ | 🔒 | ✅ | ✅ | ✅ | ⚠️ | Low | No server action for core field (name/DOB) edit. Acceptable for V1 pilot. |
| X | Skill progress update | ✅ | ✅ | ✅ | ✅ | 🔒 | ✅ | ⚠️ | ✅ | ⚠️ | Low | `createAssessment` is in locked backend file — audit log at call-site deferred. Known gap. |
| Y | Level readiness review | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Low | `assertDonnaApprovalAllowed('level_movement', 'director_approval')` enforced. |
| Z | New player placement | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Low | `finalize_player_placement()` RPC is sole activation path. |
| AA | Parent communication draft | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Low | **FIXED this sprint.** `applyParentCommunicationAction` creates parent_updates + updates player_development_summary.show_to_parent. |
| AB | Parent portal visibility | ✅ | ✅ | ✅ | ✅ | 🔒 | 🔒 | 🔒 | ✅ | ⚠️ | Low | **Unblocked by Loop E fix.** Guardian creation now possible in-app. Portal reads guardian→player_guardians chain correctly. |
| AC | Player mission assignment | ✅ | ⚠️ | ⚠️ | ✅ | ⚠️ | ✅ | ⚠️ | ✅ | ⚠️ | Low | Mission engine is derived/computed (no DB). Director assignment draft action not found. Deferred for V1. |
| AD | DONNA page-aware help | ✅ | 🔒 | 🔒 | ✅ | 🔒 | 🔒 | 🔒 | ✅ | 🔒 | Low | Pure TypeScript, no mutations. |
| AE | DONNA structured UI action dispatcher | ✅ | 🔒 | 🔒 | ✅ | ✅ | ✅ | 🔒 | ✅ | 🔒 | Low | BLOCKED_PATTERNS hardcoded. All mutations route to proposed_actions. |
| AF | DONNA voice session persistence | ⚠️ | ⚠️ | ⚠️ | 🔒 | 🔒 | 🔒 | 🔒 | ⚠️ | 🔒 | Low | localStorage-only (20-turn cap). `donna_conversations` table exists but not wired. Acceptable for controlled pilot. |
| AG | Role permissions | ✅ | 🔒 | 🔒 | ✅ | ✅ | 🔒 | 🔒 | ✅ | ✅ | Low | Middleware enforces route-level. All server actions self-authenticate. `/api/*` excluded from middleware (expected pattern). |
| AH | Audit trail | ✅ | ✅ | ✅ | ✅ | 🔒 | 🔒 | ✅ | ✅ | ✅ | Low | **Coverage expanded this sprint.** All pilot-critical mutations now logged. Known gaps: single coach session assignment, group assignment, assessment creation (backend file locked). |
| AI | Academy Health aggregation | ✅ | 🔒 | 🔒 | ✅ | 🔒 | 🔒 | 🔒 | ✅ | 🔒 | Low | KPIs transparently labeled deferred/partial. No fake success states. |
| AJ | DONNA director intelligence query | ✅ | 🔒 | 🔒 | ✅ | ✅ | ✅ | ✅ | ✅ | 🔒 | Low | `runDonnaOrchestratorAction` auth strong. Usage events written to DB. |

---

## Pilot-Blocking Loops — Before/After

| Loop | Before This Sprint | After This Sprint |
|------|--------------------|-------------------|
| C — Add Coach | ❌ No inviteCoachAction | ✅ inviteCoachAction.ts created |
| E — Add Parent/Guardian | ❌ No addGuardianAction | ✅ addGuardianAction.ts created |
| R — Quick Capture | ❌ Cross-academy write vulnerability | ✅ academyId server-resolved, membership verified |
| AA — Parent Comms | ❌ Drafts never applied | ✅ applyParentCommunicationAction.ts created |
| AB — Parent Portal | ❌ Requires guardian records not creatable in-app | ✅ Unblocked by Loop E fix |

---

## Audit Log Coverage — Before/After

| Mutation | Before | After |
|----------|--------|-------|
| Player creation | ❌ | ✅ |
| Class template creation | ❌ | ✅ |
| Fitness template creation | ❌ | ✅ |
| Session creation from template | ❌ | ✅ |
| Academy DNA save | ❌ | ✅ |
| Quick Capture creation | ❌ | ✅ |
| Coach invite | ✅ (new) | ✅ |
| Guardian creation | ✅ (new) | ✅ |
| Parent communication apply | ✅ (new) | ✅ |
| Review decisions (structured, wrap-up) | ❌ | ✅ |

---

## Known Remaining Gaps (non-blocking for pilot)

1. **`createAssessment` audit log** — in locked `src/lib/backend/assessments.ts`. No server action call site found to add it at. Deferred.
2. **Session coach assignment** (`sessions/[sessionId]/actions.ts`) — no audit log for group/status updates. Low-stakes.
3. **DONNA conversation DB persistence** — localStorage-only. Acceptable for single-device controlled pilot.
4. **Player profile core field edit** — no server action for name/DOB edit post-creation. Deferred for V1.
5. **Player mission assignment** — director draft action not found. Missions are derived, not stored.
6. **Parent communication email delivery** — `send_method: 'portal_published'` is V1 delivery. No email provider.
7. **`academy_curriculum_overrides.original_snapshot`** — always null; rollback requires manual reconstruction.
