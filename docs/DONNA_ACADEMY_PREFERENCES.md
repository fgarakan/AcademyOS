# DONNA Academy Preferences

> Sprint 470 — Academy Preferences V1
> See also: `src/lib/donna/preferences/academyPreferences.ts`

---

## What preferences exist

| Preference | Type | Default | Meaning |
|---|---|---|---|
| summaryStyle | short/standard/detailed | standard | How long DONNA briefings should be |
| parentSummaryTone | encouraging/factual/balanced | balanced | Parent communication style |
| usesCustomLevelNames | boolean | false | Academy uses non-standard level names |
| customTerminology | Record<string,string> | {} | Academy-specific word replacements |
| preferredCoachLanguage | string | null | Language code for coach-facing outputs |
| saturdaySessionDefault | boolean | false | Whether Saturday sessions are the norm |
| defaultSessionDurationMin | number | 60 | Default session length in minutes |
| hiddenKpiIds | string[] | [] | KPIs the director has muted from their view |
| donnaGreetsWithName | boolean | true | Whether DONNA uses the director's first name |
| donnaDefaultConfidenceThreshold | high/partial/low | partial | Minimum confidence to surface answers |

---

## Storage

Preferences are stored in the `academy.settings` JSON column — no new table required.

Key: `donna_preferences` within the settings JSON object.

---

## Future persistence

If per-director preferences (not academy-wide) are needed, a new `director_preferences` table will be required. This is deferred and requires schema approval.

---

## Terminology system

`applyCustomTerminology(text, terminology)` applies word replacements to DONNA output:

```typescript
applyCustomTerminology('The group is ready', { group: 'squad' })
// → 'The squad is ready'
```

Replacements are whole-word, case-insensitive.

---

## Validation

`validateAcademyPreferences(input)` returns `{ valid: boolean; errors: string[] }`.

Always validate before saving to the settings JSON column.
