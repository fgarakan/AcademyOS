# DONNA Sidebar AIQS 10/10 Audit
## Sprint 783 — DONNA Sidebar AIQS 10/10 Upgrade V1

**Component:** `src/components/assistant/DonnaAssistantButton.tsx`
**Audit date:** 2026-05-25
**Standard:** AIQS v1.0 + DONNA Conversational Quality standard
**Auditor:** Claude (Sprint 783)

---

## Current Sidebar Structure (Pre-Sprint 783)

```
[Sparkles button — bottom-right, fixed, violet gradient]

[aside — slides in from right, w-96]
│
├── HEADER (px-5 pt-5 pb-4)
│   ├── Sparkles icon (lime/10 bg)
│   ├── "DONNA" (text-sm font-semibold)
│   ├── "Review-first" badge (text-[9px] lime pill)
│   ├── Voice status badges — up to 8 states (all text-[9px])
│   │   Speaking | Listening | Paused | Stopped | Ready |
│   │   Mic blocked | Voice unavailable | Thinking…
│   ├── "Director Operations Assistant" (text-[10px] text-text-muted)
│   ├── DonnaReviewQueueBadge (if pending count > 0)
│   └── [X] close button
│
├── CHIP ROW (px-4 py-2.5, overflow-x-auto)
│   Director chips: Review Today | Prepare Coaches | Player Progress |
│                   Parent Updates | What can DONNA do here? | Ask Anything
│   Coach chips: My Sessions | Player Notes | What can DONNA do here? | Ask Anything
│
├── SCROLLABLE BODY (px-4 py-4 space-y-3)
│   ├── Page actions card (conditional — if showPageActions)
│   ├── Greeting/onboarding card (conditional — first open, no active thread)
│   │   ├── Priority hint (if review queue > 0)
│   │   ├── "Walk me through academy priorities" button
│   │   └── Coach quick actions (if coach, not on session page)
│   ├── DonnaVoiceLayer (voice state + input textarea + prompt suggestions)
│   ├── COO conversation thread (last 5 turns, if thread > 0)
│   ├── DonnaWorkflowCards (template draft, generic draft, etc.)
│   ├── "Ask about this page" lime button
│   ├── Mode section:
│   │   ├── Review Queue button (director-only, always visible)
│   │   ├── "More options" toggle (collapsed by default)
│   │   └── Mode list (Guide / Find / Capture / Explain / Create Template)
│   └── Quick actions for this page (if page has tasks)
│
└── FOOTER (px-4 py-3)
    └── "DONNA drafts. You approve." (text-[11px] lime)
```

---

## Part 1 — AIQS Sidebar Score (Pre-Sprint 783)

### Category 1 — Purpose Clarity (10 points)

| Check | Status | Notes |
|---|---|---|
| Panel name is clear | ✅ | "DONNA" headline; "Director Operations Assistant" subtitle |
| Purpose within 5 seconds | ⚠️ | Subtitle at `text-[10px]` is too small; name visible but role unclear at a glance |
| Content organized by purpose | ⚠️ | Chip row + greeting + mode buttons + voice layer compete for entry point |
| Role-specific framing | ✅ | Director vs. coach chips; role check enforced |

**Score: 7/10**

---

### Category 2 — Primary Action Clarity (10 points)

| Check | Status | Notes |
|---|---|---|
| Primary entry point obvious | ❌ | 6 chips + "Ask about this page" + mode buttons + input all compete |
| Director chips match natural intent | ❌ | "Review Today", "Prepare Coaches", "Player Progress", "Parent Updates" are nav shortcuts, not questions |
| Input area is the primary surface | ⚠️ | Input is inside DonnaVoiceLayer which is buried after greeting/chips |
| Empty state (no conversation) gives direction | ⚠️ | Greeting card is present but has 3 competing CTAs |

**Score: 5/10**

---

### Category 3 — Cognitive Load (15 points)

