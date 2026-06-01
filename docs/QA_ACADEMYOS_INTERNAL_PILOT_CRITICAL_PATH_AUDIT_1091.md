# QA — Sprint 1091: AcademyOS Internal Pilot Critical Path Audit V1

**Date:** 2026-06-01
**Sprint:** 1091

---

## Pilot Readiness Matrix

| Loop | Status | Fix Sprint | Notes |
|---|---|---|---|
| 1. Director Today — understand what matters | ⚠️ CONDITIONAL | 1094, 1100 | Data loads; no first-visit narrative |
| 2. Director creates session from template | ✅ READY | — | `generateSessionFromTemplateAction` wired |
| 3. Director assigns coach/group/roster | ✅ READY | — | Linked at generation time |
| 4. Coach sees assigned session | ✅ READY | — | `getCoachWorkspaceSummary` wired |
| 5. Coach executes + submits wrap-up | ✅ READY | — | Wrap-up link visible from session detail |
| 6. Wrap-up → structured player observations | ❌ BLOCKED | **1092** | Text only; `player_observations` not written |
| 7. Player profile receives update from wrap-up | ❌ BLOCKED | **1092, 1093** | Depends on Loop 6 fix |
| 8. Director approves/rejects review item | ✅ READY | — | Full approve/reject/apply flow wired |
| 9. Parent-safe draft from player profile | ⚠️ CONDITIONAL | **1095** | No draft CTA on player profile page |
| 10. Curriculum → template → session loop | ⚠️ CONDITIONAL | 1096 | Works; coach doesn't see level prominently |
| 11. Fitness builder age/category exercises | ✅ READY | — | 83 exercises, load check flags, DONNA guidance |
| 12. DONNA navigation/explanation | ✅ READY | — | Context packs + action registry wired |
| 13. Brian Alpha Sandbox | ⚠️ CONDITIONAL | **1097** | Env var not in `.env.local.example` |
| 14. Token/retrieval/deep-mode safety | ✅ READY | — | Sprints 1080–1089 complete |

---

## Blocker Detail

### Blocker 1 — Wrap-up observations not persisted (Sprint 1092 required)

**File:** `src/app/director/review/applyWrapUpDraftAction.ts`

Current behavior:
- Writes `session_notes` text field (concat of all structured fields)
- Advances `sessions.status` to `completed`
- Writes to `audit_logs`

What's missing:
- Structured observation rows in `player_observations` or equivalent
- Per-player standout/concern flags from wrap-up fields
- Block completion status per block (planned/done/skipped/modified)

**Pilot impact:** Director reviews player profile — no session history from coach visible. Parent communication has nothing to cite. DONNA's `get_player_profile_summary` shows no recent observations.

**Fix scope:** Parse the structured `WrapUpDraft` fields in `applyWrapUpDraftAction`. For each `playerStandouts`/`playerConcerns` entry, write a row to the appropriate observations table. Use `proposed_actions.payload` to extract structured data already captured in the draft.

---

### Blocker 2 — No parent update CTA on player profile (Sprint 1095)

**File:** `src/app/director/players/[playerId]/page.tsx`

Current state: `PlayerParentSafeSummaryPreview` renders a read-only preview. No button to initiate a draft.

**Fix scope:** Add a "Draft parent update" button or DONNA chip that opens the draft parent update flow from the DONNA action registry. Should pre-fill the player context.

---

## Route Coverage Verification

| Route | Exists | Real data | Mobile |
|---|---|---|---|
| `/director` | ✅ | ✅ | ⚠️ (sidebar layout, not mobile-optimized for director) |
| `/director/review` | ✅ | ✅ | ✅ |
| `/director/players` | ✅ | ✅ | ✅ |
| `/director/players/[id]` | ✅ | ✅ | ✅ |
| `/director/sessions` | ✅ | ✅ | ✅ |
| `/director/class-templates/[id]` | ✅ | ✅ | ✅ |
| `/director/fitness/templates/[id]` | ✅ | ✅ | ✅ |
| `/director/kpi` | ✅ | ✅ | ✅ |
| `/director/parents` | ✅ | ✅ | ✅ |
| `/coach` | ✅ | ✅ | ✅ (BottomTabBar) |
| `/coach/sessions/[id]` | ✅ | ✅ | ✅ |
| `/coach/sessions/[id]/wrap-up` | ✅ | ✅ | ✅ |
| `/player` | ✅ | ✅ | ✅ |
| `/parent` | ✅ | ✅ | ✅ |

---

## DONNA Usability Gaps

| Gap | Location | Fix |
|---|---|---|
| No first-visit orientation on Today page | `/director` | Sprint 1094/1100 — add "what to do next" chip |
| Curriculum level not visually prominent in coach session | `/coach/sessions/[id]` | Sprint 1096 |
| No parent update CTA on player profile | `/director/players/[id]` | Sprint 1095 |
| Alpha Sandbox env var not in `.env.local.example` | Root / setup docs | Sprint 1097 |

---

## Pending Migrations (non-blocking with safeguards)

| Migration | Table | Status | Impact |
|---|---|---|---|
| 056 | `session_block_exercises` RLS policies | Pending live application | Exercise display shows warning; session still created |
| 058 | `template_block_exercises` RLS policies | Pending live application | Template exercise population blocked |
| 041–044 | Requirement domains, player gate status | Pending live application | Gate evidence submissions fail at runtime |
| 045 | `templates.curriculum_level_id` | Pending live application | Curriculum context not persisted to templates |

**Recommendation:** Apply migrations 041–044, 056, 058, 045 to live Supabase in Sprint 1098 before pilot.

---

## Recommended Sprint Sequence (1092–1101)

| Sprint | Goal | Status | Why |
|---|---|---|---|
| **1092** | Apply Wrap-Up: Persist Player Observations | P0 | Critical pilot loop broken |
| **1093** | Player Profile: Surface Wrap-Up Observations | P0 | Loop 7 depends on 1092 |
| **1094** | Director Today: Orientation Card + DONNA Chip | P1 | First-visit UX for Brian |
| **1095** | Player Profile: Draft Parent Update CTA | P1 | Parent loop requires on-page entry point |
| **1096** | Coach Session: Curriculum Context Display | P2 | Coaching clarity |
| **1097** | Alpha Sandbox: `.env.local.example` + Setup Guide | P2 | Brian enablement |
| **1098** | Live DB: Apply Pending Migrations | P2 | Exercises + gates require DB fixes |
| **1099** | Pilot Onboarding: Director First-Run Checklist | P2 | New director orientation |
| **1100** | DONNA Today Page: Guidance Chips + Briefing | P3 | DONNA orientation for first sessions |
| **1101** | Final V1 Pilot E2E QA Run | P3 | Go/no-go before Brian goes live |

---

## Acceptance Criteria for Audit

- [x] All 14 V1 pilot loops audited with READY / CONDITIONAL / BLOCKED status
- [x] Exact blockers documented with files, impact, and fix sprint
- [x] Pending migrations identified
- [x] DONNA usability gaps listed
- [x] Route coverage matrix complete
- [x] 10-sprint recommended sequence clear
- [x] What NOT to build listed in architecture doc
- [ ] TypeScript unchanged (no code changes in this sprint)
