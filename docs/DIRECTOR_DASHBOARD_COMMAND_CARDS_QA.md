# Director Dashboard Command Cards — QA Tests

**Sprint:** 155
**Date:** 2026-05-01

---

## Test List

### 1. Top dashboard cards are present

Navigate to `/director`.

**Confirm these 5 command cards appear:**
- Active Players
- Academy Improvement
- Sessions
- Private Lesson Requests
- Academy Alerts

**Pass:** All 5 cards render with a count value and "View details →" affordance.

---

### 2. Top dashboard cards are clickable

Click each card.

| Card | Expected Route |
|---|---|
| Active Players | `/director/players/active` |
| Academy Improvement | `/director/improvement` |
| Sessions | `/director/sessions/overview` |
| Private Lesson Requests | `/director/private-lessons` |
| Academy Alerts | `/director/alerts` |

**Pass:** Each card navigates to the correct route.

---

### 3. Active Players drilldown loads

Navigate to `/director/players/active`.

**Confirm:**
- Page eyebrow: PLAYERS
- Page title: Active Players
- Summary cards: Total Active, With Focus Area, Missing Summary, Needs Review
- Player list with name, level, group, coach, focus area, score, and delta.
- Clicking a player routes to `/director/players/[playerId]`.

**Pass:** Page loads with real data or clean empty state. No TypeScript errors.

---

### 4. Academy Improvement drilldown loads

Navigate to `/director/improvement`.

**Confirm:**
- Page eyebrow: DEVELOPMENT
- Page title: Academy Improvement
- UTR note appears: "UTR-based growth can be enabled once UTR values are imported."
- Summary cards: Avg Improvement, Improving, Flat / No Data, Needs Attention.
- Player list with score and delta.

**Pass:** Page loads. No fake data. UTR note visible.

---

### 5. Sessions drilldown loads

Navigate to `/director/sessions/overview`.

**Confirm:**
- Page eyebrow: SESSIONS
- Page title: Session Overview
- Summary cards: Sessions This Week, Participants, Completed, Missing Recap.
- Session list with name, date, coach, group, participant count, status.
- Recap status shown for completed sessions.

**Pass:** Page loads. Sessions filtered to current week only.

---

### 6. Private Lesson Requests queue loads

Navigate to `/director/private-lessons`.

**Confirm:**
- Page eyebrow: OPERATIONS
- Page title: Private Lesson Requests
- Summary cards: Total, New, Reviewing, Scheduled/Done.
- Request list or empty state.
- Clicking a request card expands it.
- Status can be updated.
- Director notes can be saved.

**Pass:** Page loads. No communications sent on status update.

---

### 7. Parent portal private lesson preview is safe

Navigate to `/parent`.

**Confirm:**
- "Request a Private Lesson" card is visible.
- Form fields are shown but disabled (opacity-50, pointer-events-none).
- "Coming Soon" badge is visible.
- Submit button is disabled.
- No submit action is wired up.

**Pass:** Preview card visible. No live submission possible.

---

### 8. Academy Alerts route loads

Navigate to `/director/alerts`.

**Confirm:**
- Page eyebrow: INTELLIGENCE
- Page title: Academy Alerts
- Summary row: Total Alerts, High Priority, Medium Priority.
- Filter tabs: All, Players, Sessions, Curriculum, Private Lessons, Coach Notes.
- Alert cards show: severity, category icon, title, why it matters, recommended action link.
- Clicking an alert link routes to the correct page.

**Pass:** Page loads. Alerts are deterministic (no AI). Filters work.

---

### 9. Academy Alerts detailed middle panel remains on dashboard

Navigate to `/director`.

**Confirm:**
- Academy Alerts panel is visible in the middle section.
- Shows current alert items with severity, title, and links.
- Panel is separate from the top command card.

**Pass:** Both the top card (count) and the middle panel (detail) are present.

---

### 10. Bottom quick-action tiles are present

Navigate to `/director`.

**Confirm the 4 bottom quick-action tiles:**
- Onboarding Flow → `/director/players/import`
- Class Templates → `/director/class-templates`
- Voice Note AI → `/director/review`
- Academy Intelligence → `/director/alerts`

**Pass:** All 4 tiles present. Routes are correct.

---

### 11. No "weaknesses" or deficit language in player/parent-facing UI

Scan:
- `/director/players/active`
- `/director/improvement`
- `/parent`

**Confirm:**
- "Working On" instead of "Weaknesses"
- "Doing Well" instead of "Strengths" or "Good at"
- "Needs Attention" for director-internal only
- No "deficiencies", "problems", "poor", or "bad"

**Pass:** Language guide terms used consistently.

---

### 12. TypeScript passes

```bash
npx tsc --noEmit
```

**Pass:** Zero errors in sprint-touched files.

---

### 13. No unauthorized mutations

Confirm:
- Updating private lesson request status does NOT send communications.
- Updating private lesson request status does NOT create calendar events.
- Updating private lesson request status does NOT create billing records.
- Parent portal preview form does NOT submit.

**Pass:** All confirmed via code review of `privateLessonActions.ts`.