| Check | Status | Notes |
|---|---|---|
| No duplicate sections | ✅ | Deduplication from Sprint 750 (thread vs commandResponse) |
| No competing command surfaces | ⚠️ | Chip row + Ask about this page + Mode buttons + Input = 4 entry points |
| Header badge cluster is calm | ❌ | Up to 8 voice state badges; only 1 shows at a time but code complexity leaks |
| Mode list collapsed by default | ✅ | Sprint 746 "More options" toggle helps |
| Greeting card is focused | ⚠️ | 3 conditional CTAs inside greeting card (priority hint + daily brief + wrap-up) |
| Workflow cards extracted | ✅ | Sprint 384 extracted DonnaWorkflowCards |
| Contextual task shortcuts | ✅ | Page-specific shortcuts visible in context |

**Score: 8/15**

---

### Category 4 — Visual Hierarchy (10 points)

| Check | Status | Notes |
|---|---|---|
| DONNA name is visually dominant | ✅ | `text-sm font-semibold` — largest element in header |
| Subtitle is legible | ❌ | `text-[10px] text-text-muted` — too small, too low contrast |
| Chip labels are appropriately small | ✅ | `text-[11px]` chips — correct scale for navigation chips |
| Mode buttons have internal hierarchy | ⚠️ | 3 text sizes per button (label/desc/safe-status); safe-status at `text-[10px]` |
| Footer "DONNA drafts. You approve." | ✅ | `text-[11px] lime` — clearly visible, appropriate weight |
| Conversation thread is contained | ✅ | `max-h-[280px] overflow-y-auto` prevents overflow |

**Score: 6/10**

---

### Category 5 — Typography (10 points)

| Element | Current | Standard | Status |
|---|---|---|---|
| DONNA name | `text-sm` (14px) | ≥14px | ✅ |
| Subtitle "Director Operations Assistant" | `text-[10px]` | ≥12px | ❌ |
| Voice status badges | `text-[9px]` | 11px (color-paired) | ❌ |
| Review-first badge | `text-[9px]` | 11px (color-paired) | ❌ |
| Chip labels | `text-[11px]` | ≥11px (color-paired) | ✅ |
| Greeting text | `text-[13px]` | ≥14px body (near-miss) | ⚠️ |
| Page actions card header | `text-[10px]` | ≥12px | ❌ |
| Page actions card footer | `text-[10px]` | ≥12px | ❌ |
| Mode button labels | `text-[12px]` | ≥14px for actions | ⚠️ |
| Mode button descriptions | `text-[11px]` | ≥11px (ok) | ✅ |
| Mode button safe status | `text-[10px]` | ≥12px | ❌ |
| "What would you like?" section label | `text-[10px]` | ≥12px | ❌ |
| Quick actions section label | `text-[10px]` | ≥12px | ❌ |
| Footer text | `text-[11px]` | ≥11px (safety note) | ⚠️ |
| `text-text-muted` contrast | ≈2.6:1 | 4.5:1 (WCAG AA) | ❌ (systemic) |

**Score: 5/10**

---

### Category 6 — Spacing and Layout (10 points)

| Check | Status | Notes |
|---|---|---|
| Panel width (`w-96 max-w-[90vw]`) | ✅ | Good width; responsive |
| Header padding | ✅ | `px-5 pt-5 pb-4` — generous |
| Chip row padding | ✅ | `px-4 py-2.5` — fine |
| Body padding | ✅ | `px-4 py-4 space-y-3` |
| Footer padding | ✅ | `px-4 py-3` |
| Mobile bottom offset | ✅ | `sm:bottom-0 bottom-[60px]` accounts for bottom tab bar |
| Chip row horizontal scroll | ⚠️ | Needed for 6 chips; slightly jarring on mobile |
| Conversation thread contained | ✅ | `max-h-[280px] overflow-y-auto` |

**Score: 8/10**

---

### Category 7 — Role Fit (10 points)

| Check | Status | Notes |
|---|---|---|
| Director chips are director-relevant | ✅ | "Review Today", "Prepare Coaches" etc. are director topics |
| Coach chips are coach-appropriate | ✅ | "My Sessions", "Player Notes" etc. |
| Role boundary enforcement | ✅ | `isTaskAllowedForRole()` on all task launches |
| Director language is premium/calm | ⚠️ | "Prepare Coaches" reads like a button, not a natural question |
| DONNA feels like a personal assistant | ⚠️ | Current chips feel like nav shortcuts, not conversational entry |

