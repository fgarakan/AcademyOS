# DONNA Panel Browser QA — Sprint 717

**Date:** 2026-05-17
**Method:** Static code analysis. Items marked `[BROWSER NEEDED]` require manual verification.
**TypeScript:** CLEAN

---

## Panel Mount Points

| Context | Layout | Role Prop | academyId | Notes |
|---|---|---|---|---|
| Director | `src/app/director/layout.tsx` | `role="director"` (default) | From profile | `{academyId && <DonnaAssistantButton … />}` — only mounts when academyId is resolved |
| Coach | `src/app/coach/layout.tsx` | `role="coach"` | From coachAcademyId | `{coachAcademyId && <DonnaAssistantButton … />}` — same guard |

Both layouts correctly gate DONNA on `academyId` — no DONNA panel if academy is unresolved. Role prop is explicitly set to `"coach"` for coach context.

---

## Panel Open / Close

| Check | Result | Notes |
|---|---|---|
| DONNA role prop | ✅ PASS | `role?: DonnaRole` defaults to `'director'` in component |
| Director role prop passed | ✅ PASS | Director layout passes no explicit role (defaults to director) |
| Coach role prop passed | ✅ PASS | Coach layout explicitly passes `role="coach"` |
| Panel open state | ✅ PASS | React state (`useState`) — no router needed |
| Panel close | ✅ PASS | State reset on close |
| Panel persists across navigation | ✅ PASS | Mounted in layout — survives route changes within same layout |
| Runtime open/close | `[BROWSER NEEDED]` | |

---

## Panel Persistence

| Check | Result | Notes |
|---|---|---|
| Draft persistence | ✅ PASS | `sessionStorage` — `academyos:donna:introCompleted:v1` |
| Draft restored on reopen | ✅ PASS | Sprint 359 — draft restored from sessionStorage |
| Preference memory | ✅ PASS | Sprint 377 — `localStorage`-backed preferences |
| Daily greeting state | ✅ PASS | Sprint 647 — once-per-day greeting via `localStorage` |
| Panel state across route changes | ✅ PASS | Layout-mounted, state survives same-layout navigation |
| State cleared on close | ✅ PASS | Draft cleared on explicit close |

---

## Greeting

| Check | Result | Notes |
|---|---|---|
| Greeting text | ✅ PASS | Derived from `firstName` (from `directorName` or `directorDisplayName`) |
| Greeting voice | ✅ PASS | Fires once on first panel open in session — `voiceGreetingStatus` guard |
| Daily greeting gate | ✅ PASS | Once per day via localStorage — does not repeat every open |
| Voice watchdog | ✅ PASS | Timeout clears stuck-state voice greeting |
| Greeting in unsupported browser | ✅ PASS | Voice fallback — text still renders |

---

## Role-Aware Context

| Check | Result | Notes |
|---|---|---|
| Director role = director priorities | ✅ PASS | `role="director"` routes to academy priorities, review queue, player risks, parent updates |
| Coach role = coach priorities | ✅ PASS | `role="coach"` routes to session context, coach-safe priorities, wrap-up |
| No director approval powers in coach context | ✅ PASS | Role guard confirmed in `voiceRoleGuardrails.ts` and `roleGuardrails.ts` |
| Context panel awareness | ✅ PASS | `donnaPageContextRegistry.ts` provides route-specific context to panel |

---

## Voice Input

| Check | Result | Notes |
|---|---|---|
| Voice button | ✅ PASS | `VoiceInputButton`, `DONNAVoiceInputButton` |
| Mic unsupported browser | ✅ PASS | Sprint 701 — "Voice is unavailable in this browser. You can type instead." |
| Mic blocked | ✅ PASS | Sprint 701 — "Microphone access is blocked. You can enable it in your browser settings or type instead." |
| Generic voice error | ✅ PASS | Sprint 701 — "Voice is unavailable right now. You can type instead." |
| Error panel style | ✅ PASS | Sprint 701 — calm `surface-raised` style, not alarming red |
| Voice transcript review | ✅ PASS | `VoiceTranscriptReview` — editable before submitting |
| "Edited" chip on transcript | ✅ PASS | Sprint 702 — shows chip when text modified |
| Voice → typed fallback | ✅ PASS | Multiple paths show "type instead" fallback |
| type="button" on all voice buttons | ✅ PASS | Sprints 701–705 — mic, speech, skip, type-instead all fixed |
| Runtime voice input | `[BROWSER NEEDED]` | |

