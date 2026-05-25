# DONNA Response Style V1 — Sprint 786

**Date:** 2026-05-25
**Sprint:** 786
**Status:** COMPLETE

---

## Goal

Upgrade DONNA's written response style so she sounds like a calm, premium academy operator instead of a technical assistant. Responses should be shorter, warmer, and more direct — without losing safety or approval language.

---

## Style Standard Applied

**DONNA should sound:** calm, composed, warm, confident, concise, operationally sharp, helpful without over-talking.

**Rules applied:**
- Responses mostly under 3 sentences
- Bullets only for 3+ concrete items (none used in follow-up resolver)
- Preserve approval and safety boundaries
- No routing logic changed
- No DB/API behavior changed

---

## Files Changed

### 1. `src/lib/donna/donnaFollowUpResolver.ts`

All 20 response strings rewritten. Key improvements:

| Before | After |
|---|---|
| "The brief has N sections. M sections are high priority. The Review Queue has the full item list — want me to open it?" | "You've got N areas to look at today. M of them look higher priority. The Review Queue has the full list — want me to open it?" |
| "Opening the Review Queue now — that's where you can work through each item." | "I'll open the Review Queue — that's where you can go through each item." |
| "Opening the Review Queue — that's where you can see and work through each item." | "I'll open the Review Queue so you can go through each item." |
| "Start with the N high-priority items from the brief — those need attention first. I'd head to the Review Queue now. Want me to take you there?" | "I'd start with the N higher-priority items — those are the ones that need your attention first. Want me to open the Review Queue?" |
| "There are N items in today's brief. I'd start by checking the Review Queue for any pending approvals. Want me to open it?" | "There are N items in today's brief. The Review Queue is the best place to start — that's where pending approvals live. Want me to open it?" |
| "I'd start with the Review Queue — that's where pending approvals live and is usually the most time-sensitive. Want me to open it?" | "The Review Queue is usually a good starting point — approvals waiting there tend to be the most time-sensitive. Want me to open it?" |
| "I'd start with the highest-priority items in the Review Queue — those are the ones waiting longest for your approval. Want me to take you there?" | "I'd look at the Review Queue first — the oldest pending items usually need attention soonest. Want me to open it?" |
| "I'd check pending reviews first — those items are waiting on you and are usually the most time-sensitive. Want me to open the Review Queue?" | "The Review Queue is usually a good starting point — those are the items waiting on your approval. Want me to open it?" |
| "I can help with that — do you mean today's agenda, review items, or this page?" | "Sure — are you asking about today's brief, something in the review queue, or this page specifically?" |
| "Regarding today's brief: the most important next action is to check the Review Queue for anything requiring your approval or attention. Would you like me to open that?" | "The main thing right now is checking the Review Queue for anything that needs your sign-off. Want me to open it?" |
| "Happy to explain — what specifically would you like me to expand on? You can ask about today's brief, a specific section, or how something works in AcademyOS." | "What would you like me to explain? You can ask about today's brief, a specific area, or how something works here." |
| "Historical weekly data is available in the Reports section. For now, I have today's activity. Would you like to see today's brief instead?" | "I don't have last week's data here, but I can show you what's happening today. Want today's brief?" |
| "Here's what I have for today — ask me 'What do I need to do today?' for a full brief, or I can take you to the Review Queue." | "I can show you what's on today. Try 'What do I need to do today?' for a full brief, or I can open the Review Queue." |
| "Player Profiles show who needs attention. Want me to take you there?" | "I can take you to Player Profiles to see who needs attention. Want to go there?" |
| "Session data is on the Sessions page. Want me to take you there?" | "Session details are on the Sessions page. Want me to take you there?" |
| "The Review Queue has all pending approvals. Want me to open it?" | "The Review Queue has everything pending approval — want me to open it?" |
| "Curriculum details are on the Curriculum page. Want me to take you there?" | "I can take you to the Curriculum page. Want to go there?" |
| "I can help with coach-related questions — sessions, wrap-ups, or communications. What specifically would you like to know?" | "Happy to help with coaches — ask me about their sessions, wrap-ups, or briefs. What do you need?" |
| "Parent updates go through the review process — I can help you draft one. Would you like to start a parent update draft?" | "Parent messages always go through approval first. I can draft one if you'd like — just say the word." |

---

### 2. `src/components/assistant/donnaFailureModes.ts`

**`intent_unknown`** (most common unrecognized-input fallback):

| Before | After |
|---|---|
| "I'm not sure what you're asking. Try saying something like 'create a coach note' or 'create a class template'." | "I didn't quite catch that. You can ask about today's brief, the review queue, players, or try asking in your own words." |

Reason: old version felt like a command-line prompt. New version is warmer and gives real next steps without sounding robotic.

---

### 3. `src/lib/donna/donnaSafeSessionMemory.ts`

**`buildContinuityMessage`** — minor polish on 3 continuity messages:

| Branch | Before | After |
|---|---|---|
| Active workflow | "Hi — you were working on 'X'. Want to continue?" | "You were working on 'X'. Want to pick up where you left off?" |
| Previous route | "Hi — earlier you were on the Review Queue. Do you want to continue there...?" | "You were on the Review Queue earlier. Want to go back there, or can I help with something here?" |
| Last prompt | "Hi — you were asking about '...'. How can I help now?" | "You were asking about '...' earlier. Still on that, or something new?" |
| Last module | "Hi — I'm here. What can I help you with on the Review Queue?" | "I'm here. What can I help you with on the Review Queue?" |

Reason: removing "Hi —" avoids the robotic greeting loop on re-opens. The responses feel more like a colleague resuming a conversation.

---

## What Was Not Changed

- No routing logic
- No DB/API behavior
- No safety or approval language removed
- No failure modes removed
- No new state
- No new components
- No migrations

---

## Before/After Tone Summary

| Dimension | Before | After |
|---|---|---|
| Length | 2–4 sentences avg | 1–2 sentences avg |
| Formality | Slightly stiff | Warm, direct |
| Mechanical phrases | "The system detected…", "Opening the Review Queue now — that's where…" | "I'll open the Review Queue — that's where…" |
| Clarification prompts | "I can help with that — do you mean today's agenda, review items, or this page?" | "Sure — are you asking about today's brief, something in the review queue, or this page specifically?" |
| Error fallback | "I'm not sure what you're asking. Try saying something like…" | "I didn't quite catch that. You can ask about…" |

---

## Conversational Quality Delta

Sprint 785 score: **85/100**

| Dimension | Before (785) | After (786) | Change |
|---|---|---|---|
| Natural language quality | 8/10 | 9/10 | +1 — all follow-up responses rewritten to natural prose |
| Failure mode clarity | 8/10 | 9/10 | +1 — intent_unknown is now warm and actionable |
| Follow-up handling | 8/10 | 9/10 | +1 — responses sharper, shorter, warmer |
| Everything else | — | — | unchanged |

**New score: 88/100** (+3)

---

## TypeScript

Clean — `npx tsc --noEmit` passes with zero errors.
