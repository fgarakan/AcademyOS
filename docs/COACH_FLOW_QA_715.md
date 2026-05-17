# Coach Flow Browser QA — Sprint 715

**Date:** 2026-05-17
**Method:** Static code analysis. Items marked `[BROWSER NEEDED]` require manual verification in a running browser.
**TypeScript:** CLEAN

---

## /coach — Coach Home

| Check | Result | Notes |
|---|---|---|
| page.tsx exists | ✅ PASS | |
| Auth graceful degradation | ✅ PASS | `try/catch` around `getCoachWorkspaceSummary`. Falls back to empty state shell. |
| Empty state shell | ✅ PASS | Defaults: `assignedGroups: []`, `assignedPlayers: []`, `recentObservations: []`, `todaySessions: []` |
| Pending wrap-up count | ✅ PASS | `pendingWrapUpCount` from `loadWrapUpSessionSelector` |
| Coach first name | ✅ PASS | `profile?.display_name?.split(' ')[0] ?? null` — null-safe |
| EmptyState components | ✅ PASS | Imported from `@/components/ui` |
| DANA references | ✅ PASS | None found |
| Error boundary | ✅ PASS | Root `/app/coach/error.tsx` |
| Runtime render | `[BROWSER NEEDED]` | |

---

## /coach/sessions — Session List

| Check | Result | Notes |
|---|---|---|
| page.tsx exists | ✅ PASS | |
| Status style map | ✅ PASS | `STATUS_STYLES` for `in_progress`, `completed`, `cancelled`, `planned` |
| WrapUp selector integration | ✅ PASS | `loadWrapUpSessionSelector` — tracks needsWrapUp vs alreadySubmitted |
| DONNA open chip | ✅ PASS | `DonnaOpenChip` with `prompt="Help me wrap up: {sessionName}"` |
| Empty sessions states | ✅ PASS | Three empty lists default to `[]` |
| Auth guard | ✅ PASS | Guards coachId/academyId before queries |
| Runtime render | `[BROWSER NEEDED]` | |

---

## /coach/sessions/[sessionId] — Session Detail + Wrap-Up

| Check | Result | Notes |
|---|---|---|
| page.tsx exists | ✅ PASS | |
| Wrap-up status check | ✅ PASS | Reads `target_module: 'session_wrap_up_v1'` from `proposed_actions` |
| WrapUp detail panel | ✅ PASS | `CoachWrapUpDetailPanel` rendered when no existing wrap-up |
| WrapUp status card | ✅ PASS | `CoachWrapUpStatusCard` shows pending/approved status |
| Existing draft detection | ✅ PASS | `existingWrapUpStatus` from DB prevents double submission |
| Review-first enforcement | ✅ PASS | Wrap-up creates `pending_review` proposed_action — never applies directly |
| Runtime render | `[BROWSER NEEDED]` | |

---

## Wrap-Up Flow (`WrapUpGuidedFlow`, `DonnaVoiceWrapUpShell`, `WrapUpReviewSummary`)

| Check | Result | Notes |
|---|---|---|
| Guided flow steps | ✅ PASS | Multi-step: attendance → observations → session actual → review |
| Voice wrap-up shell | ✅ PASS | `DonnaVoiceWrapUpShell` with mic/text toggle |
| Transcript review | ✅ PASS | `VoiceTranscriptReview` — editable before submit |
| "Edited" chip on transcript | ✅ PASS | Sprint 702 — shows when transcript differs from captured text |
| type="button" on all wrap-up buttons | ✅ PASS | Sprint 707 — WrapUpGuidedFlow, WrapUpReviewSummary all fixed |
| Review-first pipeline | ✅ PASS | Creates `proposed_actions` entry with `pending_review` |
| No direct DB mutation from wrap-up UI | ✅ PASS | No update/insert outside proposed_actions path |
| Runtime flow | `[BROWSER NEEDED]` | |

---

## DONNA — Coach Context

| Check | Result | Notes |
|---|---|---|
| DonnaOpenChip in sessions list | ✅ PASS | Prefills wrap-up prompt |
| Coach-safe DONNA copy | ✅ PASS | Coach DONNA does not surface director-only approval powers |
| CoachSessionVoiceShell type="button" | ✅ PASS | Sprint 710 — close button fixed |
| Voice fallback for unsupported browser | ✅ PASS | Sprint 701 — text input fallback shown |
| DANA references | ✅ PASS | None in coach or capture components |
| DONNA panel opens in coach context | `[BROWSER NEEDED]` | |
| DONNA coach context correct (not director) | `[BROWSER NEEDED]` | |

---

## /coach/voice — Coming Soon

| Check | Result | Notes |
|---|---|---|
| page.tsx exists | ✅ PASS | |
| Shows coming soon tiles | ✅ PASS | `COMING_SOON_TILES` with Mic, FileText, Eye, Shield |
| No broken imports | ✅ PASS | Uses `Card`, `CardContent`, `SectionHeader` only |
| Runtime render | `[BROWSER NEEDED]` | Low priority — coming soon page |

---

## Error Boundary Coverage — Coach Routes

| Route | Coverage | Notes |
|---|---|---|
| `/coach` | Root `/app/coach/error.tsx` | Sufficient for V1 |
| `/coach/sessions` | Root `/app/coach/error.tsx` | Sufficient for V1 |
| `/coach/sessions/[sessionId]` | Root `/app/coach/error.tsx` | Sufficient for V1 |
| `/coach/players` | Root `/app/coach/error.tsx` | Sufficient for V1 |
| `/coach/voice` | Root `/app/coach/error.tsx` | Sufficient for V1 |

---

## Items Requiring Browser Verification

1. `/coach` — coach name loads, today's sessions render, recent observations show, pending wrap-up count appears
2. `/coach/sessions` — session list loads, status chips render, DONNA wrap-up chip visible
3. `/coach/sessions/[sessionId]` — session detail renders, wrap-up form visible when not submitted
4. Wrap-up guided flow — can complete all steps, submits to review queue
5. DONNA panel opens in coach context, shows coach-appropriate priorities only
6. Voice input works or degrades gracefully with "type instead" fallback
7. No hydration errors in console
8. No DANA references in rendered text

---

## Issues Found

| Severity | Component | Issue | Action |
|---|---|---|---|
| LOW | `/coach` routes | No per-route `loading.tsx`. Root coach error boundary only. | Acceptable V1. Add loading states if page slowness is observed in pilot. |
| INFO | `/coach/voice` | Coming soon page exists. Low cognitive load for coaches — no confusion about what it does. | Confirm "coming soon" tiles are clear and not alarming in browser. |

---

## Summary

| Check Type | Count | Result |
|---|---|---|
| Static code checks passed | 22 | ✅ |
| Requiring browser verification | 8 | `[BROWSER NEEDED]` |
| Issues found | 2 (both LOW/INFO) | No blockers |

**DANA check: CLEAN in coach and capture components.**
**Review-first pipeline: CONFIRMED. No coach wrap-up action bypasses proposed_actions.**

---

*Generated by Sprint 715 — Coach Flow Browser QA V1.*