**Score: 8/10**

---

### Category 8 — Accessibility (10 points)

| Check | Status | Notes |
|---|---|---|
| Panel `role="dialog"` | ✅ | ARIA semantics present |
| `aria-modal="true"` | ✅ | |
| `aria-label` on panel | ✅ | `DONNA_FULL_LABEL` |
| Close button `aria-label` | ✅ | "Close assistant" |
| `text-text-muted` contrast | ❌ | ≈2.6:1 systemic failure |
| `text-[9px]`/`text-[10px]` labels | ❌ | Below minimum for operational text |
| Touch targets for Sparkles button | ✅ | Large enough button |
| Chip touch targets (`py-1`) | ⚠️ | Borderline — `text-[11px] px-2.5 py-1` may not reach 44px |
| Focus management on open | ⚠️ | No explicit autoFocus on input |

**Score: 5/10**

---

### Category 9 — State Quality (5 points)

| State | Status | Notes |
|---|---|---|
| Loading | ✅ | "Thinking…" badge; individual loading booleans |
| Speaking | ✅ | "Speaking" badge in header |
| Listening | ✅ | "Listening" with animate-pulse |
| Idle/empty | ✅ | Greeting card on first open |
| Voice error | ✅ | Human-readable error messages |
| Session memory | ✅ | `donnaChatSessionMemory`, `donnaSafeSessionMemory` |
| Operator active state | ✅ | Sprint 779 — operator step tracking |

**Score: 4/5** *(−1: 8 possible voice status badges in header creates confusing states cluster)*

---

### Category 10 — DONNA Integration (5 points)

| Check | Status | Notes |
|---|---|---|
| Page-aware | ✅ | `resolvePageContext(pathname)` |
| Prompt suggestions by page | ✅ | `getDonnaPromptSuggestions(pathname)` |
| Page actions by context | ✅ | `getAvailableActionsForContext(uiActionRole, pathname)` |
| Persists across route changes | ✅ | Sprint 686 — `useDonnaSessionContext` |
| Daily brief intent routing | ✅ | Sprint 780 — `matchesDailyBriefIntent` |
| Operator step advance | ✅ | Sprint 779 — `handleOperatorStepAdvance` |

**Score: 5/5**

---

### Category 11 — Trust and Safety (5 points)

| Check | Status | Notes |
|---|---|---|
| Footer "DONNA drafts. You approve." | ✅ | Clear, visible |
| "Review-first" header badge | ✅ | Present |
| Mode safe-status per mode button | ✅ | Each mode shows approval requirement |
| Role boundary enforcement | ✅ | Task-level role checks |
| No direct mutations from chips | ✅ | Chips navigate or set text, no DB mutations |

**Score: 5/5**

---

### AIQS Total (Pre-Sprint 783)

| Category | Max | Score |
|---|---:|---:|
| Purpose clarity | 10 | 7 |
| Primary action clarity | 10 | 5 |
| Cognitive load | 15 | 8 |
| Visual hierarchy | 10 | 6 |
| Typography | 10 | 5 |
| Spacing / layout | 10 | 8 |
| Role fit | 10 | 8 |
| Accessibility | 10 | 5 |
| State quality | 5 | 4 |
| DONNA integration | 5 | 5 |
| Trust / safety | 5 | 5 |
| **Total** | **100** | **66** |

---

## Part 2 — Conversational Quality Score (Pre-Sprint 783)

