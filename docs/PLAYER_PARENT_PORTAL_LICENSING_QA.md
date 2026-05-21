# Player / Parent Portal + Licensing — Phase 5 QA
## Mega Sprint 594–603

**Phase:** 5 of 5 — Mega Sprint 554–603 Curriculum-Centered V1 Productization
**Date:** 2026-05-21
**Sprints:** 594–603

---

## Security sign-off

- [x] No internal coach notes exposed to player or parent views
- [x] No unapproved curriculum drafts in player or parent views
- [x] No unapproved videos in player or parent views
- [x] No official player placement or profile writes
- [x] No parent/player assessment output exposure
- [x] No medical/diagnostic language in any fitness-related display
- [x] Parent badge section shows names only — no score, no assessment detail, no coach notes
- [x] Player badge section shows earned/in-progress/locked status — no coach notes
- [x] All `player_requirement_progress` queries wrapped in try/catch — graceful fallback when table absent
- [x] DONNA suggestions are engine-computed, never direct DB mutations
- [x] All pages use `academy_id` scoping on every query

---

## Badge system — player portal

### `/player` home page (Sprint 594)
- [x] Badge section renders when `badgeReport` is not null
- [x] Earned badge chips display lime styling
- [x] "Next badge" progress bar shows for in-progress badges
- [x] Locked state shows count with Lock icon
- [x] Falls back to empty state when `player_requirement_progress` table absent
- [x] Attendance streak computed from existing `session_attendance` data — no new table

### `/player/wins` — full badge grid (Sprint 595)
- [x] Shows all player-visible badges from `getVisibleBadgesForPlayer()`
- [x] `RARITY_STYLE` and `STATUS_STYLE` maps render correct visual theme per badge
- [x] Earned badges show rarity chip and earned indicator
- [x] In-progress badges show progress bar
- [x] Locked badges show lock icon
- [x] Summary strip shows Earned / In Progress / Locked counts
- [x] Graceful fallback when `player_requirement_progress` absent — all badges show locked

### `/player/celebration` — badge-aware celebration (Sprint 596)
- [x] Shows hero trophy and current level name
- [x] Earned badges displayed as lime chips
- [x] Next mission link card present
- [x] "See all badges" link present
- [x] Falls back gracefully when no badges earned

---

## Badge system — parent portal

### `/parent/wins` — parent-visible badges (Sprint 597)
- [x] `getVisibleBadgesForParent()` filter applied — not all badges shown
- [x] Badge names displayed as chips — no score, no coach content
- [x] Badge section hidden when `earnedParentVisibleBadgeCount === 0`
- [x] Graceful fallback when `player_requirement_progress` absent
- [x] Existing positive highlight, session consistency, gate pass sections unaffected

---

## Director pilot readiness (Sprint 598)

### `/director/pilot-readiness`
- [x] Live queries for `players`, `groups`, `sessions`, `curriculum_levels`
- [x] `migrationsApplied: false` — honest pending-migration state
- [x] `attentionQueueReady: false` — lib exists; not yet wired to director hero
- [x] `kpiDashboardReady: false` — lib exists; not yet wired to director KPI grid
- [x] Overall status badge (ready/partial/not_ready/deferred) renders correctly
- [x] Critical gaps section shows when `pkg.criticalGaps.length > 0`
- [x] Checklist grouped by `LaunchChecklistCategory`
- [x] Per-item status icons: ✓ / ~ / ✗ / ⟳
- [x] Link to `/director/demo` for pending migration instructions
- [x] Read-only diagnostic — no mutations

---

## Progress indicators — player skill path (Sprint 600)

### `/player/skill-path`
- [x] Progress bar renders between overview card and skill area grid
- [x] Shows only when `completionPct > 0`
- [x] `completionPct` and `completionLabel` computed from `buildPlayerProgressIndicators()`
- [x] Graceful fallback when `player_requirement_progress` absent
- [x] Existing skill area cards and observation count unaffected

---

## Mission engine recommendation — player missions (Sprint 601)

### `/player/missions`
- [x] "DONNA suggests" card appears when `enginePrimaryMissionLabel` is not null
- [x] Mission label sourced from `MISSION_DEFINITIONS[id].title` (not `.name`)
- [x] Reason text from `engineReport.recommendedMissions[0]?.reason`
- [x] Safety note "your coach's mission always takes priority" present
- [x] Graceful fallback when `player_requirement_progress` absent
- [x] Existing priority-driven mission cards unaffected

---

## Build target update (Sprint 602)

### `docs/CURRENT_BUILD_TARGET.md`
- [x] Phase marked COMPLETE with 5-phase completion table
- [x] "Next up" section names pending migrations + director KPI wiring

---

## Data flow integrity

| Surface | Data shown | Source | Coach notes exposed? |
|---|---|---|---|
| `/player` badges | Earned badge names, count | Badge engine | No |
| `/player/wins` | Badge status, rarity | Badge engine + model | No |
| `/player/celebration` | Earned badge names, next mission title | Badge engine + priorities | No |
| `/player/skill-path` | Completion %, progress label | Progress indicators | No |
| `/player/missions` | DONNA mission suggestion, label, reason | Mission engine | No |
| `/parent/wins` | Parent-visible badge names only | Badge engine (filtered) | No |
| `/director/pilot-readiness` | Live count totals, checklist status | Live DB + build booleans | N/A |

---

## Known limitations

- `player_requirement_progress` table requires pending migrations (041–044) before badge/progress data is live. All pages fall back gracefully.
- `domainCompletedIds: []` is passed to badge engine — `domain_champion` and `mental_edge` badges will show locked until domain completion detection is wired.
- `promotionReady: null` is passed to badge engine — promotion-gated badges need director-set promotion flag to unlock.
- Pilot readiness `attentionQueue` and `kpiDashboard` items remain `false` — Director Dashboard wiring is the next sprint phase.

---

## Migration requirements

None created in Phase 5. All Phase 5 changes are pure TypeScript UI wiring using existing library modules. The following pending migrations (from prior phases) must be applied to Supabase before badge/progress data is live:

- `supabase/migrations/041_player_requirement_progress.sql`
- `supabase/migrations/042_curriculum_knowledge.sql`
- `supabase/migrations/043_knowledge_index.sql`
- `supabase/migrations/044_assessment_cadence.sql`

Apply via Supabase Dashboard → SQL Editor, in order.

---

## TypeScript validation

```
npx tsc --noEmit
```

Result: **clean** — exits 0, no errors in any Phase 5 file.
