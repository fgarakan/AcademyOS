# Empty States Audit — Sprint 665

**Date:** 2026-05-22
**Scope:** All portals — consistency of empty/no-access states across director, coach, parent, player

---

## Component Standard

`EmptyState` (`src/components/ui/EmptyState.tsx`) is the canonical empty state component. It renders:
- Optional icon in a lime-tinted box
- Bold title
- Optional description text
- Optional action slot

All no-data and no-access states should use `EmptyState` — not raw `<Card><CardContent>` with inline icons and text.

---

## Audit Results by Portal

### Director Portal
| Screen | Empty State | Uses EmptyState | Notes |
|---|---|---|---|
| `/director/review` | No pending actions | Inline text | Low-volume — acceptable |
| `/director/players` | No players yet | Inline text | Acceptable |
| `/director/kpi` | No data | Inline text | Acceptable |

### Coach Portal
| Screen | Empty State | Uses EmptyState | Notes |
|---|---|---|---|
| `/coach` | No assigned players | ✓ Yes | Sprint 659 |
| `/coach` | No recent notes | ✓ Yes (Sprint 659 accountability nudge) | |
| `/coach/sessions` | No sessions | ✓ Yes | |
| `/coach/players` | No players | ✓ Yes | |
| `/coach/players/[playerId]` | No observations | ✓ Yes | |

### Parent Portal
| Screen | Empty State | Uses EmptyState | Notes |
|---|---|---|---|
| `/parent` | No mapping state | Raw Card | Accepted — rich explanation needed |
| `/parent/updates` | No updates | Raw Card | Accepted — contextual |
| `/parent/progress` | No access | Raw Card | Accepted |
| `/parent/wins` | No access | Raw Card | Accepted |

### Player Portal
| Screen | Empty State | Uses EmptyState | Notes |
|---|---|---|---|
| `/player/missions` | No missions | Inline | Acceptable — uses Card |
| `/player/fitness-path` | Profile not linked | ✓ Fixed (Sprint 665) | Was raw Card |
| `/player/practice` | Profile not linked | ✓ Fixed (Sprint 665) | Was raw Card |
| `/player/level-up` | Profile not linked | ✓ Fixed (Sprint 665) | Was raw Card |
| `/player/skill-path` | Profile not linked | ✓ Fixed (Sprint 665) | Was raw Card |

---

## Changes Made (Sprint 665)

Four player portal pages migrated from raw `Card > CardContent > AlertCircle + text` pattern to `EmptyState`:
- `src/app/player/fitness-path/page.tsx`
- `src/app/player/practice/page.tsx`
- `src/app/player/level-up/page.tsx`
- `src/app/player/skill-path/page.tsx`

Each now renders:
```tsx
<EmptyState
  icon={<AlertCircle className="w-5 h-5" />}
  title="Profile not linked"
  description="Ask your director to link your profile to see your [page name]."
/>
```

---

## Outstanding (Low Priority)

| Item | File | Notes |
|---|---|---|
| Parent portal raw Card states | `/parent/` pages | Rich contextual copy — EmptyState would lose that richness |
| Director portal inline states | `/director/` pages | Director is a data-heavy portal — inline states are acceptable |

---

*Audit complete. Player portal is now consistent. Coach portal was already using EmptyState.*
