# Sprint 769 — AIQS Global Contrast Token Fix V1

**Date:** 2026-05-24
**Sprint:** 769
**Goal:** Fix the global muted-text contrast failure identified by the AcademyOS Site-Wide UI/UX Certification (7ed10dd)
**AIQS issue:** S-1 — `text-text-muted` contrast below WCAG AA across all 14 audited pages

---

## AIQS Issue Addressed

**Systemic Issue S-1** from `docs/ACADEMYOS_SITE_WIDE_UI_UX_CERTIFICATION.md`:

> `text-text-muted` (#626b76 on #07090c card background) ≈ 3.68:1 contrast — below WCAG AA minimum of 4.5:1 for normal text. Affects all 14 pages via the `label-xs` utility, metadata labels, section subheadings, and placeholder text.

---

## Audit — Token Source Locations Found

Before making changes, the following token definitions were identified:

| File | Token | Old value |
|---|---|---|
| `tailwind.config.ts` | `text.muted` | `#626b76` |
| `src/app/globals.css` | `--text-muted` | `#626b76` |
| `src/app/globals.css` | `--text-muted-legacy` | `#626b76` |
| `src/components/onboarding/aos-deck.css` | `--aos-text-dim` + 4 fallback values | `#626b76` |

**Note on CLAUDE.md discrepancy:** The CLAUDE.md instruction file listed `text-muted: #555555` on `surface: #111111`. Those are stale documentation values. The actually implemented values were `#626b76` (muted) on `#07090c` (card background). The audit correctly identified the contrast failure; only the specific hex values differed.

---

## Contrast Calculation

### Before (failing)

| Token | Value | Background | Contrast | WCAG AA (4.5:1) |
|---|---|---|---|---|
| `text-text-muted` | `#626b76` | `#07090c` (card) | ≈ 3.68:1 | ❌ FAIL |
| `text-text-muted` | `#626b76` | `#030506` (page) | ≈ 3.79:1 | ❌ FAIL |

**Calculation method (WCAG relative luminance):**
- L(#626b76) ≈ 0.1443
- L(#07090c) ≈ 0.00267
- Contrast = (0.1443 + 0.05) / (0.00267 + 0.05) = **3.68:1** — fails WCAG AA

### After (passing)

| Token | Value | Background | Contrast | WCAG AA (4.5:1) |
|---|---|---|---|---|
| `text-text-muted` | `#7a8898` | `#07090c` (card) | ≈ 5.49:1 | ✅ PASS |
| `text-text-muted` | `#7a8898` | `#030506` (page) | ≈ 5.63:1 | ✅ PASS |

**Calculation method:**
- L(#7a8898) ≈ 0.2394
- L(#07090c) ≈ 0.00267
- Contrast = (0.2394 + 0.05) / (0.00267 + 0.05) = **5.49:1** — passes WCAG AA ✅

---

## Why This Was the Highest-Leverage First Fix

1. **Single token — site-wide impact.** The `text-text-muted` token propagates via Tailwind utility `text-text-muted` to 40+ usages across all 14 audited pages with zero per-page code changes required.

2. **Affects the most critical utility class.** The `label-xs` utility (`@apply text-[11px] uppercase tracking-widest text-text-muted`) is used as a section heading label on virtually every page. Fixing the token fixes every label at once.

3. **Zero architectural risk.** Pure CSS/Tailwind token change — no DB, no TypeScript, no component restructuring.

4. **Blue-grey character preserved.** The new value `#7a8898` maintains the same hue (~210°) and saturation character as the original `#626b76`. It is a natural lightening within the existing palette, not a colour shift. Sits visually between the old muted (`#626b76`) and secondary (`#a3aab4`) tokens.

---

## Files Changed

### Modified

| File | Change |
|---|---|
| `tailwind.config.ts` | `text.muted: '#626b76'` → `'#7a8898'` (1 line) |
| `src/app/globals.css` | `--text-muted: #626b76` → `#7a8898`; `--text-muted-legacy: #626b76` → `#7a8898` (2 lines) |
| `src/components/onboarding/aos-deck.css` | `--aos-text-dim: #626b76` → `#7a8898` + 4 inline fallback values (5 lines) |

### Created

| File | Purpose |
|---|---|
| `docs/AIQS_GLOBAL_CONTRAST_TOKEN_FIX_769.md` | This sprint documentation |
| `docs/CHANGELOG.md` | Updated with Sprint 769 entry |

---

## Remaining Contrast Gaps (not addressed in this sprint)

### Hardcoded `#555555` instances — deferred to Sprint 770 (micro-text sweep)

The following files contain hardcoded `#555555` values **not** connected to the global token. They are outside this sprint's scope:

| File | Lines | Context | Protected? |
|---|---|---|---|
| `src/app/director/_components/AcademyHealthBreakdown.tsx` | 476 | `text-[10px]` label, inline `text-[#555555]` | No — addressable in Sprint 770 |
| `src/components/assistant/DonnaRecommendationCard.tsx` | 38, 60, 125 | Hardcoded `color: '#555555'` | DONNA component — address in DONNA sprint |
| `src/components/assistant/DonnaAssistantButton.tsx` | 3123 | Hardcoded background style | DONNA protected — address in DONNA sprint |
| `src/components/assistant/DonnaVoiceDiagnostics.tsx` | 94 | Diagnostic color | DONNA protected |
| `src/components/assistant/DonnaObjectResolverPanel.tsx` | 27 | `color: '#555555'` | DONNA protected |
| `src/components/player/UtrHistoryChart.tsx` | 43, 50 | Chart tick `fill: '#555555'` | Addressable in Sprint 770 |
| `src/app/dev/portal-foundation-check/page.tsx` | multiple | Dev diagnostic page only | Dev page — low priority |
| `src/lib/utils.ts` | 119 | Stage color fallback (unrelated to text-muted) | Leave as-is |

**Impact of remaining gaps:** These hardcoded values bypass the token system. The global token fix raises all Tailwind `text-text-muted` usages. The hardcoded instances remain at #555555 until addressed individually.

---

## Pages Affected by Token Fix

All 14 pages in the site-wide audit benefit from this change via the `text-text-muted` utility and `label-xs` component class:

| Page | Key usages of `text-text-muted` |
|---|---|
| Director Home | Section labels, metadata, timestamps |
| Director Today | Metadata, time labels, secondary text |
| Director DONNA | Left column labels, description text |
| Director KPI | Table column headers, metric labels |
| Curriculum Map | Node labels, level tags |
| Review Center | Tab metadata, queue item details |
| Players Directory | Player metadata, status labels |
| Player Profile | Development labels, evidence metadata |
| Sessions | Session time labels, group tags |
| Coach Home | Session labels, watchlist metadata |
| Coach Session | Block labels, time metadata |
| Parent Portal | Section labels, progress metadata |
| Player Portal | Mission labels, status metadata |
| Settings | Form field labels, description text |

---

## What Was Intentionally Not Changed

- **Layout** — no component structure, hierarchy, or section order changed
- **Typography sizes** — no font size changes (`text-[9px]`, `text-[10px]` micro-text deferred to Sprint 770)
- **Color palette** — lime/cyan accent, status colors, primary/secondary text unchanged
- **Background tokens** — `base`, `surface`, `surface-raised`, `border` unchanged
- **DONNA components** — `DonnaAssistantButton.tsx`, `DonnaRecommendationCard.tsx`, etc. unchanged
- **SQL/RLS/migrations/env** — nothing touched
- **TypeScript logic** — no behavior changes

---

## Remaining Systemic Fixes After This Sprint

In priority order per the /goal AIQS upgrade sequence:

| Sprint | Issue | Scope |
|---|---|---|
| Sprint 770 | Micro-text sweep | Replace `text-[9px]`/`text-[10px]` operational labels with `text-[11px]` minimum |
| Sprint 771 | Loading skeletons | Add `loading.tsx` to 8+ major page directories |
| Sprint 772 | DONNA placement | Move DONNA below primary content in Coach Home + Player Portal |
| Sprint 773–778 | Page-specific fixes | Role-specific UX improvements per AIQS audit scores |
| Sprint 779 | Re-certification | Full site-wide AIQS re-audit and final certification |

---

## TypeScript Result

No TypeScript changes — CSS and Tailwind config only.

`npx tsc --noEmit` — **EXIT 0** (no TypeScript changes made)

---

## Implementation Guardrails — Confirmed

- [x] No SQL/RLS/migrations touched
- [x] No env files touched
- [x] No DONNA dispatcher modified
- [x] No official record mutations
- [x] No role boundaries changed
- [x] No approval flows changed
- [x] No new features added
- [x] No layout restructuring
- [x] Smallest possible token-level change only
