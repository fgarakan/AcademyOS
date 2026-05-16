# Human Demo Review — Sprint 397

Manual review checklist for Farshad to walk through the director demo path.

**Sprint:** 397
**Date:** 2026-05-16
**Entry point:** `/director/today?demo=1` — start the 5-step guided tour here.
**Reviewer:** Farshad Garakani (Director role)

Cross-reference: `DONNA_OPERATING_GAP_AUDIT.md` for gap analysis, `NEXT_SPRINT_RECOMMENDATION.md` for recommended build order.

---

## Before You Start

Open the app in a browser and log in as the director account. Then navigate to `/director/today?demo=1` to activate the guided demo banner.

**Check these before walking the tour:**
- [ ] Dev server is running (`npm run dev` or `next dev`)
- [ ] You are logged in as `academy_director` role
- [ ] The URL shows `?demo=1`
- [ ] The lime-colored demo banner appears at the top of the screen

---

## Step 1 — Today's Academy (`/director/today?demo=1`)

**Goal of this screen:** Director's morning anchor. Sessions today, risk flags, DONNA quick actions.

### Layout and presence
- [ ] Banner shows "Demo · Step 1 of 5" and the step label "Today's Academy"
- [ ] Page title is "Today's Academy" with today's date
- [ ] Sidebar is visible on left (`w-60`)
- [ ] Four stat cards visible: Sessions Today, Completed, Pending Review, Risk Flags
- [ ] All stat cards show `0` or `--` (test DB is empty — confirm graceful empty state, not a crash)
- [ ] Session list area shows an empty state component, not a blank white box
- [ ] Four DONNA suggestion chips visible below the session list

### DONNA integration
- [ ] DONNA button visible (top right or floating button)
- [ ] Click DONNA button — panel opens to w-96 width
- [ ] Panel header shows "Today's Academy" context intro
- [ ] Four tab chips visible: "Review Today", "Prepare Coaches", "Player Progress", "Parent Updates"
- [ ] Footer shows: "DONNA proposes. You approve. Always in control."
- [ ] Suggestion chips on the page (not in panel) — do they feel clickable and actionable?

### Feel and judgment
- [ ] Does the empty state feel intentional, or does the screen feel broken?
- [ ] Does the stat strip feel like a real operational view?
- [ ] Would a director understand what to do here without a tooltip?

**Notes:**
```
[Farshad's notes here]
```

---

## Step 2 — Sessions (`/director/sessions?demo=1`)

**Goal of this screen:** Week view of all scheduled sessions. Create new session. DONNA can draft and populate.

### Layout and presence
- [ ] Banner shows "Demo · Step 2 of 5"
- [ ] Sessions list renders (empty state if test DB has no sessions)
- [ ] "Create Session" button or CTA is visible
- [ ] Filter row (date range, status) is present and functional

### DONNA integration
- [ ] DONNA panel opens on this route
- [ ] Context intro references sessions (not a generic fallback)
- [ ] "create_session" command is accessible from the panel

### Feel and judgment
- [ ] Is it clear that sessions drive the daily academy operations?
- [ ] Is the relationship between sessions and the "Today" screen obvious?
- [ ] Does the create session flow feel connected to templates?

**Notes:**
```
[Farshad's notes here]
```

---

## Step 3 — Level Up Review (`/director/level-up?demo=1`)

**Goal of this screen:** Aggregate readiness pipeline. Players grouped by urgency. No mutations from this page.

### Layout and presence
- [ ] Banner shows "Demo · Step 3 of 5"
- [ ] Page title is "Level Up Review" or "Readiness Review"
- [ ] Architecture red line badge is visible on the page
- [ ] Stat cards visible: pipeline count(s) and urgency breakdown
- [ ] Empty state shown for player cards (test DB has no pipeline data)
- [ ] "View" CTA links to player profile (read-only navigation)

### DONNA integration
- [ ] DONNA panel opens with level-up context
- [ ] `review_level_readiness` task is accessible from the panel
- [ ] No direct level mutation button visible anywhere on the page

### Feel and judgment
- [ ] Does the "no action from this page" constraint feel safe or frustrating?
- [ ] Is the red line badge legible and explanatory?
- [ ] Would a director know how to initiate a level review from here?

