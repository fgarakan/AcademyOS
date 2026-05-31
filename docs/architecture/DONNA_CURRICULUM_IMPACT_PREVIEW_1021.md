# Curriculum Impact Preview — Sprint 1021

**Date:** 2026-05-31
**Sprint:** 1021
**Status:** Complete

---

## What was built

Sprint 1021 adds a curriculum impact preview layer that answers "what would change if this is approved?" before a director submits a curriculum change proposal to the Review Queue.

This is the trust layer between DONNA's suggestion (Sprint 1020) and director approval (Sprint 1022).

---

## `CurriculumImpactPreview` type

| Field | Type |
|---|---|
| `title` | string — "Impact: [proposal title]" |
| `willHappen` | string[] — projected impacts if approved |
| `willNotHappen` | string[] — explicit safety reassurances |
| `affectedStages` | CurriculumStage[] |
| `affectedDomains` | string[] |
| `effortLevel` | 'low' / 'moderate' / 'significant' |
| `playerImpactSummary` | string — player-level impact description |
| `approvalRequirement` | string — always "requires your explicit approval" |
| `isReversible` | true — always true for curriculum changes |

---

## `buildCurriculumImpactPreview(proposal)` — changeType dispatch

| changeType | willHappen | willNotHappen | effort |
|---|---|---|---|
| `define_stage_structure` | New stage defined; curriculum builder shows it | No player movement; no coach session changes | moderate |
| `add_content_to_stage` | Content added to stage; coverage map updated | No auto-session updates; no player re-assessment | low |
| `rebalance_domain` | Domain coverage reviewed/updated | No auto-player assessment; no session template changes | moderate |
| `review_stage_coverage` | Review initiated | No automatic changes at all | low |

---

## Safety invariants

All previews always include these "will NOT happen" items:
- No parent or player communications will be sent
- No players will be automatically moved or re-assigned
- No session templates will be changed automatically

`approvalRequirement` is always: "This change requires your explicit approval in the Review Queue. Nothing is applied automatically."

`isReversible: true` — all curriculum changes can be undone by a subsequent change going through the same review process.

---

## Integration

Sprint 1022 (Director Curriculum Change Approval Flow) uses these previews to show the director what they're approving before routing to the Review Queue.
