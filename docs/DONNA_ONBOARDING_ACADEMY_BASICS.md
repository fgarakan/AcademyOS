# DONNA Onboarding — Academy Basics Step V1

**Date:** 2026-05-19
**Sprint:** O-4

---

## Summary

Created `AcademyBasicsStep` (Step 2 of 7) and wired it into `OnboardingShell`. The step captures core academy identity with fast pill/card selectors and minimal typing. No DB writes.

---

## Data Captured

| Field | Type | UI |
|---|---|---|
| Academy Name | Text input | Single line, max-w-sm |
| Age Groups | Multi-select pills | 6 options with ball-level colors |
| Academy Model | Single-select cards | 6 options with description |
| Primary Goals | Multi-select pills | 7 options, optional |

## Age Groups
Red Ball (5–8) / Orange Ball (8–10) / Green Ball (9–11) / Yellow Ball (10+) / High Performance (Elite) / Adult

## Academy Models
Junior Development / High Performance / Adult Program / Private Coaching / Multi-Location Academy / Consultant Setup

## UX Patterns
- Pills for age groups: color-coded by ball level using AcademyOS status tokens
- Cards for academy model: lime highlight on selection
- DONNA confirmation appears after first selection: "I'll use this to prepare your starting curriculum structure..."
- Continue button enabled as soon as any field is non-empty
- No fake "applied" language

## Safety Rules
- All state local to React — no DB writes
- DONNA confirmation copy: "I'll use this to prepare..." (future tense, not past)
- No "Applied" or "Updated" language
