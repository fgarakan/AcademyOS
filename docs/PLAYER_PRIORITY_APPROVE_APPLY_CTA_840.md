# Sprint 840 — Player Priority Approve / Apply CTA V1

**Date:** 2026-05-26
**Sprint:** 840
**Type:** UX gap fix — review queue navigation bridge in player priority draft component
**Migration:** None
**TypeScript:** Clean (`npx tsc --noEmit` — exit 0, no errors)
**Status:** ✅ IMPLEMENTED

---

## Problem

**Source:** Sprint 833 — GAP-A (Critical)

`PriorityRecommendationDrafts.tsx` on `/director/players/[playerId]` showed draft status
(Pending Review / Approved / Needs Clarification) but provided no path for the director to
act on the draft. To approve a priority recommendation, the director had to:

1. Notice the "Pending Review" badge.
2. Manually navigate to `/director/review`.
3. Find the draft in the Player Updates tab.
4. Approve it there.
5. Find it again to click "Apply."

There was no CTA, link, or even a navigation hint. In a demo this stops the loop —
the director creates a draft, sees it in the profile, then has no obvious next step.

---

## Investigation: Is there already a proposed_action?

Yes. `createPriorityRecommendationDraftAction` (`priorityRecommendationAction.ts`) already:

1. Inserts a `voice_commands` relay row (required FK).
2. Inserts a `proposed_actions` row:
   - `target_module: 'priority_recommendation'`
   - `target_object_type: 'player'`
   - `target_object_id: playerId`
   - `status: 'pending_review'`
   - `risk_level: 'low'`
3. Payload is `priority_recommendation_v1` — fully typed and traceable.

No new backend plumbing was needed.

---

## Investigation: Is there an existing safe approval path?

Yes. The full pipeline already existed:

| Component / Action | Location | Role |
|---|---|---|
| `PriorityRecommendationDraftCard` | `src/app/director/review/` | Renders the full review card |
| `PriorityDraftDecisionControls` | `src/app/director/review/` | Approve / Reject / Needs Clarification buttons |
| `ApplyPriorityRecommendationControls` | `src/app/director/review/` | "Create Active Priority" button (post-approval) |
| `updatePriorityRecommendationDecisionAction` | `review/actions.ts` | Writes `proposed_actions.status = approved/rejected` |
| `applyApprovedPriorityRecommendationAction` | `review/actions.ts` | Writes one `player_priorities` row + `audit_logs`, marks `executed` |

The review queue page (`/director/review`) renders `PriorityRecommendationDraftCard` in the
`player_updates` tab — URL: `/director/review?tab=player-updates`.

---

## Solution

One file modified: `src/app/director/players/[playerId]/PriorityRecommendationDrafts.tsx`.

### 1. Added `CTA_CONFIG` lookup table

```ts
const CTA_CONFIG: Record<string, { label: string; color: string } | null> = {
  pending_review:       { label: 'Review / Approve in Review Queue', color: 'text-status-orange hover:...' },
  approved:             { label: 'Apply in Review Queue',            color: 'text-lime hover:...' },
  clarification_needed: { label: 'Return to Review Queue',           color: 'text-status-blue hover:...' },
}
```

### 2. Added CTA footer to each draft card

After the "Date" line, a `pt-2 border-t border-border` footer renders when `cta` is non-null:

```tsx
{cta && (
  <div className="pt-2 border-t border-border">
    <Link
      href="/director/review?tab=player-updates"
      className={`inline-flex items-center gap-1.5 text-xs font-medium transition-colors ${cta.color}`}
    >
      {cta.label}
      <ArrowRight className="w-3.5 h-3.5" />
    </Link>
    <p className="text-[10px] text-text-muted mt-1">
      Director approval required before any priority change is applied.
    </p>
  </div>
)}
```

### 3. Updated header copy

Added to the top-of-card description:

> "Official priority changes require director approval in the Review Queue."

---

## CTA Behavior Matrix

| Status | CTA label | Color | Link target |
|---|---|---|---|
| `pending_review` | "Review / Approve in Review Queue →" | orange | `/director/review?tab=player-updates` |
| `approved` | "Apply in Review Queue →" | lime | `/director/review?tab=player-updates` |
| `clarification_needed` | "Return to Review Queue →" | blue | `/director/review?tab=player-updates` |
| `rejected` | (not shown — query excludes rejected drafts) | — | — |
| `executed` | (not shown — query excludes executed drafts) | — | — |

