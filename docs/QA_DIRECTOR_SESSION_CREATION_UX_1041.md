# QA — Director Session Creation UX — Sprint 1041

**Sprint:** 1041
**Date:** 2026-05-31
**Files changed:** `src/app/director/sessions/page.tsx`, `src/app/director/sessions/new/page.tsx`

---

## Sessions list page — /director/sessions

- [ ] Page loads at `/director/sessions`
- [ ] Eyebrow: "Sessions"
- [ ] H1: "Sessions"
- [ ] Subtitle is ONE sentence: "Sessions are generated from your templates and give coaches a structured plan to run on court."
- [ ] **No three-sentence subtitle visible**
- [ ] "New Session" button (btn-lime) visible in header row
- [ ] "New Session" link has `data-donna-focus-id="new-session-button"`
- [ ] "View Archive" button (btn-ghost) visible in header row
- [ ] Session list renders with name, status pill, date, coach, template name (if set), group (if set), block count
- [ ] Clicking a session row navigates to `/director/sessions/[id]`

### Empty state (no sessions)

- [ ] EmptyState shows "No sessions yet"
- [ ] "Class Templates" link (btn-lime) navigates to `/director/class-templates`
- [ ] "Fitness Templates" link (underline) navigates to `/director/fitness/templates`

---

## New session page — /director/sessions/new

- [ ] Eyebrow: **"Sessions"** (not "Director")
- [ ] H1: "Create Session"
- [ ] Subtitle: "Generate a new session from a fitness or class template."
- [ ] Back link navigates to `/director/sessions`

### With templates present

- [ ] Template selector shows all academy templates
- [ ] Session name auto-fills from selected template
- [ ] Date defaults to today
- [ ] Coach selector shows academy members
- [ ] "Create session" button (btn-lime) submits
- [ ] On success: navigates to the new session detail page

### Empty state (no templates exist)

- [ ] Title: "No templates found"
- [ ] Description: "Create a class or fitness template first, then return here to generate a session from it."
- [ ] **"Class Templates"** button (btn-lime) navigates to `/director/class-templates`
- [ ] **"Fitness Templates"** button (btn-ghost) navigates to `/director/fitness/templates`
- [ ] **No "Go to Fitness Templates" only link** — both options shown

---

## DONNA integration

- [ ] `data-donna-focus-id="new-session-button"` present on "New Session" link on list page
- [ ] `data-donna-focus-id="session-list"` still present on the session list container

---

## Regression

- [ ] Session creation flow unchanged — selecting template + date + coach + submitting works
- [ ] Session detail page unchanged — blocks, roster, DONNA chips, curriculum context intact
- [ ] Approvals, review queue, coach wrap-up flow unaffected
- [ ] TypeScript: `npx tsc --noEmit` passes clean
