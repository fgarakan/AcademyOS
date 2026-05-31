# QA — Director Player Profile Header — Sprint 1043

**Sprint:** 1043 | **Date:** 2026-05-31

---

## Player with curriculum level

- [ ] Header shows name, LevelBadge (level + stage), AdvancementStatusBadge
- [ ] Stage name and last-evaluated date show below name
- [ ] **No orange "No curriculum level" text visible**

## Player WITHOUT curriculum level

- [ ] Header shows name (no LevelBadge — none to show)
- [ ] **Orange "No curriculum level — assign one to begin tracking" text visible**
- [ ] **AlertCircle icon visible** left of the text
- [ ] Text color is `text-status-orange` (orange, not grey)
- [ ] **No "No curriculum placement" grey text visible**

## Regression

- [ ] Back link "All Players" navigates to `/director/players`
- [ ] Initials avatar renders correctly
- [ ] `data-donna-focus-id="player-profile-header"` wrapper still present
- [ ] TypeScript: `npx tsc --noEmit` passes clean