The player profile page query already filters to `['pending_review', 'approved', 'clarification_needed']`
only — so `rejected` and `executed` drafts never appear in the component.

---

## Approval Path Confirmed

```
Director clicks "Generate Recommendation" in player profile
    ↓
createPriorityRecommendationDraftAction → proposed_actions (pending_review)
    ↓
PriorityRecommendationDrafts shows draft + "Review / Approve in Review Queue →"  ← NEW
    ↓
Director clicks link → /director/review?tab=player-updates
    ↓
PriorityRecommendationDraftCard renders with PriorityDraftDecisionControls
    ↓
Director clicks "Approve Recommendation" → updatePriorityRecommendationDecisionAction
                                        → proposed_actions.status = 'approved'
    ↓
PriorityRecommendationDrafts now shows "Apply in Review Queue →"  ← NEW
    ↓
Director returns to review queue → ApplyPriorityRecommendationControls
    ↓
applyApprovedPriorityRecommendationAction
    → INSERT player_priorities { is_active: true }
    → INSERT audit_logs (provenance, actor, timestamp)
    → UPDATE proposed_actions.status = 'executed'
```

No approval is triggered from the player profile page. No `player_priorities` writes happen from
the player profile page. The CTA is purely a navigation bridge.

---

## Safety Guardrails Preserved

| Guarantee | Status |
|---|---|
| No official priority written from player profile | ✅ CTA is a Link, not a button — no action |
| No `player_priorities` writes except via apply action | ✅ apply action in `review/actions.ts` only |
| No level movement | ✅ no level changes in any path |
| No parent/player messages | ✅ no comms path |
| No parent/player data exposure | ✅ component is director-only |
| No schema changes | ✅ no migrations |
| No new server actions | ✅ existing `actions.ts` functions used |
| Approval gated in review queue | ✅ `updatePriorityRecommendationDecisionAction` enforces director role |
| Apply gated in review queue | ✅ `applyApprovedPriorityRecommendationAction` enforces director role + `status === 'approved'` |
| Audit log on apply | ✅ `priority_recommendation.priority.applied` in `audit_logs` |

---

## Files Created

### `docs/PLAYER_PRIORITY_APPROVE_APPLY_CTA_840.md`

This file.

---

## Files Modified

### `src/app/director/players/[playerId]/PriorityRecommendationDrafts.tsx`

1. Added `import Link from 'next/link'`
2. Added `ArrowRight` to lucide-react imports
3. Added `CTA_CONFIG` lookup (status → label + color)
4. Updated header copy to note review queue requirement
5. Added CTA footer section to each draft card (renders only when `cta` is non-null)

---

## Score Impact (estimated)

Dimension 5 — Approve → Apply Path Completeness: **5/10 → 8/10**

The director now has a clear path from the player profile draft to the review queue
approve/apply controls. The full pipeline was already built — this sprint closes the UX gap.

---

## Remaining Player Priority Gaps

| Gap | Source | Priority |
|---|---|---|
| No `data-donna-focus-id` on any player profile page section | Sprint 833 GAP-B | Medium |
| DONNA roster attention answers link to player list, not specific player profile | Sprint 833 | Low |
| `playerAttentionRiskLoader` only checks `observation_type = 'concern'` — misses `injury_concern` and `behavioral` | Sprint 833 | Low |
| `PlayerActivePriorities` shows no attribution (approved by / approved on) | Sprint 833 | Low |
| `draftSummaryUpdateAction` only uses `is_private = true` observations — excludes public tactical/technical notes | Sprint 833 | Low |
| Player DONNA chips are static — not priority-aware | Sprint 833 | Low |

---

## Recommended Sprint 841

**Sprint 841 — Player Profile DONNA Focus IDs V1**

Add `data-donna-focus-id` attributes to key sections of the player profile page and its tab
components so DONNA can highlight specific sections after navigating to a player profile.

Target focus IDs:
- `player-profile-header` on the player header component
- `player-notes-tab` on the notes tab trigger
- `player-priority-recommendation` on the PriorityRecommendationDrafts + draft button section
- `player-active-priorities` on the PlayerActivePriorities section
- `player-evidence-hub` on the Evidence Hub section

Risk: Low — additive DOM attribute additions only, no logic changes.

Also recommended (same sprint or Sprint 842):
- Wire `DONNA dispatch` `player_operator` result `focusTarget` to point at `player-priority-recommendation`
  when the director says "review this player's priorities" — so DONNA routes AND highlights the
  correct section in one step.
