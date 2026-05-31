# QA — Sprint 1075: DONNA Academy Profile Context Wiring V1

**Date:** 2026-05-31
**Sprint:** 1075

---

## Test 1 — File changes compile

| # | Check | Expected | Pass? |
|---|---|---|---|
| 1.1 | `npx tsc --noEmit` passes | Zero TypeScript errors | |
| 1.2 | `donnaOrchestratorAction.ts` compiles | No new TS errors | |
| 1.3 | `contextPacket.ts` compiles | No new TS errors | |

---

## Test 2 — `donnaOrchestratorAction.ts` changes

| # | Check | Expected | Pass? |
|---|---|---|---|
| 2.1 | Imports `buildAcademyProfileFromLiveData` | Present | |
| 2.2 | Imports `buildEmptyAcademyProfile` | Present | |
| 2.3 | Imports `getAcademyProfileSummaryText` | Present | |
| 2.4 | `getAuthorizedContext` queries `academies` table | Selects `name, slug, timezone, country, settings` | |
| 2.5 | Academy query is scoped to authenticated `academyId` | `.eq('id', academyId)` present | |
| 2.6 | Academy data is NOT accepted from client input | `DonnaOrchestratorInput` unchanged — no new academy fields accepted from client | |
| 2.7 | `buildAcademyProfileFromLiveData` called when academy data available | Called with name, slug, timezone, country, rawAcademySettings | |
| 2.8 | `buildEmptyAcademyProfile` used when academy query fails | Fallback in catch block | |
| 2.9 | `getAcademyProfileSummaryText` called and result stored | `academyProfileSummary` string returned from `getAuthorizedContext` | |
| 2.10 | `academyProfileSummary` passed into `orchestrate()` call | Present in orchestrate args | |
| 2.11 | Raw `academies.settings` JSON NOT passed to LLM | Only summary string passed — settings consumed server-side | |

---

## Test 3 — `contextPacket.ts` changes

| # | Check | Expected | Pass? |
|---|---|---|---|
| 3.1 | `academyProfileSummary?: string` added to `ContextPacketInput` | Present | |
| 3.2 | `buildSystemPrompt` signature accepts `academyProfileSummary?` | Present | |
| 3.3 | `buildContextPacket` passes `input.academyProfileSummary` to `buildSystemPrompt` | Present | |
| 3.4 | "## Academy Context" section added to system prompt | When summary present and not empty-profile fallback | |
| 3.5 | Section suppressed when summary starts with "Academy profile context is not available" | Section absent in system prompt | |
| 3.6 | Section suppressed when `academyProfileSummary` is undefined or empty | Section absent | |
| 3.7 | No raw settings JSON in system prompt | Only the summary text string | |
| 3.8 | No player names, parent/player private data | System prompt unchanged for sensitive data | |

---

## Test 4 — System prompt content (live profile)

When academy query succeeds with full data:

| # | Expected in system prompt | Pass? |
|---|---|---|
| 4.1 | "## Academy Context" header present | |
| 4.2 | Academy name included (e.g. "Academy: Dabul Tennis Academy") | |
| 4.3 | Director name from directorName prop still in Identity section | |
| 4.4 | Section placed between Identity and Current State | |

---

## Test 5 — System prompt content (partial/fallback)

| # | Scenario | Expected | Pass? |
|---|---|---|---|
| 5.1 | Academy query returns null | `buildEmptyAcademyProfile` used → summary suppressed | |
| 5.2 | Academy query throws exception | Catch block → fallback → section suppressed | |
| 5.3 | `academyProfileSummary` = empty string | Section omitted | |

---

## Test 6 — Existing DONNA behavior unchanged

| # | Check | Expected | Pass? |
|---|---|---|---|
| 6.1 | Context-pack lookup (Sprint 1073) still works | Pack answers still resolve before orchestrator | |
| 6.2 | Navigation commands ("open approvals") still route correctly | `handleUIDispatch` unchanged | |
| 6.3 | God Mode fallback still reaches LLM | Orchestrator path unchanged | |
| 6.4 | Typed text input still works | Unchanged | |
| 6.5 | Voice transcript still works | Unchanged | |
| 6.6 | Response cards and chips unchanged | No DonnaAssistantButton changes | |
| 6.7 | Unknown questions still fall through to God Mode | Unchanged | |
| 6.8 | `DonnaOrchestratorInput` unchanged (no new client-trusted fields) | No new fields from client | |
| 6.9 | `DonnaAssistantButton.tsx` unchanged | Not modified | |
| 6.10 | `donnaContextPackRegistry.ts` unchanged | Not modified | |

---

## Acceptance Criteria Summary

- [ ] DONNA orchestrator/system prompt receives `academyProfileSummary` when academy data is available
- [ ] Academy summary includes identity fields from the authenticated server-side query
- [ ] Missing fields (curriculum, ball levels, preferences) are honest — not invented
- [ ] Client is never the source of truth for academy identity
- [ ] Academy query failure degrades gracefully — DONNA still responds
- [ ] Context-pack answers still work
- [ ] Unknown questions still fall through to God Mode
- [ ] TypeScript passes
