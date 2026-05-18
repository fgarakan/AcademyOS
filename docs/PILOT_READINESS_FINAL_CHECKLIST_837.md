# Sprint 837 — Pilot Readiness Final Checklist V1

**Date:** 2026-05-18
**Sprint:** 837

---

## Pre-pilot checklist — complete before every pilot session

### Environment setup
- [ ] Production Supabase project is active (not paused)
- [ ] All migrations 001–038 applied
- [ ] Seed data loaded (migration 037 executed)
- [ ] Demo sandbox data loaded with `[DEMO]` prefix
- [ ] `.env.local` has correct `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] App running at correct domain or `localhost:3000`

### Accounts
- [ ] Director account created with `academy_director` role in `user_metadata`
- [ ] At least one coach account with `coach` role
- [ ] At least 3 demo players (Sarah, Mia, Leo or equivalent) with `[DEMO]` prefix
- [ ] Demo academy created and linked to director

### Curriculum
- [ ] `curriculum_levels` has 15 rows
- [ ] `curriculum_versions` has 1 active version
- [ ] At least 5 levels have drills in `exercise_library`
- [ ] At least 5 levels have gates in `assessment_gates`
- [ ] Sufficiency dashboard shows ≥ 33% green levels

### DONNA
- [ ] Voice intake functional (test with a short voice note)
- [ ] Proposed action created successfully in `proposed_actions`
- [ ] Curriculum builder opens and shows levels
- [ ] DONNA drill draft panel opens and shows character count helper
- [ ] `assertNotPreviewMode()` tested: demo mode blocks mutations

### Review queue
- [ ] At least 1 pending action in review queue for demo
- [ ] Approve flow works (action moves to approved)
- [ ] Reject flow works

### Director briefing
- [ ] Director has read `docs/DIRECTOR_TRUST_HANDOFF_SCRIPT_806.md`
- [ ] Director knows V1 limitations (curriculum drafts are UI shell)
- [ ] Director has the demo script open: `docs/CURRICULUM_BUILDER_DEMO_SCRIPT_800.md`
- [ ] Retrospective template ready: `docs/V1_RETROSPECTIVE_TEMPLATE_809.md`

---

## Post-pilot debrief checklist

- [ ] Retrospective template completed within 24h
- [ ] Top 3 friction points logged
- [ ] Top 3 "this worked really well" moments logged
- [ ] V2 priority items updated based on feedback
- [ ] Next sprint block planned based on retrospective

---

## Go / no-go decision

**Go** if all Environment, Accounts, and DONNA checks pass.
**No-go** if any check fails — fix before proceeding.

Director can be notified of known V1 limitations (curriculum UI shell, no impact preview calculation) — these are acceptable at pilot, but must be disclosed.
