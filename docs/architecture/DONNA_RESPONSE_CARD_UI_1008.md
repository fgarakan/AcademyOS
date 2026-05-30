# Architecture — DONNA Response Card UI V1 — Sprint 1008

**Date:** 2026-05-30
**Sprint:** 1008
**Depends on:** Sprint 978 (OrchestratorOutput type), Sprint 1000–1006 (orchestration stack)

---

## Purpose

Sprint 1008 creates `DonnaResponseCard` — the standard visual container for rendering a single `OrchestratorOutput` from the LLM orchestrator.

This card is the display layer for the God Mode DONNA experience. It will be used in Sprint 1011 (DONNA Panel God Mode Integration) when the DONNA assistant panel renders live orchestrator responses.

---

## Responsibility split

| Layer | Responsibility |
|---|---|
| `DonnaResponseCard` (Sprint 1008) | Visual rendering only. Calls `onNavigate` and `onHighlight` callbacks. No navigation, no sessionStorage, no mutations. |
| Parent panel (Sprint 1011) | Wires `router.push` to `onNavigate`. Wires `setDonnaFocusTarget` + `donna:highlight` dispatch to `onHighlight`. |
| Orchestrator (Sprint 978–1007) | Produces `OrchestratorOutput`. Validates safety. Text is pre-screened against safety contract. |

---

## Component: DonnaResponseCard

**File:** `src/components/donna/DonnaResponseCard.tsx`

**Props:**
```typescript
{
  output: OrchestratorOutput
  onNavigate?: (route: string) => void   // called when director taps a route suggestion
  onHighlight?: (targetId: string, route: string, label: string) => void
  children?: React.ReactNode             // follow-up chips, etc.
}
```

**Layout:**
1. Header: DONNA avatar (D circle) + output type badge + AI label (if llm_inferred)
2. Body: `output.text` rendered as-is (pre-validated by safety contract)
3. Approval gate warning: shown only when `safetyLevel === 'approval_gated'`
4. Meta row: confidence badge + safety badge
5. Action row: highlight button + navigate button (only when handlers provided + targets exist)
6. Optional children slot

---

## Output type visual map

| Type | Badge | Accent |
|---|---|---|
| `answer` | Answer | Gray/muted |
| `recommend_next_action` | Recommended action | Lime |
| `highlight_target` | Pointing here | Teal (#11d9df) |
| `explain_action` | Explanation | Blue |
| `draft_proposed_action` | Draft action | Orange |
| `route_to_review` | Review queue | Orange |
| `ask_clarifying_question` | Clarifying question | Gray |

---

## Safety behavior

- `approval_gated` → orange warning block: "Requires your approval before anything changes. Nothing is applied until you confirm in the Review Queue."
- `review_only` → gray "Draft only" badge
- `safe` → no safety badge (expected, normal state)
- Navigate CTA only appears when `suggestedRoute` is set AND `onNavigate` prop provided
- Highlight CTA only appears when `highlightTarget` is set AND `onHighlight` prop provided

---

## Privacy invariants

- `output.text` is the only content rendered — pre-validated by the orchestrator's safety contract
- No raw prompts, raw notes, player names, or full UUIDs are rendered
- Route labels are resolved from a static map — no DB content in the card
- `onNavigate` only receives internal routes validated by orchestrator (only `/director/...`, `/coach/...` etc.)

---

## What this is NOT

- Not a conversation thread — Sprint 1011 will stack cards into a thread
- Not wired to the DONNA panel yet — Sprint 1011 handles panel integration
- Not connected to the live orchestrator — Sprint 1010 creates the server action
- Not the existing `DONNAAnswerCard` — that renders `DONNAAnswer` from the legacy deterministic COO engine; this renders `OrchestratorOutput` from the Sprint 978+ LLM stack

---

## Files created

| File | Change |
|---|---|
| `src/components/donna/DonnaResponseCard.tsx` | New — response card component |
| `docs/architecture/DONNA_RESPONSE_CARD_UI_1008.md` | New — this doc |
| `docs/QA_DONNA_RESPONSE_CARD_UI_1008.md` | New — QA checklist |
| `docs/CHANGELOG.md` | Updated |
