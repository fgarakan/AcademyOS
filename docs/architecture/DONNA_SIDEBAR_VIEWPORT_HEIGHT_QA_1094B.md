# DONNA Sidebar Viewport Height QA — Sprint 1094B

**Date:** 2026-06-01
**Sprint:** 1094B
**Scope:** Layout hardening only — no backend, no logic, no migrations.

---

## Context

Sprint 1094A established the no-scroll architecture: DonnaVoiceLayer docked as `shrink-0`,
active surface as `flex-1 overflow-y-auto`, history collapsed by default, chips capped at 3+More.

Sprint 1094B audited the actual pixel heights and found two remaining issues:

1. **At 768px viewport height (1366×768):** the daily brief card overflowed the active surface
   by ~40px because the docked input section was ~278px — too tall.
2. **Active surface `flex-1` lacked `min-h-0`**: without it, flex min-content sizing could
   prevent proper shrinking on some browsers/configurations.

---

## Height audit (post-1094A, pre-1094B)

### Fixed section heights

| Section | Key CSS | Height |
|---|---|---|
| Header | `pt-5 pb-4` shrink-0 | ~88px |
| Chip row | `py-1` shrink-0 | ~36px |
| Docked input | `pt-3 pb-2` + DonnaVoiceLayer `py-3.5` | **~278px** |
| Footer | `py-3` shrink-0 | ~38px |
| **Total fixed** | | **~440px** |

### Docked input breakdown (pre-1094B)

| Element | Height |
|---|---|
| Dock wrapper padding (`pt-3 pb-2`) | 20px |
| Card vertical padding (`py-3.5`) | 28px |
| DONNA label row + `mb-1` | 24px (redundant — header already shows DONNA) |
| Subtitle text + `mb-3` | 28px (redundant when docked) |
| VoiceInputButton + status hint | ~62px |
| Textarea rows=2 + `mt-3` + send row | ~116px |
| **Total** | **~278px** |

### Active surface at 768px viewport (pre-1094B)

| Content state | Content height | Available (308px) | Result |
|---|---|---|---|
| Fresh open + greeting | ~180px | 308px | ✓ |
| One response | ~200px | 308px | ✓ |
| Daily brief (collapsed) | ~348px | 308px | **OVERFLOW 40px** |
| Daily brief (expanded) | ~500px+ | 308px | Scrolls (acceptable) |

---

## Changes made in Sprint 1094B

### 1. `DonnaVoiceLayer.tsx` — `compact?: boolean` prop

When `compact=true`:
- DONNA label row is hidden (saves ~24px — already shown in panel header)
- Subtitle text is hidden (saves ~28px — contextual but redundant when docked)
- Inner div uses `py-2` instead of `py-3.5` (saves ~12px)

Props `hideChips` and `compact` are always `true` in the docked position.

### 2. `DonnaAssistantButton.tsx` — three changes

- **Active surface**: added `min-h-0` class — `flex-1 min-h-0 overflow-y-auto overscroll-contain`
  Prevents flex min-content overflow where the scrollable container refuses to shrink.

- **Dock wrapper**: `pt-2 pb-1` instead of `pt-3 pb-2` (saves ~8px)

- **Docked DonnaVoiceLayer**: receives `compact={true}` alongside existing `hideChips={true}`

---

## Height audit (post-1094B)

### New docked input height

| Element | Height |
|---|---|
| Dock wrapper padding (`pt-2 pb-1`) | 12px |
| Card vertical padding (`py-2`) | 16px |
| ~~DONNA label row~~ | 0 (suppressed) |
| ~~Subtitle text~~ | 0 (suppressed) |
| VoiceInputButton + status hint | ~62px |
| Textarea rows=2 + `mt-3` + send row | ~116px |
| **Total** | **~206px** |

### Fixed sections total (post-1094B)

| Section | Height |
|---|---|
| Header | ~88px |
| Chip row | ~36px |
| Docked input | **~206px** |
| Footer | ~38px |
| **Total fixed** | **~368px** |

### Active surface at key viewports (post-1094B)

| Viewport | Active surface | Content area (−32px) | Daily brief (348px) |
|---|---|---|---|
| 1440×900 | 532px | 500px | ✓ |
| 1366×768 | 400px | **368px** | 348px ✓ |
| 1280×800 | 432px | 400px | ✓ |
| 1024×768 | 400px | 368px | ✓ |
| 607px (mobile) | 239px | 207px | scrolls in active surface (acceptable) |

---

## What is NOT changed

| Feature | Status |
|---|---|
| DonnaVoiceLayer voice logic | Unchanged — `compact` only affects CSS classes |
| VoiceInputButton behaviour | Unchanged |
| Interim transcript display | Unchanged — still shows when listening |
| Pending voice answer editor | Unchanged — still shows when needed |
| Voice heard text | Unchanged |
| `donnaLastResponse` card | Unchanged — still shows when non-null |
| Onboarding question spotlight | Unchanged (compact=false on onboarding screens) |
| All DONNA backend handlers | Unchanged |
| God Mode, Deep Mode, Brian Alpha | Unchanged |

---

## Compact mode — what the docked input shows

In compact mode (docked position), the visible elements are:

1. VoiceInputButton (mic + label + status hint)
2. Textarea rows=2 (`data-donna-input` focusable)
3. Send button (lime, `min-h-[44px]`)
4. "Nothing executes without your review." safety note

Contextual additions (still shown when needed, even in compact mode):
- Interim transcript — when listening with interim text
- Voice permission error — when mic blocked
- Pending voice answer editor — when in guided task mode
- Voice transcript "DONNA heard" — when voice confirmed
- `donnaLastResponse` context card — if non-null (currently always null in docked position)
- Onboarding question spotlight — in guided onboarding mode

---

## Acceptance criteria

| Criterion | Status |
|---|---|
| 1366×768: input visible without scrolling | ✓ |
| 1280×800: input visible without scrolling | ✓ |
| 1440×900: input visible without scrolling | ✓ |
| 1024×768: input visible without scrolling | ✓ |
| Fresh open fits cleanly | ✓ |
| One response fits cleanly | ✓ |
| Daily brief (collapsed) fits at 768px | ✓ |
| Expanded states scroll in active surface only | ✓ |
| Dev tools remain collapsed by default | ✓ |
| Mobile remains usable | ✓ (brief/workflow scroll; input dock always visible) |
| TypeScript | Clean (0 errors) |
