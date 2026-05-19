# DONNA Onboarding — Parent + Player Experience Step V1

**Date:** 2026-05-19
**Sprint:** O-7

---

## Summary

Created `ParentPlayerExperienceStep` (Step 5 of 7) covering parent communication style, privacy defaults, and player mission framing. No DB writes.

---

## Data Captured

| Field | Type | Constraint |
|---|---|---|
| Parent Communication Styles | Multi-select cards | Any number |
| Parent Visibility Rules | Toggle switches | 5 rules, all safe-default ON |
| Player Mission Style | Single select | Optional |

## Parent Communication Styles (7)

Informed Partner / Development-Focused / Competition-Aware / Minimal Interference / High Involvement / Emotion-Safe Zone / Data-Driven

Each card shows: name, description, and (when selected) example parent-facing language.

## Parent Visibility Rules (5)

- Hide raw coach notes from parents (safe default: ON)
- Hide director notes from parents (safe default: ON)
- Hide group rankings from parents (safe default: ON)
- Hide player-to-player comparisons (safe default: ON)
- Require director approval for AI-drafted notes (safe default: ON)

Toggle UI with Eye/EyeOff icons, "Safe default" badge on protected items.

## Player Mission Styles (7)

Challenge Seeker / Skill Builder / Team Player / Compete to Win / Love the Game / Personal Growth / Explorer

Single-select. Icon + label + desc per card.

## UX Patterns

- Parent style cards with checkmark badges on selection, example text revealed when selected
- Privacy toggles with slide indicator (lime dot = protected, muted = open)
- Protected count shown as lime "X/5 protected" counter
- Single-select mission style cards with deselect on re-click
- DONNA confirmations for all three sections
- Continue always enabled

## Safety Rules

- No DB writes
- All visibility defaults are protective (hide/require approval)
- "I'll shape..." / "I'll apply..." / "I'll frame..." (future tense) not "Applied"
