# DONNA Onboarding — Save Status + Draft Persistence V1

**Date:** 2026-05-19
**Sprint:** O-11

---

## Summary

Created `OnboardingSaveStatus`, `DraftResumeBanner`, and `useOnboardingDraftPersistence` hook. localStorage-based draft save/resume. Nothing changes about the no-DB-writes contract — all persistence is browser-local.

---

## Components

### `useOnboardingDraftPersistence(draft, setDraft)`

Custom hook. Wired in `OnboardingShell`. Responsibilities:
- Save draft to `localStorage` key `academyos_onboarding_draft_v1` on every draft change (useEffect)
- `restoreDraft()` — reads stored JSON and calls `setDraft`
- `clearDraft()` — removes key from localStorage
- `hasSavedDraft()` — returns true if key exists
- `lastSaved` — Date of most recent save (set on every draft change)
- All localStorage calls wrapped in try/catch — fail silently in restricted environments

### `OnboardingSaveStatus`

Small status line shown in shell footer. Shows "Saved in this browser X ago" with a time-ago counter (updates every 10s). Optional "Clear" button (RotateCcw icon). Renders null until first save.

### `DraftResumeBanner`

Banner shown on Welcome step (step 0) when `hasSavedDraft()` is true. Offers "Resume" (restores draft) or "Start fresh" (clears draft). Dismissed after choice via `showResumeBanner` state in shell.

## Storage Key

`academyos_onboarding_draft_v1` — versioned key so future schema changes can migrate gracefully.

## Safety Rules

- localStorage only — no server writes
- clearDraft() also resets draft to defaultDraft in the shell
- "Saved in this browser" label — never implies server sync
