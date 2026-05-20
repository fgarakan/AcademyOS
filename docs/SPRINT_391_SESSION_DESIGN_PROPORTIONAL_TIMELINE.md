# Sprint 391 — Session Design Proportional Timeline V1

**Date:** 2026-05-20
**Sprint:** 391
**Status:** Complete

---

## Context from Sprint 387D audit

The 387D audit gave `SessionDesignStep` **7/10** with one specific gap:

> "Prototype timeline uses proportional flex widths (block.duration as flex value) with time labels. AcademyOS uses equal-width bars (flex-1). Add proportional sizing and duration labels to bring timeline preview to prototype standard."

The existing timeline bar rendered every selected block as `flex-1` — equal width regardless of the block's implied time weight. A session heavy on Live Ball looked identical to a session built around Assessment Moments. This made the "Default session shape" preview misleading.

---

## What changed

### `SessionDesignStep.tsx` — `duration` added, timeline upgraded

**Before:**

```tsx
// SESSION_BLOCKS — no duration field
{ id: 'technique-blocks', label: 'Technique Blocks', ... }

// Timeline bar — equal widths
<div className="flex h-6 rounded-lg overflow-hidden gap-px">
  {selectedBlocks.map(block => (
    <div
      key={block.id}
      title={block.label}
      className={['flex-1', block.barColor, 'opacity-70'].join(' ')}
    />
  ))}
</div>
// No duration labels
```

**After:**

#### 1. `duration` field added to every block

| Block | Duration (min) | Rationale |
|---|---|---|
| Technique Blocks | 20 | Substantial coach-led work |
| Live Ball Heavy | 25 | Dominant block — largest proportion |
| Constraint Games | 15 | Moderate, engaging games |
| Point Play Progression | 15 | Moderate, competitive practice |
| Stations + Rotations | 20 | Multi-skill coverage |
| Assessment Moments | 10 | Brief, targeted checkpoints |
| Fitness Integrated | 10 | Supplementary conditioning |

Duration values represent relative weight in a default session, not a locked 60-minute template. They communicate proportion visually.

#### 2. Timeline bar — proportional widths

```tsx
<div className="flex h-6 rounded-lg overflow-hidden gap-px">
  {selectedBlocks.map(block => (
    <div
      key={block.id}
      title={`${block.label} — ${block.duration} min`}
      className={[block.barColor, 'opacity-70'].join(' ')}
      style={{ flex: block.duration }}
    />
  ))}
</div>
```

`style={{ flex: block.duration }}` replaces `flex-1`. A 25-minute block is visually 2.5× wider than a 10-minute block when both are selected. The tooltip on hover shows the block name and duration.

#### 3. Duration label row

```tsx
<div className="flex gap-px mt-1">
  {selectedBlocks.map(block => (
    <div
      key={block.id}
      className="overflow-hidden text-center"
      style={{ flex: block.duration }}
    >
      <span className="text-[8px] font-mono text-text-muted/50">{block.duration}m</span>
    </div>
  ))}
</div>
```

A second flex row mirrors the bar proportions exactly (`style={{ flex: block.duration }}`). Each cell shows its duration in minutes (`20m`, `25m`, etc.) centered under its bar segment. `overflow-hidden` prevents label overflow on narrow segments (Assessment / Fitness at 10 min with many blocks selected).

---

## What was preserved

- All 7 `SESSION_BLOCKS` — ids, labels, descriptions, color, barColor — unchanged
- Legend pills below the timeline — unchanged
- DONNA confirmation bubble — unchanged
- Block selection toggle logic — unchanged
- Navigation (Back / Continue / Skip for now) — unchanged
- Safety footer — unchanged
- `OnboardingStepHeader` — unchanged
- "How this shapes your system" info box — unchanged

---

## Visual behavior

| Selected blocks | Result |
|---|---|
| 1 block | Full bar width for that block, its label centered |
| 2 blocks equal duration | 50/50 split |
| Live Ball (25) + Assessment (10) | ~71% / ~29% split — Live Ball visually dominant |
| All 7 blocks | Proportional segments: 25 + 20 + 20 + 15 + 15 + 10 + 10 = 115 total units |

---

## TypeScript

Clean. `npx tsc --noEmit` passes with no errors. `style={{ flex: block.duration }}` is valid — React inline styles accept numeric `flex` values.

---

## Files changed

**Modified:**
- `src/components/onboarding/steps/SessionDesignStep.tsx` — `duration` added to each block; timeline bar changed from `flex-1` to `style={{ flex: block.duration }}`; duration label row added below bar
- `docs/CHANGELOG.md` — dated entry added

**Created:**
- `docs/SPRINT_391_SESSION_DESIGN_PROPORTIONAL_TIMELINE.md` — this document

---

## Parity improvement

| Area | Before | After |
|---|---|---|
| Timeline bar widths | Equal (flex-1) | Proportional (flex: duration) |
| Duration labels | Missing | Added (font-mono, muted, centered) |
| Tooltip on hover | Block name only | Block name + duration |
| SessionDesignStep parity score | 7/10 | ~9/10 |

---

## Recommended next sprint

**Sprint 392 — AcademyDna Landing Visual Polish V1**

The 387D audit gave `AcademyDnaLanding` **6/10**. The prototype has a subtle radial glow behind the headline, a slightly different headline copy pattern ("Meet DONNA" vs current AcademyOS headline), and a cleaner hero section. This is a low-effort visual improvement that closes the last remaining parity gap in the onboarding landing screen.

Alternatively, if the onboarding parity work is considered complete: the **Player Upload sprint** (parsing the `academy_os_player_import_roster.csv` and building a bulk-import flow at `/director/players/import`) is the highest-priority product sprint remaining.
