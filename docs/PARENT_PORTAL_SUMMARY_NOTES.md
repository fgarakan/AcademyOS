# Parent Portal Summary

> Sprints 486–487 — Parent Portal V1
> See also: `src/lib/parent/parentPortalSummary.ts`, `src/lib/parent/parentCommunicationPreferences.ts`

---

## Parent Portal Summary Builder (Sprint 486)

`buildParentPortalSummary(profile)` produces the view model for `/parent`.

Input is a `ParentPortalProfile` from `parentPortalQueries.ts` — already triple-gated:
- `is_parent_visible=true` (curriculum requirements)
- `is_parent_safe=true` (evidence links)
- `show_to_parent=true` (development summary)

### View model fields

| Field | Source |
|---|---|
| playerCard | parentPortalQueries — player name, level, group, coach |
| developerSummaryText | developmentProfileQueries — show_to_parent=true |
| strengths | developmentProfileQueries — parent-facing content |
| currentFocus | developmentProfileQueries — parent-facing content |
| topPriorities | developmentProfileQueries — priority_rank order |
| highlights | computed — completed count, level, next assessment |
| supportPrompts | computed — static encouragement guidance |
| engagementLevel | computed — active/moderate/low/unknown |

### What parents never see

- Coach internal notes (`coach_summary` field from `player_development_summary`)
- Raw assessment scores or deviation signals
- `v_player_signal_dashboard` data
- Any field not explicitly marked is_parent_safe or show_to_parent

---

## Parent Communication Preferences (Sprint 487)

Stored in `parent_profiles.preferences` JSON column — no new table.

| Preference | Type | Default |
|---|---|---|
| summaryTone | encouraging/factual/balanced | balanced |
| updateFrequency | weekly/biweekly/monthly/on_milestone | weekly |
| preferredLanguage | language code or null | null |
| receiveSessionSummaries | boolean | true |
| receiveAssessmentAlerts | boolean | true |
| receiveMilestoneNotifications | boolean | true |
| optOutOfAllCommunications | boolean | false |

`isParentCommunicationEnabled(prefs, type)` is the single gate before any communication is sent.
`optOutOfAllCommunications=true` blocks all types regardless of individual flags.
