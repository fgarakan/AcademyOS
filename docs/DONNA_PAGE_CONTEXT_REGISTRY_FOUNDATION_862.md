# Sprint 862 — DONNA Page Context Registry Foundation V1

**Date:** 2026-05-27
**Sprint:** 862
**Type:** Implementation — TypeScript types + route matching + capability maps (no DB fetch functions)
**Migration:** None
**TypeScript:** Clean (`npx tsc --noEmit` — exit 0, no errors)
**Status:** ✅ IMPLEMENTED
**Part of:** Mega Sprint 858–920 — DONNA 10/10 Conversational Intelligence + Memory Maturity Block V1

---

## Scope

Implements the foundation layer from the Sprint 861 Page Context Registry Design:

1. **6 new `DonnaContextType` values** — type union extended in `donnaContextTypes.ts`
2. **`DonnaContextRequest.params` extended** — `sessionId` and `templateId` added
3. **`deriveContextRequest` signature updated** — optional `role` param for coach-route dispatch
4. **4 new UUID routing rules** — session detail + template detail (director); session + wrap-up (coach)
5. **Coach route block** — P20–P23, gated by `role === 'coach'`
6. **`DonnaAssistantButton`** — passes `role` into `deriveContextRequest`
7. **6 new capability map entries** in `donnaPageContextEngine.ts`
8. **Lookup function updated** — parameterized route handlers for 5 new patterns

**Not implemented in this sprint (by design):**
- `fetchSessionDetailContext` — Sprint 863
- `fetchCoachSessionContext`, `fetchCoachHomeContext`, `fetchCoachPlayersContext` — Sprint 865
- `fetchCoachWrapUpContext` — Sprint 866
- `fetchClassTemplateDetailContext` — Sprint 867
- DB queries — zero added
- Focus target DOM attributes — Sprint 868

---

## Runtime Behavior (post-862, pre-863)

New context types that lack a fetch function fall through to the `default:` case in
`fetchDonnaContext` (line 58 of `donnaContextActions.ts`) → `fetchAcademyOverview`.

| New contextType | Pre-fetch runtime behavior | Fetch sprint |
|---|---|---|
| `session_detail` | falls to `fetchAcademyOverview` (still better than before — routing is now correct) | 863 |
| `class_template_detail` | falls to `fetchAcademyOverview` | 867 |
| `coach_session_context` | falls to `fetchAcademyOverview` (same as pre-862) | 865 |
| `coach_wrap_up_context` | falls to `fetchAcademyOverview` (same as pre-862) | 866 |
| `coach_home_context` | falls to `fetchAcademyOverview` (same as pre-862) | 865 |
| `coach_players_context` | falls to `fetchAcademyOverview` (same as pre-862) | 865 |

**Impact:** No regression. Pre-862, all these routes already returned `fetchAcademyOverview` (fallback).
The routing infrastructure is now correct; only the fetch implementation is pending.

---

## Files Modified

### `src/components/assistant/donnaContextTypes.ts`

#### Change 1 — `DonnaContextType` union extended (6 new values)

```typescript
// ── Sprint 862 — Page Context Registry Foundation ──────────────────────────
| 'session_detail'           // /director/sessions/<uuid>         — fetch: Sprint 863
| 'class_template_detail'    // /director/class-templates/<uuid>  — fetch: Sprint 867
| 'coach_session_context'    // /coach/sessions/<id>              — fetch: Sprint 865
| 'coach_wrap_up_context'    // /coach/sessions/<id>/wrap-up      — fetch: Sprint 866
| 'coach_home_context'       // /coach                            — fetch: Sprint 865
| 'coach_players_context'    // /coach/players                    — fetch: Sprint 865
```

#### Change 2 — `DonnaContextRequest.params` extended

```typescript
export interface DonnaContextRequest {
  contextType: DonnaContextType
  params?: {
    playerId?: string
    coachId?: string
    sessionId?: string   // Sprint 862 — session detail + coach session routes
    templateId?: string  // Sprint 862 — template detail route
  }
}
```

**TypeScript impact:** `{ playerId?; coachId?; sessionId?; templateId? }` is structurally
assignable to the existing `fetchDonnaContext` params `{ playerId?; coachId? }` — no
excess property check applies to non-literal values. `donnaContextActions.ts` NOT modified.

#### Change 3 — `deriveContextRequest` signature and routing

```typescript
export function deriveContextRequest(
  pathname: string,
  role?: 'director' | 'coach',
): DonnaContextRequest
```

