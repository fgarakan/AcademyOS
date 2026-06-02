# Assessment Studio — QA Checklist

**Sprint:** Mega Sprint 1196-1210
**Date:** 2026-06-02

---

## Pre-conditions

- [ ] Migrations 081 and 082 applied to live DB
- [ ] Global Core Assessment Template seeded (check: `SELECT count(*) FROM assessment_templates WHERE is_global = true`)
- [ ] At least 1 active player exists in the academy
- [ ] Coach account exists and is linked to academy

---

## Migration verification

- [ ] `assessment_templates` table exists
- [ ] `assessment_template_sections` table exists
- [ ] `assessment_template_skills` table exists
- [ ] `assessment_template_versions` table exists
- [ ] `academy_assessment_templates` table exists
- [ ] Global template has 7 sections
- [ ] Global template has 55 skills total

---

## Template auto-clone

- [ ] Director navigates to Assessments tab → no error
- [ ] Academy template auto-created (check: `SELECT * FROM academy_assessment_templates WHERE academy_id = '...'`)
- [ ] Template sections loaded from DB (not hardcoded)
- [ ] Template skills loaded from DB (not hardcoded)

---

## Assessment Studio Form — Director

### Quick mode

- [ ] "Start Assessment" button visible
- [ ] Click opens the form
- [ ] View auto-suggested based on player level
- [ ] Mode = Quick shows only `appears_in_quick = true` skills
- [ ] Score picker 1–10 works (click to select, click again to deselect)
- [ ] "N/A" toggle works per skill
- [ ] Notes field accepts text
- [ ] Submit inserts into `assessments` table
- [ ] `assessments.version_id` is populated
- [ ] `assessments.scores_detail` contains `assessment_view`, `mode`, `template_id`
- [ ] Audit log entry created: `assessment.submitted`
- [ ] No level movement
- [ ] No parent notification

### Standard mode

- [ ] Section cards rendered in sorted order
- [ ] Section cards collapsed by default
- [ ] Click header expands section
- [ ] "Not assessed this section" toggle hides score inputs
- [ ] Individual skill scores work
- [ ] Section notes field visible when expanded
- [ ] Section-level score shown in card header

### Reassessment mode (when previous assessment exists)

- [ ] Form shows "Start Reassessment" + previous assessment date + score
- [ ] Previous score shown below each domain/skill input
- [ ] Delta badge shows `+2.0` in green or `−1.5` in red
- [ ] Submit shows AssessmentComparisonCard
- [ ] Comparison shows domain deltas
- [ ] Top improvements list populated
- [ ] Top declines list populated
- [ ] Recommendations shown with safety note

---

## Assessment Studio Form — Coach

- [ ] Coach sees AssessmentStudioForm on `/coach/players/[playerId]`
- [ ] Submit shows "Submit for review" (not "Submit assessment")
- [ ] Submission creates `proposed_actions` row with `target_module = 'assessment_studio_draft'`
- [ ] Does NOT insert into `assessments` table
- [ ] Audit log entry: `assessment.draft_submitted`
- [ ] No level/blueprint/parent changes

---

## Director Review Queue

- [ ] Coach-submitted drafts appear in review queue under "Coach Assessment Drafts"
- [ ] Player name links to player profile
- [ ] Domain scores shown as bars
- [ ] Coach notes shown
- [ ] "Approve & Record" button inserts into `assessments` table
- [ ] Approval marks `proposed_actions.status = 'executed'`
- [ ] Audit log entry: `assessment.draft_approved`
- [ ] "Reject" button marks `proposed_actions.status = 'rejected'`
- [ ] No automatic level/blueprint/parent changes on approval

---

## Role safety

- [ ] Parent portal shows no new assessment data without director action
- [ ] Player portal shows no new assessment data without director action
- [ ] Coach submissions cannot set `is_baseline = true` without director approval
- [ ] Coach cannot see other coaches' drafts

---

## Assessment history display

- [ ] AssessmentsTab shows historical assessments in reverse chronological order
- [ ] Assessment card shows `assessment_label` from `scores_detail` (if present)
- [ ] Assessment card shows `assessment_view` from `scores_detail` (if present)
- [ ] Delta arrows shown between consecutive assessments

---

## Assessment type + view mapping

| Assessment Label | Expected DB type |
|---|---|
| Onboarding Placement | intake |
| Quarterly Progress Review | quarterly |
| Level Readiness Review | promotion |
| Monthly Development Check | ad_hoc |
| Competition Readiness Review | ad_hoc |
| Coach Requested | ad_hoc |
| Director Requested | ad_hoc |
| DONNA Recommended | ad_hoc |

- [ ] All 8 labels submit with correct DB type

---

## TypeScript

- [ ] `npx tsc --noEmit` passes with no errors in sprint files
