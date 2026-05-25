# Sprint 814 — DONNA Panel Mobile Usability V1

**Date:** 2026-05-25
**Sprint:** 814
**Type:** Mobile UX — Tailwind responsive class improvements only
**Files changed:** 1 source + 2 docs
**Migrations:** None
**DB mutations:** None
**TypeScript:** Clean

---

## Why this sprint

Sprint 812 certification identified DONNA mobile panel usability at **6/10** — the lowest-scoring sub-dimension in the panel score. Since Sprint 813 converted the director landing page to a no-scroll Daily Command cockpit, the director is more likely to interact with DONNA on mobile.

Sprint 812 roadmap entry:

> **Sprint 813 Option A — DONNA Panel Mobile Usability (+5 pts on Panel, 40% weight)** — Panel is 6/10 on mobile. Responsive improvements to touch targets, panel height on mobile viewport, and input sizing.

All 5 changes are Tailwind class adjustments only — no logic, routing, handlers, voice behavior, persistence, or backend code touched.

---

## Mobile Audit Findings

### Panel container
- **Before:** `fixed top-0 right-0 z-50 w-96 max-w-[90vw] flex flex-col`
- On a 390px viewport (iPhone 14): panel is `max-w-[90vw]` = 351px wide, right-aligned
- 10% of page content remains visible on the left — squeezed desktop sidebar appearance
- Looks unintentional, not like a mobile-first drawer

### Header padding
- **Before:** `px-5 pt-5 pb-4` — desktop padding applied on mobile
- 20px side padding on a ~351px panel is tight relative to full desktop panel
- Minor but visually less refined on small viewports

### DONNA subtitle (DONNA_PUBLIC_TITLE)
- **Before:** Always visible regardless of viewport
- On mobile, occupies vertical space below the DONNA name
- Page context label (`ctx.screenName`) is more useful on mobile (tells director what screen DONNA knows about)
- Subtitle provides no additional actionable information on mobile

### Close button
- **Before:** `w-8 h-8` = 32×32px
- Below the 44×44px mobile touch target recommendation
- On mobile, X button is in the top-right corner — frequently needed, should be easy to hit
- **Risk:** Director taps near the button but misses, frustration on dismissal

### Quick action chips
- **Before:** `py-1` = 4px top + 4px bottom = effective tap height ~22–24px including text
- The chip row is the primary interaction surface that directs DONNA intent
- Far below 44px; far below even a comfortable 32px tap band

### Touch targets that were already correct
- Mic button (`VoiceInputButton`): already `min-h-[44px]` ✅
- Send button (`DonnaVoiceLayer`): already `min-h-[44px]` ✅
- Voice confirm/retry buttons: already `min-h-[44px]` ✅

### What was not changed (confirmed not needed)
- Panel height: already correct — `top-0` to `bottom-[60px]` on mobile (Sprint 714), avoids `DONNADirectorMobileCommandBar`
- Scrollable body: `flex-1 overflow-y-auto` already correct
- Footer safety copy: compact 1-line, no issue
- Input `rows={2}`: already reasonable for mobile
- Thread `max-h-[280px] overflow-y-auto`: already scrolls internally
- `DONNADirectorMobileCommandBar`: separate component — not touched

---

## What changed — 5 Tailwind class edits in DonnaAssistantButton.tsx

### Change 1 — Panel container width (line ~3326)

```tsx
// Before
'fixed top-0 right-0 z-50 w-96 max-w-[90vw] flex flex-col',

// After
'fixed top-0 right-0 z-50 w-full sm:w-96 flex flex-col',
```

**Effect:** On mobile (< 640px): true full-width drawer covering 100% of viewport. On desktop (≥ 640px): exactly 384px, identical to before.

Since `fixed right-0 w-full` on mobile means the panel starts at the right edge and extends full viewport width, it correctly becomes a full-screen overlay. The slide-in animation (`translate-x-full` → `translate-x-0`) still works correctly.

### Change 2 — Header padding (line ~3338)

```tsx
// Before
className="flex items-start justify-between px-5 pt-5 pb-4 shrink-0"

// After
className="flex items-start justify-between px-4 sm:px-5 pt-4 sm:pt-5 pb-3 sm:pb-4 shrink-0"
```

**Effect:** Mobile header uses 16px side padding (was 20px), 16px top (was 20px), 12px bottom (was 16px). Compact but not cramped. Desktop padding unchanged.