**New priority 3 — Session detail:**
```typescript
if (/^\/director\/sessions\/[^/]+$/.test(pathname)) {
  const lastSegment = pathname.split('/').pop() ?? ''
  if (UUID_RE.test(lastSegment)) {
    return { contextType: 'session_detail', params: { sessionId: lastSegment } }
  }
}
```
Falls through to `session_context` when last segment is not a UUID (e.g. `/new`).

**New priority 4 — Template detail:**
```typescript
if (/^\/director\/class-templates\/[^/]+$/.test(pathname)) {
  const lastSegment = pathname.split('/').pop() ?? ''
  if (UUID_RE.test(lastSegment)) {
    return { contextType: 'class_template_detail', params: { templateId: lastSegment } }
  }
}
```
Falls through to `class_template_collection` when last segment is not a UUID (e.g. `/new`).

**New priority 20–23 — Coach routes (role-gated):**
```typescript
if (role === 'coach') {
  // P20 — wrap-up (before session match)
  const coachWrapUp = pathname.match(/^\/coach\/sessions\/([^/]+)\/wrap-up$/)
  if (coachWrapUp?.[1]) return { contextType: 'coach_wrap_up_context', params: { sessionId: coachWrapUp[1] } }
  // P21 — session
  const coachSession = pathname.match(/^\/coach\/sessions\/([^/]+)$/)
  if (coachSession?.[1]) return { contextType: 'coach_session_context', params: { sessionId: coachSession[1] } }
  // P22 — players
  if (pathname.startsWith('/coach/players')) return { contextType: 'coach_players_context' }
  // P23 — hub + other coach routes
  if (pathname.startsWith('/coach')) return { contextType: 'coach_home_context' }
}
```

**All existing director routes preserved exactly.** P99 `academy_overview` fallback preserved.

---

### `src/components/assistant/DonnaAssistantButton.tsx`

One-line change in `handleContextSummary()`:

```typescript
// Before (Sprint 856–861):
const req = deriveContextRequest(pathname)

// After (Sprint 862):
const req = deriveContextRequest(pathname, role)
```

`role` is already in scope from the component's destructured props (`role = 'director'`).
No new imports. No new state. No behavior change for existing director routes.

---

### `src/lib/donna/donnaPageContextEngine.ts`

#### Change 1 — 6 new capability map entries added to `PAGE_CAPABILITY_MAP`

| Entry | Route | pageLabel |
|---|---|---|
| Session Detail | `/director/sessions/[sessionId]` | Session Detail |
| Template Detail | `/director/class-templates/[templateId]` | Template Detail |
| Coach Hub | `/coach` | Coach Hub |
| Coach Players | `/coach/players` | Coach Players |
| Coach Session | `/coach/sessions/[sessionId]` | Coach Session |
| Coach Wrap-Up | `/coach/sessions/[sessionId]/wrap-up` | Coach Wrap-Up |

Each entry includes: `pageLabel`, `directorIntent`, `safeContext`, `suggestedPrompts` (4–5),
`allowedAnswerTypes`, `reviewRequiredActions`, `blocked`, `dataFallback`.

All coach entries block cross-coach data access. All director-facing entries block auto-approval.

#### Change 2 — `getPageCapabilityMap` lookup updated

Added parameterized route handlers before the prefix match (longest-first):

```typescript
// Session detail — /director/sessions/<id>
if (pathname.startsWith('/director/sessions/') && pathname.split('/').length >= 4) {
  return PAGE_CAPABILITY_MAP.find(m => m.route === '/director/sessions/[sessionId]') ?? FALLBACK_MAP
}
// Template detail — /director/class-templates/<id>
if (pathname.startsWith('/director/class-templates/') && pathname.split('/').length >= 4) {
  return PAGE_CAPABILITY_MAP.find(m => m.route === '/director/class-templates/[templateId]') ?? FALLBACK_MAP
}
// Coach wrap-up — matched before coach session
if (pathname.startsWith('/coach/sessions/') && pathname.endsWith('/wrap-up')) {
  return PAGE_CAPABILITY_MAP.find(m => m.route === '/coach/sessions/[sessionId]/wrap-up') ?? FALLBACK_MAP
}
// Coach session
if (pathname.startsWith('/coach/sessions/') && pathname.split('/').length >= 4) {
  return PAGE_CAPABILITY_MAP.find(m => m.route === '/coach/sessions/[sessionId]') ?? FALLBACK_MAP
}
```

---

## Route Matching Verification

