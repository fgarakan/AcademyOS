# DONNA God Mode Audit V1
**Date:** 2026-05-27
**Sprint:** 912.1
**Auditor:** Claude Code (Sprint Execution)

---

## Executive Summary

DONNA currently operates at approximately **6.0/10** for director-facing conversational experience. Strong intent routing, safe action infrastructure, and session memory are all in place. The critical gap is the absence of a continuous conversation loop: the director must manually press the mic button after every DONNA response. This makes DONNA feel like a command tool, not a continuous operating assistant.

---

## 1. Current Entry Points

### 1a. `DonnaVoiceReadyShell` (primary — Sprint 1035)
- **Location:** `src/components/donna/DonnaVoiceReadyShell.tsx`
- **Used by:** `/director/donna` page via `DonnaDirectorShellClient`
- **Architecture:** `DonnaChatThread` + `useVoiceDictation` + `donnaChatSessionMemory` + TTS auto-play (30-sec window)
- **Input path:** Manual mic toggle → `useVoiceDictation.start()` → transcript → `handleSend()`
- **Output path:** DONNA response appended to messages → TTS auto-plays if within 30s of voice input → no auto-restart of mic

### 1b. `DonnaAssistantButton` (legacy floating panel — Sprint 270+)
- **Location:** `src/components/assistant/DonnaAssistantButton.tsx`
- **Used by:** Director sidebar/layout on most pages, possibly Coach portal
- **Architecture:** Monolithic component with 15+ state setters; `VoiceInputButton` (persistent mode) + `DonnaVoiceLayer` + older `donnaConversationController` + template draft panels
- **Input path:** Persistent `VoiceInputButton` (auto-restarts on silence, up to 5 retries) → transcript → inline command routing
- **Output path:** Server TTS (`donnaServerTtsClient`) → `shouldPause` prop pauses mic during TTS

### 1c. Coach DONNA Shell
- **Location:** `src/app/coach/donna/CoachDonnaShellClient.tsx`
- **Uses `DonnaVoiceReadyShell`** with `donnaRole="coach"`

---

## 2. Current Button/Modal Behavior

- **`DonnaVoiceReadyShell`:** No modal — full-page or panel with mic toggle button. Director clicks mic to start, clicks again to stop, or waits for silence to end.
- **`DonnaAssistantButton`:** Floating `Sparkles` button in layout sidebar. Clicking opens a panel that overlays the page. Panel has close (X) button. Panel contains the voice layer, draft panels, review queue, etc.
- **Key friction:** Neither shell auto-transitions back to listening after DONNA finishes speaking. Director must press the button again.

---

## 3. Current Voice Input Behavior

### `DonnaVoiceReadyShell`
- Uses `useVoiceDictation` hook (`src/lib/donna/useVoiceDictation.ts`)
- **`continuous: false`** — single-shot recognition per press
- Director presses mic → recognition runs → final transcript captured → `handleSend()` auto-fires when `status === 'idle' && transcript.trim()`
- No automatic restart after transcript captured
- `pendingVoiceRef` guards against duplicate sends

### `DonnaAssistantButton`
- Uses `VoiceInputButton` with `persistent={true}` and `maxRetries={5}`
- Persistent mode auto-restarts on `onend` (silence-based restart)
- `shouldPause={isSpeaking}` pauses mic while TTS plays to prevent DONNA hearing herself
- This is closer to continuous but is bounded to the open panel

---

## 4. Current Speech Recognition Behavior

- Browser `SpeechRecognition` / `webkitSpeechRecognition` — no external ASR API
- `useVoiceDictation`: `continuous=false`, `interimResults=true`
- No wake phrase detection in `DonnaVoiceReadyShell` (wake phrase detection exists in `donnaVoiceRuntime.ts` but not wired to the shell)
- Errors surfaced cleanly: `permission_denied`, `no_speech`, `aborted`, `network`, `unsupported`
- Error display: one-line message with "Retry voice" button

---