### Change 3 — DONNA subtitle visibility (line ~3401)

```tsx
// Before
<p className="text-xs text-text-muted leading-snug mt-0.5">
  {DONNA_PUBLIC_TITLE}
</p>

// After
<p className="hidden sm:block text-xs text-text-muted leading-snug mt-0.5">
  {DONNA_PUBLIC_TITLE}
</p>
```

**Effect:** `DONNA_PUBLIC_TITLE` is hidden on mobile — saves one line of vertical space. Page context label (`ctx.screenName`, visible on all screen sizes) remains. Desktop shows both, unchanged.

### Change 4 — Close button touch target (line ~3424)

```tsx
// Before
className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ml-2 mt-0.5 ..."

// After
className="w-11 h-11 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0 ml-2 sm:mt-0.5 ..."
```

**Effect:** Mobile close button: 44×44px (meets WCAG 2.5.5 / Apple HIG minimum). Desktop unchanged at 32×32px. `mt-0.5` removed on mobile (not needed at 44px height), preserved on desktop via `sm:mt-0.5`.

### Change 5 — Quick action chip touch height (line ~3479)

```tsx
// Before
className="shrink-0 text-[11px] px-2.5 py-1 rounded-full ..."

// After
className="shrink-0 text-[11px] px-2.5 py-2.5 sm:py-1 rounded-full ..."
```

**Effect:** Mobile chip tap height: `py-2.5` = 10px top + 10px bottom + text height ≈ 30–32px. Significantly better than 22–24px. Desktop unchanged at `py-1`.

---

## Before / After mobile panel

### Before Sprint 814

| Element | Mobile state |
|---|---|
| Panel width | 90vw, right-aligned — "squeezed desktop sidebar" |
| Header padding | Desktop spacing (20px sides) |
| Subtitle | Always visible — wastes vertical space |
| Close button | 32×32px — below 44px target |
| Quick chips | ~22px tap height — hard to hit accurately |
| Mic button | ✅ 44px (unchanged) |
| Send button | ✅ 44px (unchanged) |

### After Sprint 814

| Element | Mobile state |
|---|---|
| Panel width | 100vw — true full-width drawer |
| Header padding | Compact (16px sides, 16px top) |
| Subtitle | Hidden — page context label remains |
| Close button | ✅ 44×44px |
| Quick chips | ✅ ~30–32px tap height |
| Mic button | ✅ 44px (unchanged) |
| Send button | ✅ 44px (unchanged) |

---

## Desktop behavior preserved

All 5 changes use `sm:` breakpoint — desktop rendering at ≥640px is identical to pre-Sprint-814:

| Property | Desktop (≥ 640px) |
|---|---|
| Panel width | `sm:w-96` = 384px (unchanged) |
| Header padding | `sm:px-5 sm:pt-5 sm:pb-4` (unchanged) |
| Subtitle | `sm:block` (unchanged — visible) |
| Close button | `sm:w-8 sm:h-8 sm:mt-0.5` (unchanged) |
| Chip padding | `sm:py-1` (unchanged) |

---

## Persistence behavior preserved

Sprint 811 persistence changes (`contextSummary`, `suggestions`, `reviewQueueData` not cleared on route change) are in the route-change `useEffect`. This sprint touches only JSX class attributes — the `useEffect` hooks are untouched.

| Persisted state | Status |
|---|---|
| `commandResponse` | ✅ Unchanged (Sprint 801) |
| `contextSummary` | ✅ Unchanged (Sprint 811) |
| `suggestions` | ✅ Unchanged (Sprint 811) |
| `reviewQueueData` | ✅ Unchanged (Sprint 811) |
| `cooThread` | ✅ Unchanged (Sprint 683) |

---

## Safety guardrails preserved

| Guard | Status |
|---|---|
| No DB mutation | ✅ CSS-only changes |
| No RLS change | ✅ Not touched |
| No localStorage | ✅ Not used |
| No sessionStorage | ✅ Not used |
| No DONNA routing changed | ✅ Not touched |
| No voice handlers changed | ✅ Not touched |
| No mic auto-start | ✅ Not touched |
| No audio auto-play | ✅ Not touched |
| No mic permission requested without user action | ✅ Not touched |
| No migrations | ✅ Not created |
| No package installs | ✅ Not installed |
| TypeScript clean | ✅ `npx tsc --noEmit` — no errors |

