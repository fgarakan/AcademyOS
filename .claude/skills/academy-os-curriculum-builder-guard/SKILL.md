---
name: academy-os-curriculum-builder-guard
description: Guards the AcademyOS Curriculum Builder from cognitive overload, premature mutations, and admin-style UX. Use before any sprint that adds or modifies curriculum views, curriculum DONNA interactions, level management, template editing, or the curriculum sidebar entry point.
---

# AcademyOS Curriculum Builder Guard

## Purpose

The Curriculum Builder is a DONNA-led, guided, visual, approval-first tool. Its purpose is to make curriculum design low-friction and director-safe. The most common failure mode is turning it into a dense admin page.

This skill ensures the Curriculum Builder remains:

- Accessible (no blank workspace on first open)
- Guided (DONNA leads the first interaction)
- Draft-safe (all edits are proposals, not live changes)
- Approval-gated (director approves before any official change)
- Visually clear (level map shows structure at a glance)

---

## When to Use

Use this skill before any sprint that:

- Adds or modifies curriculum views under `/director/curriculum`
- Changes the sidebar link behavior for curriculum
- Adds a DONNA interaction for curriculum building or modification
- Adds a new level, block, exercise type, or template
- Adds a curriculum import or migration feature
- Changes how curriculum versions are created, approved, or applied
- Adds curriculum editing to the coach portal

---

## The 7 Curriculum Builder Principles

### 1. No blank workspace

The Curriculum Builder must never open to an empty page. If no curriculum exists, DONNA presents a guided welcome and offers to start building. If a curriculum exists, the visual level map loads immediately.

### 2. DONNA-led welcome

First interaction is always a DONNA prompt, not a form. DONNA asks: "What would you like to work on?" and offers chips: start new curriculum / edit existing level / review a draft / view the map.

### 3. Guided mode default

All curriculum editing begins in guided mode (DONNA asks questions, user answers, DONNA drafts the structure). Advanced/raw edit mode is accessible but not the default.

### 4. All edits are drafts

No curriculum edit takes effect immediately. Every change creates a draft curriculum version with `status: 'draft'`. The UI shows "Draft — not yet active."

### 5. Impact preview before approval

Before a director approves a curriculum change, the system shows a preview: which sessions will be affected, which players are in affected levels, what changes. The director sees the impact before confirming.

### 6. Director approval before official change

No curriculum change becomes `status: 'active'` without explicit director approval action. The approval is a deliberate step, not a side effect of editing.

### 7. Skip and jump freely

A director can skip any level, jump to any level, and edit levels out of order. The builder does not enforce a mandatory sequential flow.

---

## Sidebar Link Rule

The Curriculum sidebar link (`/director/curriculum`) must open the DONNA Curriculum Builder front door — not a dense admin grid, not a raw template editor, not a blank form. If the first thing a director sees is a table of all exercises, the UX has failed.

---

## Pre-Sprint Checklist

1. Does the new curriculum view load with content (DONNA welcome or level map) — never blank?
2. Is the first interaction a DONNA prompt or guided chip flow, not a raw form?
3. Do all curriculum edits create a draft version — never immediately active?
4. Is there an impact preview step before the director approves a curriculum change?
5. Does the director approval require an explicit action — not a side effect of editing?
6. Can the director skip or jump to any level without being forced into a sequential flow?
7. Does the curriculum DONNA interaction include `routingNote` in `donnaCommandRouter.ts`?
8. Does any new curriculum feature require a migration? (Hard stop — see below.)

---

## Hard Stop Conditions

Stop and ask before proceeding if a sprint would:

- Add a new level type or block schema that requires a migration
- Allow a curriculum change to become `status: 'active'` without director approval
- Show a raw exercise table or block admin grid as the first curriculum view
- Add curriculum editing to the coach portal without explicit sprint approval
- Apply a curriculum template without showing an impact preview
- Add curriculum version import without RLS and audit trail
- Overwrite an active curriculum version without creating a new draft first

---

## AcademyOS-Specific Rules

- `template_blocks` and `session_blocks` are separate tables — never merge them or query one as the other.
- Curriculum versions use `status` field: `draft` → `pending_review` → `active`. Never skip stages.
- The `VoiceOverrideInputPanel` is the DONNA entry for curriculum voice commands — it gates on `hasActiveVersion` before showing the input.
- All curriculum mutations write to `audit_logs` with `entity_type: 'curriculum'`.
- Curriculum DONNA commands must include `proposedActionType: 'curriculum_change'` if they create a proposed action.
- Never use `getSupabaseAdmin()` in a curriculum server action accessible from the director UI.

---

## Commit Rule

```bash
git commit -m "Sprint XXX — Sprint Name"
```

Single line only. No `Co-Authored-By`. No AI attribution.

---

## Required Output Format

```
## Curriculum Builder Guard Report — Sprint XXX

**Entry point:** [DONNA-led welcome / level map / flag: blank or admin grid]
**First interaction:** [DONNA prompt / guided chips / flag: raw form]
**Draft safety:** [all edits create draft / flag: what applies immediately]
**Impact preview:** [present before approval / flag: what skips preview]
**Director approval gate:** [explicit action required / flag: what bypasses]
**Navigation freedom:** [skip/jump available / flag: what forces sequential]
**Migration required:** [no / flag: what requires migration]

**Hard stops triggered:** [none / list]

**Verdict:** CLEAR / HOLD — [reason if hold]
```
