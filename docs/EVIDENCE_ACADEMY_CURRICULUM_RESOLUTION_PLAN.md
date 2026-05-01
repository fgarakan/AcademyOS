# Evidence → Academy Curriculum Resolution Plan

**Sprint:** 78
**Last updated:** 2026-05-01
**Status:** Documented — V1 implementation deferred (safe read-only display)

---

## Current State

Evidence-to-requirement linking was built in Sprints 36–40. The current flow:

1. `createEvidenceRequirementLinkDraftsAction` (player profile) — deterministic matching: observation → nearest open requirements
2. Director reviews draft in `EvidenceRequirementDrafts` component
3. Director approves → `requirement_evidence_links` row created
4. `PlayerRequirementProgressReadOnly` shows evidence count + summary per requirement

This flow currently uses **global curriculum requirements** from `curriculum_requirements` and `v_curriculum_level_requirements`. Academy curriculum overrides are **not consulted** when matching evidence to requirements.

---

## What Should Change

When an academy has active curriculum overrides (e.g., "more return-of-serve work before Orange 2 → Orange 3"), the evidence resolution should:

1. **Surface the override context** in the evidence detail view — so the director can see which academy-specific emphasis applies to this player's level.
2. **Bias draft matching** toward requirements that align with the active override focus (optional, V2+).
3. **Show curriculum source in evidence detail** — "Evidence linked under: Dabul Academy Curriculum V1 · Orange 2".

---

## Resolution Logic (Proposed V2)

```
Evidence draft creation:
  resolveAcademyCurriculumContext({ academyId, playerId })
  → ctx.applicableOverrides
  → if overrides focus on X (e.g., return-of-serve), prioritize matching requirements tagged X
  → include ctx.curriculumVersionName in the draft payload

Evidence detail view:
  Show: curriculum source (academy version or global default)
  Show: active override summaries affecting this player's level
  No change to approval flow
  No change to requirement_evidence_links creation
```

---

## V1 Current Behavior

- Evidence draft creation does NOT use academy curriculum version context.
- Evidence detail view shows: evidence_summary, observation snippet, confidence, created_by.
- No curriculum source line shown.

This is a safe V1 limitation — evidence is still correctly linked to global requirements, which are the source of truth. Academy overrides affect emphasis/session content, not requirement definitions.

---

## Files to Modify (V2)

| File | Change |
|------|--------|
| `src/app/director/players/[playerId]/evidenceRequirementDraftAction.ts` | Import `resolveAcademyCurriculumContext`, include in draft payload |
| `src/app/director/players/[playerId]/EvidenceRequirementDrafts.tsx` | Show curriculum source in draft card |
| `src/app/director/players/[playerId]/types.ts` | Add optional `curriculum_source` to `RequirementEvidenceDetailRow` |

---

## Guardrails (Unchanged)

- No evidence auto-approved.
- No requirement progress auto-marked complete.
- No parent/player visibility.
- No player level movement.
- All changes through director review queue.

---

## Dependencies

- `src/lib/curriculum/academyCurriculumResolution.ts` (Sprint 71) — already available
- `player_curriculum_states` table — must exist and be populated for the player
- `academy_curriculum_overrides` with `status = 'applied'` — must exist for the academy version
