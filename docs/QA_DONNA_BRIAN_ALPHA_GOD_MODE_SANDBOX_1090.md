# QA — Sprint 1090: DONNA Brian Alpha God Mode Sandbox V1

**Date:** 2026-06-01
**Sprint:** 1090

---

## Test 1 �� Compile

| # | Check | Expected | Pass? |
|---|---|---|---|
| 1.1 | `npx tsc --noEmit` | Zero new errors | |
| 1.2 | `donnaBrianAlphaSandbox.ts` exports `isBrianAlphaSandboxAllowed` | Present | |
| 1.3 | `donnaBrianAlphaSandbox.ts` exports `isBrianAlphaSandboxRequest` | Present | |
| 1.4 | `donnaBrianAlphaSandbox.ts` exports `buildBrianAlphaSandboxDisclosure` | Present | |
| 1.5 | `donnaBrianAlphaSandbox.ts` exports `buildBrianAlphaSandboxBlockedMessage` | Present | |

---

## Test 2 — Trigger phrase detection

| # | Input | Expected: `isBrianAlphaSandboxRequest` | Pass? |
|---|---|---|---|
| 2.1 | "run brian alpha sandbox" | `true` | |
| 2.2 | "test donna god mode" | `true` | |
| 2.3 | "run sandbox academy audit" | `true` | |
| 2.4 | "run alpha deep analysis" | `true` | |
| 2.5 | "test alpha deep mode" | `true` | |
| 2.6 | "run dabul alpha analysis" | `true` | |
| 2.7 | "alpha sandbox" | `true` | |
| 2.8 | "ALPHA SANDBOX" (case insensitive) | `true` | |
| 2.9 | "donna alpha test" | `true` | |

---

## Test 3 — Normal phrases do NOT trigger sandbox

| # | Input | Expected: `isBrianAlphaSandboxRequest` | Pass? |
|---|---|---|---|
| 3.1 | "how is my academy?" | `false` | |
| 3.2 | "open approvals" | `false` | |
| 3.3 | "make this fitness template more game-based" | `false` | |
| 3.4 | "audit the whole academy" | `false` (that's Deep Mode, not sandbox trigger) | |
| 3.5 | "analyze all players" | `false` | |
| 3.6 | "what needs attention?" | `false` | |
| 3.7 | "tell me about academy health" | `false` | |
| 3.8 | "yes, go deep" | `false` | |

---

## Test 4 — Access control

| # | academyId | Env: NEXT_PUBLIC_DONNA_ALPHA_SANDBOX_ACADEMY_IDS | Expected: `isBrianAlphaSandboxAllowed` | Pass? |
|---|---|---|---|---|
| 4.1 | `abc-123` | `abc-123` | `true` | |
| 4.2 | `abc-123` | `abc-123,xyz-456` | `true` (comma list) | |
| 4.3 | `xyz-456` | `abc-123` | `false` | |
| 4.4 | `abc-123` | `` (empty) | `false` (disabled) | |
| 4.5 | `abc-123` | Not set | `false` (default OFF) | |
| 4.6 | `abc-123` | `ABC-123` (upper case) | `true` (case-insensitive) | |
| 4.7 | any | NEXT_PUBLIC_DONNA_ALPHA_SANDBOX_ENABLED=`false` | `false` (master switch OFF) | |

---

## Test 5 — Sandbox disclosure content

| # | Check | Expected | Pass? |
|---|---|---|---|
| 5.1 | Disclosure contains "Sandbox / Alpha Analysis" | Yes | |
| 5.2 | Disclosure lists explicit "will NOT do" items | Yes — player levels, parent comms, curriculum, rosters | |
| 5.3 | Disclosure lists what sandbox produces | Drafts, reports, recommendations | |
| 5.4 | Disclosure asks for specific question | Yes — includes examples | |
| 5.5 | Disclosure contains "alpha sandbox mode" note | Yes | |
| 5.6 | `buildBrianAlphaSandboxDisclosure()` returns non-empty string | Present | |
| 5.7 | `buildBrianAlphaSandboxBlockedMessage()` returns non-empty string | Present | |
| 5.8 | Blocked message references "platform administrator" | Yes | |

---

## Test 6 — Runtime gate behavior

| # | Scenario | Expected | Pass? |
|---|---|---|---|
| 6.1 | Allowed academyId + sandbox phrase | Disclosure shown, label "Sandbox / Alpha Analysis", God Mode NOT called | |
| 6.2 | Blocked academyId + sandbox phrase | Blocked message shown, God Mode NOT called | |
| 6.3 | Sandbox gate runs BEFORE Deep Mode gate | Sandbox phrase caught before "audit the whole academy" Deep Mode check | |
| 6.4 | `setCommandResponse` called with correct label | "Sandbox / Alpha Analysis" or "Not authorized" | |
| 6.5 | `speakDonna` called | Yes | |
| 6.6 | `recordTurn` called with `domain: 'general'` | Yes | |
| 6.7 | `setTypedText('')` called | Input cleared | |
| 6.8 | `handleGodModeQuery` NOT called | Zero LLM calls on initial sandbox trigger | |

---

## Test 7 — Passthrough behavior preserved

| # | Check | Expected | Pass? |
|---|---|---|---|
| 7.1 | "open approvals" still routes to /director/review | Dispatcher unaffected | |
| 7.2 | "tell me about the health of my academy" → context-pack | Context-pack fires first, sandbox never reached | |
| 7.3 | "audit the whole academy" → Deep Mode gate | Sprint 1086 Deep Mode gate still fires (sandbox not triggered) | |
| 7.4 | Normal questions → God Mode | God Mode unaffected | |
| 7.5 | Sprint 1080 token logging | Unchanged | |
| 7.6 | Sprint 1083 history filter | Unchanged | |
| 7.7 | Sprint 1086 Deep Mode gate intact | Runs after sandbox gate | |
| 7.8 | TypeScript: `npx tsc --noEmit` | Zero new errors | |

---

## Acceptance Criteria Summary

- [ ] Authorized academyId + sandbox trigger → disclosure response, no LLM call
- [ ] Unauthorized academyId + sandbox trigger → blocked message, no LLM call
- [ ] Default OFF when env vars not set
- [ ] Disclosure explicitly lists what DONNA will not do
- [ ] "audit the whole academy" still goes to Deep Mode gate (not sandbox)
- [ ] Normal DONNA behavior unchanged across all pages
- [ ] TypeScript passes