## 5. Current TTS Behavior

### Primary: Server TTS (`/api/donna/tts`)
- `donnaServerTtsClient.ts` → `speakWithServerTts(text, callback)`
- OpenAI `gpt-4o-mini-tts` with `marin` voice and voice instructions
- Fallback: `tts-1-hd` + `nova` if primary model unavailable
- Status callback: `'done' | 'error'` used in `DonnaVoiceReadyShell` to clear `isSpeaking`
- Text length cap: 500 chars at API level
- `stripMarkdownForTts()` strips formatting, caps at ~300 chars for speech

### Auto-play logic in `DonnaVoiceReadyShell`
- Auto-plays TTS for DONNA messages that follow a voice input within 30 seconds
- `lastVoiceInputAt` ref tracks when last voice input occurred
- `lastSpokenIdRef` guards against replaying the same message
- Speaking indicator shown while TTS plays (purple animated dot + "Speaking…" + Stop button)

### Stop behavior
- `stopServerTts()` — stops current TTS playback
- Stop button visible during speaking
- Stopping TTS clears `isSpeaking` state
- Mic auto-stops before TTS starts (in `handleVoiceToggle`)

---

## 6. Current `/api/donna/brief` Behavior

- **GET only**, director-role-gated
- Returns `DailyBrief` with sections: Pending Review, Today's Sessions, Pending Placements, Advancement Ready, No Curriculum Level
- Raw count queries — no AI generation, fully deterministic
- Used by `DonnaDailyBriefCard` components
- **Not** connected to the chat thread or continuous conversation flow

---

## 7. Current `/api/donna/tts` Behavior

- **POST**, auth-gated (any logged-in user)
- Input: `{ text: string }` (max 500 chars)
- Output: `audio/mpeg` binary + headers `X-Donna-Voice`, `X-Donna-Model`
- Primary: `gpt-4o-mini-tts` + `marin` + voice instructions
- Fallback: `tts-1-hd` + `nova`
- Graceful 503 if `OPENAI_API_KEY` not set
- No caching, `Cache-Control: no-store`

---

## 8. Current Page Awareness

### What exists
- `donnaPageContextRegistry.ts` — `resolvePageContext(pathname)` → `DonnaPageContext`
- `donnaPageContextEngine.ts` — `getPageCapabilityMap(pathname)` → page label + director intent + suggested prompts
- `donnaPageTaskRouter.ts` — `getAvailableTasksForPage(pathname)` → task IDs available on current page
- `donnaConversationalRouter.ts` — `routeDonnaPrompt(text, pathname)` → response mode
- `DONNA_SYSTEM_MAP` — AcademyOS module map for system explanations
- `usePathname()` is passed down to `DonnaVoiceLayer` and used in `DonnaVoiceReadyShell`

### How it is currently used
- `DonnaVoiceReadyShell` passes `pathname` to `routeDonnaPrompt()` in the conversational router fallback path
- `buildRouterAnswer()` uses `getPageCapabilityMap(pathname)` to describe the current page when mode = `use_page_context`
- Prompt suggestions are page-aware via `donnaDirectorPromptPalette.ts`
- **Gap:** DONNA does not proactively announce page context when the director opens a new page or starts a conversation. The page context is only activated by the fallback router, not at conversation start.

---

## 9. Current Session/Conversation Memory

### `donnaChatSessionMemory.ts` (Sprint 1032)
- Module-level singleton: `_state: DonnaChatSessionState | null`
- Tracks: turns (last 30), topicsDiscussed, actionsDispatched, pendingNavOffer, pendingTemplateDraft, contextLoadedAt
- `recordTurn()` stores user + DONNA message per turn
- `getRecentTurns(5)` available for context injection
- **Persists for page session** — resets on hard reload or `clearChatSession()`

