# Sprint 967 — DONNA Director Daily Brief V2

**Sprint:** 967  
**Date:** 2026-05-30  
**Status:** Complete  
**Depends on:** Sprint 966 (brief chips), Sprint 369 (brief API), Sprint 464 (library layer)

---

## What changed vs V1

| Aspect | V1 (Sprint 369/966) | V2 (Sprint 967) |
|---|---|---|
| Brief builder | Manual section construction in API route | `buildDirectorDailyBriefing` library layer |
| Sections | 5 fixed sections | Up to 9 sections from library + extras |
| COO headline | None | `briefing.headline` shown below date in card |
| Missing wrap-ups | Not tracked | Sessions past date, not completed/cancelled |
| Parent updates | Not tracked | Pending `generate_parent_update` proposals |
| Recommended action | None | Last section: `suggestedFirstAction` from library |
| DailyBrief type | `{ date, sections, generatedAt }` | Added optional `headline?: string` |

---

## What was NOT created

- No new API endpoint
- No new voice path
- No new DONNA surface
- No new brief component (minor card update only)
- No schema change
- No migration
- No permission change

---

## Architecture

```
/api/donna/brief (existing route)
  │
  ├── Run 7 RLS-scoped queries
  │     ├── pendingCount (proposed_actions, pending_review)
  │     ├── sessionCount (sessions, today)
  │     ├── placementCount (players, pending_placement)
  │     ├── advancementCount (v_player_curriculum_summary, rawDb)
  │     ├── noLevelCount (players, active, current_level_id IS NULL)
  │     ├── missingRecapCount [NEW] (sessions, past date, planned/in_progress)
  │     └── parentUpdatePendingCount [NEW] (proposed_actions, generate_parent_update)
  │
  ├── buildDirectorDailyBriefing(params) → DirectorDailyBriefing
  │     params: todaySessionCount, missingRecapCount, pendingApprovalCount,
  │             highRiskSignalCount=0, missingParentDraftCount, curriculumGapCount=0,
  │             playersPendingPlacement, coachesWithNoRecentRecap=0
  │
  ├── adaptBriefingToDailyBrief(briefing, date) → DailyBrief
  │     - skips 'ok' / 'no_data' sections
  │     - maps 'urgent' → priority:'high', 'attention' → priority:'normal'
  │     - builds human-readable item strings from label + value
  │     - sets DailyBrief.headline from briefing.headline
  │
  ├── Append extra sections (not in library)
  │     ├── Today's sessions (informational, normal priority)
  │     ├── Advancement ready (if advancementCount > 0)
  │     └── No curriculum level (if noLevelCount > 0, high if > 2)
  │
  ├── Append recommended action section (if suggestedFirstAction != null)
  │
  └── Fallback: 'All clear' if no sections were produced
```

---

## New file: `src/lib/donna/briefings/directorBriefingAdapter.ts`

Pure TypeScript utility. No DB, no React. Exports one function:

```typescript
adaptBriefingToDailyBrief(briefing: DirectorDailyBriefing, date: string): DailyBrief
```

Conversion rules:
- `BriefingSection.status === 'urgent'` → `DailyBriefSection.priority = 'high'`
- `BriefingSection.status === 'attention'` → `DailyBriefSection.priority = 'normal'`
- `BriefingSection.status === 'ok' | 'no_data'` → section omitted
- Item text built from `label + value + action` (e.g. "3 pending approvals need your attention — open review queue.")
- `headline` from `briefing.headline` placed in `DailyBrief.headline`

---

## DailyBrief type change

```typescript
interface DailyBrief {
  date: string
  sections: DailyBriefSection[]
  generatedAt: string
  headline?: string  // Sprint 967 — COO headline, optional, backward-compatible
}
```

`createEmptyBrief` is unchanged. Existing callers that don't set `headline` continue to work.

---

## DonnaDailyBriefCard change

Added 2 lines: renders `brief.headline` below the date when present.

```tsx
{brief.headline && (
  <p className="text-[12px] text-text-secondary mt-1 leading-snug">{brief.headline}</p>
)}
```

No other card changes. Expand/collapse, Walk me through it, Show pending approvals, and Prepare coach briefs CTAs are all unchanged.

---

## Brief sections (V2 output)

| Section | Source | Condition shown |
|---|---|---|
| Pending approvals | library | pendingCount > 0, attention/urgent |
| Missing recaps | library [NEW] | missingRecapCount > 0, attention/urgent |
| Parent drafts awaiting review | library [NEW] | parentUpdatePendingCount > 0 |
| Players pending placement | library | placementCount > 0 |
| Today's sessions | manual | always (informational) |
| Advancement ready | manual | advancementCount > 0 |
| No curriculum level | manual | noLevelCount > 0 |
| Recommended first action | library-derived | suggestedFirstAction != null |

---

## Voice behavior

`buildBriefVoiceSummary` in `DonnaAssistantButton.tsx` is unchanged. It reads `brief.sections` and their `priority` field. With V2 sections, it produces the same structural summary format ("3 areas today. One needs attention first: Pending approvals."). The function was not modified.

`speakDonna` path is unchanged. No new voice path created.

---

## Empty-state behavior

If all queries return 0 or null and no sections are produced after adapter + extras:
- Falls back to: "All clear — No urgent items today. Academy is on track."

If queries fail entirely (catch block), `buildDirectorDailyBriefing` receives all-zero params and produces a "Academy looks good today." headline with no actionable sections. Adapter produces an empty sections array. Fallback section fires.

---

## Sprint 966 integration

Sprint 966 brief chips (`dir-brief-walk`, `dir-brief-attention`, `rev-brief`, `ses-brief`, `plist-brief`) call `handleFetchDailyBrief()` → `/api/donna/brief` → this route. No changes to chips or DonnaAssistantButton. The improved brief flows transparently through the existing path.

---

## V3 improvement gaps

| Signal | Reason deferred | Path |
|---|---|---|
| High-risk player signals | Requires player signal aggregation join | Sprint 968+ |
| Curriculum gap count | Requires curriculum coverage computation | Sprint 968+ |
| Coaches with no recent recap | Requires per-coach session history join | Sprint 968+ |
| Richer KPI section | Requires wired KPI model | Sprint 969+ |
| Voice-first brief narration | Requires `brief.headline` wired to `buildBriefVoiceSummary` | Sprint 970+ |

---

## Safety

- No mutations — read-only queries
- All queries scoped to `academy_id` from authenticated membership
- No parent/player data exposed in brief text — counts only
- No player names, raw IDs, embeddings, or session notes
- No communications sent
- No level changes, placements, attendance, billing, curriculum, sessions, or template mutations
- No approval gates bypassed
- Sprint 904 approve/reject behavior untouched
- Sprint 964 chip/highlight systems untouched
- Sprint 965 voice persona untouched
- Sprint 966 brief chips untouched
