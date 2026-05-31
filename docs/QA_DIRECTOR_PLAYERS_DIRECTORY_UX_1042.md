# QA — Director Players Directory — Sprint 1042

**Sprint:** 1042 | **Date:** 2026-05-31

---

## Players list — with players, healthy roster (no signals)

- [ ] Page loads at `/director/players`
- [ ] H1: "Player Directory" | Eyebrow: "Academy"
- [ ] Subtitle: "N players registered"
- [ ] **`DonnaPlayersPresenceCTA` is NOT visible** when namedSignals = 0, assessmentDueCount = 0, missingCurriculumCount = 0
- [ ] Player rows render with name, status badge, group/coach, curriculum level badge
- [ ] Advancement-ready block shows when eligible players exist, absent otherwise

## Players list — with signals (attention needed)

- [ ] `DonnaPlayersPresenceCTA` IS visible when namedSignals.length > 0 OR assessmentDueCount > 0 OR missingCurriculumCount > 0
- [ ] "Who needs attention?" chip fires DONNA panel with roster context
- [ ] DONNA panel opens without error

## Empty state (no players)

- [ ] Subtitle: "Add your first player or import a roster to get started."
- [ ] **No "Academy-wide player tracking" text visible**
- [ ] "Import roster" (btn-lime) and "Add player" (btn-ghost) CTAs in empty state

## DONNA focus targets

- [ ] `data-donna-focus-id="player-directory-summary"` on header
- [ ] `data-donna-focus-id="players-missing-level"` on missing-level link (when shown)
- [ ] `data-donna-focus-id="add-player-button"` on "Add player" CTA
- [ ] `data-donna-focus-id="player-filter-bar"` on search bar
- [ ] `data-donna-focus-id="player-list"` on player list

## Regression

- [ ] Player profile navigation unchanged
- [ ] Search/filter bar works
- [ ] Status filter chips work
- [ ] TypeScript: `npx tsc --noEmit` passes clean
