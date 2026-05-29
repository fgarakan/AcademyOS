# DONNA Director Intelligence Brief V1
**Date:** 2026-05-29
**Sprint:** 945
**Status:** Complete

---

## What Was Built

`src/lib/donna/donnaDirectorBrief.ts` — COO-style director intelligence brief generator.
`DonnaVoiceReadyShell.tsx` — Shell A wired with brief intercept pattern.

---

## Brief Generator

```typescript
buildDirectorBrief(input: DirectorBriefInput): DirectorIntelligenceBrief
formatBriefAsMessage(brief): string  // Formats for Shell A chat message
```

### Priority Ranking (top 3 selected)
1. Pending review items (approval required)
2. Attendance exceptions
3. High-risk player signals
4. Advancement-eligible players
5. Player development stalls
6. Curriculum draft backlog
7. Fallback: on-track message (when no signals)

### Output
```typescript
interface DirectorIntelligenceBrief {
  priorities: DirectorBriefPriority[]   // top 3
  openingLine: string
  closingLine: string
  overallHealthSignal: 'critical' | 'attention_needed' | 'on_track' | 'insufficient_data'
  hasUrgentAction: boolean
  totalAttentionItems: number
}
```

Each priority has: rank, level, headline, text, whyItMatters, recommendedAction, targetId?, href, safetyNote?.

---

## Shell A Wiring

New `BRIEF_PATTERN` fires before the page guide intercept:
```
give me a brief | daily brief | what's going on | morning brief |
what's urgent | status update | catch me up | what's the academy status
```

When matched:
1. `buildDirectorBrief(directorCtx fields)` → generates ranked priorities
2. `formatBriefAsMessage(brief)` → single chat message
3. Top priority `targetId` → `setDonnaFocusTarget` + `donna:highlight` event
4. Top priority `href` → `setPendingNavOffer` for yes/no navigation

---

## Safety
- Brief never sends communications
- Brief never moves levels or placements
- All recommendations in brief require director approval
- Works with no live context (returns minimal text brief)
