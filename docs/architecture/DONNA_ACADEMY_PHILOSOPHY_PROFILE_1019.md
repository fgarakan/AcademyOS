# Academy Philosophy Profile — Sprint 1019

**Date:** 2026-05-31
**Sprint:** 1019
**Status:** Complete (V1 — derived profile from curriculum signals)

---

## What was built

Sprint 1019 creates a structured philosophy profile for the academy. DONNA can reference this when answering curriculum strategy questions, identifying curriculum gaps, and framing recommendations.

---

## `AcademyPhilosophyProfile` type

Structured, director-facing representation of the academy's coaching philosophy:
- `primaryStages` — which curriculum stages the academy serves
- `developmentEmphasis` — skill-first / competition-first / balanced / fitness-first
- `contentDomainPriorities` — ranked priorities (technical / tactical / fitness / mental / competition)
- `targetSessionsPerWeek` — session frequency goal
- `hasFormalCurriculum` — whether structured levels are defined
- `hasCompetitiveProgram` — whether competitive events are part of the program
- `source` — 'derived' (V1) or 'director_defined' (future)

---

## `buildDefaultPhilosophyProfile(signals)`

Derives a V1 profile from curriculum level count:
- 4+ levels → red / orange / green / yellow stages
- 2-3 levels → red / orange
- ≤1 level → red only

Default emphasis: balanced. Default domain priorities: technical > tactical > fitness > mental > competition.

---

## `buildPhilosophyContextString(profile)`

Generates a safe LLM system prompt section. No player names, no coach data, no private notes. Includes derived-profile disclaimer when `source === 'derived'`.

---

## `identifyPhilosophyGaps(profile, signals)`

Conservative gap detector:
- Primary stages missing content → flags which stages
- No content at all → flags baseline gap

Returns gap signals — not directives. DONNA cites them as "you may want to consider" suggestions.

---

## V1 limitations

- Profile is always derived — no director-defined philosophy yet
- Content domain priorities are default (no behavioral signals wired)
- `targetSessionsPerWeek` always 3 in V1
- Sprint 1020 (Philosophy-to-Curriculum Draft Engine) wires this profile into curriculum proposals
