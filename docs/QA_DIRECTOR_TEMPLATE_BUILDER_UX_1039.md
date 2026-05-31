# QA — Director Template Builder UX Simplification — Sprint 1039

**Sprint:** 1039
**Date:** 2026-05-31
**File changed:** `src/app/director/class-templates/page.tsx`

---

## Checklist

### List page — with templates

- [ ] Page loads at `/director/class-templates`
- [ ] Header shows "Class Templates" h1 and correct subtitle
- [ ] "New Class Template" button (btn-lime) visible in header row
- [ ] "Fitness Templates" button (btn-ghost) visible in header row
- [ ] **No `PageExplainerCard` visible** — 5 Q&A block is gone
- [ ] Curriculum loop stats strip visible: Lesson Plans Applied / Curriculum Level Set / Sessions w/ Curriculum (30d)
- [ ] Each template renders as a `TemplateRow` card: name, level badge (if set), blocks, exercises, curriculum count, duration, status
- [ ] Clicking a template row navigates to `/director/class-templates/[templateId]`

### List page — empty state (no templates)

- [ ] `NextBestActionCard` shown with title "Create your first class template"
- [ ] `NextBestActionCard` body text visible
- [ ] "New Class Template" action link in `NextBestActionCard` navigates to `/director/class-templates/new`
- [ ] **No redundant `EmptyState` card** below the `NextBestActionCard`
- [ ] Stats strip is NOT shown (correct — no templates to count)

### DONNA integration

- [ ] `data-donna-focus-id="create-template-button"` present on "New Class Template" link
- [ ] `data-donna-focus-id="template-list"` present on template list / empty state wrapper

### TypeScript

- [ ] `npx tsc --noEmit` passes with no new errors

### Regression

- [ ] Template create flow (`/director/class-templates/new`) unaffected
- [ ] Template builder (`/director/class-templates/[templateId]`) unaffected
- [ ] Fitness templates route (`/director/fitness/templates`) unaffected
- [ ] Review queue, approvals, sessions, curriculum unaffected
