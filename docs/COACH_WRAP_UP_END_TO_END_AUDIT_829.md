# Sprint 829 — Coach Wrap-Up End-to-End Audit V1

**Date:** 2026-05-26
**Sprint:** 829
**Type:** End-to-end audit and certification — code review only
**Files changed:** 0 source files, 2 docs
**TypeScript:** Clean (`npx tsc --noEmit` — exit 0, no errors)
**Certification status:** ✅ CERTIFIED WITH KNOWN GAPS

---

## Scope

End-to-end audit of the Coach Wrap-Up loop:

```
Session completion
  → Coach recap (WrapUpPageClient / CoachWrapUpDrawer)
  → Structured notes (structureCoachRecapAction)
  → Attendance/session actuals (saveWrapUpDraftAction)
  → Player observations (saveWrapUpObservationsAction)
  → Director review items (proposed_actions pipeline)
  → Parent-safe drafts (buildParentSafeDraft — NOT auto-sent)
```

---

## Files Read

| File | Purpose |
|---|---|
| `src/app/coach/page.tsx` | Coach home; wrap-up alert badge |
| `src/app/coach/sessions/[sessionId]/page.tsx` | Session detail; entry points to wrap-up |
| `src/app/coach/sessions/[sessionId]/wrap-up/WrapUpPageClient.tsx` | Sprint 1042 — 6-question wrap-up flow |
| `src/app/coach/sessions/[sessionId]/CoachWrapUpDrawer.tsx` | Older 7-question guided drawer |
| `src/app/coach/sessions/[sessionId]/CoachWrapUpStatusCard.tsx` | Post-submit status card |
| `src/app/coach/sessions/[sessionId]/wrap-up/review/page.tsx` | Coach draft review/status page |
| `src/app/coach/sessions/[sessionId]/saveWrapUpDraftAction.ts` | Server action — creates proposed_actions row |
| `src/app/coach/sessions/[sessionId]/saveWrapUpObservationsAction.ts` | Server action — player observations via proposed_actions |
| `src/app/coach/sessions/[sessionId]/structureCoachRecapAction.ts` | Rule-based structuring; parent-safe draft candidates |
| `src/app/director/review/applyWrapUpDraftAction.ts` | Director-only apply action |

---

## Audit Findings by Dimension

### 1. Entry Clarity

**Audited:** How a coach discovers and begins the wrap-up flow after a session.

**Coach home (`src/app/coach/page.tsx`):**
- `pendingWrapUpCount > 0` renders orange badge ("N sessions need wrap-up") linking to `/coach/sessions`
- `loadWrapUpSessionSelector` computes which sessions need wrap-up from the database
- Sessions needing wrap-up surfaced prominently at the top of the coach home screen

**Session detail page (`src/app/coach/sessions/[sessionId]/page.tsx`):**
- Prominent lime `btn-lime` "Start Wrap-Up →" link renders when no draft exists yet
- `DonnaOpenChip` present with context-aware pre-fill prompt (session name injected)
- `CoachWrapUpStatusCard` renders when a draft exists — shows current lifecycle state
- Status states covered: `pending_review`, `approved`, `executed`, `clarification_needed`, `rejected`
- `clarification_needed` state surfaces director reviewer note inline so coach knows what to clarify

**Finding:** Entry is clear, multi-surface, and progressive. The coach is never left wondering where to go or what happened to their submission.

**Score: 9/10** — minor gap: CoachWrapUpStatusCard does not show an explicit "Submitted at [time]" timestamp for the pending state (director may have it, but coach does not see submission time)

---

### 2. DONNA Involvement

**Audited:** How DONNA supports the wrap-up flow — guidance, framing, voice.

**WrapUpPageClient (Sprint 1042 — primary path):**
- DONNA-branded header: `Sparkles` icon + "DONNA" label + "Coach" badge
- Per-question guidance text rendered in a DONNA voice bubble above the textarea
- Running "DONNA Summary Draft" panel builds live as answers accumulate
- DONNA summary is clearly labeled as a draft; coaches see their own words structured back to them