| Dimension | Score | Max | Notes |
|---|---:|---:|---|
| Intent understanding | 7 | 10 | Sprint 780 excellent for daily brief; COO handles many query types |
| Natural language friendliness | 6 | 10 | Handles variants well; chips use action verbs not natural questions |
| Persistence | 8 | 10 | Panel open across routes (Sprint 686); session memory maintained |
| Page awareness | 8 | 10 | Context registry + prompt suggestions + action registry per page |
| Action clarity | 7 | 10 | Page actions panel shows what DONNA can do; safety labels present |
| Human approval boundaries | 9 | 10 | Footer + "Review-first" badge + per-mode safe status |
| Response tone | 7 | 10 | COO router produces human language; TTS available |
| Voice readiness | 8 | 10 | Full pipeline — realtime → browser TTS → fallback |
| Multi-turn flow | 7 | 10 | Conversation controller; chat thread last 5 turns; operator steps |
| Helpful default prompts | 4 | 10 | Current chips are nav shortcuts — none match natural conversational start |
| **Total** | **71** | **100** | |

---

## Part 3 — What Makes It Not Yet 10/10

### Primary Gap: Chips Don't Start a Conversation

The 6 director chips are navigation and workflow shortcuts:
- "Review Today" → opens review queue panel (bypasses COO)
- "Prepare Coaches" → fires `dispatchCooCommand('coach_brief')` directly (bypasses intent pipeline)
- "Player Progress" → navigates to `/director/level-up`
- "Parent Updates" → navigates to `/director/parents`
- "What can DONNA do here?" → shows page actions UI card
- "Ask Anything" → focuses the input textarea

None of these match the natural first question a director would ask when opening DONNA. A director's instinct is "What do I need to do today?" or "What needs my attention?" — both of which now have excellent routing via `matchesDailyBriefIntent` (Sprint 780) but are not surfaced as chips.

### Secondary Gap: Typography Below AIQS Minimum

- Header subtitle: `text-[10px]` (10px) — the thing that explains what DONNA is
- Page actions card: `text-[10px]` labels
- Greeting card DONNA label: `text-[10px]`
- Mode section: `text-[10px]` labels, `text-[10px]` safe-status text
- Quick actions section: `text-[10px]` header

### Systemic Gaps (not fixable per-component)

- `text-text-muted` contrast (~2.6:1) — requires System Sprint 1 design token fix
- Voice status badge cluster (9px) — decorative paired with color; acceptable but dense

---

## Part 4 — Changes Implemented in Sprint 783

### Change 1 — Replace Director Chips (Primary Goal)

**Old director chips:**
```
Review Today | Prepare Coaches | Player Progress | Parent Updates | What can DONNA do here? | Ask Anything
```

**New director chips (Sprint 783):**
```
What do I need to do today? | What needs my attention? | What's on the agenda? |
What should I review first? | Walk me through today. | What can you help me do here?
```

**Routing:** All 6 chips call `handleCommandSubmit(chipText)` — the same function used by the typed text input. This routes through the full DONNA intent pipeline:
1. Onboarding check
2. Attendance command early-check
3. Conversation controller (active draft routing)
4. Sprint 322 controller draft routing
5. Voice safety guard
6. Operator step advance (Sprint 779)
7. Phrase guards (review queue → daily brief → attention)
8. COO router → `routeDonnaPrompt()`
9. Page context / module / fallback

**Intent matching:**
- "What do I need to do today?" → `matchesDailyBriefIntent` ✅ (`what do i need to do today` in pattern list)
- "What needs my attention?" → `matchesDailyBriefIntent` ✅ (`what needs my attention` added Sprint 780)
- "What's on the agenda?" → `matchesDailyBriefIntent` ✅ (`on the agenda` in pattern list)
- "What should I review first?" → `matchesDailyBriefIntent` ✅ (`what do i need to review` variant → COO routing)
- "Walk me through today." → `matchesDailyBriefIntent` ✅ (`walk me through today` in pattern list)
- "What can you help me do here?" → COO router → page context answer

**Safety:** Chips do not bypass role checks, do not directly execute official actions, do not mutate data. `handleCommandSubmit` routes through all safety guards before any action.

### Change 2 — Typography Upgrades (8 instances)

| Location | Old | New |
|---|---|---|
| Header subtitle | `text-[10px]` | `text-xs` |
| Page actions card header | `text-[10px]` | `text-xs` |
| Page actions card footer | `text-[10px]` | `text-xs` |
| Greeting card DONNA label | `text-[10px]` | `text-xs` |
| Coach quick actions label | `text-[10px]` | `text-xs` |
| "What would you like?" section label | `text-[10px]` | `text-xs` |
| Mode button safe-status text | `text-[10px]` | `text-xs` |
| Quick actions section header | `text-[10px]` | `text-xs` |

