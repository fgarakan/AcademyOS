# DONNA Single Presence Architecture V1

**Date:** 2026-06-05
**Sprint:** Mega Sprint 2196–2215 — DONNA Surface Unification V1
**Purpose:** Define the architecture for a single, persistent DONNA across all of AcademyOS.

---

## The Core Principle

There is only one DONNA.

Not:
- A layout DONNA
- A page DONNA
- A curriculum DONNA
- A review DONNA
- A floating DONNA

One DONNA. One voice. One brain. One presence.

A director should never ask: "Which DONNA do I use?"

The answer is always: "DONNA."

---

## What "Single Presence" Means

Single presence does not mean a single component. It means:

1. **One canonical entry point** — `DonnaAssistantButton` (floating shell, bottom-right)
2. **One conversation thread** — `DonnaChatThread` inside the shell, persistent across navigation
3. **One voice system** — `DonnaWakeWordLayer` + `DonnaVoiceLayer` inside the shell
4. **One memory layer** — `DonnaSessionContextProvider` providing shared state
5. **One identity** — DONNA always has the same name, personality, and trust rules regardless of which page is active

Pages may contain a single contextual **DONNA Brief** (max 2 sentences, 1 CTA) that surfaces page-aware intelligence. The brief is not a second DONNA — it is a read-only summary produced by the same DONNA brain, displayed inline for convenience.

---

## Architecture Diagram

```
Director Session
├── DonnaSessionContextProvider (shared memory, invisible)
│   ├── session.pageContext (updated on every route change)
│   ├── session.playerProfileContext (set when a player is active)
│   ├── session.lastModule (last DONNA module interacted with)
│   └── session.lastObjectLabel (last entity name)
│
├── Layout (every director page)
│   ├── [Page Content]
│   │   └── DONNA Brief (one per page — read only, 2 sentences, 1 CTA)
│   │
│   ├── DonnaAssistantButton [fixed, bottom-right] ← THE DONNA
│   │   ├── DonnaChatThread (persistent conversation)
│   │   ├── DonnaVoiceLayer (voice input/output)
│   │   ├── DonnaHighlightBanner (focus UI zones on request)
│   │   ├── DonnaPanelShell (full slide-over panel)
│   │   └── [All draft/approval/intelligence modules]
│   │
│   ├── DonnaWakeWordLayer [global listener] ← voice activation
│   └── DonnaHighlightBanner [overlay] ← highlight system
│
└── [Page navigates] → DonnaSessionContextProvider updates context
                     → DonnaAssistantButton receives new context
                     → Next DONNA response is page-aware
```

---

## The Floating Shell IS THE DONNA

`DonnaAssistantButton` (5500+ lines) is not a "button." It is the complete DONNA operating system:

- Full conversation controller
- Multi-step task flows
- Draft creation and review
- Template workflows
- Curriculum improvement workflows
- Attendance exception workflows
- Level movement workflows
- Parent update workflows
- Voice input (browser + Whisper)
- Predictive suggestions
- Review queue integration
- Coach intelligence briefs
- Director intelligence layer

All of this is accessed through one interface. One button opens everything.

**The floating shell is the answer to "which DONNA do I use?" The answer is the sparkle icon, bottom-right, always.**

---

## Page Briefs Are Not Second DONNAs

Each major route has one embedded DONNA Brief. This brief is:

- Read-only
- Generated server-side from real data
- Max 2 sentences
- Max 1 CTA that either opens the DONNA shell or navigates to relevant UI

The brief is intelligence surfaced on the page for ambient awareness. It is not an interactive DONNA. It does not have an input field. It does not ask for follow-up.

| Route | Brief Component |
|---|---|
| `/director` | `DirectorTodayDonnaBrief` |
| `/director/today` | `DonnaTodayBriefPanel` |
| `/director/curriculum` | `DonnaCurriculumBrief` |
| `/director/review` | `DonnaReviewBriefPanel` |
| `/director/players` | `DonnaScreenBriefStatic` |
| `/director/players/[id]` | No dedicated brief (PlayerProfileDonnaRegistrar provides context to shell) |

---

## What "Persistent" Means

DONNA's conversation persists across:

1. **Page navigation** — Director can ask DONNA "what's wrong with Lucas?" on the players page, navigate to the curriculum page, and DONNA remembers Lucas.
2. **Module changes** — Director can start a draft on the review page, navigate away, return, and DONNA knows the draft is in progress.
3. **Session lifetime** — DONNA's context is maintained in `DonnaSessionContextProvider` for the full browser session.

DONNA resets to a fresh context only on:
- Full page reload
- Explicit logout
- Director closes the DONNA panel and explicitly says "start over"

---

## What Was Removed and Why

### Removed: `DonnaCOOStatusWrapper`

A compact status bar that appeared at the top of every page. It showed:
- Pending count (already in the sidebar badge)
- Workflow label (shown inside the DONNA panel)
- A "DONNA" branding chip

Why removed: It created a second DONNA presence above every page. Directors saw: the sidebar DONNA badge, the status bar DONNA chip, and the floating DONNA button — three DONNA signals on every page before even looking at the content. The status bar added visual noise without adding intelligence unavailable elsewhere.

### Removed: `DonnaDailyCOOBriefSurface`

A once-per-day brief banner that appeared below the status bar. It showed:
- A daily briefing generated by `buildDailyCOOBriefing()`
- A link to `/director/donna` for the full brief
- A dismiss button

Why removed: The `/director` homepage already shows `DirectorTodayDonnaBrief` with equivalent intelligence. The daily brief banner appeared on curriculum pages, review pages, and anywhere the director navigated first that day — jarring and out of context. The homepage brief is always in context. The banner was never in context.

### Removed: `DonnaProactiveBriefCard`

A per-route guide card that appeared in the bottom-right area alongside the floating DONNA button. It showed:
- A "what this page is for" one-liner
- A suggested question to ask DONNA
- A dismiss button

Why removed: It appeared directly next to the floating `DonnaAssistantButton`, creating two DONNA surfaces competing for the same visual zone. Directors saw two options and hesitated. The floating DONNA shell already surfaces suggested questions when opened. The proactive card added one more surface without solving the fragmentation problem.

### Removed: `DonnaCommandSection` (from 3 pages)

An inline text input bar (`DonnaCommandBar` + `DonnaSuggestedQuestions`) embedded in the page content on:
- `/director/review`
- `/director/players`
- `/director/players/[playerId]`

Why removed: The floating `DonnaAssistantButton` is the canonical text entry point for DONNA on every page. Embedding a second text input in the page content creates two "talk to DONNA" entry points. Directors must decide: floating button or inline bar? The inline bar also rendered suggestion chips that duplicated chips available inside the floating shell.

---

## Single Presence — Director Facing Rules

1. The floating sparkle icon (bottom-right) is always THE DONNA.
2. Every other DONNA surface on a page either reads from or opens the floating DONNA.
3. No page has more than one text input for DONNA.
4. No page has more than one DONNA brief.
5. Navigating to a new page does not interrupt an active DONNA conversation.
6. DONNA remembers the last entity discussed within the session.
7. Voice activation ("Hey DONNA") always opens the floating shell — never a different panel.
