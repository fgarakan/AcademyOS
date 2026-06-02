# Assessment Template Editor — QA Checklist

**Sprint:** Mega Sprint 1196-1210
**Date:** 2026-06-02

---

## Pre-conditions

- [ ] Migrations 081–082 applied
- [ ] Director account active
- [ ] Academy template auto-cloned (see ASSESSMENT_STUDIO_QA.md)

---

## Navigation

- [ ] "Assessment Template" link appears in sidebar under system items
- [ ] Clicking navigates to `/director/assessment-template`
- [ ] Page shows template name + stats (sections count, visible skills count, version count)
- [ ] Head coach can also access (not just director)

---

## Section editor

### Rename section

- [ ] Click pencil icon → inline input appears
- [ ] Type new name → press Enter → name updates
- [ ] Press Escape → name reverts (no change)
- [ ] Empty name shows error "Name must be 1–80 characters"
- [ ] Version snapshot created after rename
- [ ] Version count increments

### Hide/show section

- [ ] Click eye icon → section becomes visually dimmed
- [ ] Section hidden from assessment form immediately
- [ ] Version snapshot created
- [ ] Click eye-off icon → section restored
- [ ] Global template unaffected (director's clone only)

### Reorder sections

- [ ] Up arrow disabled on first section
- [ ] Down arrow disabled on last section
- [ ] Click up arrow → section moves up, version snapshot created
- [ ] Click down arrow → section moves down, version snapshot created
- [ ] New assessment form renders sections in new order

---

## Skill editor

### Expand section

- [ ] Click section card header → skills list expands
- [ ] Click again → skills list collapses

### Rename skill

- [ ] Click pencil icon on skill → inline input
- [ ] Enter to save, Escape to cancel
- [ ] New name appears in assessment form

### Hide/show skill

- [ ] Click eye icon → skill dimmed
- [ ] Hidden skill no longer appears in assessment form
- [ ] Required badge shown on required skills (no hide in V1 — note only)

### Reorder skills

- [ ] Up/down arrows work within a section
- [ ] Cannot reorder across sections (arrows are section-scoped)
- [ ] Assessment form reflects new order

---

## Version history

- [ ] Info strip shows version count
- [ ] Every rename creates a new version
- [ ] Every hide/show creates a new version
- [ ] Every reorder creates a new version
- [ ] Old assessments still reference old version_id (historical accuracy)

---

## Role guardrails

- [ ] Coach role → 404 (not found) on template editor page
- [ ] Parent/player role → 404
- [ ] Only director/head_coach can access

---

## Global template protection

- [ ] Global template not editable via template actions (RLS enforced)
- [ ] Director edits only affect their academy clone
- [ ] Verify: `SELECT is_global FROM assessment_templates WHERE id = '<template_id>'` = false for academy clone

---

## V1 limitations (known, expected)

- [ ] No "Add custom section" button (deferred)
- [ ] No "Add custom skill" button (deferred)
- [ ] No scoring scale change (deferred)
- [ ] No level applicability editor (deferred)
- [ ] No pathway category editor (deferred)
- [ ] No guidance text editors (deferred)
