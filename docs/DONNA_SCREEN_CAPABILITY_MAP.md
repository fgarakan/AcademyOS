# DONNA Screen Capability Map — Sprint 385

Maps DONNA context registry entries, supported commands, draftable actions, and COO command availability by screen.

**Last updated:** 2026-05-15

Cross-reference: `PROTOTYPE_SCREEN_ADOPTION_MAP.md` for screen details, `SCREEN_BACKEND_READINESS_MAP.md` for readiness ratings.

---

## How to read this document

For each screen:
- **Context registered** — does a `donnaPageContextRegistry` entry exist for this route?
- **COO commands** — which of the 7 COO commands are meaningful on this screen
- **Task contracts wired** — which `DonnaTaskId` server actions are available
- **Draftable actions** — what DONNA can propose on this screen
- **Protected actions** — what DONNA must never do automatically
- **Missing before build** — what must be added before the screen can use DONNA

---

## COO Command Reference

| ID | Natural phrase trigger | Server action |
|---|---|---|
| `recommendation_summary` | "What do you recommend?" | `evaluateRecommendations` (client-side) |
| `attendance_exception_draft` | "Log an attendance exception" | `saveAttendanceExceptionDraftAction` → `proposed_actions` |
| `what_needs_attention` | "What needs my attention?" | `/api/donna/attention` |
| `daily_brief` | "Give me my daily brief" | `/api/donna/brief` |
| `draft_parent_update` | "Draft a parent update for [player]" | `saveParentUpdateDraftAction` → `proposed_actions` |
| `coach_brief` | "Prepare coach briefs" | `draft_coach_communication` → `proposed_actions` |
| `show_review_queue` | "What needs approval?" | `getDonnaReviewQueueAction` |

---

## Task Contract Reference

| DonnaTaskId | Server action wired? | Sprint |
|---|---|---|
| `create_class_template` | Yes — `saveAssistantTemplateDraftAction` | 270 |
| `create_fitness_template` | Yes — `saveFitnessTemplateDraftAction` | 271 |
| `populate_session_from_template` | Yes — `populateSessionBlocksAction` | 271 |
| `create_session` | Yes — `createSessionDraftAction` | 270 |
| `capture_coach_note` | Yes — `captureCoachNoteAction` | 270 |
| `draft_parent_update` | Yes — `saveParentUpdateDraftAction` | 275 |
| `draft_player_note` | Yes — `saveDraftPlayerNoteAction` | 276 |
| `review_level_readiness` | Yes — `reviewLevelReadinessAction` | 366 |
| `handle_attendance_exception` | Yes — `saveAttendanceExceptionDraftAction` | 372 |
| `adjust_curriculum` | Yes — `adjustCurriculumDraftAction` | 366 |
| `draft_coach_communication` | Yes — `draftCoachCommunicationAction` | 282 |
| `create_group` | No — stub only | — |
| `assign_player_to_group` | No — stub only | — |
| `summarize_player_progress` | No — stub only | — |
| `recommend_template_for_group` | No — stub only | — |

---

## Screen 1 — Director Command Center (`/director/command-center`)

**Context registered:** YES — `donnaPageContextRegistry['/director/command-center']`
Screen name: `"Command Center"`

**COO commands available:** All 7
- `recommendation_summary`, `attendance_exception_draft`, `what_needs_attention`, `daily_brief`, `draft_parent_update`, `coach_brief`, `show_review_queue`

**Task contracts wired:** All 11 wired tasks available
- `create_class_template`, `create_fitness_template`, `populate_session_from_template`, `create_session`, `capture_coach_note`, `draft_parent_update`, `draft_player_note`, `review_level_readiness`, `handle_attendance_exception`, `adjust_curriculum`, `draft_coach_communication`

**Draftable actions:**
- Class template draft → Save Template button
- Fitness template draft → Save Template button
- Session creation draft → Save Session button
- Attendance exception draft → Queue for Review button
- Parent update draft → Save Draft button
- Coach communication draft → Save Draft button
- Player note draft → Save Note button

**Protected actions (never auto-execute):**
- No session creates without director approve
- No parent communications sent without explicit approve
- No audit_logs bypass

**Missing before build:**
- Nothing. This route is DONNA-capable at Level 8.
- Sprint 391: remove legacy `DirectorAssistantPanel` (predates COO layer)

---

## Screen 2 — DONNA Executive Panel (global component)

**Context registered:** YES for existing director routes (see table below)

