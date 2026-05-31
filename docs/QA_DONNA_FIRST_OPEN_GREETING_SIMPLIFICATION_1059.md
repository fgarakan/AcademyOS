# QA — DONNA First-Open Greeting Simplification
## Sprint 1059

**Date:** 2026-05-31

---

## A. Director — First Open of Day

| # | Step | Expected | Pass/Fail |
|---|---|---|---|
| A1 | Clear `academyos:donna:lastDonnaGreetingDate:v1` from localStorage to simulate first open | — | — |
| A2 | Open app as director, click DONNA | Panel opens | |
| A3 | Read the greeting card | Shows: DONNA label (lime) + one short sentence only. Example: "Good morning, Brian. I'm ready to help you focus on what matters today." | |
| A4 | Confirm NO second sentence like "Would you like me to walk you through…" | Not visible | |
| A5 | Confirm NO "You're on: [screen name]" text inside greeting card | Not visible — `↳ [screen]` still shows in header | |
| A6 | Confirm NO "N items waiting in your review queue." text inside greeting card | Not visible — badge still shows count in header | |
| A7 | Confirm "Walk me through academy priorities" button IS visible | Visible on first daily open only | |
| A8 | Click "Walk me through academy priorities" | Daily brief loads in panel body | |

---

## B. Director — Subsequent Open (Same Day)

| # | Step | Expected | Pass/Fail |
|---|---|---|---|
| B1 | After first daily open, close panel and reopen DONNA | Panel opens | |
| B2 | Read the greeting card | Shows short page-reentry text. Example: "Hi Brian. I can help you find which players need review…" OR cross-session welcome if prior session data exists | |
| B3 | Confirm NO follow-up second sentence | Not visible | |
| B4 | Confirm NO page context line inside greeting | Not visible | |
| B5 | Confirm NO review queue priority hint inside greeting | Not visible | |
| B6 | Confirm "Walk me through academy priorities" button NOT visible | Not shown — `isFirstOpenToday` is false | |

---

## C. Coach — First Open of Day

| # | Step | Expected | Pass/Fail |
|---|---|---|---|
| C1 | Open app as coach (not on session page), click DONNA | Panel opens | |
| C2 | Read the greeting card | Shows: DONNA label + one primary sentence (e.g. "Good morning, Coach Brian. I'm here to help with your sessions today.") | |
| C3 | Confirm NO follow-up text block | Not visible (coach followUp was "If you have a session to wrap up..." — no longer rendered) | |
| C4 | Confirm NO page context line | Not visible | |
| C5 | Tab chips still present | "My Sessions", "Player Notes", "What can DONNA do here?", "Ask Anything" | |

---

## D. Coach — On Session Page

| # | Step | Expected | Pass/Fail |
|---|---|---|---|
| D1 | Open app as coach on a session detail page (`/coach/sessions/[id]`), click DONNA | Panel opens | |
| D2 | Read the greeting card | Primary greeting shown. NO follow-up. NO page context line. | |
| D3 | Session wrap-up CTA still visible | "This session needs a wrap-up. Start now?" button still appears (gated to session page) | |
| D4 | Click wrap-up CTA | Text input fills with "Help me wrap up this session" | |

---

## E. Onboarding — Not Affected

| # | Step | Expected | Pass/Fail |
|---|---|---|---|
| E1 | Clear `academyos:donna:introCompleted:v1` from sessionStorage | — | — |
| E2 | Open DONNA without director name set | Onboarding starts normally — greeting card shows onboarding question | |
| E3 | "Play Donna voice" button visible | ✓ (onboarding section unchanged) | |
| E4 | DONNA Safety Reminder text visible | ✓ | |
| E5 | Complete onboarding step 1 | Onboarding advances normally | |

---

## F. Header Still Shows Page Context and Review Queue

| # | Step | Expected | Pass/Fail |
|---|---|---|---|
| F1 | Navigate to `/director/players`, open DONNA | Header shows `↳ Players` — greeting card does NOT show "You're on: Players" | |
| F2 | Review queue has pending items | Header badge shows count — greeting card does NOT show "N items waiting" text | |
| F3 | Click review queue badge in header | Navigates to review queue | |

---

## G. Sprint 1057 Voice — Preserved

| # | Step | Expected | Pass/Fail |
|---|---|---|---|
| G1 | Desktop Chrome, mic permitted, click DONNA | Panel opens → **Listening** within ~1 second | |
| G2 | No "Mic blocked" or retry loop | ✓ | |
| G3 | Voice still works alongside simplified greeting | ✓ | |

---

## H. Sprint 1058 Sidebar Reduction — Preserved

| # | Step | Expected | Pass/Fail |
|---|---|---|---|
| H1 | Open DONNA | Context section NOT auto-expanded | |
| H2 | Suggestions section NOT auto-expanded | ✓ | |
| H3 | No commandResponse "review queue" card on first open | ✓ — only badge in header | |
| H4 | Dev tools collapsed by default | ✓ — shows `Dev tools ↓` toggle only | |

---

## I. Regression Checks

| Area | Expected | Pass/Fail |
|---|---|---|
| Text input and Send | Works | |
| God Mode response | Works | |
| Chips (tab chips + page chips) | Still render and work | |
| DonnaPanelPageChips | Still render for registered routes | |
| Workflow cards (draft, brief, attention) | Still appear when explicitly triggered | |
| Response thread (COO / God Mode) | Still renders when conversation active | |
| Greeting card hidden when conversation active | `cooThread.length > 0 \|\| commandResponse` suppresses greeting | |
