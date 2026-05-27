# Sprint 880 — DONNA Follow-Up Section Nav Coverage Audit V1

**Date:** 2026-05-27
**Sprint:** 880
**Type:** Audit / Certification — follow-up resolver section_nav coverage across all 14 Category 1A actions
**Migration:** None
**TypeScript:** Clean (`npx tsc --noEmit` — exit 0, no errors)
**Status:** ✅ CERTIFIED (with 2 bugs found and fixed)
**Part of:** Mega Sprint 858–920 — DONNA 10/10 Conversational Intelligence + Memory Maturity Block V1
**Certifies:** Sprints 877 (anaphoric), 878 (elaboration), 879 (recommendation) — section_nav follow-up chain

---

## Sprint Goal

Certify the complete section_nav follow-up chain built across Sprints 877–879:
- Anaphoric / sequential: "show me", "take me there", "go there"
- Elaboration: "what is that?", "explain that", "tell me more"
- Recommendation: "what should I do next?", "what do you recommend?", "what now?"

Audit all 14 Category 1A SECTION_NAV_ENTRIES, verify focusTarget label flow, compare labels
against `SECTION_NAV_ELABORATION_MAP` and `SECTION_NAV_RECOMMENDATION_MAP`, classify coverage,
and fix any bugs found.

---

## Critical Bug Found and Fixed — Bug #1: Verbose displayName as focusTarget.label

### Root cause

In `resolveSectionNavigation` (Sprint 870), `focusTarget.label` was set to:
```typescript
const registryAction = getUIActionById(entry.actionId)
const focusTarget: DonnaFocusTarget = {
  label: registryAction?.displayName ?? entry.label,   // ← BUG
  ...
}
```

`registryAction.displayName` contains verbose registry descriptions, not short user-facing labels:

| Action ID | displayName (stored — wrong) | entry.label (correct) |
|---|---|---|
| navigate_to_session_blocks | `"Navigate to the session blocks section"` | `"Session Blocks"` |
| navigate_to_session_attendance | `"Navigate to the session roster and attendance section"` | `"Session Attendance"` |
| navigate_to_template_blocks | `"Navigate to the template block builder section"` | `"Template Blocks"` |
| navigate_to_wrapup_question | `"Navigate to the active wrap-up question"` | `"Wrap-Up Question"` |
| navigate_to_wrapup_actions | `"Navigate to the wrap-up submit actions"` | `"Wrap-Up Actions"` |
| navigate_to_coach_run_session | `"Navigate to the run-session section"` | `"Run Session"` |

### Impact (before fix)

Since `lastSuggestedNavigationLabel` is set from `result.focusTarget?.label`:

**Anaphoric ("show me" after "session blocks"):**
> ~~*"I'll take you back to Navigate to the session blocks section — that's where we were."*~~

**Elaboration ("explain that" after "session blocks"):**
> All 6 map lookups silently failed — `SECTION_NAV_ELABORATION_MAP["Navigate to the session blocks section"]` = `undefined`. Every elaboration fell through to baseline copy.

**Recommendation ("what now?" after "session blocks"):**
> All 6 map lookups silently failed — `SECTION_NAV_RECOMMENDATION_MAP["Navigate to the session blocks section"]` = `undefined`. Every recommendation fell through to baseline copy.

### Fix (Sprint 880)

`src/lib/donna/donnaUIActionDispatcher.ts` — `resolveSectionNavigation`:

```typescript
// Before (Sprint 870 — Bug):
const registryAction = getUIActionById(entry.actionId)
const focusTarget: DonnaFocusTarget = {
  label: registryAction?.displayName ?? entry.label,

// After (Sprint 880 — Fix):
// (registryAction variable removed — no longer needed)
const focusTarget: DonnaFocusTarget = {
  label: entry.label,
```

`getUIActionById` import is NOT removed — still used by `validateUIActionForContext`.

---

## Bug Found and Fixed — Bug #2: 'Coach Run Session' map key mismatch

### Root cause

Sprints 878 and 879 added map entries with key `'Coach Run Session'`. But `entry.label` for
`navigate_to_coach_run_session` is `'Run Session'` — not `'Coach Run Session'`.

Combined with Bug #1 (verbose displayNames), neither key would have matched regardless.
After fixing Bug #1, `'Coach Run Session'` would still fail to match `'Run Session'`.

