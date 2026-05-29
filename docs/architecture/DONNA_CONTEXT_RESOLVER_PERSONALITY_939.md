# DONNA Context Resolver + Personality Module V1
**Date:** 2026-05-29
**Sprint:** 939
**Status:** Complete

---

## What Was Built

Sprint 939 creates the two foundational library files for DONNA God Mode unification:

1. **`src/lib/donna/donnaPersonality.ts`** — Single source of truth for DONNA's identity, voice principles, role-specific tone, and safety language.
2. **`src/lib/donna/donnaContextResolver.ts`** — Single function that resolves a structured `DonnaResolvedContext` from role + pathname.

One shell change:
3. **`src/components/donna/DonnaAssistantShell.tsx`** — Default title now reads `DONNA_PERSONALITY.name` instead of the hardcoded string `'DONNA'`.

---

## File 1 — `donnaPersonality.ts`

### Purpose
All DONNA surfaces — Shell A, Shell B, embedded panels, page components — have scattered personality copy. This module is the canonical reference for:
- DONNA's name and tagline
- Voice principles (direct, factual, action-oriented, honest, safe)
- Role-specific tone rules for all 5 roles
- Reusable safety language messages
- Parent-safe language patterns
- Player-safe language patterns

### Key exports
```typescript
type DonnaContextRole = 'director' | 'coach' | 'parent' | 'player' | 'platform'

const DONNA_PERSONALITY = {
  name: 'DONNA',
  tagline: 'Your Academy COO',
  voicePrinciples: [...],
  roleTone: { director, coach, parent, player, platform },
  safetyLanguage: { approvalRequired, draftOnly, alwaysBlocked, ... },
  parentSafeLanguage: { ... },
  playerSafeLanguage: { ... },
}

function getRoleTone(role: DonnaContextRole): DonnaRoleTone
function getSafetyMessage(key: ...): string
function roleSupportsHighlight(role: DonnaContextRole): boolean
function roleCanCreateDrafts(role: DonnaContextRole): boolean
function roleSeesApprovalGates(role: DonnaContextRole): boolean
```

### DonnaContextRole vs existing role types
| Type | File | Values | Used for |
|---|---|---|---|
| `DonnaContextRole` (new) | `donnaPersonality.ts` | director, coach, parent, player, platform | Unified personality/resolver layer |
| `DonnaAssistantRole` (existing) | `DonnaAssistantShell.tsx` | director, coach, parent, player, platform | Shell UI role badge |
| `DonnaRole` (existing) | `donnaRoleBoundaries.ts` | director, coach | Legacy boundary checks |

The new `DonnaContextRole` aligns with `DonnaAssistantRole` but lives in the library layer to avoid importing component types into library files.

---

## File 2 — `donnaContextResolver.ts`

### Purpose
Resolves a structured `DonnaResolvedContext` from role + pathname. V1 is pure static resolution using `getPageCapabilityMap()` from the modern context engine. Future versions accept optional `DirectorDonnaContext` / `CoachDonnaContext` for live data enrichment.

### Output type
```typescript
interface DonnaResolvedContext {
  userRole: DonnaContextRole
  route: string
  pageKey: string            // Canonical route pattern (e.g. '/director/players/[playerId]')
  pagePurpose: string        // What this page is for
  roleCapabilities: string[] // Safe context DONNA can reference
  safetyBoundaries: string[] // What DONNA must not do
  knownApprovalActions: string[] // Actions needing director sign-off
  allowedAnswerTypes: string[]
  suggestedPrompts: string[]
  dataFallback: string
  highlightAvailable: boolean
  canCreateDrafts: boolean
  seesApprovalGates: boolean
  contextSources: string[]   // Active context systems for this role
}
```

### Key exports
```typescript
function resolveDonnaContext(role: DonnaContextRole, pathname: string): DonnaResolvedContext
function getTopSuggestedPrompt(pathname: string): string | null
function getPageLabel(pathname: string): string
function pageHasApprovalGates(pathname: string): boolean
```

### Context sources by role
| Role | Context sources |
|---|---|
| director | donnaPageContextEngine, DirectorDonnaContext (optional), donnaChatSessionMemory, donnaContextPacketBuilder, donnaIntentRouterV1 |
| coach | donnaPageContextEngine, CoachDonnaContext (optional), donnaChatSessionMemory |
| parent | donnaPageContextEngine, parentSafeResponseRules, player_guardians |
| player | donnaPageContextEngine, player_priorities, player_curriculum_states |
| platform | donnaPageContextEngine, platform health metrics |

---

## File 3 — `DonnaAssistantShell.tsx` (minimal change)

Default title prop changed from hardcoded `'DONNA'` to `DONNA_PERSONALITY.name`.

```typescript
// Before
title = 'DONNA'

// After
import { DONNA_PERSONALITY } from '@/lib/donna/donnaPersonality'
title = DONNA_PERSONALITY.name
```

This makes the shell's identity string derived from the single personality source. No visual change (DONNA_PERSONALITY.name === 'DONNA').

---

## What Was NOT Changed

- Shell A (DonnaVoiceReadyShell) routing/answer logic — unchanged
- Shell B (DonnaAssistantButton) — unchanged
- Legacy context registry (`donnaPageContextRegistry.ts`) — still present, still serves Shell B
- Legacy role boundaries (`donnaRoleBoundaries.ts`) — still present, still used by Shell A/B
- Any approval gates, proposed_actions, or wrap-up logic
- No migrations

---

## Legacy Systems Still Present (Documented for Future Retirement)

| File | Status | Retirement path |
|---|---|---|
| `src/components/assistant/donnaPageContextRegistry.ts` | Legacy — serves Shell B | Sprint 943: migrate Shell B to use `donnaContextResolver` |
| `src/lib/donna/donnaPageContextEngine.ts` | Modern — serves Shell A + now the resolver | Keep — `donnaContextResolver` wraps it |
| `src/lib/donna/donnaRoleBoundaries.ts` | Legacy — director/coach only | Can be deprecated after context resolver + personality module are fully adopted |

---

## Next Sprint Recommendation — Sprint 940

Build a **DONNA Page Element Registry** — a structured list of highlightable, explainable UI elements for key pages. This allows the "What should I do next?" engine (Sprint 941) to return a specific `targetId` + `explanation` rather than generic page-level guidance.

Priority pages for Sprint 940:
- `/director/review` — pending wrap-up drafts, attendance exceptions
- `/director` — daily command center pulse tiles
- `/coach/sessions/[id]` — wrap-up CTA, run-session section

No new data-donna-focus-id attributes needed on these pages — they already exist from Sprint 868+.
