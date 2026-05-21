# DONNA Academy Knowledge Context

> Sprint 463 — DONNA Academy Knowledge Context V1
> See also: `src/lib/donna/academyKnowledge/index.ts`, `docs/data-classification.md`

---

## Context areas

| Area | Roles | Sensitive | Parent-safe gate | Player-safe gate | No-cache |
|---|---|---|---|---|---|
| academy_settings | Director | No | No | No | No |
| staff | Director | Yes | No | No | No |
| groups | Director, Head Coach, Coach | No | No | No | No |
| players | Director, Head Coach, Coach | Yes | No | No | No |
| curriculum | All | No | No | No | No |
| templates | Director, Head Coach, Coach | No | No | No | No |
| sessions | Director, Head Coach, Coach | No | No | No | No |
| attendance | Director, Head Coach, Coach | No | No | No | No |
| player_priorities | Director, Head Coach, Coach | Yes | No | No | **Yes** |
| coach_notes | Director, Head Coach, Coach | Yes | **Yes** | **Yes** | **Yes** |
| parent_summaries | Director, Head Coach | Yes | **Yes** | No | **Yes** |
| badges | All | No | No | No | No |
| missions | All | No | No | No | No |
| mental_performance | All | No | **Yes** | No | No |

---

## Data classification

| Classification | Meaning |
|---|---|
| public | Safe for any role in the academy |
| internal | Safe within the academy staff |
| sensitive | Requires role gate before inclusion in context |
| restricted | Requires parent-safe or player-safe filter before inclusion |

---

## Context pack rules

1. Never include raw coach_notes in parent/player context — must pass is_parent_safe / show_to_student filter.
2. Never include player_priorities in context packs for parent or player roles.
3. No raw personal identifiers (email, phone) in AI context packs.
4. Compact summaries only — never full documents in a context pack.
5. Academy scope enforced by academy_id on every context fetch.

---

## What already exists

The primary context builder is `src/lib/donna/academyHealthContextPackage.ts`, which assembles a health signal context including:
- Live KPIs from `academyHealthSourceMap.ts`
- Deferred KPIs from the same source
- Group health from `groupHealthLoader.ts`
- Coach support from `coachSupportLoader.ts`
- Player attention risk from `playerAttentionRiskLoader.ts`

This new `academyKnowledge/` index formalizes the area-level rules that govern what goes into context packs.
