# DONNA Voice Architecture V1

**Date:** 2026-06-05
**Sprint:** Mega Sprint 2196–2215 — DONNA Surface Unification V1
**Purpose:** Define the unified voice experience for DONNA across AcademyOS.

---

## Core Principle

There is one voice system. DONNA listens through one microphone. DONNA speaks through one voice.

A director should never wonder: "Is my voice going to the right DONNA?"

The answer is always: "Your voice reaches DONNA. There is only one."

---

## Voice Entry Points — Current State (Pre-Unification)

Before this sprint, voice entry points were fragmented across:

| Component | Location | Behavior |
|---|---|---|
| `DonnaWakeWordLayer` | Global, mounted in director layout | "Hey DONNA" listener — activates floating shell |
| `DONNAVoiceInputButton` | Inside `DonnaPanelShell` | Mic button inside the DONNA panel |
| `VoiceInputButton` | Coach wrap-up drawer | Browser SpeechRecognition for coach questions |
| `AudioRecorderButton` | Coach wrap-up drawer | Whisper-based transcription for wrap-up answers |
| Multiple inline mic buttons | Various curriculum builder panels | Context-specific voice capture |

**Problem:** A director who says "Hey DONNA" expecting the global listener may instead be captured by a coach-facing mic button if one is visible on the same page. Context-specific mics are not labeled clearly enough to distinguish them from the global "talk to DONNA" system.

---

## Unified Voice Architecture

### Layer 1 — Global Listener: `DonnaWakeWordLayer`

**Wake phrase:** "Hey DONNA"

**Behavior:**
1. Director says "Hey DONNA"
2. `DonnaWakeWordLayer` captures the phrase
3. Dispatches `donna:open` CustomEvent
4. `DonnaAssistantButton` opens
5. DONNA is listening state activates
6. Director continues speaking their query

**Scope:** Director layout only. Not active in coach portal (coaches have their own session-scoped voice flow).

**Activation model:** Opt-in per session. Director must enable voice in settings or accept mic permission. Once enabled for the session, "Hey DONNA" works on every director page.

**Persistence:** Active until:
- Director closes the DONNA panel (voice returns to idle, wake word still active)
- Director navigates away from AcademyOS (full session end)
- Director explicitly disables voice

---

### Layer 2 — Panel Voice Input: Inside `DonnaAssistantButton`

**Behavior:**
1. Director opens the DONNA panel (tap floating button or "Hey DONNA")
2. Mic button appears in the panel's input bar
3. Director taps mic → DONNA enters Listening state
4. Speech is captured and submitted as a query
5. DONNA processes and responds

**Voice states:**

| State | Visual indicator | Duration |
|---|---|---|
| **Idle** | Sparkle icon at rest (bottom-right) | Default |
| **Listening** | Animated pulse ring, mic icon active | Until director stops speaking or taps to stop |
| **Thinking** | Animated dots, "DONNA is thinking..." | Until response is generated |
| **Responding** | TTS audio + text rendering | Duration of response |

---

### Layer 3 — Coach Session Voice (separate system)

Coach voice operates in a separate scope and must not be confused with DONNA's global voice.

**Coach session voice includes:**
- `VoiceInputButton` (browser SpeechRecognition, Chrome/Edge only)
- `AudioRecorderButton` (Whisper-based, requires `OPENAI_API_KEY`)

**Scope:** Coach wrap-up drawer only. These buttons capture coach observations and wrap-up answers — they do not route to DONNA's conversation thread.

**Labeling rule:** Coach-facing mic buttons must be labeled with their specific purpose: "Record wrap-up answer" or "Add observation" — never just a microphone icon without context.

**Isolation rule:** Coach session voice must not dispatch `donna:open`. Coach voice input goes to the coach's own answer fields, not to DONNA's query stream.

---

## Voice Activation Flow (Director)

```
Director says "Hey DONNA"
    ↓
DonnaWakeWordLayer hears wake phrase
    ↓
Dispatches donna:open CustomEvent
    ↓
DonnaAssistantButton receives event, opens panel
    ↓
DonnaVoiceLayer activates — state: Listening
    ↓
Director completes query ("...what's the status of Orange Ball 2?")
    ↓
Query submitted to DONNA conversation controller
    ↓
State: Thinking
    ↓
DONNA response generated
    ↓
State: Responding (text + TTS if enabled)
    ↓
State: Idle (panel remains open, ready for next input)
```

---

## Voice State Definitions

### Idle
- DONNA is available but not actively processing
- Wake word listener is active (if session-enabled)
- Floating button shows sparkle icon at rest
- Panel is closed

### Listening
- DONNA is capturing director speech
- Visual: animated pulse ring on mic icon
- Panel is open
- Director can tap to stop early or just pause speaking

### Thinking
- DONNA has received the query and is generating a response
- Visual: animated ellipsis, "DONNA is thinking..." text
- Director can type a follow-up (queued) or wait
- Panel remains open

### Responding
- DONNA is delivering the response (text renders progressively)
- If TTS is enabled: audio plays alongside text
- Director can interrupt ("stop" or tapping the panel)
- After response: returns to Listening (if still in voice session) or Idle

---

## Single Microphone Rule

At any moment, only one voice capture system should be active.

| Scenario | Rule |
|---|---|
| Director panel is open and Listening | No other mic button should capture speech |
| Coach wrap-up recorder is active | DONNA wake word listener is suspended |
| Director navigates between pages | Voice state is preserved (panel stays open, listening continues) |
| Two tabs with AcademyOS | Each tab has its own DONNA session — no cross-tab voice |

Implementation note: `DonnaWakeWordLayer` should check whether a focused coach-facing `AudioRecorderButton` or `VoiceInputButton` is active before activating the global DONNA listener. Conflict prevention is the responsibility of the wake word layer, not the coach components.

---

## What Is NOT Part of Unified Voice

These systems use audio but are NOT part of DONNA's voice system:

| System | Why it's separate |
|---|---|
| Coach `AudioRecorderButton` | Whisper transcription for wrap-up answers — not a DONNA query |
| Coach `VoiceInputButton` | Browser SpeechRecognition for coach field entry — not a DONNA query |
| TTS in `CoachWrapUpDrawer` | Reads back coach questions during wrap-up — not DONNA speaking to the director |

These systems should not be relabeled or rebranded as DONNA voice. They serve separate functions and should be clearly labeled as such.

---

## Future Voice Capabilities (Not This Sprint)

This sprint documents the architecture. Future sprints:

| Capability | When |
|---|---|
| Production TTS (OpenAI or ElevenLabs) | Sprint 77+ — requires `OPENAI_API_KEY` |
| Continuous voice mode (no tap-to-stop) | Future — requires wake word model upgrade |
| Voice output for DONNA responses | Future — requires TTS upgrade |
| Voice interruption handling | Future — requires streaming TTS with cancellation |
| Tone calibration (first-time vs experienced director) | Future — requires user tenure signal |

---

## Wake Phrase Rationale

**"Hey DONNA"** is the canonical wake phrase.

Rules:
- Two syllables + name — natural spoken cadence
- Consistent with product identity (DONNA is always the name)
- Never varies by role: "Hey DONNA" for directors, coaches, and future portal roles
- Not interchangeable with "Hey Donna," "Hi Donna," or other variants in UI copy — always "Hey DONNA"