### Usage
- `DonnaVoiceReadyShell` calls `recordTurn()` after each DONNA response
- `consumePendingNavOffer()` handles yes/no confirmation for navigation
- `getPendingTemplateDraft()` / `setPendingTemplateDraft()` for multi-turn template drafting
- **Gap:** Session memory is not threaded back into DONNA answers. `getRecentTurns()` is never called in the current routing pipeline. The memory records turns but DONNA never uses them to say "following up on what we discussed."

---

## 10. Current Assistant State Model

### `DonnaVoiceReadyShell` states (implicit)
```
- messages: []        → no conversation yet
- isTyping: true      → DONNA is processing
- isSpeaking: true    → TTS is playing
- voice.status        → 'unavailable' | 'idle' | 'listening' | 'processing' | 'done' | 'error'
```

### What is missing
- No explicit `conversationMode: boolean` state
- No `awaiting_confirmation` state
- No `auto_listening` state
- No `paused` state
- No unified state machine — states are scattered across multiple booleans

### `donnaConversationController.ts` state model (for `DonnaAssistantButton` path)
```
ConversationPhase: idle | collecting | ready_for_review | approved | cancelled
```
- Richer but wired only to the legacy button path

---

## 11. Current Listening/Thinking/Speaking/Error State Handling

| State | Current behavior | Visible to director? |
|---|---|---|
| Listening | `voice.status === 'listening'` → green animated dot + "Listening..." | ✅ |
| Interim transcript | Live text shown in status bar | ✅ |
| Thinking (processing) | `isTyping` → typing indicator dots in chat | ✅ |
| Speaking | `isSpeaking` → purple dot + "Speaking…" + Stop button | ✅ |
| Error | `voice.error` → red bar with Retry button | ✅ |
| Auto-listening | **Not implemented** | ❌ |
| Awaiting confirmation | **Not implemented** | ❌ |
| Paused | **Not implemented** | ❌ |
| Conversation mode on | **Not implemented** | ❌ |

---

## 12. Current Interruption Support

- **Stop during TTS:** Stop button visible while `isSpeaking`. Calls `stopServerTts()`. ✅
- **Stop mic early:** `voice.stop()` on second press of mic button. ✅
- **Interrupt while speaking and start listening:** Not implemented. When director presses mic while DONNA is speaking, `handleVoiceToggle()` does stop TTS (`stopServerTts()`) then starts mic. This is functional but not surfaced clearly. Partial ✅
- **Pause conversation:** Not implemented. No "Pause" state. ❌
- **Cancel current workflow:** Only in `DonnaAssistantButton` path via cancel phrases. ❌

---

## 13. Current Auto-listen Behavior

**Summary: Does not exist in `DonnaVoiceReadyShell`.**

- After DONNA speaks (TTS `done`): `isSpeaking` is cleared, typing stops. No mic restart.
- After DONNA types (no voice): no mic action.
- Director must manually press the mic button for every turn.
- The 30-second window for TTS auto-play is present, but there is no matching 30-second window for auto-listen restart.

---

## 14. Current Command Routing

### `DonnaVoiceReadyShell` routing pipeline (priority order)
1. Yes/No navigation confirmation (`consumePendingNavOffer`)
2. Role boundary check (`checkQuestionBoundary`)
3. Missing context intercept (`detectMissingContext`)
4. KPI question intercept (`tryAnswerKpiQuestion`)
5. Dashboard priority intercept (`tryAnswerDashboardPriorityQuestion`)
6. Recent decisions patterns
7. Player progress stall patterns
8. Player action draft patterns
9. Data quality guardian
10. Roster attention intercept
11. Coach health intercept
12. Curriculum draft proposal intercept (`tryAnswerCurriculumDraftProposal`)
13. Session adjustment intercept
14. Coach cue intercept
15. Curriculum impact explanation
16. Curriculum level question
17. Fitness draft intercept
18. Template draft intercept
19. Director clarification/block intercept
20. Action preview intercept
21. Safe read dispatch
22. Short-phrase handler
23. Conversational router fallback (`routeDonnaPrompt`)
24. Bare fallback "I'm not sure"

