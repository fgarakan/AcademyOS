# QA — Curriculum Director Insight View

**Sprint:** 1095B
**Date:** 2026-06-01
**Method:** Playwright headless Chromium + screenshot review at 1366×768

---

## Live QA Results

### Page structure pass

| Check | Result |
|---|---|
| Page loads at `/director/curriculum` | ✅ |
| "CURRICULUM SPINE" label visible | ✅ |
| Red Ball stage header present | ✅ |
| Orange Ball stage present | ✅ |
| Live `stage_goal` text: "Build the athletic and technical foundation..." | ✅ |
| Age range "Ages 5–10" from DB | ✅ |
| "3 levels" count label | ✅ |
| Red 1 — Foundation level row | ✅ |
| 1-line goal preview in collapsed row | ✅ |
| Gate count badge "4g" | ✅ |
| Expand button works (chevron toggles) | ✅ |
| DIRECTOR GOAL section appears on expand | ✅ |
| Builder link in expanded card | ✅ |

---

## Manual QA Checklist

### Stage insight cards

| Stage | Check | Expected |
|---|---|---|
| Red Ball | Stage header with `stage_goal` | Live DB text (not hardcoded) |
| Orange Ball | Stage header visible | Ages 9–12 from DB |
| Green Ball | Stage header visible | Ages 11–14 from DB |
| Yellow Ball | Stage header visible | Ages 13–17 from DB |
| High Performance | Stage header visible | Ages 15–21 from DB |

### Level collapse/expand

| Check | Expected |
|---|---|
| All levels collapsed on page load | ✅ default collapsed |
| Click level row → expands | Director Goal, Exit Player Profile visible |
| Click again → collapses | Returns to collapsed state |
| Only one level open at a time | Clicking new level closes previous |

### Expanded level content

| Section | Source | Expected |
|---|---|---|
| Director Goal | `levelInsightMap.ts` (static) | Non-empty, level-specific text |
| Exit Player Profile | `levelInsightMap.ts` (static) | Describes what player looks like when ready to leave |
| Focus Areas | `levelInsightMap.ts` (static) | 3-4 bullet points |
| Readiness Gates | Live `curriculum_gates` (fallback: static `readinessSignals`) | Gate domain + criterion + threshold |
| Common Blockers | `levelInsightMap.ts` (static) | 2-3 common blockers |
| Parent-Safe Summary | `levelInsightMap.ts` (static) | Labeled, parent-facing tone |
| Open in Builder | Link to `/director/curriculum/level/[levelId]` | Navigates to builder |

### All 15 levels covered

| Level | Has insight content |
|---|---|
| Red 1 — Foundation | ✅ |
| Red 2 — Intermediate | ✅ |
| Red 3 — Matchplay | ✅ |
| Orange 1 — Foundation | ✅ |
| Orange 2 — Intermediate | ✅ |
| Orange 3 — Matchplay | ✅ |
| Green 1 — Foundation | ✅ |
| Green 2 — Intermediate | ✅ |
| Green 3 — Matchplay | ✅ |
| Yellow 1 — Foundation | ✅ |
| Yellow 2 — Intermediate | ✅ |
| Yellow 3 — Matchplay | ✅ |
| HP 1 — Foundation | ✅ |
| HP 2 — Intermediate | ✅ |
| HP 3 — Matchplay | ✅ |

### Stage goal source verification

Open browser DevTools → Network tab → look for `curriculum_stages` in requests. The stage goal text should match the live DB `stage_goal` column, NOT the `fallbackPurpose` strings from `SPINE_STAGES`.

Expected (from live DB):
- Red Ball: "Build the athletic and technical foundation for all future tennis development. Players learn how to move, cooperate, and make first contact with the ball as a repeatable skill."
- Orange Ball: "Develop consistent stroke mechanics, basic tactical awareness, and the emotional regulation to compete in low-stakes environments."

### Regression checks

- [ ] `CurriculumLevelTree` still renders below the insight section (counts + builder links)
- [ ] `CurriculumHealthPanel` coverage panel still renders
- [ ] Setup Status checklist still renders
- [ ] Curriculum Status hero card unchanged
- [ ] DONNA builder welcome banner unchanged
- [ ] Curriculum Tools section (Builder, Map, Guided Review, Learning Modules) still renders
- [ ] Academy Version link still visible when academy version exists
- [ ] `/director/curriculum/level/[levelId]` builder still loads when "Open in Builder" clicked
- [ ] No console errors in browser
- [ ] Mobile: stage insight cards stack vertically, levels expand cleanly

---

## TypeScript: Clean (0 errors)