**Context registry status:**

| Route | Context registered | Screen name |
|---|---|---|
| `/director` | YES | "Dashboard" |
| `/director/command-center` | YES | "Command Center" |
| `/director/review` | YES | "Review Queue" |
| `/director/curriculum` | YES | "Curriculum" |
| `/director/class-templates` | YES | "Class Templates" |
| `/director/class-templates/[templateId]` | YES | "Class Template" |
| `/director/fitness/templates` | YES | "Fitness Templates" |
| `/director/fitness/templates/[templateId]` | YES | "Fitness Template" |
| `/director/sessions` | YES | "Sessions" |
| `/director/players/[playerId]` | YES | "Player Profile" |
| `/director/players` | YES | "Players" |
| `/director/signals` | YES | "Signals" |
| `/director/today` | **NO — needed Sprint 386** | — |
| `/director/level-up` | **NO — needed Sprint 388** | — |
| `/director/parents` | **NO — needed Sprint 389** | — |
| `/coach/sessions/[sessionId]` | **NO — needed Sprint 390** | — |
| `/coach/recap` | **NO — needed Sprint 390** | — |
| `/platform` | **NO — needed Sprint 392+** | — |

**COO commands available:** All 7 on all director routes

**Missing before build (new screens):**
- Each new screen (Today, Level Up, Parent Comms, Coach Workspace) needs a `donnaPageContextRegistry` entry before the sprint that builds it
- Context entries are cheap — add in the same sprint as the route

---

## Screen 3 — Today's Academy (`/director/today`)

**Context registered:** NO

**Required entry (add in Sprint 386):**
```ts
'/director/today': {
  screenName: "Today's Academy",
  intro: "I can see today's sessions, what needs your attention, and your daily brief.",
  quickActions: ['what_needs_attention', 'daily_brief', 'show_review_queue', 'attendance_exception_draft'],
}
```

**COO commands meaningful on this screen:**
- `what_needs_attention` — primary surface for this screen
- `daily_brief` — anchors the morning brief card
- `attendance_exception_draft` — log exceptions from today's sessions
- `show_review_queue` — surface pending approvals
- `recommendation_summary` — surface curriculum recommendations

**Task contracts relevant:**
- `handle_attendance_exception` — core workflow for today screen
- `capture_coach_note` — quick notes on today's session players
- `create_session` — draft a missing session for today
- `populate_session_from_template` — populate blocks on session missing blocks

**Draftable actions:**
- Attendance exception draft (from session)
- Session creation draft (schedule emergency session)
- Coach note draft (quick observation)

**Protected actions:**
- No automatic session status changes
- No automatic attendance writes
- No bulk write from today screen

**Missing before build (Sprint 386):**
- Add `donnaPageContextRegistry` entry for `/director/today`
- Route `/director/today` does not yet exist
- No additional backend action changes needed

---

## Screen 4 — Sessions / Director Plan / Coach Brief

### `/director/sessions` (list)

**Context registered:** YES — `donnaPageContextRegistry['/director/sessions']`
Screen name: `"Sessions"`

**COO commands available:** All 7
**Task contracts relevant:** `create_session`, `populate_session_from_template`, `draft_coach_communication`, `capture_coach_note`

### `/director/sessions/[sessionId]` (detail)

**Context registered:** NO

**Required entry (add in Sprint 387):**
```ts
'/director/sessions/[sessionId]': {
  screenName: "Session",
  intro: "I can draft a coach brief, capture notes, or help populate this session's blocks.",
  quickActions: ['draft_coach_communication', 'capture_coach_note', 'populate_session_from_template'],
}
```

**COO commands meaningful on this screen:**
- `draft_coach_communication` — primary action from session detail
- `capture_coach_note` — observation during session review
- `populate_session_from_template` — fill empty blocks
- `show_review_queue` — check status of prior session drafts

**Draftable actions:**
- Coach brief draft (from session detail → `draft_coach_communication`)
- Block population draft (`populate_session_from_template`)
- Session modification draft (TBD — stub)

**Protected actions:**
- Session status changes require approval
- Coach brief NEVER auto-sends to coach

### `/coach/sessions/[sessionId]` (coach workspace)

**Context registered:** NO

**Required entry (add in Sprint 390):**
```ts
'/coach/sessions/[sessionId]': {
  screenName: "Session Workspace",
  intro: "I can help capture notes, log attendance exceptions, or submit your recap.",
  quickActions: ['capture_coach_note', 'attendance_exception_draft'],
}
```