### Fix (Sprint 880)

`src/lib/donna/donnaFollowUpResolver.ts`:

```typescript
// SECTION_NAV_ELABORATION_MAP — before:
'Coach Run Session': "It's the coach-facing area for executing..."

// After:
'Run Session': "It's the coach-facing area for executing..."   // Sprint 880: key corrected

// SECTION_NAV_RECOMMENDATION_MAP — before:
'Coach Run Session': 'In Run Session, use the blocks...'

// After:
'Run Session': 'In Run Session, use the blocks...'            // Sprint 880: key corrected
```

---

## Coverage Audit — All 14 Category 1A Actions

### focusTarget.label after Sprint 880 fix (entry.label used)

| # | Action ID | entry.label | registryAction.displayName (was wrong, now unused for label) |
|---|---|---|---|
| 1 | navigate_to_sessions_list | `Sessions List` | Navigate to the sessions list |
| 2 | navigate_to_session_blocks | `Session Blocks` | Navigate to the session blocks section |
| 3 | navigate_to_session_attendance | `Session Attendance` | Navigate to the session roster and attendance section |
| 4 | navigate_to_session_roster_intelligence | `Roster Intelligence` | Navigate to the class roster intelligence section |
| 5 | navigate_to_template_stepper | `Template Builder` | Navigate to the template builder |
| 6 | navigate_to_template_blocks | `Template Blocks` | Navigate to the template block builder section |
| 7 | navigate_to_template_generate_session | `Generate Session from Template` | Navigate to the generate session section of a template |
| 8 | navigate_to_coach_home_today | `Today's Sessions` | Navigate to the coach hub today's sessions |
| 9 | navigate_to_coach_players | `My Players` | Navigate to the coach players list |
| 10 | navigate_to_coach_lesson_plan | `Today's Plan` | Navigate to the session's lesson plan |
| 11 | navigate_to_coach_run_session | `Run Session` | Navigate to the run-session section |
| 12 | navigate_to_coach_wrap_up_link | `Session Wrap-Up` | Navigate to the session wrap-up CTA section |
| 13 | navigate_to_wrapup_question | `Wrap-Up Question` | Navigate to the active wrap-up question |
| 14 | navigate_to_wrapup_actions | `Wrap-Up Actions` | Navigate to the wrap-up submit actions |

---

### Anaphoric / Sequential follow-up coverage ("show me", "take me there", "go there")

Handler (Sprint 877): uses `lastSuggestedNavigationLabel` directly in copy — no map lookup.

| # | entry.label | After Bug #1 fix | Branch fires | Response copy | navigationHref |
|---|---|---|---|---|---|
| 1 | Sessions List | ✅ | `section_nav` anaphoric | "I'll take you back to Sessions List — that's where we were." | `/director/sessions` |
| 2 | Session Blocks | ✅ | `section_nav` anaphoric | "I'll take you back to Session Blocks — that's where we were." | `/director/sessions/{id}` |
| 3 | Session Attendance | ✅ | `section_nav` anaphoric | "I'll take you back to Session Attendance — that's where we were." | `/director/sessions/{id}` |
| 4 | Roster Intelligence | ✅ | `section_nav` anaphoric | "I'll take you back to Roster Intelligence — that's where we were." | `/director/sessions/{id}` |
| 5 | Template Builder | ✅ | `section_nav` anaphoric | "I'll take you back to Template Builder — that's where we were." | `/director/class-templates/{id}` |
| 6 | Template Blocks | ✅ | `section_nav` anaphoric | "I'll take you back to Template Blocks — that's where we were." | `/director/class-templates/{id}` |
| 7 | Generate Session from Template | ✅ | `section_nav` anaphoric | "I'll take you back to Generate Session from Template — that's where we were." | `/director/class-templates/{id}` |
| 8 | Today's Sessions | ✅ | `section_nav` anaphoric | "I'll take you back to Today's Sessions — that's where we were." | `/coach` |
| 9 | My Players | ✅ | `section_nav` anaphoric | "I'll take you back to My Players — that's where we were." | `/coach/players` |
| 10 | Today's Plan | ✅ | `section_nav` anaphoric | "I'll take you back to Today's Plan — that's where we were." | `/coach/sessions/{id}` |
| 11 | Run Session | ✅ | `section_nav` anaphoric | "I'll take you back to Run Session — that's where we were." | `/coach/sessions/{id}` |
| 12 | Session Wrap-Up | ✅ | `section_nav` anaphoric | "I'll take you back to Session Wrap-Up — that's where we were." | `/coach/sessions/{id}` |
| 13 | Wrap-Up Question | ✅ | `section_nav` anaphoric | "I'll take you back to Wrap-Up Question — that's where we were." | `/coach/sessions/{id}/wrap-up` |
| 14 | Wrap-Up Actions | ✅ | `section_nav` anaphoric | "I'll take you back to Wrap-Up Actions — that's where we were." | `/coach/sessions/{id}/wrap-up` |