| Pathname | role | Expected type | Result |
|---|---|---|---|
| `/director/players/uuid-abc` | director | `player_profile` | ✅ P1 |
| `/director/coaches/uuid-abc` | director | `coach_profile` | ✅ P2 |
| `/director/sessions/uuid-abc` | director | `session_detail` + sessionId | ✅ P3 (new) |
| `/director/sessions/new` | director | `session_context` (falls to P11) | ✅ P3 UUID check fails → P11 |
| `/director/class-templates/uuid-abc` | director | `class_template_detail` + templateId | ✅ P4 (new) |
| `/director/class-templates/new` | director | `class_template_collection` (falls to P12) | ✅ P4 UUID check fails → P12 |
| `/director/sessions` | director | `session_context` | ✅ P11 preserved |
| `/director/class-templates` | director | `class_template_collection` | ✅ P12 preserved |
| `/director/players` | director | `player_collection` | ✅ P10 preserved |
| `/director` | director | `academy_overview` | ✅ P99 preserved |
| `/coach/sessions/123/wrap-up` | coach | `coach_wrap_up_context` + sessionId | ✅ P20 (new) |
| `/coach/sessions/123` | coach | `coach_session_context` + sessionId | ✅ P21 (new) |
| `/coach/players` | coach | `coach_players_context` | ✅ P22 (new) |
| `/coach` | coach | `coach_home_context` | ✅ P23 (new) |
| `/coach/donna` | coach | `coach_home_context` | ✅ P23 catch-all |
| `/coach/sessions/123` | director | `academy_overview` | ✅ role gate blocks → P99 |
| `/coach/sessions/123/wrap-up` | director | `academy_overview` | ✅ role gate blocks → P99 |

---

## `donnaContextActions.ts` — Why No Change Required

The switch statement in `fetchDonnaContext` has a `default:` case:
```typescript
switch (contextType) {
  case 'academy_overview':           return fetchAcademyOverview(...)
  // ... 10 existing cases ...
  default:                           return fetchAcademyOverview(...)
}
```

New types not yet in the switch fall to `default` → `fetchAcademyOverview`. TypeScript does
not require exhaustive handling when a `default:` case is present. No TypeScript error.
No regression. `donnaContextActions.ts` will be updated in Sprints 863–867 as fetch
functions are implemented.

---

## Files Created

### `docs/DONNA_PAGE_CONTEXT_REGISTRY_FOUNDATION_862.md`
This file.

---

## Files Modified

### `src/components/assistant/donnaContextTypes.ts`
- `DonnaContextType` union: 11 values → 17 values (+6)
- `DonnaContextRequest.params`: added `sessionId`, `templateId`
- `deriveContextRequest`: added `role` param; P3 + P4 UUID routing; P20–P23 coach routing

### `src/components/assistant/DonnaAssistantButton.tsx`
- `handleContextSummary`: `deriveContextRequest(pathname)` → `deriveContextRequest(pathname, role)`

### `src/lib/donna/donnaPageContextEngine.ts`
- `PAGE_CAPABILITY_MAP`: 15 entries → 21 entries (+6)
- `getPageCapabilityMap`: added 4 parameterized route handlers

---

## What Was NOT Changed

| Item | Reason |
|---|---|
| `donnaContextActions.ts` | Default case handles new types; fetch fns added Sprint 863–867 |
| All director route behavior | P1–P17 and P99 preserved exactly |
| `DonnaContextSummary` interface | Unchanged — same return type for all context types |
| `makeFallbackSummary` | Unchanged |
| Player profile route | P1 unchanged — playerId extraction identical |
| Coach profile route | P2 unchanged — coachId extraction identical |
| SQL / RLS / migrations / seed / env | Unchanged |
| `DonnaSessionContext` | Unchanged |
| Focus targets | Sprint 868 |

---

## Safety Guarantees

| Guarantee | Status |
|---|---|
| No DB writes | ✅ — pure TypeScript; no DB calls added |
| No DB reads | ✅ — no new queries |
| No role boundary weakening | ✅ — coach routes gated by `role === 'coach'` |
| No cross-coach data access | ✅ — capability map entries explicitly block it |
| No parent/player data exposure | ✅ — no new data surfaces |
| No auto-approval | ✅ — all coach entries include review guardrails |
| Director routes backward compatible | ✅ — P1–P17 + P99 identical to pre-862 |
| TypeScript clean | ✅ — `npx tsc --noEmit` exit 0 |

---

## Known Limitations (post-862)

| Limitation | Impact | Resolution |
|---|---|---|
| New types fall to `fetchAcademyOverview` until fetch fns implemented | Director on `/director/sessions/uuid` still gets academy overview context | Sprint 863 (session detail) |
| Coach routes return academy overview until Sprint 865 | No improvement yet for coach UX | Sprint 865 |
| No focus targets added | DONNA navigate actions for new routes not available | Sprint 868 |
| Coach session ID format not confirmed | UUID_RE not applied for coach routes — non-empty string check used | Confirmed in Sprint 863 |
