# Sprint 832 — Session Planning End-to-End Audit V1

**Date:** 2026-05-26
**Sprint:** 832
**Type:** End-to-end loop audit — session planning
**Files changed:** 0 source files (audit-only) + 2 docs
**TypeScript:** Clean (`npx tsc --noEmit` — exit 0, no errors)

---

## Strategic context

Sprint sequence:
- Sprint 829 — Coach Wrap-Up End-to-End Audit V1: **90/100** ✅ CERTIFIED WITH KNOWN GAPS
- Sprint 830 — Template Creation End-to-End Audit V1: **87/100** ✅ STRONG — MINOR POLISH REMAINS
- Sprint 831 — Director Daily Review End-to-End Audit V1: **93/100** ✅ STRONG — MINOR POLISH REMAINS
- Sprint 832 — Session Planning End-to-End Audit V1: **82/100** (this audit)

Individual loop gaps are NOT fixed in this audit phase — logged for resolution after all seven loops are audited.

---

## Loop under audit

**Session planning:** template selection → session generation → roster/group context → DONNA guidance → coach briefing → adjustment suggestions → planned vs actual.

---

## Files read

| File | Purpose |
|---|---|
| `src/app/director/sessions/page.tsx` | Sessions list — entry point |
| `src/app/director/sessions/new/page.tsx` | New session creation page |
| `src/app/director/sessions/new/SessionFromTemplateForm.tsx` | Session-from-template form |
| `src/app/director/sessions/[sessionId]/page.tsx` | Session detail (1,364 lines — primary audit target) |
| `src/app/director/sessions/[sessionId]/SessionCoachBriefCTA.tsx` | "Draft Coach Brief with DONNA" button |
| `src/app/director/sessions/[sessionId]/SessionAdjustmentSuggestionsPanel.tsx` | Adjustment review UI |
| `src/app/director/sessions/[sessionId]/createSessionAdjustmentSuggestionsAction.ts` | Generates suggestions (server action) |
| `src/app/director/sessions/[sessionId]/applyApprovedSessionAdjustmentAction.ts` | Applies approved adjustment |
| `src/app/director/class-templates/[templateId]/GenerateSessionFromTemplateButton.tsx` | Template-level session generator |
| `src/app/director/fitness/templates/[templateId]/generate-session-actions.ts` | `generateSessionFromTemplateAction` |
| `src/lib/session-planning/groupNeedsAggregation.ts` | Group needs aggregation library |
| `src/lib/session-planning/sessionModificationRules.ts` | 8-rule suggestion engine |
| `src/lib/donna/sessionAdjustmentDonnaAnswer.ts` | DONNA conversational session adjustment handler |
| `src/app/director/_actions/donnaDirectorIntelligenceActions.ts` (lines 1209–1342) | `fetchSessionBriefAction` |
| `src/lib/donna/donnaUIActionDispatcher.ts` (session patterns) | DONNA nav patterns + FOCUS_TARGET_MAP |

---

## Loop map

```
Director intent
  │
  ├── DONNA: "Walk me through a session" → session_operator
  ├── DONNA: "sessions" / "go to sessions" → /director/sessions
  │
  ▼
Sessions list (/director/sessions)
  │  "New Session" button → /director/sessions/new
  │  OR: class template detail → GenerateSessionFromTemplateButton
  │
  ▼
Session creation (generateSessionFromTemplateAction)
  │  auth → academy_id → template ownership → coach membership
  │  template_blocks snapshot → session_blocks (template_block_id preserved)
  │  session_block_exercises best-effort (migration 056 required)
  │  curriculum level + coach cues + focus gates embedded in session_notes
  │  status: 'planned' — template NOT modified
  │
  ▼
Session detail (/director/sessions/[sessionId])
  │
  ├── [DONNA] SessionCoachBriefCTA → "Draft a coach brief for this session."
  ├── [DONNA] 4 DonnaOpenChip prompts:
  │     "Draft a coach brief for this session."
  │     "What is missing from this session plan?"
  │     "Summarise this session for the coach."
  │     "What should I review before this session?"
  │
  ├── Curriculum Focus: levelName, stage, academy version, overrides
  ├── SessionCurriculumContextPanel: top gates, drills, coach language
  │
  ├── Coach Briefing (deterministic):
  │     per-player: curriculum level, strengths, needs, priorities
  │     watch-fors: override summaries, player needs, attention flags
  │     adaptive suggestions summary
  │     "capture after class" reminders
  │
  ├── Group Assignment (GroupAssignmentPanel)
  ├── Class Roster Intelligence (ClassRosterIntelligencePanel)
  │     per-player: curriculum level + source, strengths, thingsToWorkOn, development focus, top priority
  │
  ├── Session Blocks + curriculum content per block (SessionBlockCurriculumContent)
  │
  ├── Attendance Exception Drafts (→ proposed_actions pipeline)
  │
  ├── Suggested Adjustments (SessionAdjustmentSuggestionsPanel)
  │     createSessionAdjustmentSuggestionsAction → 8-rule engine
  │     pending_review → approve → apply → audit_log
  │     applies to session_blocks.notes or sessions.session_notes ONLY
  │     template_blocks: NEVER modified
  │
  ├── Planned vs Actual (PlannedVsActualDiffPanel)
  │     planned blocks vs. wrap-up draft completion
  │
  ├── Gate Evidence Opportunities
  │     derived from completed blocks + curriculum domain matches
  │
  ├── Curriculum Exposure Summary (SessionExposureSummaryPanel)
  │
  └── Coach Recap / Voice Note → structureRecapAction → proposed_actions
```

