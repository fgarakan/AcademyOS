# Sprint 819 — Template Builder Guided Navigation V1

**Date:** 2026-05-25
**Sprint:** 819
**Type:** Feature implementation
**Files changed:** 3 source files + 2 docs

---

## What this sprint delivers

When a director asks DONNA to "create a class template", DONNA now navigates to the Class Template Builder page and highlights the form — instead of trying to draft the template inline in the DONNA sidebar.

This converts template creation from **DONNA Draft Mode** → **Navigate + Highlight Mode**.

---

## Behavior Before Sprint 819

- Director says "Create a class template"
- `dispatchUIIntent` → `draft_submitted` kind
- DONNA says "I'll draft a session template for your review. What level and session type is this for?"
- DONNA asks questions in sidebar, trying to build the template there
- Director answers questions but still has to go to the builder separately

## Behavior After Sprint 819

- Director says "Create a class template"
- `dispatchUIIntent` → `navigate` kind with `focusTarget`
- `handleUIDispatch` calls `setDonnaFocusTarget({targetId: 'create-template-form', ...})`
- `router.push('/director/class-templates/new')`
- `DonnaHighlightBanner` fires on arrival — teal glow on the template form
- DONNA says: "I brought you to the Class Template Builder. Fill in the details here — I can help guide the structure, but the template should be built in this workspace."
- Director builds the template using the real UI, with DONNA available in the panel for guidance

---

## Command Mappings Wired

| Command Pattern | Route | Focus Target |
|---|---|---|
| "Create a class template" | `/director/class-templates/new` | `create-template-form` |
| "Create a session template" | `/director/class-templates/new` | `create-template-form` |
| "Build a class template" | `/director/class-templates/new` | `create-template-form` |
| "Make a template" | `/director/class-templates/new` | `create-template-form` |
| "New class template" | `/director/class-templates/new` | `create-template-form` |
| "Create a template" | `/director/class-templates` | `create-template-button` (via NAV_PATTERNS from Sprint 817) |

---

## Focus Targets Added

### `/director/class-templates`

| data-donna-focus-id | Element |
|---|---|
| `create-template-button` | "New Class Template" Link (the lime action button) |
| `template-list` | The `<div>` containing the template card list (both empty and populated states) |

### `/director/class-templates/new`

| data-donna-focus-id | Element |
|---|---|
| `create-template-form` | Wrapper `<div>` around the `<Card>` containing `<NewClassTemplateForm>` |

---

## What's unchanged

- The guided operator "walk me through a template" still uses the template operator (step-by-step guidance)
- Creating actual templates still requires the director to fill in the form manually — DONNA never auto-fills
- No DB mutations from DONNA
- No template data exposed to DONNA
- No official templates created automatically

---

## TypeScript

Clean — `npx tsc --noEmit` passes with no errors.