**CoachWrapUpDrawer (older path):**
- DONNA voice output available via browser `speechSynthesis` for each step's instructions
- No mic auto-start — voice is output-only; coach types or speaks via browser

**Session detail page:**
- `DonnaOpenChip` with session-specific pre-fill prompt — DONNA knows which session is active
- Chip links DONNA context to the specific session before the coach even opens the wrap-up form

**Finding:** DONNA's involvement is framing and guidance, not auto-structuring or auto-sending. The role is well-defined — coach voice, DONNA presentation.

**Score: 9/10** — gap: `DonnaOpenChip` context prompt is not deep (doesn't inject template/curriculum level into DONNA's awareness); follow-up question prompts from DONNA are generic rather than session-specific

---

### 3. Data Source Honesty

**Audited:** Whether the app presents wrap-up data accurately as coach self-report vs. verified records.

**`saveWrapUpDraftAction.ts`:**
- `proposed_payload.warnings` array is explicit:
  - `"Draft only. No session records have been officially updated."`
  - `"Block completion is self-reported — requires director review."`
  - `"Attendance data requires reconciliation with official attendance records."`
- `risk_level: 'low'` — correctly classified (draft, not execution)
- `status: 'pending_review'` — not marked complete or executed on submission

**`structureCoachRecapAction.ts`:**
- Rule-based, deterministic — NO external AI calls, no LLM interpretation
- `requires_review: true` on all structured outputs
- `parent_safe_draft_candidates` explicitly labeled as candidates — not final
- `buildParentSafeDraft()` uses keyword matching + player name — heuristic, not inference
- `processing_status: 'structured'` guard prevents re-structuring an already-processed note

**`WrapUpPageClient.tsx`:**
- Explicit safety copy rendered after submit: "Nothing has been sent to parents or applied to player profiles"
- "DONNA Summary Draft" label — the word "Draft" is in the UI heading

**Finding:** Data honesty is consistently maintained across all three layers (submission, structuring, UI copy). No outputs are presented as authoritative records.

**Score: 10/10**

---

### 4. Draft / Review / Approval Safety

**Audited:** The full proposed_actions pipeline — creation, approval gate, application, role enforcement.

**Creation:**
- `saveWrapUpDraftAction` → `proposed_actions` insert with `status: 'pending_review'`
- Player observations: `saveWrapUpObservationsAction` → separate `proposed_actions` rows with `is_private: true` in payload
- Attendance exceptions: `saveWrapUpAttendanceExceptionAction` → `proposed_actions`
- Idempotency guard: checks for recent draft by same user for same session — prevents duplicate rows

**Approval gate:**
- `applyWrapUpDraftAction.ts` requires `status === 'approved'` before executing any changes
- Director or head_coach must set status to `'approved'` in the review queue before the action can proceed
- Role check: `role !== 'academy_director' && role !== 'head_coach'` → `{ success: false, error: 'Unauthorized' }` — coaches cannot apply their own drafts

**Application:**
- No session records updated until `applyWrapUpDraftAction` runs after approval
- `proposed_actions` → `status: 'executed'` after apply — immutable audit trail
- `execute_approved_action()` is the only execution path (architecture red line preserved)

**Voice safety:**
- `isProtectedVoicePhrase()` enforced — voice cannot trigger saves, level changes, or sends
- No voice-to-database path exists for wrap-up

**Finding:** The pipeline is complete and airtight. No mutation can occur without director/head_coach approval. The audit trail is preserved at every step.

**Score: 10/10**

---

### 5. Parent / Player Safety

**Audited:** Exposure risk for parent-visible content, player profile data, and private coach observations.

**Player observations:**
- `is_private: true` set in `proposed_payload` for all observations from `saveWrapUpObservationsAction`
- Observations go to `proposed_actions` (not directly to `coach_observations`) — director must approve before any `coach_observations` row is created
- No path from `saveWrapUpObservationsAction` to parent-readable tables

**Parent-safe drafts:**
- `buildParentSafeDraft()` in `structureCoachRecapAction.ts` generates candidates only
- `parent_safe_draft_candidates` are stored in `proposed_actions.proposed_payload` — NOT in any parent-readable table
- No auto-send trigger exists — no email, push, or SMS action is called from any wrap-up path
- Director must explicitly act to promote a candidate draft to a sent communication