---

## Estimated score lift

### DONNA Side Panel sub-dimension changes

| Sub-dimension | Sprint 812 | Sprint 814 estimate | Change |
|---|---|---|---|
| Header clarity | 8/10 | 8/10 | 0 |
| Page context visibility | 8/10 | 8/10 | 0 |
| Chip hierarchy | 7/10 | 7/10 | 0 |
| Typography | 9/10 | 9/10 | 0 |
| Debug controls visible | 9/10 | 9/10 | 0 |
| Primary action clarity | 7/10 | 7/10 | 0 |
| **Mobile usability** | **6/10** | **8/10** | **+2** |

Mobile usability from 6 → 8:
- Full-width panel (+1): removes "squeezed sidebar" perception; panel feels intentional as a mobile drawer
- Touch targets (+0.5): close button and chips are now reachable; mic/send were already correct
- Reduced header clutter (+0.5): subtitle hidden on mobile; context label still visible; more content fits above the fold

**DONNA Side Panel score: 82 → 83/100**

(Sub-dimension at 8/10 contributes proportionally across 7 sub-dimensions. Mobile usability is one of 7 sub-dimensions. Sprint 814 change limited to that sub-dimension.)

### Weighted composite

| Dimension | Sprint 812 | Sprint 813 est. | Sprint 814 est. | Weight |
|---|---|---|---|---|
| DONNA Side Panel | 82 | 82 | **83** | 40% |
| DONNA Persistence | 83 | 83 | 83 | 20% |
| Command Understanding | 80 | 80 | 80 | 20% |
| Dashboard Cognitive Load | 80 | ~86 | ~86 | 20% |

**Sprint 814 composite:** (83×0.4) + (83×0.2) + (80×0.2) + (86×0.2)
= 33.2 + 16.6 + 16.0 + 17.2 = **83.0/100**

Net lift from Sprint 812 baseline: **+1.6 composite pts** (81.4 → 83.0)

---

## Recommended Sprint 815

**Option A — Stop/Start Listening Text Commands (+5 pts on Commands)**
"Stop listening" and "Start listening" typed commands route to button-only controls today. Adding phrase detection in `handleCommandSubmit` would lift Commands from 80 → 85.
- Composite lift: +5 × 0.20 = **+1.0 pts → ~84.0**

**Option B — Stale Context Indicator (+3 pts on Persistence)**
Visual badge on `contextSummary` card showing "from [page name]" when context is from a prior route. Persistence: 83 → 86.
- Composite lift: +3 × 0.20 = **+0.6 pts → ~83.6**

**Option C — DONNA Panel Mobile Usability Push 2 (+2 pts on Panel)**
Further mobile improvements: chip wrapping on very small screens, keyboard-safe input area, full-width VoiceInputButton on mobile.
- Composite lift: +2 × 0.40 = **+0.8 pts → ~83.8**

**Recommended: Sprint 815 — Option A (Stop/Start Listening Text Commands)**
Commands dimension is 20% weight. The gap is concrete and measurable: two phrases are button-only with no text path. Adding them is low-risk (no DB writes, no routing changes — just two pattern matches in `handleCommandSubmit`). Composite would reach ~84.0 and position the product for 85+ certification in Sprint 816.

**Projected path to 90+:**

| Sprint | Target | Composite projection |
|---|---|---|
| 812 | Certification | 81.4 ✅ |
| 813 | Daily Command landing | ~82.6 |
| 814 | Mobile panel usability | **~83.0** |
| 815 | Stop/Start text commands | **~84.0** |
| 816 | Stale context indicator + certification | **~85+** |
| 817 | AI Suggestions consolidation | ~86 |
| 818 | Cross-session contextSummary | ~87.5 |
| 819 | Final 90+ certification sprint | ~90+ |

---

## Files changed in Sprint 814

- **Modified** `src/components/assistant/DonnaAssistantButton.tsx` — 5 Tailwind responsive class changes: panel `w-full sm:w-96`, compact header padding, subtitle `hidden sm:block`, close button `w-11 h-11 sm:w-8 sm:h-8`, chip `py-2.5 sm:py-1`
- **Created** `docs/DONNA_PANEL_MOBILE_USABILITY_814.md` — this document
- **Modified** `docs/CHANGELOG.md` — Sprint 814 entry
