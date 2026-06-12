# Fable Typography System V1

**Sprint 2081–2110 — Fable Readability & Accessibility System V1**
**Date: June 2026**
**Authority: This file overrides any prior size decisions for Today page components.**

---

## Design Principle

> "Premium does not mean tiny text. Premium does not mean low contrast. Premium means effortless clarity."

AcademyOS is built for directors operating in real-world conditions: outdoors, on a phone, under time pressure, across a wide age range (25–65). The typography system exists to serve this context, not to look minimal in a design mockup.

---

## Type Scale

| Role | Size | Tailwind class | Use |
|---|---|---|---|
| DONNA Voice / Hero | 24px | `text-2xl` | DONNA greeting. The one message the director must absorb. |
| Critical Decision | 20px | `text-xl` | Decision card title. Requires director action. |
| Key Insight | 18px | `text-lg` | "What matters now" content, high-priority section headers. |
| Body | 16px | `text-base` | Alert headlines, win headlines, change headlines, first-step descriptions, panel body. **This is the minimum for any readable content.** |
| Supporting | 14px | `text-sm` | Evidence, change detail, secondary descriptions. Allowed only when clearly subordinate to 16px body above it, and only with `text-text-secondary` (#AAAAAA) for contrast. |
| Micro-label | 11–12px | `label-xs` or `text-xs` | Section category labels (TOP DECISIONS, ALERTS), urgency badges, confidence badges. Uppercase + letter-spacing required. Never use for content the director must read. |

---

## Contrast Rules

| Requirement | Standard | Minimum token |
|---|---|---|
| Body content | WCAG AA | `text-text-secondary` (#AAAAAA, 8.4:1) |
| Critical content | WCAG AAA | `text-text-primary` (#FFFFFF, 18.5:1) |
| Decorative / metadata | No requirement | `text-text-muted` (#555555) — for timestamps, separators only |
| Status labels | WCAG AA | Status color tokens (all pass AA on #111111) |
| Lime accent text | WCAG AAA | `text-lime` (#C8FF00, 13.2:1) |

**`text-text-muted` (#555555) on surface #111111 achieves only 1.65:1 contrast — a complete WCAG failure. It must never be used for text the director is expected to read.**

---

## Weight Rules

| Context | Weight | Class |
|---|---|---|
| DONNA greeting | Medium | `font-medium` |
| Decision title | Semibold | `font-semibold` |
| Key insight ("What matters now") | Semibold | `font-semibold` |
| Body headline (alert, win, change) | Medium | `font-medium` |
| Body text (evidence, detail) | Normal | `font-normal` |
| Section labels | Medium + uppercase | `font-medium uppercase tracking-widest` |

---

## Minimum Size Enforcement

**No body text below 16px.** This is a hard rule.

The only exceptions:
1. `label-xs` section category labels — uppercase, wide tracking, not content
2. `text-xs` urgency/confidence badges — uppercase, wide tracking, categorizing not reading
3. Timestamps — purely decorative, never required reading

---

## Font Size → Tailwind Reference

| px | Tailwind | Use in Fable |
|---|---|---|
| 10px | `text-[10px]` | **BANNED** in all Today page components |
| 11px | `text-[11px]` / `label-xs` | Section labels only |
| 12px | `text-xs` | Badges/chips only |
| 14px | `text-sm` | Supporting detail only |
| 16px | `text-base` | Body minimum |
| 18px | `text-lg` | Key insights |
| 20px | `text-xl` | Critical decisions |
| 24px | `text-2xl` | DONNA voice / hero |
| 30px | `text-3xl` | (Reserved for splash/marketing) |

---

## Mobile Sizing Rules

On mobile viewports (< 640px), sizes remain the same — the scale above already accounts for mobile-first usage. Do not reduce sizes on mobile. A director using a phone court-side needs the same or larger text.

Tap target minimum: **44px height** for all interactive elements (WCAG 2.5.5 AAA). Enforce via `min-h-[44px]` on buttons and links where the default padding is insufficient.

---

## Age Range Certification Standard

The system must be demonstrably readable for directors across the following age profiles:

| Age | Key accommodation |
|---|---|
| 25 | Standard readability — 16px body at AA contrast |
| 40 | Clear hierarchy — 20px for decisions, 24px for DONNA voice |
| 55 | High contrast required — `text-text-secondary` min for all body |
| 65 | Larger effective size — supporting detail at `text-sm` is the minimum, body at `text-base`, hero at `text-2xl`. No `text-text-muted` for any readable content. |

---

## Hierarchy in Practice

One scan of the Today page should reveal:

1. **DONNA VOICE** — biggest text, `text-2xl`, white or lime, dominates the card
2. **WHAT TO DO** — `text-xl` decision titles, clearly secondary but prominent
3. **ALERTS / WINS** — `text-base` headlines with color icons
4. **CONTEXT** — `text-sm` evidence in `text-text-secondary`, visually subordinate

If all four levels look similar in size and weight, the hierarchy has failed.
