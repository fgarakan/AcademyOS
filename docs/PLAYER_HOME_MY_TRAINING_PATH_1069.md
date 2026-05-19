# Sprint 1069 — Player Home My Training Path V1

## What was built

Player home page upgraded with Phase 7B mission-focused hero, 4 path entry cards, and DONNA quick panel. Existing IDP content preserved below. No schema changes.

## Files created

- `src/components/player/PlayerHomeHeroCard.tsx` — compact mission hero with current→next level display and "See My Missions" CTA linking to /player/missions. Data from director-approved IDP (recommended_next_mission, current_level, next_level). No raw coach notes.
- `docs/PLAYER_HOME_MY_TRAINING_PATH_1069.md` — sprint doc

## Files modified

- `src/app/player/page.tsx` — added PlayerHomeHeroCard, 4 path entry cards (Skill, Competition, Fitness, Missions), DONNA quick panel (4 chips → /player/ask-donna with guardrails notice). Added imports: PlayerHomeHeroCard, Link, Zap, Activity, MapIcon, Shield, ChevronRight. Note: `Map` import aliased as `MapIcon` to avoid shadowing native `Map` class.

## Safety properties

- Mission text: from `idpView.recommended_next_mission` (director-set IDP, not raw coach notes)
- Level names: from `idpView.current_level` and `nextLevelDisplayName` (curriculum data)
- DONNA panel: links to /player/ask-donna with guardrails notice; no AI call on home screen
- Path cards: static navigation links only — no data fetched

## TypeScript

Clean.