All upgraded from 10px to 12px (`text-xs`) — meets AIQS Category 5 metadata minimum.

---

## Part 5 — AIQS Score (Post-Sprint 783)

| Category | Max | Pre-783 | Post-783 | Delta |
|---|---:|---:|---:|---:|
| Purpose clarity | 10 | 7 | 7 | 0 |
| Primary action clarity | 10 | 5 | 7 | **+2** |
| Cognitive load | 15 | 8 | 9 | **+1** |
| Visual hierarchy | 10 | 6 | 7 | **+1** |
| Typography | 10 | 5 | 6 | **+1** |
| Spacing / layout | 10 | 8 | 8 | 0 |
| Role fit | 10 | 8 | 9 | **+1** |
| Accessibility | 10 | 5 | 5 | 0 |
| State quality | 5 | 4 | 4 | 0 |
| DONNA integration | 5 | 5 | 5 | 0 |
| Trust / safety | 5 | 5 | 5 | 0 |
| **Total** | **100** | **66** | **72** | **+6** |

---

## Part 6 — Conversational Quality Score (Post-Sprint 783)

| Dimension | Pre-783 | Post-783 | Delta | Notes |
|---|---:|---:|---:|---|
| Intent understanding | 7 | 7 | 0 | Unchanged — routing was already working |
| Natural language friendliness | 6 | 8 | **+2** | Chips now match how directors naturally ask |
| Persistence | 8 | 8 | 0 | Already strong |
| Page awareness | 8 | 8 | 0 | Already strong |
| Action clarity | 7 | 7 | 0 | |
| Human approval boundaries | 9 | 9 | 0 | |
| Response tone | 7 | 7 | 0 | |
| Voice readiness | 8 | 8 | 0 | |
| Multi-turn flow | 7 | 7 | 0 | |
| Helpful default prompts | 4 | 8 | **+4** | 6 natural question chips routed through full pipeline |
| **Total** | **71** | **76** | **+5** | |

---

## Part 7 — Is DONNA Persistent?

**YES — with one qualification.**

Evidence of persistence:
- Panel open state: `useDonnaSessionContext()` — `panelOpen`, `openDonnaPanel`, `closeDonnaPanel` survive route changes (Sprint 686). The panel does not close when the user navigates between director pages.
- Session memory: `donnaChatSessionMemory` records turns; `donnaSafeSessionMemory` stores recent prompts and summaries. Both survive within the same browser session.
- Draft persistence: `donnaDraftPersistence` (sessionStorage) restores active drafts across route changes.
- Operator state: `useRef` and local React state for active operator — persists within the session as long as the component is mounted.
- Review queue count: fetched on mount and cached; refreshes on panel open.

Qualification:
- **Page reload clears all React state.** A hard refresh or full navigation (outside Next.js client routing) resets the conversation. True cross-session persistence (resuming yesterday's conversation) does not exist. For the current use case (director uses DONNA within a single working session), this is appropriate.

---

## Part 8 — Is DONNA Conversational?

**YES — at a functional level. Not yet at a premium level.**

What works:
- Natural language variants understood via `matchesDailyBriefIntent`, `matchDirectorWorkflowCommand`, COO router intent classification
- Multi-turn aware: conversation controller tracks active draft state; chat thread shows last 5 turns
- Operator step flow: Sprint 779 — operator advances, cancels, completes via natural language
- Context-aware responses: page context loaded from `resolvePageContext(pathname)`
- Voice I/O supported: full pipeline from speech recognition → text → intent routing → TTS response
- Safety-conscious: DONNA explains boundaries; high-risk actions gated

What's not yet premium:
- DONNA doesn't proactively tell the director what happened since their last session (no cross-session summary on open)
- DONNA's response style varies by intent path — COO router responses are good; legacy fallback responses are more robotic
- DONNA can't ask a single focused clarification (it has clarification infrastructure but UX doesn't surface it cleanly)
- Full conversational memory (referencing a player or session from 3 turns ago by name) is partial — `getContextualPrefix` provides some continuity but not full entity tracking

