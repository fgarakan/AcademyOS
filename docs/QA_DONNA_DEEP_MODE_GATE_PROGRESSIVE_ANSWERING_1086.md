# QA — Sprint 1086: DONNA Deep Mode Gate + Progressive Answering V1

**Date:** 2026-06-01
**Sprint:** 1086

---

## Test 1 — Compile

| # | Check | Expected | Pass? |
|---|---|---|---|
| 1.1 | `npx tsc --noEmit` | Zero new errors | |
| 1.2 | `donnaDeepModeGate.ts` exports `DeepModeGateResult` | Present | |
| 1.3 | `donnaDeepModeGate.ts` exports `isDeepModeRequest` | Present | |
| 1.4 | `donnaDeepModeGate.ts` exports `buildDeepModeFirstPassResponse` | Present | |

---

## Test 2 — Deep Mode trigger (gate FIRES)

| # | Input | Expected: `isDeepModeRequest` | Pass? |
|---|---|---|---|
| 2.1 | "audit the whole academy" | `true` | |
| 2.2 | "audit the academy" | `true` | |
| 2.3 | "analyze all players" | `true` | |
| 2.4 | "find every gap" | `true` | |
| 2.5 | "find every curriculum gap" | `true` | |
| 2.6 | "all the data" | `true` | |
| 2.7 | "full diagnosis" | `true` | |
| 2.8 | "full analysis" | `true` | |
| 2.9 | "complete analysis" | `true` | |
| 2.10 | "comprehensive review" | `true` | |
| 2.11 | "thorough analysis" | `true` | |
| 2.12 | "deep analysis" | `true` | |
| 2.13 | "compare all coaches" | `true` | |
| 2.14 | "academy-wide analysis" | `true` | |
| 2.15 | "everything about my academy" | `true` | |
| 2.16 | "complete strategy" | `true` | |
| 2.17 | "in-depth assessment" | `true` | |
| 2.18 | "generate a full report" | `true` | |

---

## Test 3 — Normal questions pass through (gate does NOT fire)

| # | Input | Expected: `isDeepModeRequest` | Pass? |
|---|---|---|---|
| 3.1 | "how is my academy?" | `false` | |
| 3.2 | "tell me about the health of my academy" | `false` | |
| 3.3 | "what needs attention?" | `false` | |
| 3.4 | "what should I focus on?" | `false` | |
| 3.5 | "explain this KPI" | `false` | |
| 3.6 | "open approvals" | `false` | |
| 3.7 | "make this fitness template more game-based" | `false` | |
| 3.8 | "draft a parent update" | `false` | |
| 3.9 | "who needs attention?" | `false` (`who` exclusion) | |
| 3.10 | "what are the curriculum levels?" | `false` (`what are` exclusion) | |
| 3.11 | "show me the players" | `false` (`show me` exclusion) | |
| 3.12 | "why is attendance low?" | `false` (`why` exclusion) | |
| 3.13 | "health of my academy" | `false` (exclusion pattern) | |
| 3.14 | "what do the KPIs mean?" | `false` | |

---

## Test 4 — Progressive response quality

| # | Check | Expected | Pass? |
|---|---|---|---|
| 4.1 | "audit the whole academy" → response contains "Quick read:" | Present | |
| 4.2 | Response contains "deeper analysis" and "data sources" | Present | |
| 4.3 | Response contains "yes, go deep" confirmation prompt | Present | |
| 4.4 | "analyze all players" → response mentions player signals | Contains player-related guidance | |
| 4.5 | "compare all coaches" → response mentions wrap-up coverage | Contains coaching signal guidance | |
| 4.6 | "find every curriculum gap" → response mentions curriculum levels | Contains curriculum guidance | |
| 4.7 | `firstPassResponse` is non-null when `isDeepMode: true` | Non-null | |

---

## Test 5 — Runtime gate behavior

| # | Check | Expected | Pass? |
|---|---|---|---|
| 5.1 | "audit the whole academy" → `handleGodModeQuery` NOT called | No LLM call fires | |
| 5.2 | Gate response set via `setCommandResponse` | Command response visible | |
| 5.3 | Gate response appended to `cooThread` | Thread updated | |
| 5.4 | `speakDonna` called with first-pass response | Voice output triggered | |
| 5.5 | `recordTurn` called with `domain: 'general'` | Session memory updated | |
| 5.6 | `setTypedText('')` called (input cleared) | Input field cleared | |
| 5.7 | `focusDonnaInput()` called (ready for confirmation) | Input focused | |

---

## Test 6 — Passthrough behavior preserved

| # | Input | Expected flow | Pass? |
|---|---|---|---|
| 6.1 | "open approvals" | handleUIDispatch → /director/review. Gate never reached. | |
| 6.2 | "tell me about the health of my academy" on /director/kpi | Context-pack answers. Gate never reached. | |
| 6.3 | "what should I review first?" on /director/review | Context-pack or action-registry. Gate never reached. | |
| 6.4 | "make this fitness template more game-based" | Action-registry response. Gate never reached. | |
| 6.5 | "how many players do I have?" | God Mode (normal Tier 4). Gate does NOT fire. | |
| 6.6 | "what are my curriculum gaps?" | God Mode (normal). Gate does NOT fire (`what are` exclusion). | |
| 6.7 | Director types "yes, go deep" after gate response | Normal `handleCommandSubmit` → God Mode (no gate, not a deep pattern). | |

---

## Acceptance Criteria Summary

- [ ] "audit the whole academy" → first-pass response + asks for confirmation; no LLM call
- [ ] "analyze all players" → first-pass response + asks for confirmation; no LLM call
- [ ] "how is my academy?" → normal flow unchanged
- [ ] "tell me about academy health" → context-pack or normal God Mode, unaffected
- [ ] "open approvals" → dispatcher routes to /director/review, unaffected
- [ ] "make this fitness template more game-based" → action-registry response, unaffected
- [ ] "yes, go deep" (director confirmation) → reaches God Mode normally
- [ ] TypeScript passes
