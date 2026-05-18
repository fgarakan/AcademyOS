# Director DONNA Daily Brief
Sprint 1005 — 2026-05-18

## Summary

Created `src/components/donna/DirectorDonnaDailyBrief.tsx` — structured daily brief panel.

## Sections

1. Sessions Today — live count, link to /director/today
2. Missing Wrap-Ups — red badge when > 0, link to review queue
3. Attendance Issues — exceptions + unrostered flags
4. Drafts Awaiting Approval — observations, parent-safe, templates, evidence
5. Academy Risks — free-text risk strings
6. Recommended Actions — href-linked action items
7. Safety footer — "Nothing changes until you approve"

## Data Model (Props)

Caller is responsible for fetching and passing all counts. Component is display-only.

## Relation to Existing DonnaDailyBriefCard

`DonnaDailyBriefCard` (Sprint 369) is the simpler floating card used in the DONNA panel. `DirectorDonnaDailyBrief` is a full-width structured panel with section-level priority coloring, live/demo status indicator, and recommended actions. Both coexist.

## Usage

Intended for `/director/donna` or `/director/today` pages where a full-width brief panel is appropriate.
