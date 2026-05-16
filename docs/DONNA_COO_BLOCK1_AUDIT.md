# DONNA COO Block 1 — Audit + Block 2 Roadmap

**Sprints covered:** 400–419  
**Date:** 2026-05-16  
**Author:** Sprint 419 — DONNA COO Block Audit + Next Roadmap V1

---

## What Block 1 Built

Block 1 made DONNA meaningfully visible and contextually useful across AcademyOS without adding unsafe execution powers. Summary:

| Category | Delivered |
|---|---|
| New components | 4 |
| Director pages wired with DONNA chips | 5 |
| Page context registry entries | 23 routes |
| Task IDs now wired | 12 of 16 |
| Readonly (summary-only) task IDs | 2 of 12 wired |
| Review queue DONNA rendering | 2 draft module types |
| Safety guardrail improvements | 3 (data gaps, parent obs privacy, sanitizer copy) |
| Coach recap DONNA branding | 1 page |

---

## Component Inventory

### New in Block 1

| File | Role |
|---|---|
| `src/app/director/level-up/LevelUpDonnaCTA.tsx` | Per-player Review button dispatching `donna:open` with name/track/urgency context |
| `src/app/director/today/TodayDonnaSuggestionChip.tsx` | Stack-style chip for Today page (dot + label layout) |
| `src/components/assistant/DonnaOpenChip.tsx` | Shared pill-style chip for level-up, parents, sessions-detail |
| `src/app/director/review/DonnaDraftCard.tsx` | Read-only display card for DONNA-generated `parent_communication` and `level_review` proposed_actions |

### Chips Wired (director pages)

| Page | Chip type | Count |
|---|---|---|
| `/director/today` | TodayDonnaSuggestionChip | 4 |
| `/director/level-up` | LevelUpDonnaCTA (per player) + DonnaOpenChip | variable + 4 |
| `/director/parents` | DonnaOpenChip | variable |
| `/director/sessions/[sessionId]` | DonnaOpenChip | variable |
| `/director/sessions/[sessionId]` | SessionCoachBriefCTA (separate) | 1 |

---

## Task ID Status — Full Inventory

| Task ID | Wired | Readonly | Notes |
|---|---|---|---|
| `create_class_template` | — | — | Handled by TemplateDraftPanel (architectural split, not a gap) |
| `create_fitness_template` | ✓ | | Writes fitness template draft to DB |
| `create_session` | ✓ | | Writes session draft to DB |
| `populate_session_from_template` | ✓ | | Writes session block population draft |
| `capture_coach_note` | ✓ | | Writes coach_note_draft |
| `draft_parent_update` | ✓ | | Writes parent_update_draft (privacy-filtered) |
| `draft_player_note` | ✓ | | Writes player_note_draft |
| `review_level_readiness` | ✓ | | Writes level_readiness_draft |
| `handle_attendance_exception` | ✓ | | Writes attendance_exception_draft |
| `adjust_curriculum` | ✓ | | Writes curriculum_adjustment_draft (stub logic) |
| `draft_coach_communication` | ✓ | | Writes coach_communication_draft |
| `summarize_player_progress` | ✓ | ✓ | Read-only summary; no DB write |
| `draft_session_brief` | ✓ | ✓ | Read-only summary; no DB write |
| `create_group` | — | | Shell — shows "coming soon" in panel |
| `assign_player_to_group` | — | | Shell — shows "coming soon" |
| `recommend_template_for_group` | — | | Shell — shows "coming soon" |

**12 of 16 task IDs wired. 3 remain as shells (`create_group`, `assign_player_to_group`, `recommend_template_for_group`).**

---

## Page Context Registry Coverage

All 23 routes registered (including wildcard fallback):

```
/director/onboarding/interview
/director/onboarding/curriculum
/director/onboarding
/director/review
/director/curriculum
/director/class-templates/[templateId]
/director/class-templates
/director/fitness/templates/[templateId]
/director/fitness/templates
/director/sessions
/director/sessions/[sessionId]
/director/players/[playerId]
/director/players/active          ← added Sprint 415
/director/players/development-intake ← added Sprint 415
/director/players/onboarding-review  ← added Sprint 415
/director/players
/director/signals
/coach/sessions/[sessionId]        ← added Sprint 414
/coach/recap
/director/parents
/director/level-up
/director/today
/director
* (fallback)
```

**Gaps:** `/director/groups`, `/director/fitness` (non-template), `/coach` (home), `/coach/players` have no specific context and fall through to the wildcard fallback.

---

## Safety & Guardrails — Block 1 Status

| Guardrail | Status |
|---|---|
| Parent update uses only `is_private = false` observations | ✓ Verified in `saveParentUpdateDraftAction` |
| `sanitizeParentFacingText()` called on all 5 draft sections | ✓ Verified |
| Observation count shown in safetyNotes copy | ✓ Added Sprint 416 |
| `donnaVisibilityGuardrail.ts` copy includes private obs exclusion | ✓ Added Sprint 416 |
| Player progress summary flags missing data | ✓ DATA GAPS section added Sprint 413 |
| Session brief flags missing coach/blocks/group | ✓ PREPARATION NEEDED section added Sprint 413 |
| GenericDraftPanel distinguishes readonly vs write-through success states | ✓ Added Sprint 407 |
| DonnaAssistantButton distinguishes wired/readonly/unwired info banner | ✓ Added Sprint 407 |
| Edit (✏) button in draft review is visible and labeled | ✓ Improved Sprint 412 |

