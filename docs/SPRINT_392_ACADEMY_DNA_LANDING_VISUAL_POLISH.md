# Sprint 392 — AcademyDna Landing Visual Polish V1

**Date:** 2026-05-20
**Sprint:** 392
**Status:** Complete

---

## Context from Sprint 387D audit

The 387D audit scored `AcademyDnaLanding` at **6/10**:

> "Required changes: Change headline from 'Let's build your academy operating system.' to 'Meet DONNA —' variant or equivalent AcademyOS copy. Add subtle radial glow behind headline. Consider hero background image at low opacity."
> "Priority: Medium — landing is visible but not blocking DNA flow."

The headline was preserved — the current copy is accurate AcademyOS-specific language and the sprint spec explicitly asked to keep it unless mismatched. The visual depth and card polish items were the higher-priority changes.

---

## What changed

### `AcademyDnaLanding.tsx`

#### 1. Root background token

**Before:** `style={{ background: 'var(--bg-app)' }}`
**After:** `className="flex min-h-screen bg-base"` — uses AcademyOS design token directly.

#### 2. Hero radial glow

An absolutely-positioned `div` with `pointer-events-none aria-hidden="true"` was added behind the hero content:

```tsx
<div
  className="pointer-events-none absolute top-0 left-0 w-[640px] h-[420px]"
  style={{ background: 'radial-gradient(ellipse at 20% 30%, rgba(200,255,0,0.06) 0%, transparent 65%)' }}
  aria-hidden="true"
/>
```

- Lime at 6% opacity — adds warmth and depth without making the brand feel lime-dominant
- Ellipse centered at `20% 30%` — behind the headline, fades completely by 65%
- Does not affect interaction or overflow

#### 3. Setup mode card polish

**Recommended badge:** Moved from inline text inside the label to a standalone pill chip:

**Before:**
```tsx
{mode.recommended && (
  <span className="ml-2 text-[9px] font-bold uppercase tracking-widest text-lime/80">
    Recommended
  </span>
)}
```

**After:**
```tsx
{mode.recommended && (
  <div className="mb-1.5">
    <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-lime/10 border border-lime/25 text-[8px] font-bold uppercase tracking-wider text-lime/80">
      Recommended
    </span>
  </div>
)}
```

The badge is now a dedicated chip on its own row — clearly legible, not buried in the label.

**Selected state strengthened:**

- Border changed from `border-lime/40` to `border-lime/50` with an outer glow ring: `shadow-[0_0_0_1px_rgba(200,255,0,0.15)]`
- Selected indicator dot added at `top-3 right-3` (same corner as Lock icon):

```tsx
{isSelected && !isDeferred && (
  <span className="absolute top-3 right-3 w-4 h-4 rounded-full bg-lime/20 border border-lime/40 flex items-center justify-center">
    <span className="w-1.5 h-1.5 rounded-full bg-lime block" />
  </span>
)}
```

**Deferred cards non-clickable:**

Before, all cards called `setSelectedMode(mode.id)` regardless of supported state. Clicking a deferred card would set it as selected (showing a confusing lime style that the code tried to suppress).

After:
```tsx
onClick={() => { if (!isDeferred) setSelectedMode(mode.id) }}
```

Deferred cards also get explicit `cursor-not-allowed` in their className branch.

#### 4. Begin Setup button

**Before:** `style={{ color: '#030506' }}` — hardcoded hex color.
**After:** `text-base` Tailwind class — uses the AcademyOS `base` token (`#0A0A0A`) for dark text on lime background. Consistent with how other lime buttons work in the codebase.

#### 5. DONNA panel header

- Avatar size increased slightly: `w-9 h-9` → `w-10 h-10`
- Avatar font size: `16px` → `17px`
- Added a very subtle lime ambient shadow on the avatar: `shadow-[0_0_12px_rgba(200,255,0,0.08)]`
- Panel header gets a `bg-lime/[0.02]` tint — just enough to visually anchor the DONNA identity header from the conversation area

#### 6. DONNA landing message

**Before:**
> "I'll help build your starting operating system. Choose a setup mode and I'll walk you through the steps."

