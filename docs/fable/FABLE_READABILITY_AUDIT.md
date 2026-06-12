# Fable Readability Audit — Today Page V1

**Sprint 2081–2110 — Fable Readability & Accessibility System V1**
**Date: June 2026**
**Scope: DonnaCommandBrief, DirectorDecisionCenter, DonnaAlertsAndMomentum, WhatChangedPanel**

---

## Summary Verdict

The Today page as built in Sprint 2051–2080 uses text sizes ranging from 10px to 15px for the majority of visible content. Nothing in the hero (DONNA voice) or decision cards meets the 16px minimum required for outdoor, aging-eye, or bright-sunlight use. Most detail text fails WCAG AA contrast entirely.

**Premium does not mean tiny text. Premium means effortless clarity.**

---

## Contrast Failure Analysis

| Token | Hex | On Surface #111111 | Ratio | WCAG |
|---|---|---|---|---|
| `text-primary` | #FFFFFF | white on near-black | 18.5:1 | AAA |
| `text-secondary` | #AAAAAA | light gray on near-black | ~8.4:1 | AAA |
| `text-muted` | #555555 | mid-gray on near-black | ~1.65:1 | **FAIL** |
| `lime` | #C8FF00 | lime on near-black | ~13.2:1 | AAA |
| `status-red` | #FF3B30 | red on near-black | ~4.9:1 | AA |
| `status-orange` | #FF9500 | orange on near-black | ~7.1:1 | AAA |
| `status-green` | #30D158 | green on near-black | ~5.4:1 | AA |
| `status-blue` | #0A84FF | blue on near-black | ~4.8:1 | AA |

