# QA — DONNA Sidebar 10/10 UX Reduction
## Sprint 1058

**Date:** 2026-05-31

---

## A. First-Open State — Calm and Minimal

| # | Step | Expected | Pass/Fail |
|---|---|---|---|
| A1 | Open app as director, click DONNA | Panel opens | |
| A2 | Count chip rows visible above the input | One chip row only (3 chips OR page chips — not both layers plus a third inside voice card) | |
| A3 | Observe greeting card | Short greeting text only. No quick-action buttons visible for director. | |
| A4 | Observe Context pill | Collapsed. No Context section open below it. Dot appears when context loads but section stays closed. | |
| A5 | Observe Suggestions pill | Collapsed. No recommendations block open by default. Dot appears when data loads. | |
| A6 | Observe Actions pill | Collapsed. No mode list, no review queue card open. | |
| A7 | Check review queue badge in header | Shows pending count if items exist. | |
| A8 | Confirm no "You have X items waiting" card below disclosure bar | Not present on first open. | |
| A9 | Scroll to bottom of panel | No dev tools visible (just the small `Dev tools ↓` toggle in non-production). | |

---

## B. First-Open State — Coach Role

| # | Step | Expected | Pass/Fail |
|---|---|---|---|
| B1 | Open app as coach (not on session page), click DONNA | Panel opens | |
| B2 | Observe greeting card | Greeting text and follow-up only. No "Capture a player note", "What needs attention today?", or "Go to my sessions" buttons in the greeting. | |
| B3 | Observe tab chip row | "My Sessions", "Player Notes", "What can DONNA do here?", "Ask Anything" still present | |
| B4 | Text input works | Type a question → DONNA responds | |

---

## C. Disclosure Pills — Manual Expansion

| # | Step | Expected | Pass/Fail |
|---|---|---|---|
| C1 | Click "Context" pill | Context section expands below the pill | |
| C2 | Context section shows "Ask about this page" button or loading state | ✓ | |
| C3 | Click "Context" pill again | Section collapses | |
| C4 | Click "Suggestions" pill | Suggestions section expands; shows recommendation cards if any | |
| C5 | Click "Actions" pill | Actions section expands; shows mode list (Create Template, Guide me, etc.) | |
| C6 | Open Actions → click "Guide me" | Guided next step appears in panel body | |

---

## D. Review Queue — Badge and Explicit Request

| # | Step | Expected | Pass/Fail |
|---|---|---|---|
| D1 | Director opens DONNA when review queue has items | Header badge shows count. No "You have X items waiting" card below the voice input. | |
| D2 | Ask DONNA: "What's in the review queue?" | DONNA responds with review queue content (normal response path still works) | |
| D3 | Click review queue badge in header | Navigates to review queue | |

---

## E. One-Click Voice (Sprint 1057 Preserved)

| # | Step | Expected | Pass/Fail |
|---|---|---|---|
| E1 | Desktop Chrome, mic permission already granted | Click DONNA once → header shows **Listening** within ~1 second | |
| E2 | Speak a phrase | DONNA hears and responds | |
| E3 | No second mic click required | One click only | |
| E4 | Header voice status badge still cycles: Listening → Thinking → Speaking → Listening | ✓ | |

---

## F. Conversation Active — Thread Appears

| # | Step | Expected | Pass/Fail |
|---|---|---|---|
| F1 | Type a question and send | Response bubble appears in DonnaPanelResponseRenderer | |
| F2 | Greeting card visibility | Suppressed when commandResponse or cooThread is active | |
| F3 | Context/Suggestions/Actions still not auto-expanded | Only expand if user clicks pills or if triggered by explicit DONNA response | |
| F4 | God Mode response | God Mode card renders inside response renderer | |

---

## G. Developer Tools (Non-Production)

| # | Step | Expected | Pass/Fail |
|---|---|---|---|
| G1 | Open DONNA in development environment | Scroll to bottom — see `Dev tools ↓` toggle button only | |
| G2 | DonnaDeveloperTools NOT visible by default | No voice debug state, no reset buttons visible until toggled | |
| G3 | Click `Dev tools ↓` | Section expands; all dev tools visible | |
| G4 | Click `Hide dev tools ↑` | Section collapses | |
| G5 | Close panel and reopen | Dev tools are collapsed again (state resets) | |

---

## H. Preserved Behavior — Regression Checks

| Area | Expected | Pass/Fail |
|---|---|---|
| Text input + Send | Works | |
| God Mode text queries | Works | |
| Workflow cards (draft, attendance, communication) | Appear when explicitly triggered | |
| Daily brief (via "Walk me through academy priorities" button) | Still triggered by first-open director CTA | |
| Chips in voice card | Still appear (route-aware prompt suggestions) | |
| DonnaPanelPageChips | Render correctly for registered routes | |
| Review queue explicit open (`handleOpenReviewQueue`) | Still works | |
| Attendance exception draft | Still works | |
| Sprint 1057 mic pre-authorization | `getUserMedia` call in click handler still present | |

---

## Known Limitations

- Context section no longer auto-opens: users who relied on context appearing automatically must click the "Context" pill once. The dot indicator signals available data.
- Recommendations no longer auto-open: same. Dot indicator on Suggestions pill signals data.
- Review queue notification card removed from first-open: header badge is the primary signal for review queue count.