---

## Part 9 — Remaining Gaps for True 10/10

| Gap | Severity | Fix path |
|---|---|---|
| `text-text-muted` contrast failure throughout panel | High | System Sprint 1 — design token fix |
| Voice status badge cluster in header (9px badges) | Medium | Future: consolidate to one-line indicator |
| `text-[9px]` badges throughout (review-first, status, count) | Medium | System Sprint 2 — micro-text audit |
| No cross-session conversation summary on open | Medium | Future: "Since your last session, here's what changed" |
| DONNA can't ask focused clarifying questions naturally | Medium | Future: `directorClarificationEngine.ts` integration |
| Mode button labels at `text-[12px]` (below 14px for action labels) | Low | Future typography pass |
| No explicit autoFocus on input when panel opens | Low | Add `autoFocus` to textarea on panel open |
| Chip touch targets (`py-1`) may be below 44px minimum | Low | Future: increase to `py-1.5` or `py-2` |

---

## Part 10 — Safety Guardrails

All safety guardrails verified intact after Sprint 783:

- ✅ **Chips route through `handleCommandSubmit`** — same function as typed text, subject to all the same safety guards
- ✅ **No chip bypasses role check** — `isTaskAllowedForRole()` is called inside intent routing
- ✅ **No chip directly writes to DB** — all mutations still require operator confirmation → proposed_actions → director review
- ✅ **Footer "DONNA drafts. You approve."** unchanged
- ✅ **"Review-first" header badge** unchanged
- ✅ **Mode safe-status labels** still visible (now at `text-xs` instead of `text-[10px]`)
- ✅ **`execute_approved_action()` is still the only path to execution** — chips cannot bypass this
- ✅ **Role boundaries enforced** via `donnaRoleBoundaries.ts` — no chip gives director access to coach-only flows or vice versa

---

## Final Classification

> ## DECISION 3: DONNA SIDEBAR USABLE — NEEDS CONVERSATIONAL DEPTH

**Rationale:**

DONNA's infrastructure is strong. Sprint 780 daily brief routing, Sprint 779 operator step advance, Sprint 686 persistence, Sprint 747/748 chat bubbles — these make DONNA fundamentally sound.

The 6 conversational chips (Sprint 783) close the biggest single gap: the entry point. A director can now open DONNA and tap "What do I need to do today?" and get a real contextual response routed through `matchesDailyBriefIntent` → `handleFetchDailyBrief`.

What keeps DONNA from DECISION 2 (STRONG — VOICE/TONE POLISH):
- Systemic contrast failure across the entire panel (requires System Sprint 1)
- `text-[9px]` status badges create visual noise in the header
- No cross-session "welcome back" intelligence
- Response consistency depends on which routing path was triggered — COO router responses are premium, legacy fallback responses are not

What keeps DONNA from DECISION 1 (10/10 READY):
- All of the above, plus the premium conversational experience (proactive awareness, single focused clarification, entity memory across turns) is not yet built

---

## Recommended Next Sprints

| Priority | Sprint | Scope |
|---|---|---|
| 1 | **System Sprint 1** | Design token contrast fix — `text-text-muted` → `#6B6B6B+` across entire app |
| 2 | **System Sprint 2** | Micro-text size audit — `text-[9px]` → `text-[11px]` throughout |
| 3 | **Sprint 784** | DONNA cross-session welcome — "Since your last session, N things changed" on panel open |
| 4 | **Sprint 785** | DONNA clarification flow — one focused question when intent is ambiguous |

---

## Files Changed in Sprint 783

| File | Change |
|---|---|
| `src/components/assistant/DonnaAssistantButton.tsx` | Replace 6 director chips with conversational question chips; upgrade 8 `text-[10px]` → `text-xs` |
| `docs/DONNA_SIDEBAR_AIQS_10_10_783.md` | This document (created) |
| `docs/CHANGELOG.md` | Sprint 783 entry added |