**Critical finding:** `text-text-muted` (#555555) achieves only 1.65:1 contrast on the surface background. Any body text using this token is inaccessible by WCAG standards. It must be reserved for purely decorative elements — separators, borders, timestamps — where reading the text is not required.

---

## Component-by-Component Audit

### DonnaCommandBrief.tsx

| Element | Current size | Current contrast | Verdict | Required fix |
|---|---|---|---|---|
| Situation label (normal) | `text-[12px]` 12px | `text-text-primary` or color token | FAIL size | → `text-base` 16px |
| Situation label (returning, primary) | `text-[12px]` 12px | `text-lime` | FAIL size | → `text-sm` 14px min |
| Situation label (returning, secondary) | `text-[11px]` 11px | color token | FAIL size | → `text-sm` 14px |
| Confidence badge | `text-[10px]` 10px | green/orange | FAIL size | → `text-xs` 12px (badge, uppercase) |
| Timestamp | `label-xs` 11px | `text-text-muted` | FAIL contrast | → decorative only, or `text-text-secondary` |
| Returning greeting | `text-[15px]` 15px | `text-text-primary` | FAIL size | → `text-2xl` 24px (hero) |
| Change item headline | `text-[12px]` 12px | color token | FAIL size | → `text-base` 16px |
| Change item detail | `text-[11px]` 11px | `text-text-muted` | FAIL size + contrast | → `text-sm` + `text-text-secondary` |
| "What matters now" label | `label-xs` 11px | `text-lime/70` | FAIL contrast | → `text-xs text-lime` |
| "What matters now" content | `text-[13px]` 13px | `text-text-primary` | FAIL size | → `text-xl` 20px (critical) |
| Normal greeting | `text-[15px]` 15px | `text-text-primary` | FAIL size | → `text-2xl` 24px (hero) |
| Primary CTA label | `text-sm` 14px | lime on black | FAIL size | → `text-base` 16px |
| Pending actions link | `text-[12px]` 12px | `text-text-muted` | FAIL size + contrast | → `text-sm` + `text-text-secondary` |

**Severity: CRITICAL.** The DONNA voice — the most important element on the entire director dashboard — is rendered at 15px, below the 16px minimum.

---

### DirectorDecisionCenter.tsx

| Element | Current size | Current contrast | Verdict | Required fix |
|---|---|---|---|---|
| "Top Decisions" section label | `label-xs` 11px | `text-text-muted` | Acceptable (categorical label) | No change |
| Count label | `text-[10px]` 10px | `text-text-muted` | FAIL size + contrast | → `text-xs` + `text-text-secondary` |
| Rank circle number | `text-[10px]` 10px | `text-text-muted` | FAIL size + contrast | → `text-xs` + `text-text-secondary` |
| Urgency badge text | `text-[10px]` 10px | color token | FAIL size | → `text-xs` 12px (badge, uppercase) |
| Confidence dot label | `text-[10px]` 10px | color token | FAIL size | → `text-xs` 12px |
| Decision title | `text-sm` 14px | `text-text-primary` | FAIL size | → `text-xl` 20px (critical decision) |
| First step text | `text-[12px]` 12px | `text-text-muted` | FAIL size + contrast | → `text-base` + `text-text-secondary` |
| "Approval required" label | `text-[10px]` 10px | `text-status-orange` | FAIL size | → `text-xs` 12px |
| "Open" CTA link | `text-[11px]` 11px | `text-lime` | FAIL size | → `text-sm` 14px |
| Empty state body | `text-sm` 14px | `text-text-secondary` | FAIL size (barely) | → `text-base` 16px |
| Empty state sub | `text-[11px]` 11px | `text-text-muted` | FAIL size + contrast | → `text-sm` + `text-text-secondary` |

**Severity: CRITICAL.** The decision title — the director's primary action item — is rendered at 14px. A director reading 3 decisions quickly needs to absorb them in under 5 seconds. At 14px with a font-semibold in a dark card, this is straining.

---

### DonnaAlertsAndMomentum.tsx

| Element | Current size | Current contrast | Verdict | Required fix |
|---|---|---|---|---|
| Empty state | `text-[12px]` 12px | `text-text-muted` | FAIL size + contrast | → `text-base` + `text-text-secondary` |
| Alert headline | `text-[13px]` 13px | `text-text-primary` | FAIL size | → `text-base` 16px |
| Alert evidence | `text-[11px]` 11px | `text-text-muted` | FAIL size + contrast | → `text-sm` + `text-text-secondary` |
| Alert severity label | `text-[10px]` 10px | color token | FAIL size | → `text-xs` 12px (badge) |
| Win headline | `text-[13px]` 13px | `text-text-primary` | FAIL size | → `text-base` 16px |
| Win evidence | `text-[11px]` 11px | `text-text-muted` | FAIL size + contrast | → `text-sm` + `text-text-secondary` |
| Win confidence label | `text-[10px]` 10px | color token | FAIL size | → `text-xs` 12px (badge) |
| Alert/Win icons | size 13 | color token | FAIL — too small for touch | → size 16 |

**Severity: HIGH.** Alert headlines at 13px are below minimum. Alert evidence at 11px with `text-text-muted` fails both size and contrast. A director cannot scan 3 alerts in 5 seconds at these sizes.

---

### WhatChangedPanel.tsx

| Element | Current size | Current contrast | Verdict | Required fix |
|---|---|---|---|---|
| Panel title | `text-sm` 14px | `text-text-secondary` | FAIL size + contrast | → `text-base` + `text-text-primary` |
| Panel subtitle | `text-xs` 12px | `text-text-muted` | FAIL size + contrast | → `text-sm` + `text-text-secondary` |
| Change headline | `text-sm` 14px | `text-text-primary` | FAIL size | → `text-base` 16px |
| Change detail | `text-xs` 12px | `text-text-muted` | FAIL size + contrast | → `text-sm` + `text-text-secondary` |
| Chevron icon | size 14 | `text-text-muted` | FAIL size + contrast | → size 16 + `text-text-secondary` |

**Severity: HIGH.** The panel title at 14px fails minimum. The change detail at 12px with `text-text-muted` is essentially unreadable outdoors or for directors with reduced visual acuity.

---

## Scan Speed Assessment

A director should be able to answer three questions in 5 seconds by scanning the Today page:

1. **What happened?** — WhatChangedPanel / returningDirectorSummary
2. **What matters right now?** — DONNA greeting + whatMattersNow
3. **What do I do?** — DirectorDecisionCenter

**Current score: FAIL.** The current Today page renders all content at similar visual weight (11-15px, similar gray tones). Nothing visually dominates. A director scanning quickly cannot identify the primary message without reading every word.

**Required change:** The DONNA greeting must visually dominate. Decision titles must be the second-heaviest element. Everything else is supporting.

---

## Mobile Touch Target Assessment

| Element | Current tap size | WCAG minimum (44px) | Verdict |
|---|---|---|---|
| Primary CTA (btn-lime) | ~36px height | 44px | FAIL |
| "Open" decision link | ~24px height | 44px | FAIL |
| "N actions pending" link | ~20px height | 44px | FAIL |
| WhatChanged expand button | ~52px height (full-width) | 44px | PASS |
| COO Panel summary | ~52px height (full-width) | 44px | PASS |

---

## Findings Summary

| Category | Count | Severity |
|---|---|---|
| Text below 16px (body) | 18 instances | Critical |
| Text below 12px (even labels) | 9 instances | Critical |
| `text-text-muted` used on readable content | 12 instances | Critical — fails WCAG AA |
| Icons below 16px | 7 instances | High |
| Touch targets below 44px | 3 instances | High |
| `text-sm` used for critical decisions | 2 instances | Critical |

**Total deficiencies requiring Sprint 2081–2110 remediation: 51**
