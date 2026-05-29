# QA — DONNA Director Intelligence Brief V1
**Date:** 2026-05-29
**Sprint:** 945

---

## 1. TypeScript Validation
- [x] `npx tsc --noEmit` passes — clean
- [x] `donnaDirectorBrief.ts` compiles
- [x] `DonnaVoiceReadyShell.tsx` compiles with brief import + intercept

---

## 2. Brief Generator
- [x] pendingReviews > 0 → priority rank 1 with targetId: 'pending-review-list'
- [x] attendanceExceptions > 0 → included with targetId: 'attendance-exceptions-section'
- [x] No signals → returns informational "on track" priority
- [x] Max 3 priorities returned
- [x] overallHealthSignal: critical when total >= 10, attention_needed >= 3, on_track otherwise
- [x] Safety notes included on approval-required priorities
- [x] formatBriefAsMessage produces readable multi-line text

---

## 3. Shell A Wiring
- [x] "Give me a brief" matched by BRIEF_PATTERN
- [x] "What's going on?" matched
- [x] "Morning brief" matched
- [x] "What's urgent?" matched
- [x] Brief fires before page guide intercept (higher priority)
- [x] directorCtx fields passed when available; empty input when null
- [x] Top priority targetId triggers setDonnaFocusTarget + donna:highlight
- [x] Top priority href sets pendingNavOffer for navigation confirmation

---

## 4. Safety Invariants
- [x] Brief never sends communications
- [x] Brief never moves levels or placements
- [x] All priorities require director click to act
- [x] safetyNote present on all approval_required items
- [x] No parent/player data in brief text
- [x] Coach wrap-up loop untouched
- [x] Sprint 904 paths untouched
- [x] No migrations
