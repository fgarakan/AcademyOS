# DONNA Context Firewall Architecture V1

**Sprint:** Mega Sprint 2771–2800  
**Date:** 2026-06-15  
**Status:** DOCUMENTATION ONLY — No new code. Existing layers documented here.

---

## Summary

The DONNA context firewall is not a single class or module. It is five layered safety mechanisms that work together to ensure no private, sensitive, or oversized context reaches an external AI provider. This document is the authoritative reference for all five layers.

**Verdict from audit:** The existing layers are adequate for V1. No new `DonnaContextFirewall` class is needed. The primary gap (documented below) is maximum context size enforcement and a `structureCoachNote.ts` annotation.

---

## Layer Map

```
Director message input
        ↓
Layer 1: Blocked Action Pre-Screening (orchestrator.ts + safetyContract.ts)
        ↓
Layer 2: Context Packet Assembly (contextPacket.ts)
        ↓
Layer 3: Parent-Safe Context Filter (parentSafeContextFilter.ts)
        ↓
Layer 4: Token Budget Check (llmApiClient.ts)
        ↓
Layer 5: Output Post-Validation (llmApiClient.ts)
        ↓
OrchestratorOutput (safe, validated, role-scoped)
```

---

## Layer 1 — Blocked Action Pre-Screening

**Files:** `src/lib/donna/llmOrchestration/orchestrator.ts`, `src/lib/donna/llmOrchestration/safetyContract.ts`

**What it prevents:**
- Destructive commands detected in user input before the LLM call
- Known blocked action patterns (e.g., "delete all", "bulk move all players") short-circuited
- No LLM tokens consumed for blocked requests

**How it works:**
- `detectBlockedAction(userInput)` scans for blocked intent patterns
- If matched → function returns without calling `callDonnaLlm()`
- Blocked actions are logged to `safetyAudit[]` for internal review

**Gap:** None. This layer is robust.

---

## Layer 2 — Context Packet Assembly

**Files:** `src/lib/donna/llmOrchestration/contextPacket.ts`

**What it prevents:**
- Raw coach notes reaching the LLM
- Player names in the system prompt (only aggregate counts and anonymized signals)
- Private assessment scores
- Internal decision logic not relevant to the current request

**How it works:**
- `buildContextPacket()` assembles only `safeSignals` — aggregated, anonymized academy state
- No raw DB records are included
- Coach notes and player-specific text are excluded by design
- Conversation history is limited to last 4 turns

**What IS included (permitted):**
- Role, page path, pending review count
- Academy name (non-sensitive)
- Aggregate KPI signals (e.g., "3 players advancement-eligible")
- Active workflow missions
- Recommendation context (anonymized — no player names)
- Memory context (decision patterns — no raw note content)
- Academy DNA summary (philosophy, model, preferences)

**Gap:** No maximum context size enforcement. Warning fires at 4,000 chars but does not block. Oversized context can inflate token costs and degrade response quality. **Action:** Add `if (systemPrompt.length > 6000) throw new Error('Context packet exceeds safe size limit')` to `callDonnaLlm()`.

---

## Layer 3 — Parent-Safe Context Filter

**Files:** `src/lib/donna/llmOrchestration/parentSafeContextFilter.ts`

**What it prevents (for parent-facing responses only):**
- Raw coach notes
- Internal assessment scores
- Player comparison data
- Behavioral flags and risk signals
- Level change proposals
- Peer rankings

**How it works:**
- `filterForParentSafe(data)` removes blocked field names and content patterns
- Applied specifically when generating parent-facing content (emails, portal updates)
- Director and coach contexts do NOT go through this filter (they have broader access)

**Blocked field names:**
`coach_notes`, `coach_note`, `raw_notes`, `observations`, `internal_assessment`, `score_delta`, `risk_signals`, `behavioral_flags`, `attention_flags`, `level_movement_proposal`, `comparison_data`, `peer_comparison`, `ranking`, `session_notes_raw`, `voice_notes`, `recap_raw`

