# DONNA Final Connected UX Audit — Sprint 1045

**Date:** 2026-05-18
**Sprint:** 1045 — DONNA Final Connected UX Audit V1
**Block:** Phase 5 — DONNA Page Wiring Block (Sprints 1038-1045)

---

## 1. Executive Summary

Phase 5 (Sprints 1038-1045) completes the DONNA page wiring block. All DONNA infrastructure built in Phase 4 (Sprints 1001-1037) is now connected to actual Director and Coach portal pages. Directors reach DONNA from the sidebar. Coaches reach DONNA from home, sessions, and wrap-up. The chat thread, voice shell, context summary, and review queue surface are all wired and working with live data (demo fallback when unauthenticated or no academy data).

**Phase 5 wiring verdict: COMPLETE.**

---

## 2. Director DONNA Connected Experience — 9/10

**Route:** `/director/donna`

**What is connected:**
- `loadDirectorDonnaContext` — live Supabase reads (sessions, pending reviews, wrap-ups, attendance exceptions, evidence drafts, attention flags, academy risks, recommended actions)
- `DonnaContextSummaryCard` — context frame with live/partial/demo indicators
- `DonnaVoiceReadyShell` → `DonnaChatThread` — full chat UI with voice input
- `donnaSuggestedQuestions` (director-scoped) — 4 quick question chips
- `donnaBoundaryResponses` — fires on out-of-scope questions
- `donnaSafeReadActions` — keyword-dispatch for recognized question types
- `donnaChatSessionMemory` — records turns across page session
- `DonnaReviewQueueSurface` — 6 review categories with live counts + CTAs
- Director sidebar entry point (Sparkles, position 2)
- All attention items, academy risks, recommended actions rendered
- Safety notice: "DONNA proposes — you approve"

**Gap:** Chat responses are keyword-driven, not natural language. Complex or ambiguous questions fall back to "I'm not sure." Needs real AI API to reach 10/10.

---

## 3. Coach DONNA Connected Experience — 9/10

**Route:** `/coach/donna`

**What is connected:**
- `loadCoachDonnaContext` — live Supabase reads (sessions today, players, wrap-up status, pending submissions, observation drafts)
- `DonnaContextSummaryCard` — coach-scoped context frame
- `DonnaVoiceReadyShell` → `DonnaChatThread` — coach role chat with voice
- `donnaSuggestedQuestions` (coach-scoped) — 4 quick question chips
- `donnaBoundaryResponses` — blocks director-only requests
- Coach home DONNA card → `/coach/donna` (blue-accented, tappable)
- Coach home Quick Actions tile → `/coach/donna`
- Session brief KPIs, today's sessions list, recommended actions

**Gap:** Same keyword-dispatch limitation as director. "Ask me about a specific player" will not return useful results without real AI.

---

## 4. ChatGPT-Like Usability Score — 7/10

**What works:**
- Message thread with scrolling, timestamps, sender avatars
- User and DONNA bubbles with distinct styling
- Typing indicator (thinking bubble + spinner)
- Suggested question chips auto-populate from role context
- Voice input with interim transcript and send-on-silence
- Auto-scroll to latest message
- Mic / Send buttons in input area
- Press Enter to send
- Shift+Enter for newline in textarea

**What is missing to reach 10/10:**
- Natural language understanding (requires real AI API)
- Streaming responses (currently instant or 600ms simulated delay)
- Multi-turn context within a conversation (session memory records but does not feed back into response generation)
- Richer card-based answers (suggested actions, inline charts)

---

## 5. Role Safety Score — 10/10

All three layers verified:

**Layer 1 — Route protection:** Director pages under `/director` middleware, coach pages under `/coach` middleware. Routing enforces auth before any data loads.

**Layer 2 — Data scoping:** `loadDirectorDonnaContext` queries with `academy_id`. `loadCoachDonnaContext` queries with `academy_id` + `coach_id`. No cross-coach data possible.

**Layer 3 — DONNA response boundaries:** `donnaBoundaryResponses.checkQuestionBoundary()` runs before any response. Coach cannot receive director-only answers. Director cannot act as coach through DONNA.

**Confirmed:** No parent data visible in coach or director DONNA surfaces. No auto-approve paths. No parent-send paths. No curriculum mutations without review.

---

## 6. Workflow Connection Score — 8/10

| Workflow | Connected | Notes |
|---|---|---|
| Director reviews pending items | Yes | Review Queue Surface → `/director/review` |
| Director follows up on missing wrap-ups | Yes | CTA → `/director/sessions` |
| Director checks at-risk players | Yes | Attention Items → `/director/players` |
| Coach submits wrap-up | Yes | Wrap-up alert → `/coach/sessions/[id]/wrap-up` |
| Coach runs session | Yes | Session summaries → `/coach/sessions/[id]` |
| Coach captures observation | Partial | CTA links to `/coach/recap`, form not wired to DONNA |
| Director approves proposed action | Partial | Review Queue Surface links to review page, decision there |
| Coach sees player watch-fors | Partial | Context item mentions players but no per-player brief |

Gap: Player-specific watch-for briefing (per-player observation summary for coaches before sessions) requires `loadPlayerAttentionContext` wiring — not built yet.

---

## 7. Review-First Compliance — 10/10

All DONNA pages:
- Safety notice at bottom of every page ("DONNA proposes — you approve")
- Review Queue Surface footer: "Nothing is approved, sent, or applied until you act"
- Wrap-up page: "Nothing is sent to parents or applied to player profiles" (in DONNA prompt and confirmation)
- Submitted state: "Your wrap-up draft is in the director review queue"
- No "Apply" or "Approve" buttons on DONNA chat surfaces
- No auto-approve paths in `donnaSafeReadActions` or `donnaBoundaryResponses`

---

