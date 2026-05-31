# Philosophy-to-Curriculum Draft Engine — Sprint 1020

**Date:** 2026-05-31
**Sprint:** 1020
**Status:** Complete

---

## What was built

Sprint 1020 creates the engine that converts philosophy gap analysis (Sprint 1019) into structured curriculum change draft proposals. These proposals describe what SHOULD go into a proposed_action in the Review Queue — they do not create DB records themselves.

---

## `CurriculumDraftProposal` type

| Field | Type | Description |
|---|---|---|
| `title` | string | Human-readable proposal title |
| `description` | string | What this change proposes |
| `changeType` | enum | add_content / rebalance / define_structure / review_coverage |
| `targetStage` | CurriculumStage or null | Which stage is targeted |
| `targetDomain` | string or null | Which domain is targeted |
| `gapRationale` | string | The philosophy gap this addresses |
| `safetyLevel` | 'review_only' | Always review_only — never approval-gated or safe |
| `approvalNote` | string | "Nothing changes until you approve" — always present |
| `reviewActionLabel` | string | Suggested Review Queue button label |
| `source` | 'philosophy_analysis' | Always philosophy_analysis in V1 |

---

## `buildProposalFromGap(gap, profile)`

Decision tree:
1. "No curriculum content" gap → "Define Initial Curriculum Structure" proposal
2. Stage name found in gap description → "Add Content to [Stage]" proposal
3. Otherwise → "Review [Domain] Content Balance" proposal

---

## Safety invariants

- `CurriculumDraftProposal` is a display-only structure
- It describes what to submit — it does not create a `proposed_action` DB record
- `STANDARD_APPROVAL_NOTE` is always included: "Nothing changes in your curriculum until you review and approve it in the Review Queue"
- `safetyLevel` is always `'review_only'` — these are never auto-applied
- No player names, coach notes, or private data in any proposal

---

## Integration path

Sprint 1021 (Curriculum Impact Preview) uses these proposals to build an impact preview.
Sprint 1022 (Director Curriculum Change Approval Flow) wires the actual proposed_action submission.