**Strength:** Very comprehensive coverage.
**Weakness:** All routing is based on keyword matching with no LLM-based intent classification. Complex or ambiguous inputs fall through to fallback. No memory of previous turns used in routing.

---

## 15. Current Safe Action/Draft Behavior

- **Navigation offers:** DONNA says "Want me to take you there?" and stores `pendingNavOffer`. Yes/no confirms. ✅
- **Template drafts:** Multi-turn `pendingTemplateDraft` in session memory. Draft built via `tryAnswerTemplateDraftRequest`. ✅
- **Curriculum draft proposal:** `tryAnswerCurriculumDraftProposal` returns an informational answer with a link to the curriculum builder — **does not create a draft automatically**. ⚠️
- **Player action draft:** `submitDonnaActionDraft` creates a `voice_commands` sentinel + `proposed_actions` row. Gated on eligibleCount > 0. Director must go to Review Center to approve. ✅
- **All draft actions:** DONNA never auto-approves. Review queue always required. ✅
- **Sprint 904 approve/reject actions:** Untouched in this architecture — they live in `curriculumOverrideApprovalActions.ts` and are only called from the CurriculumBuilderChangeQueue UI.

---

## 16. Current Confirmation-Before-Mutation Behavior

| Scenario | Confirmation behavior |
|---|---|
| Navigation | Pending nav offer → yes/no next turn ✅ |
| Template draft | Multi-turn slot filling → explicit review step ✅ |
| Player advancement | Submits draft only; director reviews in Review Center ✅ |
| Curriculum draft creation | DONNA describes what to do, offers nav to builder — no automatic draft ⚠️ |
| Any "approve it" / "save it" / "do it" voice phrase | `donnaVoiceRuntime.VOICE_PROTECTED_PHRASES` blocks it → boundary message ✅ |

---

## 17. Current UI Friction Points

1. **Director must press mic button for every turn.** Biggest friction point. Conversational flow breaks.
2. **No Conversation Mode toggle.** Director cannot set "keep listening after responses."
3. **Chat thread is only on `/director/donna` page** — not embedded in the primary sidebar across all director pages. The sidebar uses the older `DonnaAssistantButton` which has a different UX.
4. **No "DONNA is listening" ambient indicator** outside the DONNA panel.
5. **Curriculum draft in `DonnaVoiceReadyShell` is informational only.** Director asked to navigate manually to the builder — no guided draft creation from the chat.
6. **Session memory not used in routing.** DONNA cannot say "as we discussed" or follow up on previous context.
7. **Quick action chips disappear at 2+ messages** — useful shortcuts gone once conversation starts.
8. **No "Pause" mode.** Director cannot pause and come back.
9. **Fallback message is generic** — "I'm not sure how to answer that" with no specific suggestions.

---

## 18. Current Mobile/Desktop Behavior

- `DonnaVoiceReadyShell` is rendered in `DonnaDirectorShellClient` with fixed `h-[580px]`. Works on desktop panel.
- `DonnaChatThread` uses a fixed scroll area with `max-h-[calc(100%-120px)]`.
- No specific mobile adaptation in `DonnaVoiceReadyShell` — it scales but is designed for the `/director/donna` dedicated page.
- `DonnaAssistantButton` floating panel is desktop-only (sidebar layout).
- Coach DONNA shell is mobile-optimized via `BottomTabBar` navigation.

---

## 19. Current Accessibility Concerns

- Mic button has no ARIA label in `DonnaChatThread`
- Speaking indicator uses visual-only pulse dot (no `aria-live` region)
- Voice error messages do not use `role="alert"`
- Chat messages are not rendered with `aria-live="polite"` for screen reader announcement
- No keyboard shortcut to toggle mic
- Focus management when conversation starts is not explicitly handled

---

## 20. Current Failure Modes

