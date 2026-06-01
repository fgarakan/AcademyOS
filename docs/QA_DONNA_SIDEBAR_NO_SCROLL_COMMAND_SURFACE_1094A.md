# QA — DONNA Sidebar No-Scroll Command Surface

**Sprint:** 1094A
**Date:** 2026-06-01

---

## Test environment

- Browser: Chrome / Edge (desktop, 1280×800 or larger)
- Role: academy_director
- Page: any director route (e.g. `/director`, `/director/players`)

---

## Critical path checks

### 1. Panel opens without internal scroll

| Step | Expected |
|---|---|
| Open DONNA panel | Panel fits in viewport — no scrollbar visible inside the panel body |
| No active response yet | Sees: header + chips + greeting card + DonnaPanelPageChips + disclosure pills + docked input dock + footer |
| Docked input dock | Text input + mic button + Send always visible at bottom, above "DONNA drafts. You approve." |

### 2. Send a message — response appears without forcing scroll

| Step | Expected |
|---|---|
| Type "What needs my attention?" in input dock | Input is visible, no scroll needed to reach it |
| Press Enter or Send | DONNA thinking indicator appears briefly |
| Response arrives | Appears in the active surface above the input dock |
| Input dock stays visible | Text input + mic + Send never pushed offscreen |

### 3. Conversation history — collapsed by default

| Step | Expected |
|---|---|
| Send a second message | Active surface shows only the latest turn |
| "History (N earlier) ↑" button visible | One click expands all prior turns (max 5, max-h-[260px] bounded) |
| "Hide history ↓" visible when expanded | One click collapses back to last turn |

### 4. Chip row — max 3 visible + More toggle

| Step | Expected |
|---|---|
| Open panel as director | At most 3 chips visible in chip row (e.g. "What do I need to do today?", "What needs my attention?", "What can you help me do here?") |
| More ↓ button visible | When more chips exist, "More ↓" button appears |
| Click More ↓ | All chips revealed |
| Click Less ↑ | Returns to 3 visible |

### 5. Suggestion chips not duplicated

| Step | Expected |
|---|---|
| Open panel | Suggestion chips appear in the TOP chip row only |
| Docked input dock | NO suggestion chips below the text input — only voice button + Send + safety note |

### 6. Voice input still works

| Step | Expected |
|---|---|
| Click mic button in docked input dock | Listening indicator appears in header (Listening badge) |
| Speak a phrase | Interim transcript shows in docked area while listening |
| Phrase confirmed | Routed through normal command handling (same as before) |
| "Nothing executes without your review." | Visible below the Send button |

### 7. God Mode response fits without scroll

| Step | Expected |
|---|---|
| Send a phrase that triggers God Mode | God Mode loading (Thinking…) shows in active surface |
| Response arrives | DonnaResponseCard renders in active surface above docked input |
| Input dock stays visible | No forced scroll to reach input |

### 8. Daily brief / workflow cards

| Step | Expected |
|---|---|
| Type "What should I do today?" | Daily brief card loads in active surface |
| Docked input still visible | Input dock not pushed offscreen |
| Dismiss brief | Active surface shrinks; input dock unchanged |

### 9. Active workflow (guided task)

| Step | Expected |
|---|---|
| Start a task (e.g. "capture coach note") | GenericDraftPanel renders in active surface |
| Scroll within active surface if needed | Outer panel stays stable; only active surface scrolls if content is very tall |
| Docked input always visible | Text input never hidden |

### 10. Mobile behavior

| Step | Expected |
|---|---|
| Open panel on mobile (<640px) | Full-width drawer above DONNADirectorMobileCommandBar |
| Docked input | Visible above footer |
| Chips | Max 3 visible + More toggle |
| Touch targets | min-h-[44px] on all buttons |

### 11. Existing DONNA commands still work

| Command | Expected |
|---|---|
| "What do I need to do today?" | Routes to daily brief |
| "What needs my attention?" | Routes to attention report |
| "Open review queue" | Opens review queue panel |
| "Walk me through this" | Starts COO conversational response |
| Any God Mode query | Routes to LLM orchestrator |
| Brian Alpha Sandbox trigger phrase | Shows sandbox disclosure (if authorized) |
| Deep Mode broad query | Shows first-pass response gating |

### 12. Review-first safety language present

| Check | Expected |
|---|---|
| "Review-first" badge in header | Visible |
| "Nothing executes without your review." | Visible below Send button in docked input |
| "DONNA drafts. You approve." | Visible in footer |

---

## Regression checks (should still work)

- [ ] Minimize/expand button preserves conversation
- [ ] Escape key closes panel
- [ ] Panel re-opens on page navigation (sessionStorage restore)
- [ ] Context / Suggestions / Actions disclosure pills toggle correctly
- [ ] Dev tools button (non-production) shows/hides correctly
- [ ] Quick Capture drawer opens when Capture mode triggered
- [ ] Onboarding flow (if director name unknown) still shows question + Play voice button

---

## Known acceptable limitations

- Very tall workflow cards (GenericDraftPanel with many fields) may still require active-surface
  scroll when both a draft AND a response are shown simultaneously. This is acceptable — the
  input dock stays docked and the director can scroll the active surface if needed.
- On extremely small viewports (<480px height), the docked input + footer may leave very little
  space for the active surface. This is an edge case; standard mobile height (667px+) is fine.
