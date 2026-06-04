# DONNA Proactive Pilot Guide V1 — QA

Sprint: Mega Sprint 1801–1810
Date: 2026-06-04

## Purpose

Help a first-time director (e.g. Brian Dabul) use AcademyOS without Farshad sitting next to him.

Every brief answers:
1. What is this page for?
2. What should I look at first?
3. What should I do next?
4. What can I ask DONNA?

---

## Design rules

| Rule | How enforced |
|------|--------------|
| Once per route per session | sessionStorage key `donna_pilot_routes_seen_v1` |
| Dismissible | × button always visible |
| Evidence-safe | Engine uses live counts only when passed; honest fallback otherwise |
| Approval-safe | "Do next" never says to bypass review pipeline |
| Desktop-only | `hidden lg:block` |
| No mutations | Read-only display; no DB writes |

---

## Supported routes

| Route | Canonical key | Brief focus |
|-------|--------------|-------------|
| `/director` | `director_dashboard` | Review queue count, wrap-up coverage |
| `/director/review` | `director_review` | Items waiting for approval |
| `/director/today` | `director_today` | Today's sessions, missing wrap-ups |
| `/director/players` | `director_players` | Player directory navigation |
| `/director/players/[uuid]` | `director_player_profile` | Active priorities from player context |
| `/director/curriculum` | `director_curriculum` | Coverage gaps |
| `/director/sessions` | `director_sessions` | Session schedule, wrap-up coverage |
| `/director/templates` | `director_templates` | Template library |
| `/director/kpi` | `director_kpi` | KPI metrics |

---

## QA Test Scenarios

### Scenario 1 — Director Dashboard brief
1. Log in as director on a fresh session (clear sessionStorage or open incognito tab).
2. Navigate to `/director`.
3. **Expected:** Card appears in bottom-right (above DONNA button). Shows:
   - Header: "DONNA — Director Dashboard"
   - "What is this" line
   - "Look first" section (with live pending count if available)
   - "Do next" section (approval-safe)
   - Suggested question chip
4. **Expected:** If `pendingCount > 0`, "Look first" mentions the count.
5. **Expected:** Card is `hidden` on mobile.

---

### Scenario 2 — Review Queue brief
1. From a fresh session, navigate to `/director/review`.
2. **Expected:** Card appears with Review Queue brief.
3. **Expected:** "Do next" says to read each item and click Approve or Reject — no shortcut or bypass.
4. **Expected:** `confidence` is `data` if pendingCount was passed.

---

### Scenario 3 — Cooldown: once per route per session
1. See brief on `/director`. Dismiss it.
2. Navigate to `/director/review`. See brief.
3. Navigate back to `/director`.
4. **Expected:** No brief shown for `/director` (already seen this session).
5. **Expected:** Each route shows at most once per session.

---

### Scenario 4 — Player Directory brief
1. Navigate to `/director/players`.
2. **Expected:** Brief tells director to look for orange/red flagged players.
3. **Expected:** "Do next" says to click a player to open their profile.
4. **Expected:** No player-specific counts claimed (template confidence).

---

### Scenario 5 — Player Profile brief with context
1. Open a player profile. (PlayerProfileDonnaRegistrar must be mounted on the page.)
2. **Expected:** If `session.playerProfileContext.activePriorityCount > 0`, brief shows that count.
3. **Expected:** If context is null, brief shows generic "Check coach notes and active priorities."
4. **Expected:** "Do next" says to use action buttons for level changes — not the chat.

---

### Scenario 6 — Ask DONNA button
1. See any brief card.
2. Click "Ask DONNA" or the suggested question chip.
3. **Expected:** DONNA panel opens. Suggested question is pre-filled and auto-submitted.
4. **Expected:** Brief card dismisses after click.
5. **Expected:** Existing approval guardrails in DONNA panel remain intact.

---

### Scenario 7 — CTA button (Review Queue only)
1. Navigate to `/director` when pendingCount > 0.
2. **Expected:** Card shows "Open review queue" link → `/director/review`.
3. For routes where no CTA is defined, no link shown.

---

### Scenario 8 — Curriculum brief
1. Navigate to `/director/curriculum`.
2. **Expected:** Brief explains page purpose (curriculum structure, levels, drills).
3. **Expected:** "Do next" suggests asking DONNA about gaps and getting a draft proposal to review.
4. **Expected:** No live counts claimed — confidence is `template`.

---

### Scenario 9 — New session resets cooldown
1. Complete Scenario 3 above (routes seen).
2. Close and reopen the browser tab (sessionStorage is cleared).
3. Navigate to `/director`.
4. **Expected:** Brief appears again (new session).
5. Confirm: sessionStorage key `donna_pilot_routes_seen_v1` is empty.

---

### Scenario 10 — Unsupported routes show no card
1. Navigate to `/director/command-center` or any unsupported route.
2. **Expected:** No brief card appears.
3. Navigate to `/director/onboarding`.
4. **Expected:** No brief card appears (not in supported route list).

---

## Deferred (future sprints)

| Feature | Reason deferred |
|---------|----------------|
| Per-player brief with specific player data | Requires player data at layout level |
| Quiet mode / proactivity settings UI | Separate sprint; lower priority |
| AI-generated dynamic briefs | Requires LLM integration approval |
| Brief for coach/parent/player portals | Director pilot first |
| Auto-dismiss after N seconds | Explicit director control preferred |

---

## Acceptance Checklist

- [ ] Brief card appears on supported routes (first visit per session)
- [ ] Card answers: What is this? Look first. Do next. Ask DONNA.
- [ ] Live pending count appears in briefs where relevant
- [ ] "Do next" is always approval-safe (no bypass instructions)
- [ ] Card is dismissible via × button
- [ ] Cooldown: once per route per session via sessionStorage
- [ ] "Ask DONNA" opens panel with suggested question auto-submitted
- [ ] Card hidden on mobile (`hidden lg:block`)
- [ ] No brief on unsupported routes
- [ ] New session (new tab) resets all cooldowns
- [ ] TypeScript clean (`npx tsc --noEmit`)
- [ ] No DB writes, no mutations, no approvals triggered
