# Assessment → Evidence Engine V1 — QA Checklist

**Sprint:** Mega Sprint 1451–1480
**Date:** 2026-06-03
**Scope:** Assessment evidence mapper · Section-level evidence · Evidence freshness/expiry · DONNA evidence answers · Quick assessment evidence

---

## 1 — Evidence Mapper (pure TS)

| # | Check | Pass/Fail |
|---|---|---|
| 1 | `mapAssessmentToEvidenceRecords` returns a `summaryRecord` for every completed assessment | |
| 2 | Summary record `source_type = 'assessment_score'` (or `'reassessment_change'` for reassessments) | |
| 3 | Summary record `evidence_category = 'assessment'` | |
| 4 | Summary record `visible_to_parent = false`, `visible_to_player = false` | |
| 5 | Section records returned for every section with a non-null, non-skipped score | |
| 6 | Section record `source_id = assessmentId + '_s_' + sectionKey` (dedup-safe) | |
| 7 | Section record `evidence_category = 'assessment_snapshot'` | |
| 8 | `mapQuickAssessmentToEvidence` returns a single summary record with `evidence_category = 'assessment'` | |

---

## 2 — Section → Pathway / Category Mapping

| # | Check | Pass/Fail |
|---|---|---|
| 9 | Section key `technical` → `pathway = 'skill'`, `evidenceCategory = 'skill'` | |
| 10 | Section key `movement_foundations` → `pathway = 'fitness'`, `evidenceCategory = 'movement'` | |
| 11 | Section key `tactical` → `pathway = 'competition'`, `evidenceCategory = 'tactical'` | |
| 12 | Section key `competition` → `pathway = 'competition'`, `evidenceCategory = 'competition'` | |
| 13 | Section key `behavior` or `learning_behaviors` → `pathway = 'general'`, `evidenceCategory = 'behavior'` | |
| 14 | Section key `mental_performance` → `pathway = 'mental_performance'`, `evidenceCategory = 'mental_performance'` | |

---

## 3 — Evidence Freshness / Expiry

| # | Check | Pass/Fail |
|---|---|---|
| 15 | `quick_placement_snapshot` → `expires_at` = 30 days from now | |
| 16 | `development_assessment` → `expires_at` = 90 days from now | |
| 17 | `level_readiness_assessment` → `expires_at` = 45 days from now | |
| 18 | `evaluation_assessment` → `expires_at` = 60 days from now | |
| 19 | `isEvidenceStale(null)` returns `false` | |
| 20 | `isEvidenceStale(pastDate)` returns `true` | |
| 21 | `evidenceAgeLabel` returns 'Fresh' for records < 7 days old | |
| 22 | `expires_at` is stored on every evidence record written by the full writer | |

---

## 4 — Full Assessment Evidence Writing (AssessmentStudioForm → director)

| # | Check | Pass/Fail |
|---|---|---|
| 23 | Submitting a development assessment creates at least 1 summary evidence record | |
| 24 | Sections with scores create additional section records | |
| 25 | Sections marked "not assessed" do NOT create evidence records | |
| 26 | `source_id` on summary record = assessment UUID | |
| 27 | Evidence write is non-blocking — assessment save succeeds even if evidence write fails | |
| 28 | `evidence_weight = 1.5` for reassessment summary, `1.0` for initial assessment | |
| 29 | `evidence_weight = 0.8` for section records | |
| 30 | `visible_to_parent = false` and `visible_to_player = false` on all records | |

---

## 5 — Coach Draft Approval Evidence Writing

| # | Check | Pass/Fail |
|---|---|---|
| 31 | When director approves a coach assessment draft, evidence records are written | |
| 32 | Evidence records use the `finalDetail` (possibly director-edited) scores | |
| 33 | `isReassessment` flag from draft payload is respected | |

---

## 6 — Quick Placement Snapshot Evidence Writing

| # | Check | Pass/Fail |
|---|---|---|
| 34 | Completing a Quick Placement Snapshot creates 1 summary evidence record | |
| 35 | Evidence `source_id` = the assessment UUID from DB insert | |
| 36 | `expires_at` = 30 days from now | |
| 37 | Domain score labels appear in summary: "Technical: Solid, Movement: Developing" | |
| 38 | Evidence write is non-blocking if evidence table unavailable | |

---

## 7 — DONNA Evidence Answers

| # | Check | Pass/Fail |
|---|---|---|
| 39 | `buildAssessmentEvidenceMissingAnswer` returns no-evidence when no assessment records exist | |
| 40 | When assessment records exist but are stale, answer mentions "reassessment due" | |
| 41 | When no gaps: answer confirms "No critical evidence gaps detected" | |
| 42 | `buildWhyNotReadyToAdvanceAnswer` cites weak assessment records and high blockers | |
| 43 | Returns no-blocker message when no weak records or blockers found | |
| 44 | `buildCoachFocusAnswer` prioritises weak assessment section records first | |
| 45 | Falls back to `rollup.recommendedNextAction` when no weak records exist | |
| 46 | All three new builders return `safeForParent = false`, `safeForPlayer = false` | |
| 47 | All three new builders return `isSafe = true` (safe for director/coach) | |

---

## 8 — Safety

| # | Check | Pass/Fail |
|---|---|---|
| 48 | No evidence record has `visible_to_parent = true` or `visible_to_player = true` by default | |
| 49 | `playerEvidenceWriter.ts` passes `evidence_category`, `evidence_weight`, `expires_at` to DB but does not break existing callers (all optional fields) | |
| 50 | `EvidenceWriteInput` additions are optional — existing callers compile without changes | |

---

## 9 — TypeScript

| # | Check | Pass/Fail |
|---|---|---|
| 51 | `npx tsc --noEmit` passes with zero errors | |

---

## Known limitations / follow-up work

- `playerEvidenceAggregator.ts` does not yet select `expires_at` or `evidence_category` from the DB. Follow-up: add these columns to the SELECT query so freshness checks work at query time.
- Attention Queue does not yet query evidence stale signals directly — it will need to filter `player_evidence_records` where `expires_at < now()` to produce "Reassessment Due" entries. Follow-up sprint.
- Section evidence summaries use `sectionKey.replace(/_/g,' ')` as a display name. A follow-up sprint should use the actual `display_name` from the template loaded at assessment time.
- Skill-level evidence records (below section level) are not written in V1. The mapper data structures support them but the writer does not iterate individual skills. A follow-up sprint can enable per-skill records for deep-mode assessments.
