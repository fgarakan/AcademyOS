# Academy OS — Master Build Repository
**Version:** 1.0 | **Date:** 2026-04-27

## What this is

This is the complete knowledge base, documentation system, schema, and build kit for **Academy OS** — a voice-driven academy planning and player development operating system for tennis academies.

## Start here

1. **`ACADEMY_OS_MASTER_ORG.md`** — The command center. Read this first.
2. **`MISSING_ITEMS_AND_DECISIONS.md`** — Open decisions that block V1.
3. **`BUILD_ORDER.md`** — What to build and in what sequence.
4. **`PACKAGE_INDEX.md`** — What's in each package.

## Quick links

| What you need | Where to find it |
|---|---|
| Product vision | `packages/01_PRODUCT_STRATEGY_AND_SCOPE/` |
| Database schema (SQL) | `packages/02_DATABASE_AND_SUPABASE_SCHEMA/` |
| Voice architecture | `packages/03_VOICE_FIRST_ARCHITECTURE/` |
| Placement engine spec | `packages/04_NEW_STUDENT_PLACEMENT_ENGINE/` |
| Player profile spec | `packages/05_PLAYER_PROFILE_AND_DEVELOPMENT_PATHS/` |
| Session/template spec | `packages/06_SESSION_TEMPLATE_EXERCISE_SYSTEM/` |
| Coach notes spec | `packages/07_COACH_NOTES_AND_ASSESSMENTS/` |
| UI/UX screen specs | `packages/08_UI_UX_WIREFRAMES_AND_SCREEN_SPECS/` |
| AI workflow + prompts | `packages/09_AI_WORKFLOW_AND_CLAUDE_PROMPTS/` |
| Roadmap + testing | `packages/10_IMPLEMENTATION_ROADMAP_AND_TESTING/` |

## Current repo state

```
/workspaces/AcademyOS/
  index.html          — Pitch deck (presentation)
  app.html            — Functional prototype (all 5 roles working)
  Academy_OS_Master_Build/
    ACADEMY_OS_MASTER_ORG.md
    MISSING_ITEMS_AND_DECISIONS.md
    BUILD_ORDER.md
    PACKAGE_INDEX.md
    packages/          — 11 spec/documentation packages
    generated/         — Audit reports and inventory
    scripts/           — Automation scripts
    zips/              — Generated zip packages
```

## Generate zip packages

```bash
cd /workspaces/AcademyOS/Academy_OS_Master_Build
bash scripts/create-zips.sh
```

## Working with Claude Code

Start every session with:
> "Read ACADEMY_OS_MASTER_ORG.md and MISSING_ITEMS_AND_DECISIONS.md, then tell me current state."

See `packages/09_AI_WORKFLOW_AND_CLAUDE_PROMPTS/DAILY_BUILD_PROMPT.md` for session templates.