| Failure | Current handling |
|---|---|
| No OPENAI_API_KEY | TTS route returns 503; `speakWithServerTts` calls callback with 'error'; `isSpeaking` clears | ✅ |
| Mic permission denied | `voice.error = 'permission_denied'` → red bar with retry | ✅ |
| Speech recognition unsupported | `voice.status = 'unavailable'` → no mic button shown | ✅ |
| TTS network error | callback 'error' → `isSpeaking` clears | ✅ |
| DONNA routing falls through all interceptors | Generic fallback message | ✅ |
| Director says "yes" with no pending nav offer | `consumePendingNavOffer()` returns null → falls through to normal routing | ✅ |
| Long DONNA response (>500 chars) | TTS API rejects; text is stripped to ~300 chars for TTS | ✅ |
| Duplicate voice send | `pendingVoiceRef` guard prevents double submit | ✅ |
| Session memory overflow | Capped at 30 turns | ✅ |

---

## Ratings — Current DONNA State

| Dimension | Score | Notes |
|---|---|---|
| **Continuous conversation** | 3/10 | Director must press mic every turn. No auto-listen cycle. |
| **Page awareness** | 6/10 | Context exists in routing; not surfaced at conversation start. |
| **Voice UX** | 6/10 | Good states (listening, speaking, error); no continuous mode. |
| **Interruption** | 5/10 | Stop button works. No pause/resume. No "speak over DONNA" UX. |
| **Session memory** | 5/10 | Memory recorded but never injected into routing answers. |
| **Safe action routing** | 8/10 | Strong safety infrastructure. Curriculum draft is informational only. |
| **Low cognitive load** | 6/10 | Clean UX; friction from repeated mic presses breaks flow. |
| **Director usefulness** | 7/10 | Answers are good. Workflow guidance is present. |
| **Reliability** | 8/10 | Good error handling. Fallbacks work. |
| **Demo readiness** | 6/10 | Works but feels like a tool, not an assistant. |
| **OVERALL** | **6.0/10** | Strong foundation; missing the conversational loop. |

---

## Architecture Summary for Planning

### What is already built and usable
- `DonnaVoiceReadyShell` — clean chat + voice shell ✅
- `donnaChatSessionMemory` — 30-turn in-memory session ✅
- TTS auto-play (30-sec window) ✅
- TTS stop button ✅
- `stopServerTts()` function ✅
- `useVoiceDictation` hook (needs `continuous=false → true` or restart loop) ✅
- Page-aware routing via `getPageCapabilityMap()` ✅
- Role boundary checking ✅
- Protected voice phrase blocking ✅
- Pending nav offer yes/no confirmation ✅
- Session memory with `pendingTemplateDraft` pattern (reusable for confirmation) ✅

### What needs to be built for God Mode V1
1. **`useDonnaConversationLoop` hook** — ties TTS done → auto-listen restart when conversation mode is on
2. **`conversationMode: boolean` state** — toggle in `DonnaVoiceReadyShell`
3. **`awaiting_confirmation` state** — for pending actions that need voice yes/no
4. **`paused` state** — explicit pause/resume control
5. **Auto-listen restart** — when TTS callback fires `'done'` and `conversationMode` is on
6. **Interrupt speaking → listen** — pressing mic while TTS plays stops TTS + starts mic immediately
7. **Page context announcement** — DONNA announces current page context when conversation mode turns on or page changes
8. **Session memory injection into routing** — inject last 3 turns as prefix context
9. **Curriculum draft guided flow from chat** — `tryAnswerCurriculumDraftProposal` upgrades to create draft + guide through required fields
10. **Conversation Mode UI** — toggle chip in DONNA panel header, visual indicator when active
11. **State labels refinement** — explicit "Waiting for your response", "Waiting for confirmation" labels

### Critical protection constraints
- Do NOT modify Sprint 904 approve/reject actions
- Do NOT add `execute_curriculum_override()` calls from UI
- Do NOT bypass review queue
- Do NOT modify migrations
- Do NOT use `proposed_actions` except via existing `donnaSentinelAction.ts` path