**Anaphoric: 14/14 correct ✅ (all used baseline previously — verbose displayName was shown)**

---

### Elaboration follow-up coverage ("what is that?", "explain that", "tell me more")

Handler (Sprint 878): `buildSectionNavElaborationResponse` — map lookup then label-baseline fallback.

| # | entry.label | In SECTION_NAV_ELABORATION_MAP | Coverage class | Response copy |
|---|---|---|---|---|
| 1 | Sessions List | ❌ | Baseline fallback | "That was Sessions List — the section DONNA just helped you navigate to. I can take you back there if you'd like." |
| 2 | Session Blocks | ✅ | Fully mapped | "That was Session Blocks. It's where you review the planned activities or blocks inside that session. I can take you back there or help you use that section." |
| 3 | Session Attendance | ✅ | Fully mapped | "That was Session Attendance. It's where you check who is present, absent, or needs attendance review. I can take you back there or help you use that section." |
| 4 | Roster Intelligence | ❌ | Baseline fallback | "That was Roster Intelligence — the section DONNA just helped you navigate to. I can take you back there if you'd like." |
| 5 | Template Builder | ❌ | Baseline fallback | "That was Template Builder — the section DONNA just helped you navigate to. I can take you back there if you'd like." |
| 6 | Template Blocks | ✅ | Fully mapped | "That was Template Blocks. It's where the template's drills, activities, and block structure live. I can take you back there or help you use that section." |
| 7 | Generate Session from Template | ❌ | Baseline fallback | "That was Generate Session from Template — the section DONNA just helped you navigate to. I can take you back there if you'd like." |
| 8 | Today's Sessions | ❌ | Baseline fallback | "That was Today's Sessions — the section DONNA just helped you navigate to. I can take you back there if you'd like." |
| 9 | My Players | ❌ | Baseline fallback | "That was My Players — the section DONNA just helped you navigate to. I can take you back there if you'd like." |
| 10 | Today's Plan | ❌ | Baseline fallback | "That was Today's Plan — the section DONNA just helped you navigate to. I can take you back there if you'd like." |
| 11 | Run Session | ✅ | Fully mapped (key fixed Sprint 880) | "That was Run Session. It's the coach-facing area for executing the session, including blocks and attendance. I can take you back there or help you use that section." |
| 12 | Session Wrap-Up | ❌ | Baseline fallback | "That was Session Wrap-Up — the section DONNA just helped you navigate to. I can take you back there if you'd like." |
| 13 | Wrap-Up Question | ✅ | Fully mapped | "That was Wrap-Up Question. It's the current coach wrap-up prompt DONNA is asking you to answer. I can take you back there or help you use that section." |
| 14 | Wrap-Up Actions | ✅ | Fully mapped | "That was Wrap-Up Actions. It's where you finish or submit the coach wrap-up. I can take you back there or help you use that section." |

**Elaboration: 6/14 fully mapped, 8/14 baseline fallback (all semantically correct) ✅**

---

### Recommendation follow-up coverage ("what should I do next?", "what do you recommend?", "what now?")

Handler (Sprint 879): `buildSectionNavRecommendationResponse` — map lookup then label-baseline fallback.

