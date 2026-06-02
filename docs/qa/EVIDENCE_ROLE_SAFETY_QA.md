# Evidence Role Safety — QA Checklist

**Sprint:** Mega Sprint 1211-1230
**Date:** 2026-06-02

---

## Role visibility matrix

| Evidence type | Director | Coach | Parent | Player |
|---|---|---|---|---|
| `assessment_score` | ✅ | ✅ | ❌ | ❌ |
| `reassessment_change` | ✅ | ✅ | ❌ | ❌ |
| `coach_observation` | ✅ | ✅ | ❌ | ❌ |
| `mission_assigned` | ✅ | ✅ | ❌ | ✅ |
| `mission_completed` | ✅ | ✅ | ❌ | ✅ |
| `session_attendance` | ✅ | ✅ | ❌ | ❌ |
| `session_actual` | ✅ | ✅ | ❌ | ❌ |
| `placement_decision` | ✅ | ✅ | ❌ | ❌ |
| `director_override` | ✅ | ❌ | ❌ | ❌ |
| `level_readiness_signal` | ✅ | ✅ | ❌ | ❌ |
| `parent_update_approved` | ✅ | ❌ | ✅ | ❌ |
| `competition_note` | ✅ | ✅ | ❌ | ❌ |
| `fitness_note` | ✅ | ✅ | ❌ | ❌ |
| `mental_performance_note` | ✅ | ✅ | ❌ | ❌ |

---

## Data ownership matrix

| Evidence type | Owner scope | Portability | On exit |
|---|---|---|---|
| `assessment_score` | shared | portable | Exported with consent |
| `reassessment_change` | shared | portable | Exported with consent |
| `coach_observation` | academy_owned | internal_only | Retained by academy (never exported) |
| `mission_assigned` | player_owned | portable | Always exportable |
| `mission_completed` | player_owned | portable | Always exportable |
| `session_attendance` | academy_owned | anonymized_on_exit | player_id detached |
| `session_actual` | academy_owned | anonymized_on_exit | player_id detached |
| `placement_decision` | shared | portable | Exported with consent |
| `director_override` | academy_owned | internal_only | Retained by academy (never exported) |
| `level_readiness_signal` | shared | portable | Exported with consent |
| `parent_update_approved` | player_owned | portable | Always exportable |
| `competition_note` | shared | portable | Exported with consent |
| `fitness_note` | academy_owned | anonymized_on_exit | player_id detached |
| `mental_performance_note` | academy_owned | internal_only | Retained by academy |

---

## RLS policy verification

- [ ] Director sees all evidence in their academy (`visible_to_director = true` implied by role)
- [ ] Coach sees only `visible_to_coach = true` evidence
- [ ] Parent sees only `visible_to_parent = true` evidence for linked players
- [ ] Player sees only `visible_to_player = true` evidence for themselves
- [ ] Coach cannot see `director_override` records
- [ ] Parent cannot see any `assessment_score` records
- [ ] Player cannot see `placement_decision` records

---

## Parent/player safe content rules

- [ ] `evidence_summary` never contains raw assessment scores (e.g. "7.2/10")
- [ ] `evidence_summary` never contains raw coach observation text
- [ ] `evidence_summary` never contains director override reasoning
- [ ] `evidence_summary` never contains internal disagreement or conflict notes
- [ ] Parent-facing DONNA answers use only `visible_to_parent = true` records
- [ ] Player-facing DONNA answers use only `visible_to_player = true` records
- [ ] `evidenceParentTranslator.ts` generates positive development language only

---

## Post-anonymization safety

- [ ] `anonymized_at IS NOT NULL` records excluded from all aggregator queries
- [ ] Anonymized records do not appear in DONNA answers
- [ ] Anonymized records do not appear in PlayerEvidenceSummaryPanel
- [ ] Rollup computed only from non-anonymized records

---

## Exit flow safety (V2 — not yet built, verify architecture only)

- [ ] `portability_status = 'portable'` records included in player passport
- [ ] `portability_status = 'internal_only'` records never included in export
- [ ] `portability_status = 'anonymized_on_exit'` records have `player_id` detached
- [ ] `consent_status = 'granted'` required before export of `shared` records
- [ ] `director_override` records never exported regardless of consent

---

## DONNA ownership rules

- [ ] Parents/players asking DONNA see only approved summaries, not raw evidence
- [ ] Directors asking DONNA see full evidence including `visible_to_director = true`
- [ ] Coaches asking DONNA see `visible_to_coach = true` subset
- [ ] After exit: directors see only anonymized history (enforcement deferred to V2)
- [ ] DONNA never exposes `director_override` reasoning to coaches, parents, or players

---

## Cross-role data leak prevention

- [ ] Assessment scores not visible in parent portal
- [ ] Coach observation text not visible in parent portal
- [ ] Director override details not visible in coach portal
- [ ] Player-safe summaries contain no score numbers
- [ ] Player-safe summaries contain no "declining" or "struggling" language
