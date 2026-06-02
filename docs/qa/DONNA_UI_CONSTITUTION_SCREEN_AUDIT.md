# DONNA UI Constitution — Screen Audit

**Version:** 1.0
**Date:** 2026-06-02
**Standard:** `docs/architecture/DONNA_UI_CONSTITUTION.md`

---

## Audit Legend

| Status | Meaning |
|---|---|
| ✅ Compliant | Meets the constitution: 1 job, 1 action, DONNA brief, ≤5 visible signals |
| ⚠️ Partial | Has a DONNA brief or primary action but exceeds signal count |
| ❌ Non-compliant | Multiple jobs, no DONNA brief, or >10 visible data cards |
| 🔧 Fixed | Non-compliant before Sprint 1123, now compliant or improved |

---

## Director Portal

### `/director` — Director Dashboard
**Status:** ⚠️ Partial (improved in Sprint 1123)

**Current state (before Sprint 1123):**
- ❌ 20+ visible cards/sections on initial load
- ❌ Multiple competing sections: Hero, KPI grid, Attention queue, Players, Sessions, Curriculum, Setup
- ❌ No DONNA brief — user must interpret data manually
- ✅ Has `DirectorPrimaryActionHero` (partial constitution compliance)

**Sprint 1123 change:**
- 🔧 Added `DonnaScreenBriefStatic` above hero — computes 1–2 sentence brief from pending counts
- Brief example: *"3 wrap-ups waiting for review, 2 players need placement."*
- Primary action: "Review Queue" (when pending items exist)

**Remaining gaps (not fixed in Sprint 1123):**
- KPI grid with 8+ number tiles is still visible by default
- `CollapsibleSection` pattern is partially compliant but sections are too wide
- Target state: 3 tiles (Review Queue count · Players needing attention · Wrap-up coverage) + everything else behind DONNA

**Next sprint:** Collapse all sections except the 3-tile pulse strip + attention queue. Move KPI detail behind DONNA.

---

### `/director/players` — Player Directory
**Status:** ⚠️ Partial (improved in Sprint 1123)

**Current state:**
- ✅ Clean player card format (name, level, status, actions)
- ✅ Search + filter available
- ❌ Missing DONNA brief — player count visible but no "what matters here" line
- ❌ Page title + stats + filter + cards all load simultaneously

**Sprint 1123 change:**
- 🔧 Added `DonnaScreenBriefStatic` above player directory
- Brief: `"[N] active players · [N] missing a level · [N] ready for advancement · [N] with overdue assessment."`
- Primary action: "Add Player"

**Remaining gaps:**
- Stats strip below the brief duplicates the brief — should be removed or merged
- Filter UI could move inside search instead of being its own row

---

### `/director/players/[playerId]` — Player Profile
**Status:** ❌ Non-compliant

**Current state:**
- ❌ 9 tabs, all immediately accessible
- ❌ Overview tab alone has 10+ cards
- ❌ No DONNA brief at the top of the page
- ⚠️ Blueprint tab (Sprint 1113) is constitution-compliant within its tab

**Target state:**
```
[Player name, level]   [Approve Missions / Start Assessment]

DONNA says: [Player] is working on [top priority]. [N] missions active. Assessment [due/overdue/in N weeks].

[Level + next target]    [Top 3 priorities]    [Active missions (1–3)]

[Blueprint · Notes · History]   ← 3 tabs max visible
```

**Required changes:**
1. Add `DonnaScreenBriefStatic` to player profile header area
2. Reduce default visible cards to 3 (level, top priority, mission status)
3. Consolidate 9 tabs to 4 max (Overview · Development · History · Notes)

**Priority:** High — most-visited director screen.

---

### `/director/review` — Review Queue
**Status:** ⚠️ Partial

**Current state:**
- ✅ Has pending count by type
- ✅ Items grouped by module type with count badges
- ❌ All item types shown simultaneously — no urgency ordering
- ❌ No DONNA brief for the queue overall
- ❌ Approved/rejected items not hidden

**Target state:**
```
DONNA says: 3 approvals blocking 2 players. 1 wrap-up from yesterday.

[URGENT: 2 placement decisions]
[TODAY: 1 wrap-up approval]
[ROUTINE: 3 curriculum edits]
```

