# Assistant TTS Upgrade Plan

**Sprint:** 86
**Date:** 2026-05-06
**Status:** V1 uses browser `speechSynthesis` (prototype only). Production TTS requires explicit decision and key provisioning.

---

## 1. Why Browser `speechSynthesis` Is Prototype Only

| Limitation | Impact |
|---|---|
| No voice consistency | Depends on OS-installed voices. Sounds different on every device. Cannot control brand. |
| No iOS Safari support | `speechSynthesis` is unreliable on iOS — garbles or refuses mid-utterance. |
| No caching | Every utterance re-synthesised on the fly. Latency visible on slow connections. |
| No call-back accuracy | `onend` is unreliable on iOS; cancellation leaves audio in undefined state. |
| No quality control | Rate, pitch, and voice selection are not standardised across OS versions. |
| Not suitable for production coaching audio | A coach needs reliable, consistent voice in a noisy court environment. |

Current use: reads wrap-up question prompts only, on supported browsers, when coach enables it. This is appropriate for prototype/demo — not for production coaches.

---

## 2. Production TTS Options

### Option A: ElevenLabs

| Factor | Detail |
|---|---|
| Voice quality | Best-in-class. Designed for professional audio. |
| Latency | ~300–500ms to first chunk (streaming). |
| Cost | ~$0.30 per 1,000 characters. Budget: ~$5–15/month for active coach usage. |
| Caching | Cache synthesised phrases (not dynamic data) to reduce cost significantly. |
| Streaming | Yes — supports streaming with low perceived latency. |
| Voice personality | Custom voice upload possible — create "The Academy OS voice." |
| API key | Server-side only. Never exposed to browser. |
| Data risk | Text sent to ElevenLabs API. DPA/subprocessor registration required. |

### Option B: OpenAI TTS

| Factor | Detail |
|---|---|
| Voice quality | High quality (tts-1-hd model). Less customisable than ElevenLabs. |
| Latency | ~200ms. |
| Cost | ~$0.030 per 1,000 characters (10× cheaper than ElevenLabs). |
| Caching | Yes — cache audio chunks by text hash. |
| API key | Already in use for Whisper. Shared `OPENAI_API_KEY`. No new key required. |
| Streaming | Yes — mp3 stream. |
| Data risk | Text sent to OpenAI API. Same DPA as Whisper — covered together. |

### Option C: Browser Native Fallback

Keep `speechSynthesis` as a fallback-only option when production TTS is not configured. Never as primary.

### Recommended path

**V2: OpenAI TTS** — reuses existing API key, cheaper than ElevenLabs, acceptable quality for assistant prompts. Cache synthesised prompt questions by exact text hash to reduce API calls to near-zero for repeated questions.

**V3 (optional): ElevenLabs** — if voice personality and brand consistency become a product differentiator. Requires separate API key and DPA.

---

## 3. Voice Personality Spec

These rules apply regardless of TTS provider:

| Role | Voice character | Speaking pace | Emotion |
|---|---|---|---|
| Coach assistant | Calm, direct. Like a supportive colleague. | Moderate — 0.9× normal. | Neutral. No uplift, no warmth. |
| Director assistant | Briefing-room. Crisp. Informational. | Slightly faster — 1.0× normal. | Flat. Authoritative but not cold. |
| Player assistant | Encouraging. Not gamified. | Slightly slower — 0.85× normal. | Mild warmth. |
| Parent assistant | Warm but professional. | Slow and clear — 0.8× normal. | Reassuring. |

**Universal rules:**
- No filler sounds ("um", "uh")
- No forced enthusiasm
- Short utterances only (under 20 words per voice segment)
- Pause between sentences (TTS silence gap: 300ms minimum)

---

## 4. What Can Be Spoken Aloud

### Safe to speak

| Content | Role | Why safe |
|---|---|---|
| Assistant prompt questions | Coach | Helping coach remember what to answer |
| Navigation suggestions | Director | Non-sensitive route guidance |
| Count summaries | Director | "3 items need review" — no PII |
| Status phrases | All | "Saved", "Processing…", "Done" |

### Never spoken aloud by default

| Content | Why blocked |
|---|---|
| Raw coach notes | Could be overheard. Child-sensitive. |
| Specific child names in observations | Overheard = accidental disclosure |
| Health or injury references | Sensitive in any context |
| Player performance judgements | Could cause embarrassment if overheard |
| Parent contact details | PII |
| Attendance flags for specific players | Sensitive family information |
| Any note marked `is_private = true` | System-level safety boundary |

**Rule:** If the content contains a name + a judgement or status, it must NOT be spoken aloud without explicit user intent in a private setting.

---

## 5. Cost Controls

| Control | Implementation |
|---|---|
| Cache by text hash | Hash prompt question text → cache audio blob in memory or IndexedDB (session-scoped) |
| No raw notes in cache | Cache only prompt questions and system phrases — never dynamic coach/player content |
| Max TTS per session | Limit: 60 TTS calls per coach session (prompt questions only = 6 max; 10× headroom) |
| Stop on close/unmount | Always cancel in-flight TTS on component unmount |
| Mute controls | Always-visible stop/mute button next to any TTS-enabled UI |
| Server-side generation only | Audio generated server-side, streamed to browser. No client-side API key. |

---

## 6. Academy Voice Settings

Future admin settings (director configuration screen):

| Setting | Default | Who controls |
|---|---|---|
| Voice output enabled | Off | Director |
| TTS provider | OpenAI TTS | System |
| Max recording duration | 60s | Director |
| Transcription enabled | On (if key set) | Director |
| TTS per-session limit | 60 | System |

---

## 7. Accessibility

- Voice output must never be the only way to receive information — always provide visual copy.
- Stop button must be reachable without voice.
- Screen reader compatibility: TTS audio does not interfere with ARIA live regions.
- Keyboard shortcut to mute TTS: future sprint.

---

## 8. Future Implementation Plan

| Phase | Description | Sprint |
|---|---|---|
| V1 (current) | Browser `speechSynthesis` for question prompts only | Sprint 72 |
| V2 | OpenAI TTS for coach wrap-up prompts. Server-side audio generation. Cache by text hash. Mute button. | Sprint 95+ |
| V3 | ElevenLabs for premium voice personality. Academy voice settings. Per-academy on/off. | Sprint 100+ |
| V4 | Streaming TTS for director briefings. Real-time response reading. | Sprint 110+ |

**Pre-V2 requirements (must be done before implementing):**
1. `OPENAI_API_KEY` set in production environment
2. Server-side TTS endpoint built (`/api/assistant/speak`)
3. DPA documentation for OpenAI completed
4. Academy voice settings schema designed (director can disable)
5. Mute/stop button wired to all TTS-enabled components