**Note:** DONNA is currently `academy_director`-gated. Coach DONNA panel is a future sprint. Context entry can be pre-registered but panel will not render until coach-gating is added.

---

## Screen 5 — Coach Recap Flow (`/coach/sessions/[sessionId]` wrap-up tab)

**Context registered:** NO (same as session workspace above)

**DONNA for coach:** Not yet available. `DonnaAssistantButton` is director-gated.

**COO commands when coach DONNA is built:**
- `attendance_exception_draft` — "Everyone was here except Lucas"
- `capture_coach_note` — "Capture a note about Sarah"

**Draftable actions when coach DONNA is built:**
- Coach note draft
- Attendance exception draft

**What must NOT be added to coach portal yet:**
- No COO commands requiring director data (daily brief, attention report)
- No parent-facing draft commands from coach portal
- No level movement commands from coach portal

**Missing before build:**
- `/coach/recap` dedicated route (Sprint 390)
- DONNA coach portal: separate sprint, not Sprint 390 scope
- Context entry for `/coach/sessions/[sessionId]` (Sprint 390)

---

## Screen 6 — Level Up / Readiness Review (`/director/level-up`)

**Context registered:** NO

**Required entry (add in Sprint 388):**
```ts
'/director/level-up': {
  screenName: "Level Up Review",
  intro: "I can see which players are ready for advancement and help you review their readiness gates.",
  quickActions: ['review_level_readiness', 'recommendation_summary', 'show_review_queue'],
}
```

**COO commands meaningful on this screen:**
- `recommendation_summary` — curriculum category recommendations
- `show_review_queue` — level movement items in review queue
- `review_level_readiness` — trigger full readiness evaluation for a player

**Task contracts relevant:**
- `review_level_readiness` — wired (Sprint 366). MOST IMPORTANT for this screen.
- `summarize_player_progress` — task contract exists, server action NOT wired (stub)

**Draftable actions:**
- Readiness review proposal (→ `proposed_actions` → director approval → `finalize_player_placement()`)
- Player progress summary (stub, not yet wired)

**Protected actions (architecture red lines):**
- DONNA NEVER automatically advances a player's level
- `finalize_player_placement()` is the ONLY RPC that activates/levels a player
- Level change proposals MUST go through `proposed_actions` → explicit director approval
- No bulk level changes

**Missing before build (Sprint 388):**
- Add `donnaPageContextRegistry` entry for `/director/level-up`
- Route `/director/level-up` does not yet exist

---

## Screen 7 — Parent Communication Center (`/director/parents`)

**Context registered:** NO

**Required entry (add in Sprint 389):**
```ts
'/director/parents': {
  screenName: "Parent Communications",
  intro: "I can draft parent updates, surface pending approvals, and check private lesson requests.",
  quickActions: ['draft_parent_update', 'show_review_queue'],
}
```

**COO commands meaningful on this screen:**
- `draft_parent_update` — primary action for this screen
- `show_review_queue` — filter to parent_update action_type
- `coach_brief` — related comms workflow

**Task contracts relevant:**
- `draft_parent_update` — wired (Sprint 275)
- `draft_coach_communication` — wired (Sprint 282)

**Draftable actions:**
- Parent update draft (→ parent-safe filter → `proposed_actions` → director approval)

**Protected actions:**
- Parent communications NEVER send automatically
- All drafts pass `sanitizeParentFacingText` before director sees them
- Director must explicitly approve before any content reaches parent portal
- External email/SMS delivery: NOT built — approved communications are staged but not auto-delivered

**Missing before build (Sprint 389):**
- Add `donnaPageContextRegistry` entry for `/director/parents`
- Route `/director/parents` does not yet exist

---

## Screen 8 — Multi-Academy Portal (`/platform`)

**Context registered:** NO

**Required entry (add in Sprint 392+):**
```ts
'/platform': {
  screenName: "Platform Portal",
  intro: "Platform overview. I can help navigate to an academy.",
  quickActions: [],
}
```

**COO commands available:** None defined at platform level yet.

**Draftable actions:** None. Platform-level DONNA is a future scope item.

**Missing before build (Sprint 392+):**
- `platform_roles` table must be formalized in `database.types.ts` (requires migration)
- Cross-academy aggregation queries not built
- Platform-level DONNA scope not yet defined
- DONNA context entry for `/platform`

---

*Last updated: Sprint 385*
