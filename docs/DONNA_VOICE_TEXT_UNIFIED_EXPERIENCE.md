# DONNA Voice + Text Unified Experience

> Sprint 471 — Voice + Text Unified Experience V1
> See also: `docs/UX_STATE_PATTERNS.md`, `docs/MOBILE_INTERACTION_PATTERNS.md`, `src/lib/donna/conversation/index.ts`

---

## Core principle

DONNA's voice and text paths must produce identical outcomes. A spoken instruction and a typed instruction create the same draft, the same proposal, the same audit log entry, and the same approval requirement.

---

## Unified behavior contract

| Behavior | Voice | Text | Status |
|---|---|---|---|
| Context window | Same academy context pack | Same academy context pack | ✓ |
| Draft output | proposed_actions pipeline | proposed_actions pipeline | ✓ |
| Approval flow | Director review queue | Director review queue | ✓ |
| Audit log | Written with source='voice' | Written with source='ui' | ✓ |
| Role gates | Enforced | Enforced | ✓ |
| Safety rules | Trust Stack applied | Trust Stack applied | ✓ |
| Session memory | Same donnaSessionMemory | Same donnaSessionMemory | ✓ |
| Transcript | Stored in voice_notes | N/A | ✓ |
| Error handling | Voice failed → type instead | Standard error | ✓ |

---

## Voice input pipeline

```
Microphone → AudioRecord → TranscriptionService (OpenAI/Google)
→ transcript text
→ same DONNA classifyDonnaIntent() function
→ same multi-step task flow
→ same proposed_action creation
```

Voice structuring is gated by:
- `isVoiceTranscriptionEnabled()` feature flag
- `isKillSwitchAllowed('voice_processing')` kill switch
- Minimum transcript length (20 chars from `recapIntelligence.ts`)

---

## Text input pipeline

```
Textarea / Command input → text
→ same DONNA classifyDonnaIntent() function
→ same multi-step task flow
→ same proposed_action creation
```

---

## UI unification rules

1. Both voice and text show the same **review/confirm step** before submitting.
2. Both show the same **action preview card** before creating a proposed_action.
3. Both display the same **"Submitted for review"** success state.
4. Voice additionally shows: transcript preview → "Does this look right?" → confirm.
5. If voice fails, "type instead" immediately shows the text input.
6. Both write to the same audit_logs with different source values.

---

## What is not unified (by design)

- Voice has an additional transcription step (no text equivalent)
- Voice has a "does this look right?" transcript confirmation step
- Voice is not available to parent or player roles
- Text input is always available as a fallback
- TTS (text-to-speech) response is a voice-only feature; text shows text responses only

---

## Related components

- `src/components/voice/` — voice input components
- `src/lib/donna/donnaGateway.ts` — checks feature flags + kill switches for both paths
- `src/lib/donna/donnaIntentClassifier.ts` — shared classification (voice/text both use it)
- `src/lib/voice/` — voice pipeline helpers
