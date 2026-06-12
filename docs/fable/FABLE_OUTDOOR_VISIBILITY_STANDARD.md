# Fable Outdoor Visibility Standard V1

**Sprint 2081–2110 — Fable Readability & Accessibility System V1**
**Date: June 2026**

---

## Context

Tennis academy directors use AcademyOS from tennis courts. This means:

- Bright direct sunlight reducing display contrast by 40–60%
- Phone or tablet held at arm's length (55–70cm), not desktop distance
- One-handed use while holding clipboard, racquet, or radio
- Time pressure — director has 15 seconds between interactions with players
- Potential glare from court surfaces (hard, clay, grass)
- No mouse — touch only, often with sweaty fingers

The design must work in this context. Not just "be usable" but be effortless.

---

## Sunlight Contrast Impact

Standard WCAG ratios assume indoor, controlled lighting. In direct sunlight:

| Indoor contrast | Effective outdoor contrast | WCAG indoor pass | Outdoor verdict |
|---|---|---|---|
| 1.65:1 (`text-muted` on surface) | ~0.9:1 | **FAIL** | **Completely invisible** |
| 4.5:1 (WCAG AA) | ~2.5:1 | PASS | Borderline — strain |
| 7:1 (WCAG AAA) | ~3.9:1 | PASS | Acceptable outdoor |
| 13:1+ (lime, white on #111111) | ~7.2:1+ | AAA | Excellent outdoor |

**Minimum outdoor-safe contrast: 7:1 (WCAG AAA).** For critical content the director must act on (decisions, alerts, DONNA greeting), use `text-text-primary` (#FFFFFF, 18.5:1 indoor / ~10:1 outdoor).

---

## Outdoor-Safe Font Sizes

Standard indoor minimums shrink further in sunlight due to reduced contrast and squinting:

| Role | Indoor minimum | Outdoor minimum | Fable system |
|---|---|---|---|
| Body readable content | 16px | 18px | 16px base → status OK; prefer 18px where possible |
| Critical decision | 20px | 22px | 20px (`text-xl`) → acceptable |
| DONNA voice / hero | 24px | 28px | 24px (`text-2xl`) → acceptable; squinting still readable |
| Labels (uppercase) | 12px | 14px | 12px (`text-xs`) → borderline; only for non-required metadata |
| Touch targets | 44px height | 48px height | Target 44px minimum |

---

## Color Differentiation Rules

**Color must never be the only differentiator.** Directors in sunlight cannot reliably distinguish:
- Red vs orange (similar luminance, appears same in glare)
- Blue vs purple (wash out similarly in bright light)
- Muted grays (all appear similar — the reason `text-muted` fails outdoors)

Every status indicator must pair color with:
1. An icon (AlertCircle, AlertTriangle, Info, TrendingUp)
2. A text label (CRITICAL, HIGH, THIS WEEK, CONFIRMED)
3. Sufficient size (both icon and label at 16px+ or `text-xs` with uppercase + tracking)

All three layers are implemented in DonnaAlertsAndMomentum and DirectorDecisionCenter — this is correct.

---

## One-Handed Use Standard

The director's thumb arc on a standard phone (375px wide) reaches:
- Bottom 60% of screen: comfortable
- Top 40% of screen: stretch — acceptable for occasional actions
- Off-screen: NEVER require this

Rules:
1. Primary action (btn-lime) must be reachable without repositioning the hand
2. The decision card "Open" links must be large enough to tap without precision
3. WhatChangedPanel expand button (full-width) passes — any full-width element passes
4. "N actions pending" link must be `min-h-[44px]` or embedded within a larger tappable area

---

## Outdoor Visibility Certification Checklist

Before any Today page release, verify:

- [ ] No body text below 16px in any Today page component
- [ ] All readable content uses `text-text-secondary` or `text-text-primary` (never `text-text-muted`)
- [ ] DONNA greeting is visually dominant at `text-2xl` or larger
- [ ] Decision titles are at `text-xl` (20px) or larger
- [ ] All alert/win icons are at least size 16 (w-4 h-4)
- [ ] Primary CTA (btn-lime) tap target meets 44px minimum
- [ ] Status is never communicated by color alone (icon + label always present)
- [ ] Text-lime elements use `text-lime` not `text-lime/70` (opacity reduces outdoor contrast)

---

## Director Device Profiles

| Device | Screen size | DPI | Notes |
|---|---|---|---|
| iPhone 15 Pro | 6.1" | 460 | Common for younger directors |
| iPhone SE | 4.7" | 326 | Most space-constrained — test on this |
| iPad Mini | 8.3" | 326 | Clipboard replacement |
| Samsung Galaxy S24 | 6.2" | 416 | Common Android |
| 13" MacBook Pro | 13.3" | 227 | Office use — desktop layout |

The Today page must be tested on iPhone SE-equivalent dimensions (375px wide) for worst-case mobile. All elements must remain readable and tappable at this width.
