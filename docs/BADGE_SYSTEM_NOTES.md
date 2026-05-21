# Badge System

> Sprints 492–493 — Badge System V1
> See also: `src/lib/badges/badgeModel.ts`, `src/lib/badges/badgeEligibilityEngine.ts`

---

## Purpose

Badges are computed achievements earned by completing curriculum milestones, attendance streaks, or other measurable player goals. No separate badge table — all badge state is computed from `player_requirement_progress` at read time.

---

## Badge catalogue (10 badges)

| Badge | Rarity | Criteria |
|---|---|---|
| First Step | Common | 1 requirement completed |
| Consistent Player | Common | 5 requirements completed |
| Level Complete | Uncommon | All level requirements achieved |
| Domain Champion | Rare | All requirements in one domain complete |
| Attendance Streak | Uncommon | 10 consecutive sessions attended |
| Assessment Ready | Uncommon | 80% completion + promotion_ready=true |
| Wrap-Up Champion | Rare | Coach achievement — 100% wrap-up over 10 sessions |
| Mental Edge | Rare | All mental domain requirements achieved |
| Curriculum Explorer | Uncommon | Progress in 3+ domains |
| Promotion Ready | Legendary | 100% of level requirements complete |

---

## Eligibility engine

`buildBadgeEligibilityReport(input)` returns `BadgeEligibilityReport` with:
- `awards: BadgeAward[]` — status per badge (earned / in_progress / locked)
- `earnedBadgeIds` — list of earned badge IDs
- `getNextBadgeToEarn(report)` — closest in-progress badge to completion

---

## Privacy

- `Wrap-Up Champion` is not player/parent visible (coach achievement)
- All other badges are player + parent visible
- Badge state is never stored — always recomputed from live data

---

## Wiring targets

- Player portal home cards — "Next Badge" progress indicator
- Parent portal highlights — earned badges for player
- Director player profile — badge overview tab
- DONNA briefing — milestone celebrations