---

## Typed Input

| Check | Result | Notes |
|---|---|---|
| Input bar | ✅ PASS | `DonnaInputBar` component |
| Sends to DONNA intent classifier | ✅ PASS | `donnaIntentClassifier.ts` — deterministic, no external AI |
| Typed input accessible | ✅ PASS | No voice dependency required for typed input |
| Runtime typed input | `[BROWSER NEEDED]` | |

---

## DONNA Answer and Response Flow

| Check | Result | Notes |
|---|---|---|
| Intent classification | ✅ PASS | `donnaIntentClassifier.ts` — deterministic |
| Command routing | ✅ PASS | `donnaCommandRouter.ts` — maps intent to category and destination |
| `type="honest"` response | ✅ PASS | Orange color, "Not available yet" — confirmed in `DonnaWorkflowCards.tsx` |
| Answer card | ✅ PASS | `DONNAAnswerCard` — shows answer, follow-up "Go →" button with type="button" |
| Answer history | ✅ PASS | `DONNAAnswerHistoryPanel` |
| Clarification | ✅ PASS | `DONNACommandClarification` — option buttons + Cancel, all type="button" (Sprint 703) |
| Rejection banner | ✅ PASS | `DONNACommandRejectionBanner` — Retry + Dismiss, all type="button" (Sprint 703) |
| Confirmation | ✅ PASS | `DONNACommandConfirmation` — Confirm + Edit + Cancel, all type="button" (Sprint 703) |
| Command preview | ✅ PASS | `DONNACommandPreviewCard` — Clarify + Proceed + Cancel, all type="button" (Sprint 704) |

---

## No DANA References

| Check | Result |
|---|---|
| `donnaAssistantCopy.ts` | ✅ DONNA |
| `DonnaAssistantButton.tsx` | ✅ DONNA |
| `DonnaPanelShell.tsx` | ✅ DONNA |
| `DonnaVoiceLayer.tsx` | ✅ DONNA (Sprint 701 — hardcoded "Ask DONNA" fixed to use constant) |
| `DONNACOOIntelligencePanel.tsx` | ✅ DONNA |
| Global DANA search | ✅ Zero references across entire codebase |

---

## Items Requiring Browser Verification

1. DONNA button visible in bottom-right corner on all director routes
2. DONNA button visible in coach layout
3. Panel opens on click
4. Panel persists after navigating between director routes
5. Role-appropriate greeting shown (director name vs coach name)
6. Greeting not repeated on same-day reopens (localStorage gate)
7. Voice button shows correctly, triggers microphone request
8. Voice unsupported/blocked states show correct copy
9. Typed input submits and returns intent-classified response
10. `type="honest"` response shown in orange when data unavailable

---

## Issues Found

| Severity | Component | Issue | Action |
|---|---|---|---|
| INFO | `DonnaPanelShell.tsx` | Comment notes: "Future path: Migrate panel state to a dedicated context (DonnaPanelContext)." State management is spread across `DonnaAssistantButton`. | Not a V1 blocker. Refactor is a future sprint if state complexity grows. |
| LOW | Voice watchdog | Voice greeting has a timeout watchdog for stuck-state detection. If the watchdog fires incorrectly, greeting may repeat. | `[BROWSER NEEDED]` — test by opening panel multiple times same session. |

---

## Summary

| Check Type | Count | Result |
|---|---|---|
| Static code checks passed | 32 | ✅ |
| Requiring browser verification | 10 | `[BROWSER NEEDED]` |
| DANA references | 0 | ✅ |
| Issues found | 2 (both LOW/INFO) | No blockers |

---

*Generated by Sprint 717 — DONNA Panel Browser QA V1.*