---

## Audit question responses

### 1. Can a director create or select a session plan easily?

**Partially.** Three entry points exist:
- `/director/sessions` → "New Session" button → `/director/sessions/new`
- Class template detail (`/director/class-templates/[templateId]`) → `GenerateSessionFromTemplateButton`
- Fitness template detail (`/director/fitness/templates/[templateId]`) → same button component

**Gap:** `/director/sessions/new` empty state when no templates exist says "Create a fitness template first" and links to `/director/fitness/templates`. Class templates are not mentioned. A director who has only class templates sees this dead end.

**Also:** `/director/sessions/new` fetches all templates with no category filter, then passes them all to `SessionFromTemplateForm`. This is correct for existing templates. But the empty state path is broken for class-template-only academies.

---

### 2. Does the system know roster/group context?

**Yes, richly.** `getGroupNeedsForSession` fetches:
- Group memberships → player names
- Attendance for this session
- Curriculum states (level, version)
- Curriculum level names
- Development summaries (strengths, thingsToWorkOn, developmentFocus)
- Top priorities per player
- Evidence counts (voice_notes as proxy)
- Last coach note per player
- Academy override summaries (for the template's curriculum level)

12-query aggregation fully scoped to `academy_id`. Warnings emitted for unrecorded attendance, missing curriculum assignments, missing development summaries.

The session detail page also derives `playerIntelligence` from the same data sources inline (6+ queries).

---

### 3. Does DONNA suggest modifications based on class/player needs?

**Yes — two paths:**

**Path A — Conversational (DONNA panel):**
`sessionAdjustmentDonnaAnswer.ts` intercepts "adjust/modify session", "mixed levels", "I have Orange 2 and Yellow 1" type phrases → returns concrete mixed-level coaching strategies with level-specific cues. Uses level extraction regex for 12 level patterns. Pure TypeScript, no DB, no AI.

**Path B — Session detail page (rule engine):**
`createSessionAdjustmentSuggestionsAction` → `generateSessionModificationSuggestions`:
- 8 rules: recovery needs, spacing/footwork, return readiness, directional control, mixed levels, low class size, assessment moment, academy override constraint
- Uses player `thingsToWorkOn`, `strengths`, `developmentFocus`, attendance, evidence counts
- Max 8 suggestions per session; `scope: 'this_session_only'`
- Suggestions link to specific target blocks

---

### 4. Are planned sessions separate from actual session results?

**Yes, strictly.** Key evidence:

- `template_blocks` and `session_blocks` are separate tables (architecture red line confirmed respected)
- `template_block_id` on `session_blocks` is a reference only — never modified
- `generateSessionFromTemplateAction` explicitly: `status: 'planned'`, `is_override: false`
- "Planned session snapshot — changes here do not affect the master template." notice on session detail (line 880)
- `GenerateSessionFromTemplateButton` success message: "A planned session was created from this template. The master template is unchanged."
- `applyApprovedSessionAdjustmentAction` writes to `session_blocks.notes` or `sessions.session_notes` — never touches `template_blocks`
- `PlannedVsActualDiffPanel` explicitly compares planned blocks vs wrap-up actual data
- `SessionActualDisplay` renders `sessions.session_notes` post-completion — clearly labeled

---

### 5. Are coach briefs generated clearly?

**Yes, with caveats.**

`fetchSessionBriefAction` (Sprint 401) builds a structured text brief:
- SESSION / DATE / COACH / GROUP / STATUS
- PLANNED BLOCKS (ordered, with duration and type)
- FOCUS / EMPHASIS (from director-entered notes or default)
- PLAYER WATCH-FORS (generic text — not player-specific in the brief)
- SESSION NOTES (first 300 chars)
- PREPARATION NEEDED: gaps surfaced (no coach, no blocks, no group)

Safety notes enforced:
- "Read-only session brief — no session data was modified."
- "This brief has not been sent to the coach."
- "Review required before sharing with coach or anyone else."
- "No proposed action was created. No official record was changed."

**Gap:** `fetchSessionBriefAction` requires the director to confirm a `_resolved_session_id` via a resolver panel in DONNA. If the director is already on the session page and clicks "Draft Coach Brief with DONNA", the pre-seeded prompt doesn't include the session ID — DONNA will ask for the session before generating the brief.

**Also:** The brief text is shown in the DONNA panel only — there is no "Copy brief" button visible in that flow, nor any path to send to the coach directly (by design for V1).

---

### 6. Are session overrides safe and not mutating master templates?

**Yes — fully safe.** Full audit:

| Mechanism | Template mutation? | Evidence |
|---|---|---|
| `generateSessionFromTemplateAction` | No | `is_override: false` flag; template row not touched |
| `applyApprovedSessionAdjustmentAction` | No | Writes to `session_blocks.notes` or `sessions.session_notes` only; `template_blocks` not touched |
| Session adjustment suggestions | No | `scope: 'this_session_only'` on all rows |
| `sessionAdjustmentDonnaAnswer` | No | Pure TypeScript, zero DB writes |
| Group assignment | No | Updates `sessions.group_id` only |
| Attendance exception | No | Writes to `proposed_actions` — pending director review |
| Voice note / coach recap | No | Writes to `voice_notes` — pending structuring/review |

---

### 7. Is mobile/desktop usable?

**Desktop: Yes. Mobile: Partially.**

Session detail page (`/director/sessions/[sessionId]/page.tsx`) contains 16+ distinct sections rendered in a single vertical scroll. The stats card uses `grid-cols-2 sm:grid-cols-4`. Otherwise no mobile breakpoints on the per-section layouts. The session new page uses `max-w-2xl` which constrains well.

The `ClassRosterIntelligencePanel`, `SessionAdjustmentSuggestionsPanel`, and `PlannedVsActualDiffPanel` are all client components that expand/collapse but have no mobile-specific layout adjustments.

For a director using a tablet or mobile device, the 16-section session detail page is cognitively and scrollably heavy.

---

### 8. Are missing roster/template issues surfaced?

**Yes, comprehensively.** Issues surfaced at multiple layers:

| Condition | Surfaced where |
|---|---|
| Template has no blocks | `generateSessionFromTemplateAction` returns error: "This template has no blocks." |
| Coach not in academy | `generateSessionFromTemplateAction` returns error: "Selected coach is not a valid active member." |
| No group assigned to session | "No group is assigned to this session yet." in Roster section + "Assign a group above to populate the roster." |
| Session has blocks but no exercises | Orange warning with migration 056 diagnostic SQL |
| No curriculum level on template | `SessionNoCurriculumContextPanel` graceful empty state ("Set a curriculum level on this template to see focus context here.") |
| Missing coach in brief | `fetchSessionBriefAction`: "No coach assigned — assign a coach to this session before sharing a brief." |
| No blocks for brief | `fetchSessionBriefAction`: "No session blocks planned — add blocks from a template before the brief is meaningful." |
| Missing development data | `getGroupNeedsForSession` warnings: "N players without curriculum assignment.", "N players without development summary." |

---

### 9. Is the plan connected to curriculum?

**Yes — deeply connected when template has a curriculum level set.**

- `generateSessionFromTemplateAction` embeds `[Curriculum: levelName]`, `[Academy Version: ...]`, overrides, and coach language cues into `sessions.session_notes` at creation time
- Session detail: `curriculumContext` panel (level name, stage, academy version, customizations)
- `SessionCurriculumContextPanel`: top gates, focus domains, top drills, coach language
- `SessionBlockCurriculumContent`: per-block curriculum content items from `curriculum_class_template_blocks`
- `PlannedVsActualDiffPanel`: compares curriculum content coverage vs. coach completion
- `SessionExposureSummaryPanel`: maps player attendance + block completion to curriculum exposure candidates
- Gate evidence opportunities: correlates completed curriculum blocks to active player gates

**Gap (known from Sprint 830):** When template `curriculum_level_id` is null (migration 045 not applied, or level not set), all curriculum panels show graceful empty states — curriculum is not surfaced at all. The session still functions but loses the pedagogical context layer.

---

### 10. Does it reduce director workload?

**Substantially — but with rough edges.**

Workload reductions confirmed:
- **One-click session generation** from template: date, coach, gates, notes → session with all blocks
- **Automatic curriculum context** embedded in session_notes at generation time
- **Pre-session Coach Briefing** panel on session detail (deterministic, no extra steps)
- **DONNA coach brief CTA** — opens DONNA with the right prompt
- **Adjustment suggestions** generated on demand from player intelligence
- **Planned vs actual diff** — no manual reconciliation needed
- **Gate evidence opportunities** — surfaces evidence capture moments automatically

Workload friction points:
- Generating a DONNA coach brief requires going through a resolver panel (additional steps beyond clicking the CTA)
- 16-section session detail requires significant scrolling to find any specific section
- Class templates not visible in the new session empty state (broken path for class-template-only academies)

---

## 10-Dimension Score

| Dimension | Score | Notes |
|---|---|---|
| 1. Entry clarity | **8/10** | Sessions list + "New Session" button present; class template path to new session not mentioned in empty state |
| 2. DONNA guidance | **9/10** | 4 chips + coach brief CTA + conversational adjustment handler + session_operator; minor: brief requires resolver friction |
| 3. Page-aware context | **9/10** | Exceptional depth: per-player intelligence, curriculum gates/drills/language/overrides, group aggregation |
| 4. Navigation/highlight support | **6/10** | DONNA has `sessions-list` targetId in FOCUS_TARGET_MAP, but NO `data-donna-focus-id` on any sessions page — highlight fires but finds no element |
| 5. UI cognitive load | **7/10** | 16+ sections in one session detail page; no progressive disclosure or anchor navigation |
| 6. Data honesty | **9/10** | Template snapshot notice clear; brief safety notes enforced; data gaps surfaced in brief; no fake data |
| 7. Draft/review/approval safety | **10/10** | Full `pending_review → approved → applied` pipeline; audit log; template never mutated |
| 8. Error/edge-case handling | **9/10** | Missing group/coach/blocks/curriculum all surfaced; migration 056 orange warning with SQL |
| 9. Mobile usability | **7/10** | `max-w-2xl` on new session good; 16-section detail page heavy on mobile; no section anchors |
| 10. Director/coach demo readiness | **8/10** | Feature-rich; adjustment suggestions impressive; but highlight gap + class template blind spot + page density hurt demo impact |
| **Total** | **82/100** | |

---

## Certification decision

### ⚠️ DEMO-READY WITH CAVEATS

The session planning loop is architecturally complete and safe. Template→session separation is watertight. Curriculum integration is deep. The adjustment suggestion engine (8 rules) is impressive. Planned vs. actual is built. However:

**Caveats for demo:**
1. **DONNA highlight gap** — `sessions-list` targetId in FOCUS_TARGET_MAP finds no DOM element on the sessions page. DONNA banner fires but highlights nothing.
2. **Class template blind spot** — `/director/sessions/new` empty state references only fitness templates. A class-template-only academy sees a broken path.
3. **Session detail density** — 16+ sections in a single page overwhelm a first-time demo viewer. No progressive disclosure, no section anchors.
4. **Coach brief resolver friction** — Director clicks "Draft Coach Brief with DONNA", DONNA asks which session — no auto-resolution from the current session page URL.

---

## Gaps found in this audit

| Gap | Severity | Dimension affected |
|---|---|---|
| No `data-donna-focus-id` on any sessions page | Medium | Navigation/highlight (4/10) |
| `/director/sessions/new` empty state → "Fitness Templates" only; class templates not mentioned | Medium | Entry clarity (8/10) |
| Session detail page: 16+ sections, no progressive disclosure | Medium | UI cognitive load (7/10), Mobile (7/10) |
| `fetchSessionBriefAction` requires resolver panel confirmation (extra steps from session page) | Low | DONNA guidance (9/10) |
| `curriculum_level_id` migration 045 pending — curriculum context requires manual DB setup | Pre-existing | Page-aware context (9/10) |
| `session_block_exercises` migration 056 pending — exercises require manual DB setup | Pre-existing | Error handling (9/10) |

---

## What was NOT changed

- No source files modified — audit-only sprint
- No SQL, migrations, RLS, seed, or env files touched
- No data approved, published, or sent

---

## Recommended Sprint 833

**Sprint 833 — Session Planning Navigation Highlight V1**

Target: Add `data-donna-focus-id` attributes to session planning pages so DONNA highlight fires correctly.

Specific targets to add:
- `data-donna-focus-id="sessions-list"` on the session list container in `src/app/director/sessions/page.tsx`
- `data-donna-focus-id="new-session-form"` on the form wrapper in `src/app/director/sessions/new/page.tsx`
- Update `FOCUS_TARGET_MAP` in `src/lib/donna/donnaUIActionDispatcher.ts`:
  - `/director/sessions` → `targetId: 'sessions-list'` (already present — just add the DOM attribute)
  - `/director/sessions/new` → add `targetId: 'new-session-form'`

Also: Update `/director/sessions/new` empty state to mention class templates as a session source.

Risk: Very low — additive DOM attribute changes only.
Scope: `src/app/director/sessions/page.tsx`, `src/app/director/sessions/new/page.tsx`, `src/lib/donna/donnaUIActionDispatcher.ts`.
