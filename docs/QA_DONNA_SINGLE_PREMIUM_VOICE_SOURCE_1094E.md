# QA — DONNA Single Premium Voice Source

**Sprint:** 1094E
**Date:** 2026-06-01

---

## Code audit result (primary verification)

```
speakAssistantText() remaining call sites:
  Line 522:  function definition   — KEPT (definition)
  Line 680:  speakAssistantText(text, (callbackStatus) => {   — KEPT (interview-page fallback)

speakDonna() call sites for all other DONNA speech: 25 new + many existing
```

All template draft questions, announcements, controller speech, guided task questions now route
through `speakDonna()` → `speakWithServerTts()` → `/api/donna/tts` → premium OpenAI voice.

---

## Browser QA states

### Test 1 — DONNA sidebar open on /director

| Check | Expected | Method |
|---|---|---|
| Open DONNA panel | Greeting plays if first open today | `speakDonna(greeting)` → premium TTS |
| Ask "What should I do here?" | DONNA response spoken | `speakDonna(response)` → premium TTS |
| Ask "what should I do today?" | Daily brief spoken | `speakDonna(narration)` → premium TTS |
| All responses: same voice | Yes — all route through `speakDonna` | Code audit ✅ |

### Test 2 — DONNA sidebar on /director/templates

| Check | Expected | Method |
|---|---|---|
| Open DONNA panel | Panel opens normally | ✅ confirmed via screenshot |
| Type "Create a template for Orange 2..." | DONNA asks first clarifying question | NOW uses `speakDonna` (was `speakAssistantText`) |
| DONNA asks "What level is this template?" | Premium voice, same as sidebar responses | `speakDonna(firstQ.question)` |
| Draft complete | "I have enough to draft this. Review it before saving." | `speakDonna(...)` — premium ✅ |
| No robotic voice | Browser system default never called | `speakAssistantText` removed from this path |

### Test 3 — Conversation controller speech

| Scenario | Voice | Note |
|---|---|---|
| Director says "undo" | `speakDonna(controllerTurn.speakText)` | Premium ✅ |
| Director says "cancel" | `speakDonna(controllerTurn.speakText)` | Premium ✅ |
| New draft started | `speakDonna(...)` if speakText set | Premium ✅ |

### Test 4 — Guided task speech

| Scenario | Voice |
|---|---|
| Task question asked | `speakDonna(nextQ.question)` — premium ✅ |
| Task completion | `speakDonna('Task is ready to review.')` — premium ✅ |

### Test 5 — Multi-step plan

| Scenario | Voice |
|---|---|
| Plan summary spoken | `speakDonna(plan.summary)` — premium ✅ |

---

## Fallback verification

| Condition | What happens |
|---|---|
| `OPENAI_API_KEY` set | Server TTS → premium OpenAI marin voice |
| `OPENAI_API_KEY` not set (local dev) | Browser TTS fallback → uses `preferredBrowserVoiceKeywords` from `donnaVoiceConfig.ts` (NOT system default) |
| Neither available | Silent — text shown in UI, no random robotic voice |

---

## What is NOT tested in this sprint (out of scope)

| Component | Reason |
|---|---|
| Coach wrap-up voice | Different role/context. Coach wrap-up has its own voice UX. |
| Onboarding interview voice | DirectorInterviewAssistant has OpenAI Realtime primary path. |
| ElevenLabs upgrade | Future sprint. Current premium = OpenAI "marin". |
| TTS quality rating | Subjective. Test by ear in the app with `OPENAI_API_KEY` set. |

---

## Regression checks

- [ ] DONNA sidebar speech works on /director
- [ ] DONNA sidebar speech works on /director/templates
- [ ] DONNA response to "What should I do here?" plays
- [ ] Daily brief narration plays (trigger "what should I do today?")
- [ ] Template draft question plays when DONNA asks a clarifying question
- [ ] No JavaScript errors in browser console related to TTS
- [ ] `testBrowserVoice()` dev tool still works (uses `speakAssistantText` intentionally)
- [ ] `/director/onboarding/interview` Realtime + browser fallback still works
- [ ] TypeScript: clean
