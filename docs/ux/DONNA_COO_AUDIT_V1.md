# DONNA COO Audit V1

**Date:** 2026-06-05
**Sprint:** Mega Sprint 2101–2150
**Purpose:** Evaluate DONNA against ChatGPT, Claude, Perplexity, Superhuman, and OpenAI Voice. Identify where DONNA feels robotic, where she requires too much effort, and where she should take ownership.
**Method:** Code analysis of 80+ DONNA components and modules, behavioral inference from component names and props, cross-reference with best-in-class AI interfaces.

---

## DONNA Component Inventory

From `ls src/components/donna/` — 80 files. Selected key surfaces:

| Component | Role |
|---|---|
| `DonnaAssistantButton.tsx` | Floating button → full side panel |
| `DonnaCOOStatusWrapper.tsx` | Persistent status bar (top of every page) |
| `DonnaDailyCOOBriefSurface.tsx` | Once-per-day brief card |
| `DonnaAcademyCOOBriefCard.tsx` | Expanded COO brief on dashboard |
| `DonnaCommandSection.tsx` | Text input bar (inline, every page) |
| `DonnaScreenBriefStatic.tsx` | Static DONNA page context brief |
| `DonnaProactiveBriefCard.tsx` | Per-route proactive guide |
| `DonnaHighlightBanner.tsx` | Guided highlight overlay |
| `DonnaWakeWordLayer.tsx` | "Hey Donna" voice trigger |
| `DonnaChatThread.tsx` | Full conversation thread |
| `DonnaGuidedWorkflowCard.tsx` | Multi-step guided workflow |
| `DonnaDecisionGuidePanel.tsx` | Decision assistance panel |
| `DonnaSuggestedQuestions.tsx` | Suggestion chips |
| `DonnaContextSummaryCard.tsx` | Context summary |
| `DonnaConversationalPanel.tsx` | Conversational interface |
| `DonnaFirstGreeting.tsx` | First visit greeting |
| `DonnaKpiExplainerPanel.tsx` | KPI explanation |
| `DONNACOOIntelligencePanel.tsx` | Intelligence panel |
| `DONNAAcademyPulseCard.tsx` | Academy pulse |
| `DONNAWrapUpCoverageTracker.tsx` | Wrap-up coverage |
| `DONNAAnswerCard.tsx` | Individual answer card |
| `DONNAAnswerHistoryPanel.tsx` | Answer history |

**Total DONNA components: 80+**

**Finding:** DONNA has been built incrementally across 2000+ sprints. Each sprint added a new component to solve a specific problem. The result is 80 components that collectively create a fragmented, inconsistent DONNA experience.

---

## DONNA vs. Best-in-Class AI Interfaces

### Comparison Benchmark 1: ChatGPT

**What ChatGPT does:**
- One input. One output.
- Context is retained across turns in a session.
- The AI's response IS the interface.
- Minimal chrome — no status bars, no banners, no overlays.
- Suggestions appear only when the thread is empty.

**What DONNA does differently (problems):**
1. 8+ entry points — user doesn't know where to talk to DONNA
2. Context fragments across surfaces — `DonnaCOOStatusWrapper` doesn't share state with `DonnaAssistantButton` panel
3. The AI's response is INSIDE a small component alongside 10 other UI elements, not the primary content area
4. Suggestions chips appear ALWAYS, not just when the thread is empty — they look like navigation tabs

**DONNA should learn from ChatGPT:** One primary surface. Rich response as the main content. Context that persists.

---

### Comparison Benchmark 2: Claude (Anthropic)

**What Claude does:**
- Shows thinking process briefly when reasoning is complex
- Responses are long when the question warrants it, short when it doesn't
- Never hedges unnecessarily
- Never says "I cannot do X" — says "Here's what I CAN do"
- Artifacts appear alongside conversation (code, documents, lists)

