# QA — Sprint 967 DONNA Director Daily Brief V2

**Sprint:** 967  
**Date:** 2026-05-30

---

## TypeScript

- [ ] `npx tsc --noEmit` passes with no errors in sprint files
- [ ] `directorBriefingAdapter.ts` compiles cleanly
- [ ] `route.ts` compiles cleanly (rawDb cast preserved for v_player_curriculum_summary)
- [ ] `donnaDailyBrief.ts` — `headline?: string` addition is backward-compatible
- [ ] `DonnaDailyBriefCard.tsx` — no new TypeScript errors

---

## Brief API

- [ ] `GET /api/donna/brief` returns `{ ok: true, brief: DailyBrief }` for a director
- [ ] `GET /api/donna/brief` returns 401 for unauthenticated request
- [ ] `GET /api/donna/brief` returns 403 for non-director role
- [ ] Brief includes `headline` field when briefing has urgent/attention items
- [ ] Brief sections contain COO-style directive text (not raw SQL language)
- [ ] No raw IDs, no raw JSON, no player names in any section item

---

## DailyBrief type

- [ ] `DailyBrief.headline` is optional — existing code that doesn't set it still compiles
- [ ] `createEmptyBrief()` still returns a valid `DailyBrief` (no headline)
- [ ] `formatBriefAsText()` still works (headline not required)

---

## Adapter behavior

- [ ] Sections with `status = 'ok'` are omitted from output
- [ ] Sections with `status = 'no_data'` are omitted from output
- [ ] Sections with `status = 'urgent'` have `priority = 'high'`
- [ ] Sections with `status = 'attention'` have `priority = 'normal'`
- [ ] Item text is human-readable (not raw `label + value`)
- [ ] Adapter returns correct `headline` from briefing

---

## Card rendering

- [ ] `DonnaDailyBriefCard` renders `brief.headline` when present
- [ ] Card does not render headline element when `brief.headline` is undefined
- [ ] Section list, expand/collapse, and priority styling unchanged
- [ ] "Walk me through it" button still appears when `onWalkthrough` is provided
- [ ] "Show pending approvals" button still appears when `onOpenReviewQueue` is provided
- [ ] "Prepare coach briefs" button still appears when `onPrepareCoachBriefs` is provided
- [ ] Generated time still appears at the bottom

---

## VoiceSummary behavior

- [ ] `buildBriefVoiceSummary` in `DonnaAssistantButton.tsx` not modified
- [ ] Voice summary still narrates brief on load via `speakDonna`
- [ ] No new voice path created
- [ ] No second DONNA button created

---

## Section presence

| Scenario | Expected sections |
|---|---|
| 3 pending + 2 missing recaps + 2 sessions today | Pending approvals, Missing recaps, Today's sessions, Recommended first action |
| 0 pending, 0 missing, 0 placements, 1 no-level player | Today's sessions, No curriculum level |
| Everything zero | All clear |
| Query failure | All clear (catch fallback) |

---

## Empty state

- [ ] Empty brief shows "All clear — No urgent items today. Academy is on track."
- [ ] Card does not crash when `brief.sections` has only the All clear section
- [ ] Expand/collapse hidden when only one section

---

## No-mutation / no-send

- [ ] No `INSERT`, `UPDATE`, or `DELETE` in route.ts
- [ ] No communications sent to parents or players
- [ ] No level changes triggered
- [ ] No approvals bypassed

---

## Protected systems

- [ ] Sprint 904 approve/reject behavior: untouched
- [ ] Sprint 964 highlight chips and escalation: untouched
- [ ] Sprint 965 voice persona: untouched
- [ ] Sprint 966 brief chips: still call `handleFetchDailyBrief` → this route
- [ ] `DonnaWorkflowCards` / `DonnaDailyBriefCard` interface: unchanged (all props same)
- [ ] `buildBriefVoiceSummary` in `DonnaAssistantButton.tsx`: not modified
- [ ] `handleFetchDailyBrief` in `DonnaAssistantButton.tsx`: not modified
- [ ] `proposed_actions` state machine: not touched
- [ ] RLS scoping: all queries use `eq('academy_id', academyId)` from authenticated membership

---

## Files changed (only these)

- `src/lib/donna/briefings/directorBriefingAdapter.ts` (new)
- `src/app/api/donna/brief/route.ts` (modified)
- `src/components/assistant/donnaDailyBrief.ts` (modified)
- `src/components/assistant/DonnaDailyBriefCard.tsx` (modified)
- `docs/architecture/DONNA_DIRECTOR_DAILY_BRIEF_V2_967.md` (new)
- `docs/QA_DONNA_DIRECTOR_DAILY_BRIEF_V2_967.md` (new)
- `docs/CHANGELOG.md` (modified)
