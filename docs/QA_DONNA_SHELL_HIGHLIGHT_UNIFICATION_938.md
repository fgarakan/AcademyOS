# QA — DONNA Shell Highlight Unification V1
**Date:** 2026-05-29
**Sprint:** 938

---

## 1. TypeScript Validation

- [x] `npx tsc --noEmit` passes — clean
- [x] `DonnaVoiceReadyShell.tsx` compiles
- [x] `coach/layout.tsx` compiles
- [x] `DonnaHighlightBanner.tsx` compiles (unchanged)
- [x] `DonnaAssistantButton.tsx` compiles (unchanged)

---

## 2. Shell A Highlight Dispatch

- [x] `setDonnaFocusTarget` called before same-page/cross-page branch
- [x] Same-page: `window.dispatchEvent(new CustomEvent('donna:highlight'))` fires when `pendingOffer.href === pathname`
- [x] Cross-page: `setTimeout(() => router.push(pendingOffer.href), 500)` fires when `pendingOffer.href !== pathname`
- [x] `buildFocusTargetForRoute` called with both route and `questionContext` (unchanged)
- [x] Null focus target is handled — only dispatches/navigates, doesn't require a target
- [x] Shell B behavior is identical in pattern (verified against lines 2857–2884 of DonnaAssistantButton.tsx)
- [x] No new imports added to DonnaVoiceReadyShell — `setDonnaFocusTarget`, `buildFocusTargetForRoute`, `pathname` already imported

---

## 3. Coach Layout Mount

- [x] `DonnaHighlightBanner` imported in `coach/layout.tsx`
- [x] Mounted unconditionally (not inside coachAcademyId guard — banner is always safe to mount)
- [x] `DonnaSessionContextProvider` not added — confirmed not needed by `DonnaHighlightBanner`
- [x] No visual impact when no focus target is active (`DonnaHighlightBanner` returns null when `!active`)
- [x] Mobile-safe: banner is `fixed top-16 left-1/2 -translate-x-1/2` — does not affect layout flow
- [x] Bottom tab bar unaffected
- [x] `FirstRunDeckGate` unaffected
- [x] `PreviewBanner` unaffected

---

## 4. Existing Coach Focus Targets Verified

Coach pages have these `data-donna-focus-id` attributes (no new ones added):

| Target ID | File | Section |
|---|---|---|
| `coach-today-sessions` | `/coach/page.tsx` | Today's sessions section |
| `coach-players-section` | `/coach/page.tsx` | Players section |
| `wrapup-question-card` | `WrapUpPageClient.tsx` | Active wrap-up question |
| `wrapup-nav-actions` | `WrapUpPageClient.tsx` | Submit/back/skip buttons |
| `coach-player-watch-list` | `/coach/sessions/[id]/page.tsx` | Player watch list |
| `coach-lesson-plan` | `/coach/sessions/[id]/page.tsx` | Lesson plan section |
| `coach-run-session` | `/coach/sessions/[id]/page.tsx` | Run session section |
| `coach-wrap-up-link` | `/coach/sessions/[id]/page.tsx` | After session CTA |
| `coach-player-list` | `CoachPlayersClient.tsx` | Players list |

---

## 5. Protected Systems Checklist

- [x] Sprint 904 approve/reject paths untouched
- [x] `proposed_actions` state machine untouched
- [x] `execute_approved_action()` untouched
- [x] `DonnaVoiceReadyShell` voice/session/memory logic untouched
- [x] `DonnaAssistantButton` Shell B untouched
- [x] `DonnaHighlightBanner` component untouched
- [x] `donnaChatSessionMemory` untouched
- [x] Context cache untouched
- [x] Event ledger untouched
- [x] Intent router untouched
- [x] Action registry untouched
- [x] Approval gate untouched
- [x] Recommendation feedback untouched
- [x] Semantic memory safety untouched
- [x] Coach wrap-up loop Sprints 926–936 untouched
- [x] Parent/player communication safety untouched
- [x] Player level movement safety untouched
- [x] Roster/placement/billing/curriculum mutation safety untouched
- [x] RLS/multi-tenant boundaries untouched
- [x] No migration created

---

## 6. Safety Invariants

- [x] No app data mutations in any changed code
- [x] No parent/player communications triggered
- [x] No level/placement/roster/billing/curriculum mutations
- [x] Highlight is read-only UI guidance only — no state writes
- [x] `setDonnaFocusTarget` writes only to sessionStorage (not DB)
- [x] No private data in focus target (only route + element ID + display label)

---

## 7. Regression Check

**Shell A navigation confirmation (before/after comparison):**

Before Sprint 938:
```
setDonnaFocusTarget → setTimeout(router.push, 500)
```

After Sprint 938:
```
setDonnaFocusTarget →
  if same page: dispatchEvent('donna:highlight')
  if cross page: setTimeout(router.push, 500)
```

The cross-page path is identical. The same-page path adds the event dispatch (was previously missing, now fires correctly).

**Shell B highlight path:** Lines 2857–2884 of `DonnaAssistantButton.tsx` are unchanged. Shell B is still the authoritative implementation and Shell A now mirrors the same pattern.

---

## 8. Git Diff Validation

Changed files:
- `src/components/donna/DonnaVoiceReadyShell.tsx` — 7 lines changed (navigation handler, same-page branch)
- `src/app/coach/layout.tsx` — 2 imports + 4 lines added (banner mount with comment)

Documentation only:
- `docs/architecture/DONNA_SHELL_HIGHLIGHT_UNIFICATION_938.md` (new)
- `docs/QA_DONNA_SHELL_HIGHLIGHT_UNIFICATION_938.md` (new)
- `docs/CHANGELOG.md` (updated)

---

## 9. Known Limits (Post-Sprint 938)

1. Shell A highlight fires only through the `pendingNavOffer` confirmation path — direct highlight without navigation not yet wired
2. "What should I do next?" answers remain text-only — highlight on "what next?" is Sprint 940–941
3. Shell A lacks `lastKnownContextParamsRef` — section navigation in Shell A resolves from current URL only, not cross-page context params
4. Player/parent layouts intentionally have no highlight banner

---

## 10. Manual Test Script (for Brian / Coach Farshad)

### Director (Shell A test)
1. Navigate to `/director/donna`
2. Ask DONNA: "Take me to the review queue"
3. DONNA responds with nav offer: "Would you like me to take you to the Review Center?"
4. Say "yes"
5. **Expected:** Navigates to `/director/review` AND teal "DONNA is pointing here — Review Center" banner appears + highlight ring on `pending-review-list`

### Coach (highlight banner test)
1. Log in as coach, navigate to any coach page (e.g., `/coach`)
2. From Shell B (floating DONNA button), ask "Take me to today's sessions"
3. DONNA navigates and triggers highlight
4. **Expected:** Teal highlight banner appears on coach page pointing to `coach-today-sessions`

### Coach (same-page highlight test)
1. Navigate to `/coach/donna`
2. Ask DONNA: "Show me today's sessions"
3. DONNA offers navigation: "Would you like me to take you to Today's Sessions?"
4. Say "yes"
5. **Expected:** Navigates to `/coach` AND highlight fires on `coach-today-sessions`
