# DONNA Global Command Layer — QA Checklist

**Sprint:** Mega Sprint 1141-1155
**Date:** 2026-06-02

---

## Intent Router

| Check | Expected | Status |
|---|---|---|
| 30+ intents defined | Yes | ✅ |
| 8 categories | player_status, assessment, placement, level_readiness, coach_workflow, parent_communication, academy_health, navigation_action | ✅ |
| Pattern matching uses regex + keyword scoring | Yes | ✅ |
| Player name extraction works | "for Jamie", "about Jamie", "why is Jamie" patterns | ✅ |
| Ambiguous short questions resolved by page context | "Why?" on player profile → explain_placement | ✅ |
| Freeform fallback returns intent: 'freeform_question' | Yes | ✅ |
| Pure TypeScript — no DB | Yes | ✅ |

---

## Action Proposal Engine

| Check | Expected | Status |
|---|---|---|
| 3 risk levels: low/medium/high | Yes | ✅ |
| Low = navigate (immediate) | Yes | ✅ |
| Medium = create_draft (review queue) | Yes | ✅ |
| High = approval_required (always routes to Approvals) | Yes | ✅ |
| Max 3 actions returned per intent | Yes | ✅ |
| Player-specific hrefs resolved | `?tab=missions` → `/director/players/{id}?tab=missions` | ✅ |
| High-risk never auto-executes | Confirmed — `requiresApproval: true` | ✅ |

---

## Evidence Synthesizer

| Check | Expected | Status |
|---|---|---|
| Readiness evidence: gates + assessment + missions + coach note | Yes | ✅ |
| Placement evidence: confidence + reasons + assessment + risk notes | Yes | ✅ |
| Missing evidence explicitly surfaced | Yes — `missing[]` array | ✅ |
| Missing evidence proposes next step | Yes — `resolveAction` field | ✅ |
| Overall strength is computed | strong/moderate/weak/missing | ✅ |
| Pure TypeScript — no DB | Yes | ✅ |

---

## Global Command Action

| Check | Expected | Status |
|---|---|---|
| Auth check at entry | Yes | ✅ |
| academyId server-resolved | Yes | ✅ |
| Role resolved from academy_memberships | Yes | ✅ |
| assertNotPreviewMode() | Yes | ✅ |
| Intent classified deterministically | classifyDonnaIntent() | ✅ |
| Data fetched scoped to intent.requiredData | Yes | ✅ |
| Player data fetched only when playerId present | Yes | ✅ |
| All DB fallbacks via try/catch (pending migrations) | Yes | ✅ |
| answer generated deterministically | Yes — no LLM in V1 | ✅ |
| Evidence assembled per intent | Yes | ✅ |
| Actions proposed per intent | Yes | ✅ |
| High-risk audit log written | Yes | ✅ |
| Command logged to donna_events (best-effort) | Yes — try/catch | ✅ |

---

## DonnaCommandBar UI

| Check | Expected | Status |
|---|---|---|
| Input field with placeholder | Yes | ✅ |
| Enter key submits | Yes | ✅ |
| Loading state during pending | Loader2 spinner | ✅ |
| Answer displayed below input | Yes | ✅ |
| Evidence toggle (show/hide) | Yes — collapsible | ✅ |
| Action buttons with risk styling | low/medium/high colors | ✅ |
| Follow-up question chips | Yes | ✅ |
| High-risk approval note | AlertTriangle + text | ✅ |
| Error state | Yes | ✅ |

---

## Role Safety

| Check | Expected |
|---|---|
| Parent receives parentSummary only | generateDonnaPlayerSummary('parent', ...) enforced |
| Player receives studentFriendlySummary only | generateDonnaPlayerSummary('player', ...) enforced |
| Coach answer uses coachFocusAreas, not director detail | 'coach' role path in generateDonnaPlayerSummary |
| High-risk actions always require approval | requiresApproval: true + audit log |
| No raw parent/player notes in director answer | Evidence from blueprint/assessment/gates only |

---

## TypeScript

```
npx tsc --noEmit → clean
```
