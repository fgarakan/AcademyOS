# Director Template Builder UX — Sprint 1039

**Sprint:** 1039 — Director Template Builder UX Simplification V1
**Date:** 2026-05-31
**File changed:** `src/app/director/class-templates/page.tsx`

---

## Audit findings

### Routes

| Route | Purpose |
|---|---|
| `/director/class-templates` | Primary class template list (Supabase live data) |
| `/director/class-templates/new` | Create class template form |
| `/director/class-templates/[templateId]` | Template builder (5-step `ClassTemplateBuilderStepper`) |
| `/director/templates/class` | Secondary class templates library (uses mock/demo data — not the primary path) |

### Primary CTA
"New Class Template" (btn-lime) — clear and correctly styled.

### Problems identified

**Problem 1 — `PageExplainerCard` always rendered**
`PageExplainerCard` with 5 Q&A items was rendered unconditionally — appearing above both the empty state and the populated template list. A returning director with 20 templates saw 5 educational Q&A blocks on every visit. These add ~200px of visual overhead with zero operational value after the first visit.

**Problem 2 — Redundant empty state**
The empty state showed two cards stacked:
1. `NextBestActionCard` — explains the concept, provides "New Class Template" CTA
2. `EmptyState` inside a `Card` — explains the concept again, no CTA

Both said "here's what a class template is" in slightly different words. Only one is needed.

### What the director should do first
Click "New Class Template." The button was always visible but buried under the explainer.

---

## Decision

Remove `PageExplainerCard` entirely from the list page. The subtitle already answers "what is a class template?" The first-time empty state is handled by `NextBestActionCard` alone.

Remove the redundant `EmptyState` card from the empty state. `NextBestActionCard` covers first-time guidance with a CTA.

### What was preserved
- All Supabase queries unchanged
- Stats strip (lesson plans applied, curriculum level set, sessions w/ curriculum 30d)
- `data-donna-focus-id="template-list"` and `data-donna-focus-id="create-template-button"` — intact
- `TemplateRow` component — unchanged
- `NextBestActionCard` in empty state — kept as sole first-time guide
- "Fitness Templates" secondary CTA — kept

### What was removed
- `PageExplainerCard` import and render block (5 always-visible Q&A items)
- `EmptyState` import and Card wrapper in empty state
- `CardContent` import removed (no longer used in empty state; still used by `TemplateRow` via `Card`)

Wait — `CardContent` is still used in `TemplateRow`. Keeping the import.

---

## DONNA targets

| Focus ID | Targets |
|---|---|
| `data-donna-focus-id="create-template-button"` | "New Class Template" link |
| `data-donna-focus-id="template-list"` | Template list or empty state container |
