# QA — DONNA Response Card UI V1 — Sprint 1008

**Date:** 2026-05-30
**Sprint:** 1008

---

## TypeScript Checklist

- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `DonnaResponseCard` component compiles cleanly
- [ ] `DonnaResponseCardProps` interface compiles cleanly
- [ ] `OrchestratorOutput` import from `@/lib/donna/llmOrchestration/types` resolves
- [ ] `OUTPUT_TYPE_CONFIG` covers all 7 `OrchestratorOutputType` values

---

## Rendering Checklist — Output Types

- [ ] `type: 'answer'` renders gray "Answer" badge
- [ ] `type: 'recommend_next_action'` renders lime "Recommended action" badge
- [ ] `type: 'highlight_target'` renders teal "Pointing here" badge
- [ ] `type: 'explain_action'` renders blue "Explanation" badge
- [ ] `type: 'draft_proposed_action'` renders orange "Draft action" badge
- [ ] `type: 'route_to_review'` renders orange "Review queue" badge
- [ ] `type: 'ask_clarifying_question'` renders gray "Clarifying question" badge

---

## Rendering Checklist — Confidence

- [ ] `confidence: 'high'` renders green "Confident" badge
- [ ] `confidence: 'medium'` renders orange "Estimated" badge
- [ ] `confidence: 'low'` renders gray "Uncertain" badge

---

## Rendering Checklist — Safety

- [ ] `safetyLevel: 'safe'` renders no safety badge
- [ ] `safetyLevel: 'review_only'` renders gray "Draft only" badge
- [ ] `safetyLevel: 'approval_gated'` renders orange "Requires approval" badge + warning block
- [ ] Approval warning text: "This action requires your approval before anything changes."
- [ ] Approval warning text: "Nothing is applied until you confirm in the Review Queue."

---

## Rendering Checklist — Source

- [ ] `source: 'llm_inferred'` renders small "AI" label in header
- [ ] `source: 'deterministic'` shows no source label (expected behavior)
- [ ] `source: 'fallback'` shows no source label (expected behavior)

---

## Action CTA Checklist

- [ ] No navigate button when `onNavigate` prop is not provided
- [ ] No navigate button when neither `suggestedRoute` nor `type === 'route_to_review'` present
- [ ] Navigate button appears when `suggestedRoute` is set AND `onNavigate` provided
- [ ] Navigate button label uses `routeToLabel()` mapping (e.g. '/director/review' → 'Review Queue')
- [ ] Navigate button calls `onNavigate(route)` — does NOT call router.push itself
- [ ] No highlight button when `onHighlight` prop is not provided
- [ ] No highlight button when `highlightTarget` is not in output
- [ ] Highlight button appears when `output.highlightTarget` set AND `onHighlight` provided
- [ ] Highlight button calls `onHighlight(targetId, route, label)` — does NOT write sessionStorage itself

---

## Privacy Checklist

- [ ] Component does NOT render raw prompts
- [ ] Component does NOT render raw LLM response beyond `output.text`
- [ ] Component does NOT render player names
- [ ] Component does NOT render coach notes
- [ ] Component does NOT render session notes
- [ ] Component does NOT render full UUIDs
- [ ] `output.text` is the only user-visible content (pre-validated by safety contract)
- [ ] Route labels come from static map, not DB

---

## No-Mutation Checklist

- [ ] Component makes no database calls
- [ ] Component makes no API calls
- [ ] Component writes nothing to sessionStorage
- [ ] Component performs no navigation side effects
- [ ] Navigate action: calls `onNavigate` callback only
- [ ] Highlight action: calls `onHighlight` callback only
- [ ] Parent is responsible for all side effects

---

## Not-Wired-Yet Checklist (expected)

- [ ] `DonnaResponseCard` is not yet imported by `DonnaAssistantButton` — Sprint 1011 will wire it
- [ ] `DonnaResponseCard` is not connected to a live server action — Sprint 1010 creates that
- [ ] `onNavigate` and `onHighlight` are optional — card renders safely without them

---

## Sprint Regression Checklist

- [ ] Existing `DONNAAnswerCard` is unchanged — different type, different engine
- [ ] `DonnaHighlightBanner` unchanged
- [ ] `DonnaConversationalPanel` unchanged
- [ ] Sprint 1007 usageTracker unchanged
- [ ] Sprint 1005 donnaUsageTracking unchanged
- [ ] Sprint 978 types unchanged
- [ ] No new DONNA surface added (card is a component, not a panel/button)
- [ ] One DONNA button still in place
