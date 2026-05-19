# Sprint 1076 — Player Practice At Home V1

## What was built

Full `/player/practice` page. Category-keyed drill sets (6 categories) tied to active mission priority. Interactive checklist via local state (no DB writes). Today's focus card with mission title and estimated session time. Practice tips section. CTAs to missions and Ask DONNA.

## Files modified

- `src/app/player/practice/page.tsx` — replaced stub with full page

## Files created

- `src/components/player/PracticeChecklist.tsx` — client component, local checkbox state only
- `docs/PLAYER_PRACTICE_1076.md` — sprint doc

## Safety

- No DB writes — checklist is purely local/session state
- Mission title from director-set active priority only
- No raw coach notes
- Footer note: "Practice log is local — nothing here is sent to your coach. Just for you."
- Player identity via profile_id linkage only

## TypeScript

Clean.
