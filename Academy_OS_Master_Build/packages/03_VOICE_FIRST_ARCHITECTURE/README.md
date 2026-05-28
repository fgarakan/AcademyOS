# Package 03 — Voice-First Architecture
**Status:** Draft v1.0

## Contents
| File | Purpose |
|---|---|
| `VOICE_COMMAND_LIFECYCLE.md` | Full 11-stage pipeline with examples |
| `VOICE_INTENT_TAXONOMY.md` | All intent types, required entities, ambiguity rules |
| `VOICE_TO_STRUCTURED_ACTION_SPEC.md` | Stages 3–5: normalization → entity resolution → validated payload |
| `PROPOSED_ACTIONS_SYSTEM.md` | Lifecycle, approval UI spec, execution, access control |
| `DIRECTOR_APPROVAL_WORKFLOW.md` | Review UI and approval patterns (TODO) |
| `CLARIFICATION_LOGIC.md` | How the system asks follow-up questions (TODO) |
| `VOICE_COMMAND_EXAMPLES.md` | Real examples with expected outputs (see voice-command-examples.ts) |
| `VOICE_SECURITY_AND_GUARDRAILS.md` | What voice cannot do, role gates, expiry (TODO) |
| `FUTURE_AI_INTERPRETATION_LAYER.md` | V3 vision for autonomous AI interpretation (TODO) |

## Key rule
Voice never directly mutates core data.
Always: voice → transcript → intent → proposed action → approval → execution → audit

## V1 reality
V1 uses typed input through the voice pipeline UI. The same pipeline, without audio recording.
Audio recording (Whisper) is V2.
