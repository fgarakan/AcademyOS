# QA — Coach DONNA God Mode Parity V1
**Date:** 2026-05-29
**Sprint:** 948

---

## 1. TypeScript Validation
- [x] `npx tsc --noEmit` passes — clean
- [x] `donnaWhatNextEngine.ts` compiles with new WhatNextLiveContext fields
- [x] `DonnaVoiceReadyShell.tsx` compiles with coach page guide branch

---

## 2. Coach What-Next Engine
- [x] missingWrapUps > 0 → returns targetId: 'coach-wrap-up-link', source: 'page_element_urgent'
- [x] todaySessions > 0 on /coach → returns targetId: 'coach-today-sessions'
- [x] No live ctx → falls through to page element registry fallback
- [x] Coach elements registered in page element registry

---

## 3. Shell A Coach Branch
- [x] "What should I do next?" triggers COACH_PAGE_NEXT_STEP
- [x] "Where am I?" triggers COACH_WHERE_AM_I → whereAmI(path)
- [x] "What can I do here?" triggers COACH_WHAT_CAN_I_DO → whatCanYouHelpWith(path)
- [x] buildWhatNextAnswer called with coachCtx fields when available
- [x] Highlight fires when targetId present
- [x] Nav offer set when href differs from current path

---

## 4. Protected Systems
- [x] DonnaVoiceWrapUpShell untouched
- [x] Sprint 904 paths untouched
- [x] Coach wrap-up loop (Sprints 926–936) untouched
- [x] No migrations