**What DONNA does differently (problems):**
1. DONNA displays confidence level as a metadata badge ("LOW confidence"), which is visible but not explained — a director sees "LOW" and feels the system is unreliable, not that data is still accumulating
2. DONNA responses use corporate hedging: "Based on available data..." instead of clear answers
3. DONNA sometimes provides a summary when a decision is what's needed
4. DONNA does not show reasoning — when she recommends Orange Ball 2 as the priority level, a director cannot see why

**DONNA should learn from Claude:** Lead with the answer. Show reasoning on demand. Replace confidence badges with plain language ("I'm working with limited data — I'll update this as more sessions run").

---

### Comparison Benchmark 3: Perplexity

**What Perplexity does:**
- Every answer cites its source inline
- Source credibility is visible at a glance
- The answer is structured: direct answer first, sources below, related questions at bottom

**What DONNA does differently (problems):**
1. DONNA recommendations don't show their source — "3 players are stalled in Orange Ball 2" doesn't link to the player list or the data table it came from
2. Source labels exist in `donnaSourceLabels.ts` but are not surfaced in the UI
3. Directors cannot verify DONNA's claims without navigating elsewhere

**DONNA should learn from Perplexity:** Every claim links to its evidence. "3 players stalled" → click → see those 3 players. Trust is built through transparency, not authority.

---

### Comparison Benchmark 4: Superhuman (Email)

**What Superhuman does:**
- AI Triage surfaces the most important emails with a one-line reason why
- The AI is confident about priority — it makes decisions, not suggestions
- "Reply with this" puts a draft in the editor immediately
- The human approves or modifies, but the AI goes first

**What DONNA does differently (problems):**
1. DONNA frames everything as a "suggestion" — never as a decision
2. The COO brief card shows "your highest-leverage action today" but still requires the director to decide whether to trust it before acting
3. DONNA never says "I've already drafted the parent update for this player — want to review it?"
4. Multi-step workflows (guided completion) require the director to initiate each step — DONNA waits to be asked

**DONNA should learn from Superhuman:** Take the first action. Make the draft. Surface the decision. The director's job is to approve, not to initiate.

---

### Comparison Benchmark 5: OpenAI Voice Mode

**What OpenAI Voice does:**
- Responds immediately to natural language
- No wake word delay
- Tone adjusts to the question — casual questions get casual answers
- Can handle interruptions gracefully
- Never reads out metadata ("LOW confidence") — speaks in human terms

**What DONNA does differently (problems):**
1. "Hey Donna" requires opt-in activation and microphone permission flow — high friction for voice-first interaction
2. Browser TTS fallback ("browser_fallback") is audibly robotic and inconsistent with premium brand positioning
3. DONNA reads status codes and UI labels aloud (confidence levels, source tags) rather than converting them to natural language
4. No tone calibration — DONNA speaks to a new director the same way she speaks to a 2-year user

**DONNA should learn from OpenAI Voice:** Natural, immediate, warm. The technology is invisible.

---

## DONNA Behavioral Audit

### Where DONNA feels robotic

| Behavior | Robotic Pattern | Human Alternative |
|---|---|---|
| Confidence level shown as badge | "LOW confidence" badge in orange | "I'm working with early data on this level — my recommendation will sharpen as more sessions run." |
| Source tags exposed | "Source: player_requirement_progress" | Say nothing unless asked. If pressed: "Based on 10 player records." |
| Multi-step workflows require user to start each step | DONNA waits after each step for user to say "continue" | DONNA says: "Step 1 done. Here's step 2 — does this look right?" |
| Empty states show platform-speak | "No DONNA recommendation available" | "Your academy is new — I'll have recommendations after your first week of sessions." |
| Suggestions chips always visible | 6 suggestion chips displayed even mid-conversation | Chips appear only when the conversation is idle |
| Hedging responses | "Based on available data, you may want to consider..." | "Here's what I'd do: advance Lucas to Orange Ball 2." |
| Every response has a disclaimer | "Nothing changes until you approve." (shown on every response) | Show this ONCE on first interaction, then trust is established |