---

### `/director/curriculum` — Curriculum
**Status:** ❌ Non-compliant

**Current state:**
- Shows full curriculum tree on load
- 15 levels visible simultaneously
- No DONNA brief
- No clear primary action

**Target state:**
```
DONNA says: Curriculum is healthy. 12/15 levels have content. 0 override requests pending.

[Active stage] [Levels with gaps] [Pending overrides]

[Red Foundation ▶]  [Orange Development ▶]  [Green Performance ▶]
```

---

### `/director/sessions` — Sessions
**Status:** ⚠️ Partial

**Current state:**
- Session list visible on load
- Status filters available
- No DONNA brief
- Schedule view and list view coexist

**Target state:**
```
DONNA says: 3 sessions this week. 1 wrap-up missing. Next: Orange Group today at 4pm.

[Today] [This week] [Pending wrap-ups: 1]
```

---

## Coach Portal

### `/coach` — Coach Home
**Status:** ⚠️ Partial

**Current state:**
- ✅ Shows today's sessions
- ✅ Shows pending wrap-ups
- ⚠️ Has multiple sections that compete for attention
- ❌ No DONNA brief

**Target state:**
```
DONNA says: You have 2 sessions today. 1 wrap-up is overdue.

[Today's Sessions (2)]  [Pending Wrap-ups (1)]

[Quick Capture]  [Ask DONNA]
```

---

## Parent Portal

### `/parent` — Parent Home
**Status:** ✅ Partially compliant (constitution-like design)

**Current state:**
- Shows child's name, level, current focus
- Clean card layout
- ⚠️ Missing DONNA brief line
- ✅ Limited data points (good)

**Improvement needed:**
- Add `DonnaScreenBriefStatic` with: *"[Child] is working on [mission]. Last update [N] days ago."*

---

### `/parent/development` — Parent Development Context
**Status:** ✅ Improved (Sprint 1121)

**Current state:**
- Shows mission, why it matters, support guide
- Blueprint-sourced parent summary visible when director enables
- ✅ Follows constitution pattern (limited visible data)
- ⚠️ Missing DONNA brief

---

## Player Portal

### `/player` — Player Home
**Status:** ✅ Partially compliant

**Current state:**
- Shows mission hero, level progress, today's missions (Sprint 1121)
- ✅ Limited visible data (good design)
- ⚠️ Missing DONNA brief that names what to do next

---

## Summary Table

| Screen | Current Status | Sprint 1123 Change | Priority for Next Fix |
|---|---|---|---|
| Director Dashboard | ❌ Non-compliant | 🔧 Brief added | High — collapse KPI grid |
| Players List | ❌ No brief | 🔧 Brief added | Medium — clean stats strip |
| Player Profile | ❌ 9 tabs, 10+ cards | None | **Critical** — most-used screen |
| Review Queue | ⚠️ Partial | None | High — add urgency ordering |
| Curriculum | ❌ Non-compliant | None | Medium |
| Sessions | ⚠️ Partial | None | Medium |
| Coach Home | ⚠️ Partial | None | High — coach adoption |
| Parent Home | ✅ Near-compliant | None | Low |
| Parent Development | ✅ Sprint 1121 | None | Low |
| Player Home | ✅ Near-compliant | None | Low |

---

## Components Created (Sprint 1123)

| Component | Path | Purpose |
|---|---|---|
| `DonnaScreenBrief` | `src/components/donna/DonnaScreenBrief.tsx` | Client-interactive DONNA brief banner |
| `DonnaScreenBriefStatic` | same file | Server Component DONNA brief banner |
| `DonnaSimplifiedPageHeader` | `src/components/donna/DonnaSimplifiedPageHeader.tsx` | Full page header pattern |

---

## How to Migrate a Screen

1. Identify the screen's **one primary job**
2. Compute the **DONNA brief** from available data (1–2 sentences, named numbers)
3. Add `<DonnaScreenBriefStatic brief="..." primaryActionLabel="..." primaryActionHref="..." />` at the top
4. Identify the **3–5 most important signals** — hide the rest behind expand/DONNA
5. Ensure a single **primary action** is always visible
6. Verify: no more than 5 visible cards by default

The migration does not require removing data — only defaulting it to collapsed/hidden.