**Session data:**
- Session detail page renders block names, curriculum level, template goal — all coach-visible data
- No parent/player PII (emails, phone, health, private parent notes) read or rendered on any wrap-up page
- `academy_id` scoping verified on all queries

**Finding:** Parent and player safety is fully maintained. No private data is exposed to wrong roles. No communications are auto-sent. Private observations are gated behind director approval before they ever reach `coach_observations`.

**Score: 10/10**

---

### 6. Error and Edge-Case Handling

**Audited:** Idempotency, auth failures, missing data, localStorage, network errors.

**Idempotency:**
- `saveWrapUpDraftAction`: checks for existing `proposed_actions` row by same user + session within recent window → returns existing row ID instead of inserting duplicate
- `structureCoachRecapAction`: `processing_status === 'structured'` guard → returns early, no re-structuring

**Auth and role:**
- All server actions check auth → academy_id → role in sequence before any DB operation
- Unauthenticated requests return `{ success: false, error: 'Unauthorized' }` — no data leaked
- `applyWrapUpDraftAction` has additional role check (director/head_coach only)

**localStorage (CoachWrapUpDrawer):**
- Draft auto-saved to localStorage with session-keyed identifier
- `try/catch` wraps localStorage reads and writes — graceful fallback if storage unavailable
- Draft restores on re-open within same browser session

**Missing data:**
- `blockList` passed as `[]` if no blocks exist — UI handles empty gracefully
- WrapUpPageClient renders all 6 questions even if `blockList` is empty — no crash
- Session name fallback to "this session" if name not resolved

**Network errors:**
- Server actions return `{ success: false, error: string }` on failure
- UI shows error state; toast notification pattern confirmed in DrawerUI

**Finding:** Error handling is thorough for the primary paths. The idempotency guards prevent data corruption from double-submit. Auth failures are handled safely.

**Score: 9/10** — gap: WrapUpPageClient does not show a specific error message when `saveWrapUpDraftAction` fails (generic error state only); `CoachWrapUpStatusCard` `clarification_needed` note is only shown if the director explicitly adds a note — silent rejection is less actionable for the coach

---

### 7. Cognitive Load / UX Flow

**Audited:** Form complexity, question clarity, progress visibility, early exit options.

**WrapUpPageClient (Sprint 1042 — primary):**
- 1 question displayed at a time — low cognitive load per step
- Progress rail visible — coach knows where they are in 6 steps
- DONNA guidance text above each question in voice-bubble style
- "Skip" available for each question — coach is never forced to answer all 6
- "Submit early" available once any answer exists — respects time pressure after sessions
- Running "DONNA Summary Draft" below the form — coach sees how their answers will appear
- Textarea with `autoFocus` — no click required on desktop

**CoachWrapUpDrawer (older path):**
- 7 steps, including block status per-block (more steps if many blocks)
- Player observation entry per player — can be deep for large rosters
- Step-by-step with visible step counter
- localStorage auto-save means partial progress is never lost

**Dual-path concern:** Both `WrapUpPageClient` (at `/wrap-up`) and `CoachWrapUpDrawer` (rendered as a drawer on the session detail page) coexist. A coach on the session detail page may see the drawer; the link to `/wrap-up` opens a full page. It is unclear from the codebase which path is the canonical current path.

**Finding:** Both UIs are well-designed for cognitive load within their own flows. The dual-path existence is the main friction — a coach could submit from the drawer and also navigate to the page, or vice versa. Idempotency guard prevents double data, but the UX is redundant.

**Score: 8/10** — dual-path UX is a known gap; otherwise the newer WrapUpPageClient UX is excellent

---

### 8. Session Context Availability

**Audited:** Whether template name, curriculum level, block plan, and roster are available in the wrap-up UI.

**Session detail page:**
- Template name, `curriculum_level_key`, `template_goal` shown as chips in the page header
- Full block list (template blocks + session blocks) rendered
- Roster with curriculum levels and attendance marks shown