### Where DONNA requires too much effort

| Friction | Required Effort | Should Be |
|---|---|---|
| Access curriculum improvement | Know `?improve=` URL parameter | DONNA proactively opens improvement when navigating to a level with problems |
| Ask DONNA for help | Click floating button → panel opens → type question → wait | "Hey Donna" wake word triggers immediately, or DONNA speaks first on page load |
| Review queue intelligence | Navigate to /director/review → no DONNA present | DONNA pre-summarizes the queue: "5 items. 2 are routine. 1 needs your judgment — a coach assessment flagged an unusual player regression." |
| Daily brief | Wait for `DonnaDailyCOOBriefSurface` to appear (once per day, dismissible) | Daily brief is the FIRST thing director sees on login, always, not a dismissible banner |
| Understanding a KPI | Click `DonnaKpiExplainerPanel` (requires finding it) | Hover or tap any KPI tile → DONNA tooltip explains immediately |
| Curriculum bottleneck data | Load curriculum page → look for intelligence card → interpret | DONNA leads curriculum page: "This week's focus: Orange Ball 2 forehand." |

### Where DONNA should proactively guide but doesn't

| Moment | What DONNA Should Do | What Happens Instead |
|---|---|---|
| Director opens curriculum | "Orange Ball 2 has 3 stalled students. Want me to walk through improvements?" | Static page loads, DONNA improvement is URL-gated |
| Director opens review queue | "You have 5 items. I'll start with the one that expires first." | Review queue shows all items undifferentiated |
| Director opens player profile with issues | "Lucas has missed 3 sessions and hasn't advanced in 8 months. I've drafted a parent update and a reassessment request." | Player profile loads without DONNA context |
| Monday morning | "Good morning. Last week: 4 sessions, 82% attendance, 1 player advanced. This week: 5 sessions scheduled, 2 assessments due." | Director sees the dashboard (all sections collapsed) |
| First coach assessment arrives | "Coach Marco submitted Lucas's assessment. His forehand rated 6/10 — below the gate threshold. I've drafted a development note." | Assessment appears in review queue without context |

### Where DONNA should own the workflow (not just assist)

Based on Superhuman's model, DONNA should take the first action in these flows:

| Workflow | DONNA Should Own |
|---|---|
| Parent update drafts | DONNA generates the draft. Director approves or edits. Director never starts from blank. |
| Coach performance check | DONNA generates weekly coach summary with the 2 coaches needing attention highlighted. |
| Player advancement readiness | DONNA generates the advancement list with evidence citations. Director approves, not decides from scratch. |
| Curriculum improvement | DONNA generates the improvement proposal with confidence and evidence. Director approves, not creates from scratch. |
| Session planning | DONNA pre-populates a session template based on curriculum level and last session recap. |

---

## DONNA Architecture Problem

The 80-component DONNA surface is the result of building DONNA as a feature added to each page, rather than DONNA as the operating layer beneath all pages.

**Current model:** Page exists → DONNA is added as a widget alongside other widgets on the page.

**Correct model:** DONNA is the operating layer → The page is the evidence DONNA uses to reason → The director interacts with DONNA, and DONNA presents the relevant page data as context.

This is not a code change — it is a design principle change. The same backend intelligence can power both models. The difference is what the director sees first: the data or the recommendation.

---

## Summary

DONNA has world-class intelligence underneath. The problem is not capability — it is surface design.

The 5 changes that would make DONNA feel premium instantly:

1. **One surface.** Collapse 8 DONNA surfaces into 1. The panel is the interface.
2. **Lead with the answer.** Every DONNA response starts with the recommendation, not the context.
3. **Show reasoning on demand.** The answer is clean. Tap "Why?" to see the evidence.
4. **Take the first action.** DONNA drafts, proposes, and queues. The director approves.
5. **Human language only.** No confidence badges, no source tags, no "based on available data." Speak like a COO, not like a database query.