---

## Known Gaps After Block 1

### Architecture gaps

1. **Coach layout has no DONNA panel** — The `donna:open` event dispatch pattern works only within the director layout. The coach recap DONNA branding (Sprint 417) is informational only — tapping it does nothing because DonnaAssistantButton is absent from the coach layout. Coaching-facing DONNA requires a different architecture (in-page panel, not sliding director panel).

2. **DonnaDraftCard has no approval action** — The review/page.tsx rendering of `parent_communication` and `level_review` drafts is display-only. No approve/reject controls exist on DonnaDraftCard. Actual approval of these draft types must go through the main proposed_actions review queue flow — which doesn't yet render these module types in its approve/reject buttons.

3. **`adjust_curriculum` has stub logic** — The task is wired and writes a draft, but the curriculum adjustment structuring in `donnaDirectorIntelligenceActions.ts` is a shell (no actual curriculum data is read to inform the adjustment).

4. **`create_group`, `assign_player_to_group`, `recommend_template_for_group` are shells** — These task IDs are defined in `donnaTaskContracts.ts` but not in `WIRED_TASK_IDS`. They show "coming soon" copy in the panel.

5. **No real LLM calls for most tasks** — All DONNA drafting is deterministic rule-based structuring. The one real AI integration is `generateNoteDraftAction` (Sprint 100, Anthropic Claude). DONNA's "intelligence" is pattern matching and template filling, not LLM generation.

6. **Parent and player portals** — Zero DONNA presence. `/parent` and `/player` routes have no context registry entries, no chips, no DONNA panel.

7. **Groups pages** — `/director/groups` (if it exists) has no DONNA context or chips.

---

## Block 2 Roadmap — Sprints 420+

Priority order based on impact and safety:

### Tier 1 — Approval + Execution gaps

| Sprint | Target | Goal |
|---|---|---|
| 420 | `DonnaDraftCard` | Add approve/mark-reviewed action to parent_communication and level_review cards in review queue — currently display-only |
| 421 | `adjust_curriculum` action | Connect to real curriculum data — read current curriculum state to generate a meaningful adjustment proposal |

### Tier 2 — Shell tasks

| Sprint | Target | Goal |
|---|---|---|
| 422 | `create_group` | Wire to DB write — create a group proposed_action record |
| 423 | `assign_player_to_group` | Wire player-to-group assignment draft |
| 424 | `recommend_template_for_group` | Wire group template recommendation using existing recommendation engine |

### Tier 3 — Coach-facing DONNA

| Sprint | Target | Goal |
|---|---|---|
| 425 | Coach layout DONNA | Add a minimal in-page DONNA panel to coach layout (separate from director sliding panel) — contextual help for coach session workspace and recap |
| 426 | Coach recap → DONNA suggestion pipeline | When coach marks recap ready, surface DONNA suggestion prompts for director to use when reviewing |

### Tier 4 — Portal expansion

| Sprint | Target | Goal |
|---|---|---|
| 427 | `/director/groups` context | Add page context entry for groups pages |
| 428 | `/director/fitness` context | Add context for fitness pages that aren't template-specific |

### Tier 5 — Real AI integration

| Sprint | Target | Goal |
|---|---|---|
| 429+ | LLM-backed drafts | Replace rule-based structuring in `summarize_player_progress` and `draft_session_brief` with real Anthropic API calls — requires ANTHROPIC_API_KEY and graceful fallback |

---

## TypeScript Status

`npx tsc --noEmit` — **CLEAN** across all 18 implementation sprints.

---

## Block 1 Commit History

| Sprint | Description |
|---|---|
| 400 | DONNA Summarize Player Progress V1 |
| 401 | DONNA Draft Session Brief V1 |
| 402 | DONNA Player Progress Context Enrichment V1 |
| 403 | DONNA Session Brief Context Enrichment V1 |
| 404 | DONNA Draft Panel Revision UX V1 |
| 405 | DONNA Today Page Chip Integration V1 |
| 406 | DONNA Level-Up CTA Integration V1 |
| 407 | DONNA Draft Panel Safety Copy V1 |
| 408 | DONNA Review Queue Parent Draft Rendering V1 |
| 409 | DONNA Today Page Chip Client Bridge V1 |
| 410 | DONNA Shared Chip Component + Multi-Page Wiring V1 |
| 411 | DONNA Review Queue Draft Card V1 |
| 412 | DONNA Draft Revision UX Clarity Pass V1 |
| 413 | DONNA Data Gap Reporting V1 |
| 414 | DONNA Coach Session Context V1 |
| 415 | DONNA Player Context Awareness Pass V1 |
| 416 | DONNA Parent Communication Safety Pass V1 |
| 417 | DONNA Coach-Facing Recap UX Pass V1 |
| 418 | DONNA COO Block Regression V1 (audit only) |
| 419 | DONNA COO Block Audit + Next Roadmap V1 (this file) |