| # | entry.label | In SECTION_NAV_RECOMMENDATION_MAP | Coverage class | Response copy |
|---|---|---|---|---|
| 1 | Sessions List | ❌ | Baseline fallback | "You're at Sessions List. The best next step is to review that section, make any needed updates, and continue with the related session or wrap-up flow. I can take you back there." |
| 2 | Session Blocks | ✅ | Fully mapped | "In Session Blocks, review the planned activities, check the order, and make sure the session flow matches the group's needs. I can take you back there." |
| 3 | Session Attendance | ✅ | Fully mapped | "In Session Attendance, confirm who was present, absent, or needs follow-up before moving on. I can take you back there." |
| 4 | Roster Intelligence | ❌ | Baseline fallback | "You're at Roster Intelligence. The best next step is to review that section, make any needed updates…" |
| 5 | Template Builder | ❌ | Baseline fallback | "You're at Template Builder. The best next step is to review that section, make any needed updates…" |
| 6 | Template Blocks | ✅ | Fully mapped | "In Template Blocks, review the block structure, make sure the activities match the template goal, and adjust anything that feels off. I can take you back there." |
| 7 | Generate Session from Template | ❌ | Baseline fallback | "You're at Generate Session from Template. The best next step is to review that section…" |
| 8 | Today's Sessions | ❌ | Baseline fallback | "You're at Today's Sessions. The best next step is to review that section…" |
| 9 | My Players | ❌ | Baseline fallback | "You're at My Players. The best next step is to review that section…" |
| 10 | Today's Plan | ❌ | Baseline fallback | "You're at Today's Plan. The best next step is to review that section…" |
| 11 | Run Session | ✅ | Fully mapped (key fixed Sprint 880) | "In Run Session, use the blocks as the live coaching guide, then update attendance or notes as needed. I can take you back there." |
| 12 | Session Wrap-Up | ❌ | Baseline fallback | "You're at Session Wrap-Up. The best next step is to review that section…" |
| 13 | Wrap-Up Question | ✅ | Fully mapped | "Answer the current wrap-up question clearly and specifically, then move to the next wrap-up action. I can take you back there." |
| 14 | Wrap-Up Actions | ✅ | Fully mapped | "In Wrap-Up Actions, finish the coach wrap-up and submit anything that needs review. I can take you back there." |

**Recommendation: 6/14 fully mapped, 8/14 baseline fallback (all semantically correct) ✅**

---

## Coverage Summary

| Coverage class | Anaphoric | Elaboration | Recommendation |
|---|---|---|---|
| Fully correct | 14/14 ✅ | 6/14 ✅ | 6/14 ✅ |
| Baseline fallback (acceptable) | 0/14 | 8/14 ✅ | 8/14 ✅ |
| Missing / unsafe | 0/14 | 0/14 | 0/14 |

**All 14 actions × 3 follow-up types = 42 scenarios: 0 missing, 0 unsafe. Certified. ✅**

---

## Stale Context Fallback Verification

| Follow-up type | Stale/no context response | Correct |
|---|---|---|
| Anaphoric | "Sure — are you asking about today's brief, something in the review queue, or this page specifically?" | ✅ |
| Elaboration | "What would you like me to explain? You can ask about today's brief, a specific area, or how something works here." | ✅ |
| Recommendation | "The Review Queue is usually a good starting point — those are the items waiting on your approval. Want me to open it?" | ✅ |

---

## Non-section_nav Follow-Up Preservation Check

| Family | Anaphoric | Elaboration | Recommendation |
|---|---|---|---|
| `daily_brief` | `buildBriefAnaphoricResponse` ✅ | Generic `lastTopicLabel` check ✅ | `buildBriefRecommendationResponse` ✅ |
| `review_queue` | Navigate to `/director/review` ✅ | Generic `lastTopicLabel` check ✅ | Navigate to `/director/review` ✅ |
| `attention` | Navigate to `/director/review` ✅ | Generic `lastTopicLabel` check ✅ | Navigate to `/director/review` ✅ |
| `coo_answer` | Generic catch-all ✅ | Generic `lastTopicLabel` check ✅ | Generic Review Queue fallback ✅ |
| `page_actions` | Generic catch-all ✅ | Generic `lastTopicLabel` check ✅ | Generic Review Queue fallback ✅ |
| `roster_attention` | Generic catch-all ✅ | Generic `lastTopicLabel` check ✅ | Generic Review Queue fallback ✅ |

**All non-section_nav families: unchanged ✅**

---

## Files Modified