## 8. Coach Cognitive Load Score — 8/10

**Low friction:**
- Wrap-up: one question at a time, progress rail, skip button
- Coach home: DONNA card is visual and minimal
- DONNA page: recommended actions tell the coach exactly what to do next
- Suggested questions give a starting point without blank-page anxiety

**Friction remaining:**
- Coach DONNA page requires navigating to `/coach/donna` — not reachable inline from a session page
- No DONNA presence inline in session execution (`/coach/sessions/[id]/execute`) yet
- Wrap-up "Submit for Review" does not show which director will review it

---

## 9. Director Command Center Usefulness — 8/10

**Useful now:**
- Real pending review count (live)
- Real missing wrap-up count (live)
- Attention flags from concern observations (live when data exists)
- Review queue surface with category breakdown
- Recommended actions with links
- Direct access to all major director surfaces

**Limited:**
- Curriculum gaps: schema-blocked, shows "Migration pending"
- Academy health trends: not yet wired (no time-series charts in DONNA page)
- Player-level context in DONNA chat: partial (shows count, not list)
- COO command (from COO demo) not integrated into main DONNA page — lives separately at `/director/donna-coo-demo`

---

## 10. Mobile Usability — 7/10

**Works on mobile:**
- Wrap-up flow: designed mobile-first, single column, 100% functional
- Coach home DONNA card: full-width, tappable, readable
- Director DONNA page: stacks to single column on mobile

**Limitations:**
- Director DONNA page: 560px chat shell in single-column stacks below all context panels — means the chat is far down the page on mobile
- Context summary card is small-text-heavy on very small screens
- Review Queue Surface rows are cramped on narrow screens (2 CTAs side by side)

Recommended improvement: make the director DONNA chat the primary top section on mobile, collapse context panels to accordions.

---

## 11. What Is Live (with real Supabase data)

- Pending reviews count: live (queries `proposed_actions.status = 'pending_review'`)
- Today's sessions count: live (queries `sessions.scheduled_date = today`)
- Missing wrap-ups: live (compares session IDs to wrap-up proposed actions)
- Attendance exceptions: live (queries `proposed_actions.target_module = 'attendance'`)
- Attention flags: live (concern observations + absences, last 30/7 days)
- Coach sessions today: live (coach-scoped query)
- Coach wrap-up status: live (per-session check)
- Coach pending submissions: live (coach-scoped proposed_actions)

---

## 12. What Is Demo / Local-Only

- Curriculum gaps: always empty (no curriculum_gaps table populated)
- Parent-safe summary drafts count: hardcoded 0 (schema + pipeline not wired to this count)
- DONNA chat responses: keyword-dispatch only, no real AI API
- Voice transcription: browser SpeechRecognition (no STT service)
- COO command pipeline: demo seed data in `/director/donna-coo-demo` (not live)

When unauthenticated or no academy data: full demo fallback activates (clearly labeled).

---

## 13. What Still Requires Backend

- `curriculum_gaps` field in `DirectorDonnaContext`: currently returns `[]` — needs curriculum spine + gap detection query
- Player-specific brief for coaches: `loadPlayerAttentionContext` not yet wired to DONNA pages
- Parent-safe draft count: needs `proposed_actions` filter for `target_module = 'parent_communication'`
- Review queue "Defer" action: if desired, needs a `status = 'deferred'` proposed_action update endpoint
- Observation draft count by coach today: already wired in `loadCoachDonnaContext`

---

## 14. What Still Requires Real AI

- Natural language question answering beyond keyword dispatch
- Streaming responses
- Multi-turn contextual awareness (current history recorded but not fed to responses)
- Player-level narrative summaries ("Tell me about Emma's progress")
- Coach briefing text ("Here's what to watch for in today's session")
- Director narrative synthesis ("What's the biggest risk in the academy right now?")

**Integration path:** Set `ANTHROPIC_API_KEY` in `.env.local`, create a `/api/donna/ask` Edge Function that receives the user question + `DirectorDonnaContext`/`CoachDonnaContext` as a system prompt, returns a Claude response. Wire into `DonnaVoiceReadyShell.handleSend()` before the fallback.

---

## 15. Recommended Next Sprint Block

**Recommendation: Director Review Queue Apply Flow (Sprint Block 1046+)**

**Rationale from audit findings:**
- The Review Queue Surface is fully built and connected to the review queue page
- Directors see all pending categories but the "approve / reject" decisions still happen on a generic review page
- The biggest gap between current DONNA and "fully useful" is the ability to act on decisions with clear context — "here's the observation, here's what DONNA recommends, approve or reject"
- The Player Profile Evidence Hub needs the review apply flow as a prerequisite to show meaningful data

**Alternative (second choice): Player Profile Evidence Hub + Parent/Player Portal Foundation**
- Strong candidate if the director review flow is already usable enough for Brian's pilot
- Parent/Player portal is entirely unbuilt — would unlock the full loop

**Decision: Director Review Queue Apply Flow.** The review queue is already surfaced in DONNA and the director sees pending counts daily. The gap is the decision experience, not the discovery. Fixing that completes the core operating loop.

---

## Scores Summary

| Dimension | Score |
|---|---|
| Director DONNA connected experience | 9/10 |
| Coach DONNA connected experience | 9/10 |
| ChatGPT-like usability | 7/10 |
| Role safety | 10/10 |
| Workflow connection | 8/10 |
| Review-first compliance | 10/10 |
| Coach cognitive load | 8/10 |
| Director command center usefulness | 8/10 |
| Mobile usability | 7/10 |
| **Overall Phase 5** | **8.4/10** |

**Phase 4 + Phase 5 combined DONNA readiness: CONNECTED AND FUNCTIONAL.**
**What it lacks for 10/10: real AI API, curriculum gap data, mobile layout optimization.**
