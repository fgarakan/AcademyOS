# DONNA Director Action Explanation Layer — Sprint 970

**Date:** 2026-05-30
**Sprint:** 970
**Status:** Implemented — TypeScript clean

---

## Purpose

Every DONNA recommended action now has a structured canonical explanation covering:

- **What the action does** — one declarative sentence
- **Whether it changes records** — boolean
- **Whether approval is required** — boolean
- **What happens next** — what the director sees after clicking
- **Safety statement** — one-sentence canonical safety copy
- **Safety badge** — short label: "Read-only", "Draft / No auto-save", or "Approval Required"

This is the single source of truth for safety/approval language across all DONNA surfaces. The same explanation block is consumed by:
1. The DONNA panel (V1 — text-only)
2. The LLM orchestration context packet (Sprint 978)
3. Any future DONNA surface that needs canonical safety copy

---

## Files Created

### `src/lib/donna/directorActionExplanation.ts`

Pure TypeScript — no DB, no API, no mutations.

**Exports:**
- `DirectorActionExplanation` — structured explanation type
- `buildActionExplanation(action: DirectorNextAction): DirectorActionExplanation` — main builder
- `formatExplanationAsText(explanation: DirectorActionExplanation): string` — formats as COO paragraph
- `getSafetyBadge(level: DirectorNextActionSafetyLevel): string` — returns "Read-only" / "Draft / No auto-save" / "Approval Required"
- `requiresDirectorApproval(level: DirectorNextActionSafetyLevel): boolean`
- `canChangeRecords(level: DirectorNextActionSafetyLevel): boolean`

---

## Safety Level Templates

| Safety Level | Changes Records | Approval Required | Badge |
|---|---|---|---|
| `safe` | No | No | Read-only |
| `review_only` | No | No | Draft / No auto-save |
| `approval_gated` | Yes | Yes | Approval Required |

---

## Action ID Coverage

All 8 `DirectorNextAction` ids have specific `whatItDoes` and `whatHappensNext` copy:

| Action ID | What It Does |
|---|---|
| `pending_review_queue` | Opens the Review Queue where pending coach notes, wrap-ups, and parent drafts wait for your decision |
| `curriculum_status_review` | Shows the curriculum status overview — active levels, content gaps, and pending drafts |
| `class_template_primary_action` | Opens the primary setup step for this class template |
| `class_template_list` | Shows all class templates so you can review, edit, or create a new one |
| `sessions_attention` | Lists all director-visible sessions and identifies which need attention |
| `player_attention` | Opens the player directory with status, curriculum level, and attention signals |
| `review_queue_clear` | Review Queue is clear — suggests checking the dashboard |
| `dashboard_review` | Opens the Academy Dashboard for an at-a-glance view |

Unknown action IDs fall back to `action.why` (always populated).

---

## Integration

Sprint 970 creates the helper but does NOT change `DonnaAssistantButton` response text. The current `action.summary` already includes inline safety language. Adding a second block would lengthen responses and reduce COO clarity.

Sprint 978 LLM orchestration will consume `buildActionExplanation(action)` as part of the context packet, giving the LLM structured safety context rather than free-text paragraphs.

---

## No-Mutation / No-Migration Guarantee

- Pure TypeScript helper — no DB, no API, no React
- No changes to `DirectorNextAction` shape
- No changes to `DonnaAssistantButton`
- No schema changes
- No RLS changes