**Notes:**
```
[Farshad's notes here]
```

---

## Step 4 — Parent Communications (`/director/parents?demo=1`)

**Goal of this screen:** Draft and approval workflow for parent updates. 4-step workflow banner. No auto-send.

### Layout and presence
- [ ] Banner shows "Demo · Step 4 of 5"
- [ ] Workflow banner is visible (4 steps: Draft → Review → Approve → Send)
- [ ] Step 4 (Send) is visually dimmed (opacity-50) to indicate it is not live
- [ ] "External delivery is not yet active" notice is visible
- [ ] Empty state for update cards (test DB has no parent_updates)
- [ ] Stat strip: Total, Needs Approval, Approved, Sent

### DONNA integration
- [ ] DONNA panel opens with parent comms context
- [ ] `draft_parent_update` task is accessible from the panel
- [ ] No "Send" button anywhere on the page
- [ ] Review queue CTA links to `/director/review`

### Feel and judgment
- [ ] Does the workflow banner communicate the approval gate clearly?
- [ ] Does the "not yet active" notice feel like a known gap or like something is broken?
- [ ] Would a director trust this screen to draft a parent communication?

**Notes:**
```
[Farshad's notes here]
```

---

## Step 5 — DONNA Command Center (`/director?demo=1`)

**Goal of this screen:** Director dashboard / main command view. DONNA panel is the central interface.

### Layout and presence
- [ ] Banner shows "Demo · Step 5 of 5" with "Tour complete ✓" — no Next → button
- [ ] Exit × button present; clicking it removes `?demo=1` and leaves current route
- [ ] Director dashboard renders: review queue count, signals, recent sessions
- [ ] Review queue badge in header shows pending count (0 in test DB — confirm badge is `0`, not a crash)

### DONNA integration
- [ ] DONNA panel opens
- [ ] All 7 COO commands accessible
- [ ] Tab chips navigate correctly: "Review Today" opens review queue, "Prepare Coaches" dispatches coach_brief, "Player Progress" routes to `/director/level-up`, "Parent Updates" routes to `/director/parents`
- [ ] Any DONNA command that would mutate shows a draft card (not direct execution)

### Feel and judgment
- [ ] Does the DONNA panel feel like a command center or a chatbot?
- [ ] Does the approval boundary copy feel trustworthy?
- [ ] Are the tab chips a useful shortcut, or do they feel redundant with the sidebar?

**Notes:**
```
[Farshad's notes here]
```

---

## Overall Demo Assessment

### First impression (rate 1–5)
- Visual quality of dark/lime design system: `__`
- "This feels like a real product": `__`
- "I would show this to an academy": `__`

### Coherence (rate 1–5)
- The 5 screens feel connected as a system: `__`
- A director would understand the workflow without explanation: `__`
- DONNA feels useful, not just decorative: `__`

### Top 3 things that feel real and polished
1. 
2. 
3. 

### Top 3 things that feel fake, empty, or placeholder
1. 
2. 
3. 

### Critical gaps that must be resolved before a real pilot
1. 
2. 
3. 

### "Nice to have" polish that would impress but isn't blocking
1. 
2. 
3. 

---

## Known Issues to Watch For (Documented Before Review)

The following are known limitations documented before Farshad's review. They are expected and not bugs:

| Screen | Known limitation | Severity |
|---|---|---|
| All director screens | Test DB is empty — all screens show empty states | Expected |
| Today's Academy | UTC date filter — directors UTC+ may see off-by-one late at night | Known gap |
| Level Up | `v_reassessment_pipeline` returns no data in test DB | Expected |
| Parent Comms | External email/SMS delivery not built | Known gap |
| Parent Comms | Private lesson request view not built | Known gap |
| Coach Recap | No DB write — session ID required for full pipeline | Known gap |
| DONNA panel | 4/15 task contracts are stubs (no draft card) | Known gap |
| Sessions | Coach session workspace has no DONNA context | Known gap |
| Platform portal | `/platform` is scaffolded only — no cross-academy data | Expected |

---

*Sprint 397 — Audit only. No code changes.*
