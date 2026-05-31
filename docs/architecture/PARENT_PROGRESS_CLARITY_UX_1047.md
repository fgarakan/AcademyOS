# Parent Progress Clarity UX — Sprint 1047

**Sprint:** 1047 — Parent Progress Clarity UX V1
**Date:** 2026-05-31
**File changed:** `src/app/parent/progress/page.tsx`

---

## Problem

The progress page had three explanatory/trust blocks:

1. **ShieldCheck box** (top): "Showing coach-approved development data only — no raw notes, no rankings."
2. **Encouragement box**: "Name's development is tracked through coach observations in every session. The numbers above reflect how much coaching attention each area has received — not a grade or evaluation."
3. **Safety footer note** (bottom): "Advancement requires coach and director confirmation — not automatic. Coaching teams decide timing."

The ShieldCheck box already establishes the trust frame: data is approved, no raw notes. The safety footer note (#3) repeats a variation of this trust frame (coach/director approval) and is redundant. It added footer noise to what should be a clean close.

The encouragement box (#2) is worth keeping because it explains what the observation counts ARE (not a grade) — that's additive context, not repeated safety messaging.

## Change

Removed the bottom safety note paragraph. The ShieldCheck box at the top remains as the single trust statement for this page.

## What was preserved

- Header (eyebrow, H1, subtitle)
- ShieldCheck approved data notice
- Level journey card
- Current focus area card
- Domain observation counts (5 areas)
- Encouragement box
- Development Focus link → /parent/development
