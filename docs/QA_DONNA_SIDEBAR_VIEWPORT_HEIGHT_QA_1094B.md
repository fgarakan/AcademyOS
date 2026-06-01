# QA — DONNA Sidebar Viewport Height QA

**Sprint:** 1094B
**Date:** 2026-06-01

---

## Test setup

Resize browser window to each target viewport. Open DONNA panel. Check that input dock is visible without scrolling in each state listed below.

Use browser DevTools → Responsive mode or manually resize window.

---

## Viewport targets

| Viewport | Panel height (desktop) | Notes |
|---|---|---|
| 1440×900 | 900px | Large laptop |
| 1366×768 | 768px | **Most common laptop** |
| 1280×800 | 800px | MacBook Air 13" |
| 1024×768 | 768px | Small laptop / tablet |
| 375×667 (iPhone SE) | 607px (−60px mobile nav) | Mobile narrow |

---

## QA state matrix

For each viewport, verify each state:

### State 1 — Fresh open, no response

| Check | Expected |
|---|---|
| Open DONNA panel | No scrollbar in panel body |
| Input dock visible | Textarea + mic + Send visible at bottom |
| "Nothing executes without your review." | Visible below Send |
| "DONNA drafts. You approve." | Visible in footer |
| Active surface shows | Greeting card + DonnaPanelPageChips + disclosure pills |

**Expected at 1366×768:** Active surface ~400px; content ~180px — fits ✓

---

### State 2 — After asking "What should I do here?"

| Check | Expected |
|---|---|
| Response appears in active surface | DONNA bubble with answer |
| Input dock still visible | Not pushed offscreen |
| Can type a follow-up immediately | No scroll needed to reach input |

**Expected at 1366×768:** Content area ~368px; response ~200px — fits ✓

---

### State 3 — After daily brief loads

| Check | Expected |
|---|---|
| DonnaDailyBriefCard visible | Shows header + urgent section + 1 normal section |
| Input dock visible | Not pushed below viewport |
| "Show full brief" button visible | If more sections exist |
| No outer panel scroll | Active surface contains all brief content |

**Expected at 1366×768:** Content area 368px; brief 348px — fits with 20px margin ✓

---

### State 4 — After "What needs attention?"

Same as state 2. Attention report appears as a command response card.

---

### State 5 — History with 3+ turns, collapsed (default)

| Check | Expected |
|---|---|
| Only latest turn visible | User bubble + DONNA bubble |
| "History (N earlier) ↑" button visible | Below the latest turn |
| Input dock visible | Not affected by collapsed history |

---

### State 6 — History expanded

| Check | Expected |
|---|---|
| Click "History (N earlier) ↑" | All prior turns appear (max 5, max-h-[260px] bounded) |
| Active surface may scroll | Scrollbar appears inside active surface, not in outer panel |
| Input dock still visible | Docked position unchanged |
| "Hide history ↓" button visible | Allows collapsing back |

---

### State 7 — Daily brief collapsed (show less)

| Check | Expected |
|---|---|
| Default brief state | 1-2 sections visible |
| "Show full brief" button present | Tapping it expands |
| Input dock visible | Not affected |

---

### State 8 — Daily brief expanded

| Check | Expected |
|---|---|
| Click "Show full brief" | All sections visible |
| Active surface scrolls | Outer panel scroll is acceptable for expanded secondary content |
| Input dock still visible | Always docked, never scrolled away |

---

### State 9 — Dev tools collapsed (default)

| Check | Expected |
|---|---|
| In development/local env | "Dev tools ↓" toggle visible at bottom of active surface |
| Collapsed by default | No dev panel content visible |
| Input dock not affected | Still visible |

---

### State 10 — Dev tools expanded (development only)

| Check | Expected |
|---|---|
| Click "Dev tools ↓" | DonnaDeveloperTools panel appears |
| Active surface scrolls | Expected — dev tools are secondary content |
| Input dock still visible | Docked position unchanged |

---

### State 11 — Mic blocked / voice unavailable

| Check | Expected |
|---|---|
| Voice not available | VoiceInputButton renders as text note (~12px) instead of button |
| Dock is shorter | Less height used (button is gone) |
| Textarea + Send still visible | Director can still type |

---

### State 12 — Listening state

| Check | Expected |
|---|---|
| Click mic button | Listening badge in header |
| Interim transcript area appears in dock | ~80px added to dock temporarily |
| Dock may grow during listening | Acceptable — this is a temporary active state |
| Typing still works | Textarea accessible, may need scroll to reach during heavy interim display |

---

### State 13 — Mobile layout (375px width)

| Check | Expected |
|---|---|
| Panel opens full-width | w-full on mobile |
| Dock above mobile command bar | `bottom-[60px]` maintains clearance |
| Chips row | 3 visible + More toggle |
| Input dock | Compact — textarea + mic + Send |
| Brief scroll | Active surface scrolls for brief content on small height |

---

## Regression checks

- [ ] DONNA label ("DONNA") still visible in panel **header** (even though it's hidden in compact dock)
- [ ] "Review-first" badge still in header
- [ ] Voice status badge (Thinking/Listening/Speaking) still in header
- [ ] Pressing Enter in textarea still sends
- [ ] Mic button still starts voice session
- [ ] Suggestion chips NOT visible in docked area (suppressed via `hideChips=true, compact=true`)
- [ ] Context/Suggestions/Actions disclosure pills still work
- [ ] Escape key still closes panel
- [ ] Minimize button still works
- [ ] Existing DONNA commands ("what do I need to do today?", "open review queue", etc.) still route correctly
- [ ] Onboarding flow still shows question + Play voice button on first open (onboarding bypasses compact mode because it uses the full DonnaVoiceLayer non-compact rendering when `onboardingStep` is active)

---

## Height calculations (reference)

Post-1094B fixed section heights:
- Header: ~88px
- Chip row (3 chips + More): ~36px
- Docked input (compact): **~206px**
- Footer: ~38px
- **Total fixed: ~368px**

Active surface available at key viewports:
- 900px: 532px
- 768px: 400px (content area 368px)
- 800px: 432px (content area 400px)
- 607px (mobile): 239px (content area 207px — brief scrolls, acceptable)
