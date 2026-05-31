# Sprint 1076 — DONNA Action Registry Expansion V1

**Date:** 2026-05-31
**Sprint:** 1076

---

## Problem

DONNA's command understanding was scattered across five parallel layers with no unified intent-level vocabulary. "Open approvals" was wired in Sprint 1071 as a NAV_PATTERN. "Explain academy health" was wired in Sprint 1073 as a context-pack answer. "Draft parent update" was a dispatcher pattern. There was no single place to ask "what does DONNA know about the draft_parent_update action and what are its safety rules?"

---

## Existing Command/Action Architecture (pre-1076)

| Layer | File | Entries | Focus |
|---|---|---|---|
| UI Action Registry (Sprint 753) | `donnaUIActionRegistry.ts` | 91 `UIAction` entries | Fine-grained UI surface operations (mechanism-level) |
| Dispatcher (Sprint 755) | `donnaUIActionDispatcher.ts` | 23 nav + 6 blocked + 6 operators + 70+ section nav | Runtime pattern → `DispatchResult` |
| Chip Registry (Sprint 964) | `donnaPageChipRegistry.ts` | 58 chips across 16 routes | Per-route highlight/prompt chips |
| God Mode Wiring (Sprint 914) | `donnaActionRegistryWiring.ts` | Risk-domain blocking | High-risk domain list for orchestrator |
| Context Packs (Sprint 1072) | `donnaContextPackRegistry.ts` | `commonCommands` in 8 packs | Narrative phrases, not dispatched |

**The gap:** All five layers classify actions at the mechanism level or the narrative level — none classifies at the *intent level* ("what did the director ask for?").

---

## New: DonnaAction Registry

### File

`src/lib/donna/donnaActionRegistry.ts`

Pure TypeScript — no DB, no API. Safe to import from any context.

### Interfaces

```typescript
export type DonnaActionRole = 'academy_director' | 'head_coach' | 'coach' | 'player' | 'parent'

export type DonnaActionCategory =
  | 'navigation'       // routes director to a page, no state change
  | 'explanation'      // reads context and answers, no navigation or mutation
  | 'draft'            // creates a proposed_action or draft for director review
  | 'review'           // opens review queue or summarizes pending items
  | 'mutation_request' // director asked for something that changes records — must only draft

export type DonnaActionRiskLevel = 'low' | 'medium' | 'high'

export interface DonnaAction {
  actionId: string
  label: string
  category: DonnaActionCategory
  intentPhrases: string[]          // trigger phrases for matchDonnaActionIntent
  route?: string                    // navigation target (optional)
  allowedRoles: DonnaActionRole[]
  riskLevel: DonnaActionRiskLevel
  requiresApproval: boolean
  confirmationMessage: string | null
  blockedMessage: string | null
  safetyMessage: string
  relatedContextPackRoutes: string[]
}
```

### How DonnaAction differs from UIAction

| Dimension | UIAction (Sprint 753) | DonnaAction (Sprint 1076) |
|---|---|---|
| Level | Mechanism (route_push, draft_submit) | Intent (what director asked for) |
| Count | 91 | 18 initial |
| Focus | UI surface ops | Director-facing commands |
| Wiring | `dispatchUIIntent()` runtime | Future: pre-classifier in `handleDonnaCooPrompt` |

---

## Initial Actions (18)

### Navigation (10) — all low risk

| actionId | Route | Roles |
|---|---|---|
| `open_today` | `/director` | director, head_coach |
| `open_approvals` | `/director/review` | director |
| `open_players` | `/director/players` | director, head_coach |
| `open_sessions` | `/director/sessions` | director, head_coach |
| `open_curriculum` | `/director/curriculum` | director |
| `open_parent_updates` | `/director/parents` | director |
| `open_academy_health` | `/director/kpi` | director |
| `open_templates` | `/director/class-templates` | director, head_coach |
| `open_coaches` | `/director/coaches` | director |
| `open_settings` | `/director/settings` | director |

### Explanation (2) — low risk

| actionId | Notes |
|---|---|
| `explain_academy_health` | Answers from Academy Health context pack (Sprint 1072/1073) |
| `make_fitness_template_game_based` | Guidance only — director uses builder on-screen |

### Draft (4) — medium risk, requiresApproval: true

| actionId | Route | Safety note |
|---|---|---|
| `create_class_template` | `/director/class-templates/new` | Routes to builder — director publishes |
| `create_fitness_template` | `/director/fitness/templates` | Routes to section — director creates |
| `draft_parent_update` | `/director/review` | Never auto-sends; review queue only |
| `create_session_adjustment_draft` | `/director/review` | Draft only; no session records change until approved |

### Review (1) — low risk

| actionId | Notes |
|---|---|
| `review_approvals` | Explains pending queue; no items approved/rejected |

### Mutation Request (1) — high risk, requiresApproval: true

| actionId | Route | Safety note |
|---|---|---|
| `suggest_level_movement` | `/director/level-up` | Only produces a proposed_action draft — finalize_player_placement() is the only valid activation path |

---

## Safety / Risk Model

```
low    — navigation + explanation — no state change possible
medium — draft — creates a draft in proposed_actions or review queue — director must approve
high   — mutation_request — DONNA only produces a proposal — never executes directly
```

**Critical invariants:**
1. `draft_parent_update` — `requiresApproval: true`, `blockedMessage` explains coach limitations, never sends automatically
2. `suggest_level_movement` — `riskLevel: 'high'`, `safetyMessage` references `finalize_player_placement()` and the Level Up review queue as the only valid paths
3. All `mutation_request` actions have explicit `confirmationMessage` that tells the director the action only produces a draft

---

## Helpers

### `getDonnaActionById(actionId)`
Returns `DonnaAction | null`. Direct lookup by ID.

### `matchDonnaActionIntent(prompt, role?)`
Case-insensitive substring match against `intentPhrases`. Optional role filter. Returns first match or null.
**Not wired in Sprint 1076 — future pre-classifier for `handleDonnaCooPrompt`.**

### `getDonnaActionsForRoute(route)`
Returns all actions whose `route` or `relatedContextPackRoutes` match. Handles dynamic routes (e.g. `/director/fitness/templates/<id>`).

---

## What Is NOT Wired in This Sprint

- `matchDonnaActionIntent` not called from `handleDonnaCooPrompt` or `handleUIDispatch`
- `donnaUIActionDispatcher.ts` unchanged
- `donnaUIActionRegistry.ts` unchanged
- `donnaPageChipRegistry.ts` unchanged
- Context-pack `commonCommands` unchanged
- No new mutations
- No schema changes

---

## Future Wiring (Sprint 1077+)

```typescript
// In handleDonnaCooPrompt, before routeDonnaPrompt:
const action = matchDonnaActionIntent(text, role === 'director' ? 'academy_director' : role)
if (action) {
  if (action.riskLevel === 'low' && action.category === 'navigation' && action.route) {
    router.push(action.route)
    return true
  }
  if (action.confirmationMessage) {
    setCommandResponse({ message: action.confirmationMessage, type: 'info', label: action.label })
    return true
  }
  if (action.blockedMessage) {
    setCommandResponse({ message: action.blockedMessage, type: 'honest', label: 'Not allowed' })
    return true
  }
}
```