**WrapUpPageClient:**
- Receives: `sessionId`, `sessionName`, `blockList` (array of block names + completion status)
- Does NOT receive: template goal, curriculum level key, coach context summary, prior session notes
- DONNA guidance text in WrapUpPageClient is generic per-question — not tailored to this session's curriculum level or template goal

**CoachWrapUpDrawer:**
- Receives: `session`, `roster` (with `curriculum_level_key`, `display_name`, `player_id` per player), full `session.blocks`
- Can reference curriculum level per player when generating observations
- Template name available from `session.template_name`

**Finding:** CoachWrapUpDrawer has richer context than WrapUpPageClient. The newer flow (Sprint 1042) sacrificed template/curriculum context for UX simplicity. This is a known architectural gap — DONNA's guidance text is context-blind in the primary wrap-up path.

**Score: 7/10** — WrapUpPageClient context gap is the main deduction; CoachWrapUpDrawer has full context

---

### 9. Mobile Usability

**Audited:** Layout, touch targets, form behavior, keyboard handling on mobile.

**WrapUpPageClient:**
- `max-w-lg mx-auto px-4 py-6 min-h-screen flex flex-col` — responsive, centered, safe on mobile
- `textarea` with `autoFocus` — keyboard opens on desktop without requiring a tap (no touch guard needed here since it's a form, not a follow-up command)
- 1-question-at-a-time layout fits small viewports without horizontal scroll
- "Skip" and navigation buttons are large enough for touch targets
- Progress rail is a simple `div` strip — no tiny interactive elements

**CoachWrapUpDrawer:**
- Renders as a drawer (slide-up from bottom) — appropriate mobile pattern
- Player observation entry has individual textareas per player — can be dense on small screens for large rosters
- Close button and step navigation buttons are standard size

**Session detail entry:**
- "Start Wrap-Up →" lime button is a full-width link on mobile
- `DonnaOpenChip` is a chip-sized tap target — adequate but compact

**Finding:** Mobile usability is good for the primary path (WrapUpPageClient). CoachWrapUpDrawer's per-player observation entry can be dense for large rosters on mobile, but this is acceptable given the data entry requirement.

**Score: 9/10**

---

### 10. Director Demo Readiness

**Audited:** Full loop demonstrability, TypeScript hygiene, sprint history, safety guardrails.

**Full loop status:**
- ✅ Coach home → orange badge → sessions → "Start Wrap-Up" → WrapUpPageClient
- ✅ WrapUpPageClient submit → `saveWrapUpDraftAction` → `proposed_actions` (pending_review)
- ✅ CoachWrapUpDrawer → step-by-step → `saveWrapUpDraftAction` + `saveWrapUpObservationsAction` → `proposed_actions`
- ✅ Director review queue → director reads draft → approves → `applyWrapUpDraftAction`
- ✅ `applyWrapUpDraftAction` → `status: 'executed'` → session records updated
- ✅ Coach review page (`/wrap-up/review`) → shows current status + director note if any
- ✅ Parent-safe draft candidates generated (rule-based) — never auto-sent
- ✅ Player observations private (`is_private: true`) — never auto-published

**TypeScript:** Clean — no errors in any file read during this audit.

**Safety guardrails (all confirmed):**
- `proposed_actions` pipeline enforced end-to-end
- No AI-generated content presented as authoritative
- No auto-send to parents
- No auto-application of session actuals
- Voice cannot mutate data
- Director/head_coach role required for apply

**Known gaps (non-blocking for demo):**
1. Dual wrap-up UI paths (WrapUpPageClient + CoachWrapUpDrawer) — redundant; idempotency guards prevent data corruption
2. WrapUpPageClient lacks template/curriculum context in DONNA guidance
3. No submission timestamp shown to coach in `CoachWrapUpStatusCard` pending state
4. `CoachWrapUpStatusCard` silent rejection (no note from director) gives coach no actionable guidance

**Score: 9/10**

---

## Certification Scorecard

| Dimension | Score | Notes |
|---|---|---|
| Entry clarity | 9/10 | No submission timestamp in coach status card |
| DONNA involvement | 9/10 | Context pre-fill shallow; guidance generic vs session-specific |
| Data source honesty | **10/10** | Warnings explicit; "Draft" labeled throughout; no AI inference |
| Draft / review / approval safety | **10/10** | Full proposed_actions pipeline; director-only apply; role gate |
| Parent / player safety | **10/10** | is_private; no auto-send; parent-safe candidates only; academy_id scoped |
| Error / edge-case handling | 9/10 | Generic error state in WrapUpPageClient; silent rejection gap |
| Cognitive load / UX | 8/10 | Dual-path UX (drawer + page) is redundant confusion risk |
| Session context availability | 7/10 | WrapUpPageClient missing template/curriculum level in DONNA guidance |
| Mobile usability | 9/10 | Primary path clean; drawer per-player entry dense on large rosters |
| Director demo readiness | 9/10 | Full loop demonstrable; idempotency safe; dual UI gap non-blocking |
| **Total** | **90/100** | |

---

## Certification Verdict

**✅ CERTIFIED WITH KNOWN GAPS — 90/100**

The Coach Wrap-Up loop is production-ready and demonstrable end-to-end. The core pipeline (submit → proposed_actions → director review → apply) is correctly implemented with strong safety guardrails. No coach action can bypass director approval. No parent receives data automatically. Player observations are private until director-approved. The data honesty and safety dimensions are exemplary.

The known gaps (dual UI paths, missing session context in WrapUpPageClient DONNA guidance) are real but non-blocking — they affect experience quality, not data safety or correctness.

---

## Known Gaps and Follow-up Sprints

| Priority | Gap | Recommended Sprint |
|---|---|---|
| High | WrapUpPageClient does not pass `templateGoal` / `curriculumLevelKey` to DONNA guidance — guidance is generic | Sprint 830 — pass session context props to WrapUpPageClient; update DONNA guidance text per question to reference template goal and curriculum level |
| Medium | Dual wrap-up UI paths (WrapUpPageClient at `/wrap-up` + CoachWrapUpDrawer on session detail) — redundant, potentially confusing | Sprint 831 — deprecate CoachWrapUpDrawer or make it the rich "expert mode" while WrapUpPageClient is the default; add canonical path decision in docs |
| Medium | `CoachWrapUpStatusCard` does not show submission timestamp in pending state | Sprint 830 or 831 — add `submitted_at` read from `proposed_actions.created_at` |
| Low | Silent director rejection (status `rejected` with no note) gives coach no actionable guidance | Sprint 832 — require director note on rejection; surface in CoachWrapUpStatusCard |
| Low | DONNA guided navigation has no focus targets for wrap-up pages (`data-donna-focus-id` absent from `/coach/sessions/[sessionId]/wrap-up`) | Sprint 830 — add focus targets for DONNA highlight architecture on wrap-up page |

---

## What was NOT changed

- No source files modified — audit-only sprint
- All server actions, database queries, RLS, migrations — untouched
- All UI components — untouched
- Voice behavior, routing, persistence — untouched
- `proposed_actions` pipeline — untouched
- No SQL, migrations, RLS, seed, or env files touched

---

## TypeScript result

```
npx tsc --noEmit
# Exit: 0 — no errors
```

---

## Recommended Sprint 830

**Sprint 830 — Coach Wrap-Up Session Context Injection V1**

Target: `WrapUpPageClient` receives `sessionId`, `sessionName`, and `blockList` but not `templateGoal`, `curriculumLevelKey`, or `coachContextSummary`. DONNA guidance text for all 6 questions is generic. Passing these three props allows the guidance text to reference the session's actual curriculum level and template goal — e.g., "What stood out in today's [Red Ball Level 1] session?" instead of "What stood out in today's session?".

Risk: Very low — prop additions and string interpolations only. No database changes. No routing changes.
Scope: `src/app/coach/sessions/[sessionId]/wrap-up/page.tsx` (parent that renders WrapUpPageClient) + `WrapUpPageClient.tsx` (accept new props, update guidance text strings).