**After:**
> "Ready to build your starting system. Choose a setup mode and I'll walk you through each step — adjustments are always available after setup begins."

The updated message sets clearer expectation that adjustments remain available post-selection.

#### 7. Selected mode card in DONNA panel

Added a contextual card in the DONNA conversation area that reflects the currently selected mode (supported modes only):

```tsx
{selectedMode && selected?.supported && (
  <div className="rounded-xl bg-surface-raised border border-border p-3">
    <p className="text-[9px] uppercase tracking-widest font-semibold text-text-muted mb-1">
      Setup mode selected
    </p>
    <p className="text-[12px] text-text-primary font-semibold">{selected.label}</p>
    <p className="text-[10px] text-text-muted mt-0.5">{selected.desc}</p>
  </div>
)}
```

This gives the DONNA panel a live feedback feel — it responds to the director's mode selection.

#### 8. Quick chips section label

Added a `text-[9px] font-bold uppercase tracking-widest text-text-muted` section header above the chips:

```
Quick adjustments
```

This makes the chip area feel more intentional and less like floating buttons.

#### 9. Quick chip hover polish

Added `hover:bg-lime/5` to quick chips — a very subtle lime wash on hover, reinforcing the DONNA/lime identity without being garish.

---

## What was preserved

- Headline: "Let's build your academy operating system." — unchanged
- Subtitle paragraph — unchanged
- Top pill ("AcademyOS — Director Onboarding") — unchanged
- DONNA will create pills — unchanged (all 6)
- Setup mode data (6 modes, 3 supported, 3 deferred) — unchanged
- Begin Setup → `setShowShell(true)` → `<OnboardingShell initialStep={1} />` — unchanged
- Deferred mode deferredCopy text — unchanged
- `handleAsk()` and `donnaDraftNote` state — unchanged
- DONNA input and Ask button — unchanged
- Safety footer: "All selections are saved as a draft. Nothing is applied until Final Activation." — unchanged
- `handleBegin()` gated on `canBegin` — unchanged
- `/director/onboarding` renders `<AcademyDnaLanding />` — unchanged

---

## Safety copy

No copy implies:
- Published
- Sent
- Applied live
- Activated live
- Imported
- Invited

Copy used:
- `"All selections are saved as a draft. Nothing is applied until Final Activation."` — preserved
- `"Draft only — DONNA applies preferences when setup begins."` — preserved
- `"Import setup is not yet available in this flow."` — deferred message
- `"Consultant setup requires a scheduled onboarding session."` — deferred message
- `"Multi-location setup is available in a future release."` — deferred message

---

## TypeScript

Clean. `npx tsc --noEmit` passes with no errors.

---

## Files changed

**Modified:**
- `src/components/onboarding/AcademyDnaLanding.tsx` — hero glow, card polish, DONNA panel improvements
- `docs/CHANGELOG.md` — dated entry added

**Created:**
- `docs/SPRINT_392_ACADEMY_DNA_LANDING_VISUAL_POLISH.md` — this document

---

## Parity improvement

| Area | Before | After |
|---|---|---|
| Hero radial glow | Missing | Added (6% lime radial, top-left) |
| Root bg token | `style={{ background: var(--bg-app) }}` | `bg-base` class |
| Recommended badge | Inline text in label | Standalone pill chip |
| Selected state indicator | Border only | Border + selection dot + outer glow |
| Deferred card click | Selects card (confusing) | No-op (cursor-not-allowed) |
| Begin Setup text color | Hardcoded `#030506` | `text-base` token |
| DONNA mode reflection | None | Live selected-mode card in panel |
| AcademyDnaLanding parity score | 6/10 | ~8/10 |

---

## Recommended next sprint

The 6 onboarding parity sprints (387E–391) and this landing polish sprint are now complete. Overall onboarding parity is estimated at **~8/10** across the full flow.

**Sprint 393 — Player Upload Sprint V1**

Parse `data/player-import/academy_os_player_import_roster.csv`, build a player bulk-import UI at `/director/players/import`, validate rows client-side, and write accepted rows to the `players` table via a server action (existing RLS in place). This is the highest-priority product feature remaining after onboarding parity.
