# QA Checklist — Sprint 964: DONNA Single Role Shell Persistent Panel V1

**Date:** 2026-05-29

---

## TypeScript

- [ ] `npx tsc --noEmit` exits with code 0
- [ ] No errors in `src/lib/donna/donnaPageChipRegistry.ts`
- [ ] No errors in `src/components/donna/DonnaPanelPageChips.tsx`
- [ ] No new errors in `src/components/assistant/DonnaAssistantButton.tsx`

---

## One-Button Director Checklist

- [ ] Exactly one DONNA FAB exists in the director shell (`fixed bottom-6 right-6`)
- [ ] No additional floating DONNA buttons on any director page
- [ ] Pages that need DONNA use `donna:open` CustomEvent, not a separate button
- [ ] `/director/donna` page does not add a floating button — it is a full-page surface with its own embedded chat shell (`DonnaVoiceReadyShell`)
- [ ] FAB hidden on mobile for director (replaced by `DONNADirectorMobileCommandBar`)
- [ ] FAB visible on desktop for director

---

## Side Panel Checklist

- [ ] Clicking FAB opens the panel (slides in from right)
- [ ] Clicking FAB again closes the panel
- [ ] Minimize button hides panel without clearing conversation thread
- [ ] Expand from minimize restores panel + thread intact
- [ ] Panel open state persists across route navigation (sessionStorage key: `donnaPanelOpen`)
- [ ] Panel closes on Escape key press
- [ ] Panel does not obscure the sidebar navigation on desktop
- [ ] Panel adapts to mobile width (`w-full` on small screens, `sm:w-96` on desktop)

---

## Greeting Checklist

- [ ] Greeting shows on first panel open in a session (`showGreeting = true`)
- [ ] Greeting is role-aware: director greeting via `buildDonnaOpeningGreeting()`
- [ ] Greeting is page-aware: references current module/route
- [ ] First open of the day: richer greeting via `isFirstOpenToday` flag
- [ ] Subsequent opens: continuity message or cross-session welcome
- [ ] Greeting is suppressed when a conversation reply or commandResponse is already active
- [ ] Review queue count shown in greeting when pending > 0

---

## Page-Aware Chip Checklist (Sprint 964 — new)

- [ ] `DonnaPanelPageChips` renders after the greeting card
- [ ] `DonnaPanelPageChips` renders before the voice/text input layer
- [ ] Chips appear on `/director` with correct targets: `todays-pulse`, `review-queue-card`, `academy-metrics-section`
- [ ] Chips appear on `/director/curriculum` with correct targets: `curriculum-status`, `curriculum-review-draft`, `curriculum-level-tree`
- [ ] Chips appear on `/director/class-templates` (list) with correct targets
- [ ] Chips appear on `/director/class-templates/[templateId]` (detail) with correct targets
- [ ] Chips appear on `/director/templates/impact-preview` as prompt-only chips
- [ ] Chips appear on `/director/review` as prompt-only chips
- [ ] Chips appear on `/director/onboarding/*` as prompt-only chips
- [ ] Chips appear on `/director/players` (directory) with correct targets
- [ ] Chips appear on `/director/players/[id]` (profile) with correct targets
- [ ] No chips rendered (component returns null) on routes not in registry — no empty space, no error
- [ ] Chip labels are readable, concise, and role-appropriate
- [ ] Chip layout wraps gracefully when multiple chips cannot fit on one row

---

## Highlight Chip Checklist

- [ ] Clicking a highlight chip calls `setDonnaFocusTarget` with the correct `targetId` and `route`
- [ ] After `setDonnaFocusTarget`, the `donna:highlight` CustomEvent is dispatched
- [ ] `DonnaHighlightBanner` applies teal glow to the target element on the same page
- [ ] Target element scrolls into view
- [ ] "DONNA is pointing here" badge appears in the fixed banner
- [ ] Auto-dismiss after 8 seconds (default `expiresAt`)
- [ ] Manual dismiss (× button) removes glow and badge
- [ ] If target element does not exist on the page: no crash, no error thrown, chip still clickable

---

## Repeated-Highlight Escalation Checklist

- [ ] First click on a highlight chip: `highlightStyle: 'teal-glow'` — standard teal CSS class
- [ ] Second+ click on the same highlight chip: `highlightStyle: 'warning'` — orange/warning CSS class
- [ ] Escalated chip button shows a teal animated pulse dot
- [ ] Escalated chip button uses stronger border + background tint vs. non-escalated
- [ ] Escalation count resets when panel closes (component unmounts) — new session starts fresh
- [ ] Different chips on the same page do not share escalation counts

---

## Prompt Chip Checklist

- [ ] Clicking a prompt chip calls `onPrompt(chip.prompt)` → `handleCommandSubmit(text)` in parent
- [ ] Prompt enters the existing DONNA conversation flow — no new surface opened
- [ ] Prompt chips styled in lime tint (vs. teal for highlight chips) — visually distinct
- [ ] DONNA responds to prompt in the existing conversation thread / COO panel

---

## Voice-Ready Checklist

- [ ] No new TTS path created in Sprint 964
- [ ] Existing `speakWithServerTts` → browser fallback path unchanged
- [ ] No second voice button added to the panel
- [ ] No new DONNA voice widget created
- [ ] Sprint 965 voice persona path documented in architecture doc
- [ ] Voice controls remain in the existing `DonnaVoiceLayer` — not moved or duplicated

---

## Route Safety Checklist

- [ ] Visiting `/director/donna` shows the full-page command center — not a duplicate FAB
- [ ] Onboarding pages do not add a second DONNA button
- [ ] Class template detail page does not add a second DONNA button
- [ ] Curriculum page does not add a second DONNA button
- [ ] Impact preview page does not add a second DONNA button
- [ ] Review queue page does not add a second DONNA button

---

## No-Mutation / No-Send Checklist

- [ ] No player observation created from chip interaction
- [ ] No session note created from chip interaction
- [ ] No parent/player communication sent from chip interaction
- [ ] No player level change triggered from chip interaction
- [ ] No attendance record written from chip interaction
- [ ] No curriculum change from chip interaction
- [ ] No template record modified from chip interaction
- [ ] `setDonnaFocusTarget` writes only route + element ID to sessionStorage — no user data
- [ ] `donna:highlight` CustomEvent carries no payload — no data transmitted
- [ ] Prompt chips route through `handleCommandSubmit` — existing safety guardrails apply
- [ ] `proposed_actions` pipeline not modified
- [ ] `execute_approved_action()` not called
- [ ] `finalize_player_placement()` not called

---

## Protected Systems Checklist

- [ ] Sprint 904 approve/reject behavior untouched
- [ ] DONNA God Mode V1 (Sprints 939–960) systems untouched
- [ ] Sprint 961 onboarding UX changes untouched
- [ ] Sprint 962 curriculum builder UX changes untouched
- [ ] Sprint 963 class template builder UX changes untouched
- [ ] Emergency fix c94bad7 (impact preview client boundary) intact
- [ ] Coach wrap-up loop (Sprints 926–936) untouched
- [ ] `DonnaHighlightBanner` unchanged — Sprint 964 only adds a new caller
- [ ] `data-donna-focus-id` targets on existing pages unchanged
- [ ] `DonnaSessionContextProvider` unchanged
- [ ] `donnaFocusTarget.ts` unchanged
- [ ] All `src/lib/backend/` files unchanged
- [ ] `src/middleware.ts` unchanged
- [ ] No RLS policies changed
- [ ] No migrations added
- [ ] No schema changes
