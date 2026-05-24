# Sprint 770 — AIQS Micro-Text Sweep V1

**Date:** 2026-05-24
**Sprint:** 770
**Goal:** Upgrade operational micro-text labels from `text-[9px]`/`text-[10px]` to `text-[11px]`/`text-xs` minimum on the 5 main role home pages and 2 flagged components.
**AIQS issue:** S-2 — Operational labels below readable size (9–10px) on all major pages

---

## AIQS Issue Addressed

**Systemic Issue S-2** from `docs/ACADEMYOS_SITE_WIDE_UI_UX_CERTIFICATION.md`:

> `text-[9px]` and `text-[10px]` used for operational labels, section headings, and descriptions throughout all major pages. Below the 11px minimum for label chips and 14px minimum for body/operational text. Reduces readability, especially on mobile.

**AIQS typography standard:**
- Body / operational text: 14px (`text-sm`) minimum — no exceptions
- Section subheadings: 14px minimum
- Label chips / status text: 11px (`text-[11px]`) — only if paired with color/icon
- Metadata / timestamps: 12–13px (`text-xs`) — only if non-critical
- Micro-labels 9–10px: only for purely decorative, non-critical use

---

## Scope

This sprint targeted **operational micro-text only** — section labels, descriptions, instructions, metadata in the 5 main role home pages and 2 flagged components.

**Badge/chip patterns exempted:** `text-[9px]` or `text-[10px]` with `px-1.5 py-0.5 rounded border` remain unchanged — these are decorative status chips paired with color, which qualifies as the AIQS exception.

---

## Files Modified

| File | Changes |
|---|---|
| `src/app/director/page.tsx` | 2 instances: day labels `text-[10px]` → `text-[11px]`; activity timestamp `text-[10px]` → `text-xs` |
| `src/app/director/donna/page.tsx` | 8 instances: metric label `text-[9px]` → `text-[11px]`; demo fallback, risk details, action reasons, review link, DONNA subtitle `text-[10px]` → `text-xs` |
| `src/app/coach/page.tsx` | 4 instances: "Next Session" label, Today/Players/Notes stat labels `text-[10px]` → `text-[11px]`; DONNA description `text-[10px]` → `text-xs` |
| `src/app/parent/page.tsx` | 13 instances: all section labels (uppercase tracking-widest) `text-[10px]` → `text-[11px]`; descriptions and metadata `text-[10px]` → `text-xs` |
| `src/app/player/page.tsx` | 12 instances: section labels `text-[9px]`/`text-[10px]` → `text-[11px]`; descriptions and metadata → `text-xs`; badge rarity label → `text-[11px]` |
| `src/app/director/_components/AcademyHealthBreakdown.tsx` | Line 476: `text-[10px] text-[#555555]` → `text-[11px] text-text-muted` (fixes both micro-text and the hardcoded #555555 contrast failure from S-1) |
| `src/components/player/UtrHistoryChart.tsx` | Both XAxis + YAxis tick: `fill: '#555555', fontSize: 10` → `fill: '#7a8898', fontSize: 11` (aligns chart axis labels with updated muted token and minimum size) |

---

## Change Rule Applied

| Pattern | Old | New | Reason |
|---|---|---|---|
| Section label (uppercase tracking-widest) | `text-[9px]` or `text-[10px]` | `text-[11px]` | Below AIQS 11px minimum for label-xs class |
| Description / body text | `text-[9px]` or `text-[10px]` | `text-xs` (12px) | Below minimum; metadata/description → 12px acceptable |
| Badge/chip with px-1.5 py-0.5 rounded | `text-[9px]` | unchanged | AIQS exception: decorative chip paired with color |
| Chart axis tick labels | `fontSize: 10, fill: '#555555'` | `fontSize: 11, fill: '#7a8898'` | Aligns with token update from Sprint 769; size below minimum |

---

## What Was Not Changed

- **Badge/chip patterns** — `text-[9px] px-1.5 py-0.5 rounded border` throughout coach session, review queue, curriculum components — AIQS allows 9px for decorative chips paired with color
- **DONNA/assistant components** — `DonnaAssistantButton.tsx`, `DonnaRecommendationCard.tsx` etc. — protected per /goal rules
- **Deep `_components/` files** not on home page above-fold — scoped to main page files only
- **Library files** (`src/lib/`) — not UI-facing, out of scope
- **SQL/RLS/migrations/env** — nothing touched
- **Layout or component hierarchy** — no structural changes

---

## Remaining Micro-Text Gaps (not addressed in this sprint)

The following remain for future per-page polish sprints (773+):

| Location | Pattern | Priority |
|---|---|---|
| `src/app/coach/_components/CoachOnCourtActionsBar.tsx` | `text-[10px]` description labels | Sprint 773 (Coach Home rebuild) |
| `src/app/director/kpi/page.tsx` | Table column labels at small size | Sprint 770+ or later |
| Various `_components/` not above-fold | `text-[10px]` secondary metadata | Low — per page-specific sprint |
| DONNA components (`/assistant/`) | Hardcoded `#555555` labels | DONNA sprint |

---

## TypeScript Result

No TypeScript changes — className string and recharts fontSize prop changes only.

`npx tsc --noEmit` — **EXIT 0** (verified clean)

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
- [x] Badge/chip patterns left at decorative size per AIQS exception
- [x] Only pages and components named in plan were touched
