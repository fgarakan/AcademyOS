# DONNA Voice + Chat Re-Audit — Sprint 650

**Date:** 2026-05-22  
**Scope:** All DONNA voice and chat flows from Sprint 288 through Sprint 649  
**Auditor:** Sprint 650 automated audit pass

---

## 1. Voice Output Paths

| Path | Status | Notes |
|---|---|---|
| OpenAI Realtime WebRTC | Infrastructure exists (`useDonnaRealtimeVoice.ts`) | Requires `OPENAI_API_KEY` on server |
| Server TTS (`/api/donna/tts`) | Wired (`donnaServerTtsClient.ts`) | Falls back to browser TTS if key absent |
| Browser `speechSynthesis` | Wired and tested | Cross-browser (Chrome/Safari) — no Firefox support |
| Silent mode | Always available | Screen text is source of truth |

**Voice preload:** Added Sprint 646 — warms browser TTS engine on panel open.

---

## 2. Voice Input Paths

| Path | Status | Notes |
|---|---|---|
| Browser `SpeechRecognition` | Wired (`VoiceInputButton.tsx`) | Chrome/Edge only; no Firefox/Safari |
| Persistent mode (auto-restart) | Added Sprint 641 | `persistent` prop + `maxRetries` guard |
| Auto-restart guard | Added Sprint 642 | Max 3 consecutive silence retries before fallback |
| Interim transcript display | Wired Sprint 644 | "Use this" button captures partial result |
| Wake phrase detection | Wired (`donnaVoiceRuntime.ts`) | Panel-local only; no global listening |

**Current question display:** Added Sprint 643 — shows active question during guided flows.

---

## 3. Protected Phrase Enforcement

Phrases that sound like approval commands but must **always** use the on-screen button:

- `save it`, `save this`, `save the draft`, `save this draft`
- `apply it`, `send it`, `approve it`, `confirm it`, `do it`
- `move her up`, `move him up`, `move them up`
- `go ahead and apply`, `go ahead and send`, `go ahead and save`
- `execute it`

**Enforcement point:** `isProtectedVoicePhrase()` in `donnaVoiceRuntime.ts`  
**Response:** `VOICE_PROTECTED_RESPONSE` constant — directs to on-screen button  
**Test coverage:** Sprint 649 `donnaSafetyTestHarness.ts` — 8 cases

---

## 4. Onboarding Routing Protection

Phrases that would auto-start onboarding are **routed**, not executed:

- Detected by `isOnboardingRoutingPhrase()` in `donnaVoiceRuntime.ts`
- Response: `ONBOARDING_ROUTING_RESPONSE` — explains the process and prompts screen click
- DONNA never auto-starts onboarding from voice alone

**Test coverage:** Sprint 649 — 3 cases

---

## 5. DONNA Doctrine Compliance Checklist

| Rule | Status |
|---|---|
| Voice never directly mutates core data | Confirmed — all mutations go through `proposed_actions` |
| No level movement from voice without approval | Confirmed — `LevelMovementReviewCard` shows apply controls only after approval |
| No parent/player content published without approval | Confirmed — `ParentSummaryReviewCard` has explicit blockers |
| Raw coach notes never exposed | Confirmed — no raw coach note surface in any voice or chat output |
| No sibling player data exposed | Confirmed — all queries academy-scoped |
| No cross-academy data exposure | Confirmed — all queries include `academy_id` guard |
| No global knowledge promotion from director | Confirmed — `KnowledgePromotionReviewCard` blocks global promotion |
| No video visibility change without approval | Confirmed — `VideoVisibilityReviewCard` has apply path blocker |
| All mutations audit-logged | Confirmed — `audit_logs` written on all approved action executions |
| Approval-only actions require on-screen button | Confirmed — protected phrase enforcement wired |

---

## 6. Known Limitations and Gaps

| Area | Gap | Sprint to Address |
|---|---|---|
| SpeechRecognition browser support | Firefox and Safari not supported; silent fallback only | Future (platform TTS) |
| Voice input on iOS | `webkitSpeechRecognition` unreliable on iOS Safari | Future |
| Realtime voice availability | Requires server-side `OPENAI_API_KEY` — not available in dev | Ops config |
| Name correction memory | Session-local only — cleared on refresh (Sprint 645) | Future: persist to preferences |
| Voice preload (realtime probe) | HEAD probe may not work on all CORS configs | Low risk — fails silently |
| Badge/mission apply path | No `badge_award` or `mission_assignment` execute path exists | Future sprint |
| Video visibility apply path | No `video_visibility_change` execute path exists | Future sprint |
| Knowledge promotion apply path | No `knowledge_promotion` execute path (by design for platform-owner gate) | Intentional |
| Parent communication send | No send infrastructure — approval captures decision only | Future sprint |

---

## 7. File Registry

| File | Purpose |
|---|---|
| `donnaVoiceRuntime.ts` | Shared types, protected phrases, wake detection, timeouts |
| `VoiceInputButton.tsx` | Browser SpeechRecognition — persistent + single-shot mode |
| `donnaVoicePreload.ts` | Browser TTS warm-up + realtime availability probe |
| `DonnaVoiceLayer.tsx` | Voice input card, interim transcript, pending answer review |
| `DonnaCurrentQuestionDisplay.tsx` | Current question spotlight for guided flows |
| `donnaNameCorrections.ts` | Session-local name correction registry |
| `donnaSafetyTestHarness.ts` | QA utility — runs safety rule test cases |
| `donnaVoicePolicy.ts` | Voice output mode resolution (realtime / TTS / silent) |
| `donnaServerTtsClient.ts` | Server TTS client with browser TTS fallback |
| `useDonnaRealtimeVoice.ts` | OpenAI Realtime WebRTC hook |
| `donnaVisibilityGuardrail.ts` | Parent/player visibility rule enforcement |
| `donnaParentSafeRules.ts` | Rules for what DONNA may and may not surface to parents |
| `donnaPermissionGuard.ts` | Role-based permission enforcement for DONNA actions |

---

## 8. Outstanding Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Director says protected phrase embedded in longer sentence | Medium | `isProtectedVoicePhrase` checks for substring inclusion — mitigated |
| SpeechRecognition transcribes "save it" from background noise | Low | Protected phrase blocks execution; on-screen button always required |
| Retry loop exhaustion not communicated clearly | Low | Sprint 642 — `retryExhausted` state shown with fallback notice |
| Voice capture during wrong context (e.g., typing in another field) | Low | Panel-local only; no global wake listener |
| Stale name correction overwriting a legitimate similar name | Medium | Sprint 645 — whole-word replacement only via regex |

---

*Audit complete. No code changes in this sprint. Next: Sprint 651 Coach Recap Golden Path Polish.*