**Blocked content patterns:**
- `/coach.*note/i`
- `/internal.*assessment/i`
- `/risk.*signal/i`
- `/behavioral.*flag/i`
- `/raw.*note/i`
- `/ranked\s+\d+(st|nd|rd|th)/i`
- `/compared to (other|peers|the group)/i`

**Gap:** None for parent-facing context. Layer is robust.

---

## Layer 4 — Token Budget Check

**Files:** `src/lib/donna/llmOrchestration/llmApiClient.ts`

**What it prevents:**
- Oversized system prompts degrading response quality
- Unexpected token cost spikes

**How it works:**
- If `ctx.systemPrompt.length > 4000` → warning pushed to `safetyAudit[]`
- Does NOT block the request (gap — see above)
- Token usage is logged via `logDonnaLlmUsage()`

**Gap:** Warning only — no enforcement. Upgrade to: throw if `> 6000 chars` (approximately 1,500 tokens), warn if `> 4,000 chars`.

---

## Layer 5 — Output Post-Validation

**Files:** `src/lib/donna/llmOrchestration/llmApiClient.ts`

**What it prevents:**
- Invalid LLM response types reaching the UI
- Blocked action patterns appearing in LLM-generated text
- External route suggestions (LLM trying to send directors outside the app)
- Responses declaring themselves `safetyLevel: blocked` being used

**How it works:**
```
1. Parse JSON response
2. Validate against LlmDonnaResponse schema
3. Verify output type in VALID_OUTPUT_TYPES
4. Scan response text for blocked action patterns
5. Reject safetyLevel === 'blocked' responses
6. Sanitize suggestedRoute (must start with /director, /coach, /player, /parent)
```

**Gap:** None. This layer is robust.

---

## Special Case: structureCoachNote.ts

**File:** `src/lib/ai/structureCoachNote.ts`

This is the **only intentional exception** to the firewall — raw coach note text is sent directly to Anthropic as the primary input. This is the designed behavior: the entire purpose of this endpoint is to structure raw coach notes.

**Safeguards in place:**
- Server-side action only (never callable from client)
- Called explicitly by director/coach — not automatically
- Output is a structured draft requiring review before use
- No player identifiers in the API call (note text only)
- Result requires director or coach to review before saving

**Documentation status:** This intentional exception is now documented here. No change to the file is needed.

---

## Privacy Risk by Future AI Provider

| Provider | Risk Level | Required Pre-Integration Checks |
|---|---|---|
| Anthropic (Claude) — current | LOW | Data not stored by API; ANTHROPIC_API_KEY server-side only |
| OpenAI | MEDIUM | Review OpenAI's data retention policy for minor athlete data. Check COPPA/FERPA applicability. |
| Google Gemini | MEDIUM | Same as OpenAI — audit before integration |
| Local models (Ollama, etc.) | LOW | No data leaves premise; preferred for sensitive coach note processing |

---

## Future Insertion Point for DonnaContextFirewall

If a formal firewall class is ever needed, insert it **between Layer 2 and Layer 4**:

```typescript
// In orchestrator.ts, before callDonnaLlm():
const firewall = new DonnaContextFirewall()
const firewallResult = firewall.validate(contextPacket, role)
if (!firewallResult.safe) {
  return buildFirewallBlockedResponse(firewallResult.reasons)
}
```

At V1, this is not needed. The five existing layers adequately protect context integrity.

---

## Memory Retention Policy (Supporting Layer)

**File:** `src/lib/donna/donnaMemoryPolicy.ts`

Defines `neverStore` rules for each memory category:
- `user_preference`: never stores player names, raw notes, private communications
- `academy_operation`: never stores coach identity with negative signals, raw coach notes
- `coach_behavior`: never stores player-specific details tied to coach names
- `player_development`: never stores player names or family identifying information
- `recommendation_outcome`: never stores which specific player was recommended for what

The memory policy is the upstream firewall — it prevents sensitive data from entering the memory layer that would then be assembled into context packets.

---

*End of DONNA Context Firewall Architecture V1*  
*No code was changed in this document — all layers described are already implemented.*