| File | Change |
|---|---|
| `src/lib/donna/donnaUIActionDispatcher.ts` | In `resolveSectionNavigation`: removed `const registryAction = getUIActionById(entry.actionId)` (unused after fix); changed `focusTarget.label` from `registryAction?.displayName ?? entry.label` → `entry.label`; added explanatory comment; `getUIActionById` import NOT removed (still used by `validateUIActionForContext`) |
| `src/lib/donna/donnaFollowUpResolver.ts` | Renamed map key `'Coach Run Session'` → `'Run Session'` in both `SECTION_NAV_ELABORATION_MAP` and `SECTION_NAV_RECOMMENDATION_MAP`; added Sprint 880 inline comments |

## Files NOT Modified

| File | Reason |
|---|---|
| `src/components/assistant/DonnaAssistantButton.tsx` | No change needed |
| `src/lib/donna/donnaUIActionRegistry.ts` | `displayName` values are correct for their purpose (registry documentation); only the label-for-display usage was wrong |
| `src/lib/donna/donnaConversationalRouter.ts` | No change |
| `src/components/donna/DonnaHighlightBanner.tsx` | No change |
| All SQL / migrations / seed / env files | Not in scope |

---

## Safety Guarantees

| Guarantee | Status |
|---|---|
| No DB writes | ✅ — pure dispatcher/resolver changes |
| No DB reads | ✅ — no queries added |
| No server actions | ✅ — no server-side changes |
| No mutations | ✅ — label change only; no data mutations |
| No new packages | ✅ — none |
| No new registry actions | ✅ — 14 Category 1A actions unchanged |
| No routing architecture changes | ✅ — route values unchanged; only label used for display |
| No role boundary changes | ✅ — `allowedRoles` unchanged |
| SECTION_NAV_ENTRIES patterns unchanged | ✅ — dispatcher patterns unchanged |
| Follow-up branch order unchanged | ✅ — Sprint 877/878/879 handler positions unchanged |
| `getUIActionById` import preserved | ✅ — still used by `validateUIActionForContext` |
| TypeScript clean | ✅ — `npx tsc --noEmit` exit 0 |

---

## Certification Result

| Area | Result |
|---|---|
| focusTarget.label flow | ✅ FIXED — now stores short entry.label; verbose displayName no longer used for display |
| Anaphoric follow-up chain | ✅ CERTIFIED — 14/14 actions produce correct short-label copy |
| Elaboration follow-up chain | ✅ CERTIFIED — 6/14 fully mapped, 8/14 baseline fallback (all correct) |
| Recommendation follow-up chain | ✅ CERTIFIED — 6/14 fully mapped, 8/14 baseline fallback (all correct) |
| Stale context fallbacks | ✅ CERTIFIED — all 3 follow-up types fall back safely |
| Non-section_nav family preservation | ✅ CERTIFIED — all 6 other families unchanged |
| TypeScript | ✅ CLEAN |
| Bugs found | 2 (both fixed in Sprint 880) |
| Unsafe scenarios | 0 |

---

## Known Limitations (post-880)

| Limitation | Impact | Resolution |
|---|---|---|
| 8/14 actions use baseline fallback for elaboration/recommendation | "That was {label} — the section DONNA just helped you navigate to." is functional; not as specific as map copy | Extend maps in a future sprint if user feedback indicates baseline is insufficient |
| Time-shift and topic-shift branches have no `section_nav` explicit handling | These intents override context; section_nav context is correctly ignored | Low impact; by design |
| `'page_actions'` and `'roster_attention'` have no explicit handling for any follow-up type | Both fall through to generic copy (catch-all) | Low priority |

---

## Sprint 881 Recommendation

**Sprint 881 — DONNA Section Nav Follow-Up Map Expansion V1**

The 8 unmapped labels (Sessions List, Roster Intelligence, Template Builder, Generate Session from
Template, Today's Sessions, My Players, Today's Plan, Session Wrap-Up) currently produce baseline
copy. If specific action-oriented guidance for these sections is desired, Sprint 881 can extend
`SECTION_NAV_ELABORATION_MAP` and `SECTION_NAV_RECOMMENDATION_MAP` with 8 additional entries each.

No DB changes, no migrations, no server actions required.
Alternatively, if baseline copy is deemed acceptable for all 8, sprint 881 can pivot to a
different area of DONNA intelligence entirely.
