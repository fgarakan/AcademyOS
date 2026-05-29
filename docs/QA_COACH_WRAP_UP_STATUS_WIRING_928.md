# Coach Wrap-Up Status Wiring QA
**Sprint:** 928 | **Date:** 2026-05-29
**Method:** Static code analysis

---

## 1. loadWrapUpStatusMap (lib)

| Check | Result |
|---|---|
| Queries only proposed_actions (read-only) | ✅ |
| Scoped to academy_id | ✅ |
| Scoped to target_module = 'session_wrap_up_v1' | ✅ |
| Uses rawDb as any (TS2589 prevention, established pattern) | ✅ |
| Returns {} for empty sessionIds | ✅ |
| Takes most recent draft per session (order DESC + skip if seen) | ✅ |
| Maps raw DB status to WrapUpDisplayStatus union | ✅ |
| No writes to proposed_actions or any table | ✅ |
| No approval logic modified | ✅ |

---

## 2. coach/page.tsx wiring

| Check | Result |
|---|---|
| loadWrapUpStatusMap called with today's session IDs only | ✅ |
| Wrapped in try/catch — home renders if query fails | ✅ |
| wrapUpStatusMap defaults to {} on failure | ✅ |
| wrapUpStatus passed to CoachDailyBriefCard (next session only) | ✅ |
| sessionStatus passed to CoachDailyBriefCard | ✅ |
| deriveWrapUpBadge called per session in list | ✅ |
| No raw IDs passed to components | ✅ |
| No raw DB status names in UI labels | ✅ |

---

## 3. CoachDailyBriefCard wrap-up strip

| Check | Result |
|---|---|
| Strip hidden for planned/in_progress with no draft | ✅ |
| Strip shown for completed session with no draft ("Wrap-up needed") | ✅ |
| Strip shown when draft exists regardless of session status | ✅ |
| "Wrap-up needed" links to /wrap-up | ✅ |
| "Pending review" links to session detail | ✅ |
| "Approved" / "Applied" — no link, status only | ✅ |
| "Needs revision" links to /wrap-up | ✅ |
| "Director has questions" links to session detail | ✅ |
| No nested Link elements | ✅ (strip is outside the CTA Link row) |
| Sprint 926 core card behavior unchanged | ✅ (header, focus, watch-fors, CTAs all intact) |

---

## 4. Session list badges

| Check | Result |
|---|---|
| Badge shown for completed + not_started ("Wrap-up needed", orange) | ✅ |
| Badge shown for pending_review ("Pending review", blue) | ✅ |
| Badge shown for approved ("Approved", green) | ✅ |
| Badge shown for executed ("Applied", green) | ✅ |
| Badge shown for rejected ("Needs revision", red) | ✅ |
| Badge shown for clarification_needed ("Director has questions", orange) | ✅ |
| No badge for planned/in_progress + not_started | ✅ |
| No raw IDs in badge text | ✅ |
| Existing session status badge unchanged | ✅ |

---

## 5. Safety / protected systems

| Check | Result |
|---|---|
| No parent/player communication sent | ✅ |
| No player level movement | ✅ |
| No curriculum mutation | ✅ |
| No roster/placement change | ✅ |
| Sprint 904 approve/reject paths unchanged | ✅ |
| CoachWrapUpDrawer unchanged | ✅ |
| proposed_actions pipeline unchanged (read only) | ✅ |
| RLS scoping verified in loadWrapUpStatusMap | ✅ |
| No migrations created | ✅ |

---

## 6. TypeScript

```
npx tsc --noEmit → clean (0 errors)
```

---

## 7. Existing behavior preserved

| Check | Result |
|---|---|
| Sprint 926 CoachDailyBriefCard core still renders | ✅ (props are additive, optional) |
| Sprint 927 /wrap-up page still compiles | ✅ (not touched) |
| pendingWrapUpCount alert still works | ✅ (loadWrapUpSessionSelector untouched) |
| DONNA Coach assistant panel unchanged | ✅ |
| Coach home session list still navigates to session detail | ✅ |
