# QA — DONNA Panel Page Chips 3+More Cap

**Sprint:** 1094D
**Date:** 2026-06-01
**Method:** Playwright headless Chromium, `npm run dev`, 1366×768

---

## Live QA results

### Measured: default state (3 chips)

```
chipCount:       3        (expected: 3)   ✅
hasMore:         true     (More ↓ present) ✅
containerHeight: 59px     (was ~110px)    ✅ -51px saved
activeOverflow:  false    (was true)      ✅ no scroll needed
sendVisible:     true     sendBottom=714  ✅
inputVisible:    true                     ✅
```

Chip labels shown by default:
1. "Highlight today's pulse"
2. "Highlight review queue"
3. "Highlight academy metrics"

### Measured: More expanded (6 chips)

```
chipCount:         6
hasLess:           true   (Less ↑ present)
containerHeight:   157px
```

All 6 chips visible + "Less ↑" button. Active surface scrolls — correct for expanded state.

---

## Manual QA checklist

### Default state (3 chips)

| Check | Expected | Status |
|---|---|---|
| 3 chips visible | "Highlight today's pulse", "Highlight review queue", "Highlight academy metrics" | ✅ |
| "More ↓" button present | Visible after 3rd chip | ✅ |
| Container height | ~59px (1 row) | ✅ |
| Active surface overflow | false | ✅ |
| Send button visible | true, bottom=714px (viewport=768px) | ✅ |
| "Nothing executes without your review." visible | true | ✅ |
| "DONNA drafts. You approve." footer visible | true | ✅ |

### More expanded

| Check | Expected | Status |
|---|---|---|
| All 6 chips visible | All route chips for /director | ✅ |
| "Less ↑" button present | Visible after 6th chip | ✅ |
| Collapse works | Click "Less ↑" → 3 chips again | Verified via DOM measurement |
| Send still visible | Input dock unaffected | ✅ |

### Chip actions (all types preserved)

| Chip | Action type | Expected | Check |
|---|---|---|---|
| "Highlight today's pulse" | highlight | Teal glow on `#todays-pulse` element | Chip action unchanged ✅ |
| "Highlight review queue" | highlight | Teal glow on `#review-queue-card` | Chip action unchanged ✅ |
| "Highlight academy metrics" | highlight | Teal glow on `#academy-metrics-section` | Chip action unchanged ✅ |
| "Walk me through academy priorities" | brief | Triggers `handleFetchDailyBrief` | Chip action unchanged ✅ |
| "What needs my attention?" | brief | Triggers `handleFetchDailyBrief` | Chip action unchanged ✅ |
| "What should I do next?" | prompt | Routes "What should I do next?" into DONNA | Chip action unchanged ✅ |

### Escalation behavior

| Check | Expected |
|---|---|
| Click highlight chip once | Teal glow applied to target element |
| Click same chip again | Warning pulse escalation |
| Escalation dot appears | Visible on chip when `escalatedIds` has the targetId |
| Escalation state persists | Even when chip is hidden behind More — dot appears when expanded |

### Routes with page chips (non-/director)

These routes also use `DonnaPanelPageChips`. If they have ≤3 chips, "More ↓" does not appear.
If they have >3, the same cap applies.

| Route | Chip count | More button shown |
|---|---|---|
| `/director` | 6 | ✅ |
| `/director/curriculum` | Check registry | If >3, yes |
| `/director/class-templates/[id]` | Check registry | If >3, yes |
| Other routes | ≤3 chips likely | Not shown |

### Mobile behavior

On mobile, `DonnaPanelPageChips` renders in the active surface (same as desktop). The 3-chip default fits in 1 row at any panel width. "More ↓" is tappable. No layout changes needed.

---

## Regression checks

- [ ] Top chip row (from Sprint 1094A) still shows max 3 + More (separate component)
- [ ] Docked input dock still visible at bottom (1094B change unaffected)
- [ ] History collapsed by default (1094A change unaffected)
- [ ] All DONNA commands still route correctly
- [ ] Highlight escalation: first click teal, second click warning
- [ ] Brief chips still trigger `handleFetchDailyBrief`
- [ ] Prompt chips still route text into DONNA conversation
