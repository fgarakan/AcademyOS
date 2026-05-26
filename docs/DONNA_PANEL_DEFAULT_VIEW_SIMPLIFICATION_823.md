# Sprint 823 — DONNA Panel Default View Simplification V1

**Date:** 2026-05-26
**Sprint:** 823
**Type:** UI simplification — panel default view
**Files changed:** 1 source file + 2 docs
**TypeScript:** Clean (`npx tsc --noEmit` — no errors)

---

## Why this sprint

Sprint 815 audit finding:

> **Part 2C — Target side panel default view**
> The panel currently renders 7+ information sections simultaneously (greeting, conversation thread, command response, context summary, predictive recommendations, daily brief, attention report, mode buttons). The director sees everything at once with no visual hierarchy.

Before Sprint 823, opening the DONNA panel showed:
- Greeting / onboarding flow
- Conversation thread
- Command response card
- Daily brief card (if populated)
- Attention report card (if populated)
- Recommendations (from `DonnaWorkflowCards`)
- Predictive suggestions (from local state)
- "Ask about this page" chip
- "More options" toggle → mode list
- Quick actions for this page

Sprint 823 collapses background information (context, suggestions, actions) behind 3 compact disclosure pills. The default panel now shows: greeting → conversation thread → input. Background surfaces appear on demand.

---

## What changed

### `src/components/assistant/DonnaAssistantButton.tsx`

**1. Three new disclosure state variables (added after `showMoreOptions` was removed):**

```tsx
// Sprint 823 — Panel disclosure section visibility (context / suggestions / actions)
const [showContextSection, setShowContextSection] = useState(false)
const [showSuggestionsSection, setShowSuggestionsSection] = useState(false)
const [showActionsSection, setShowActionsSection] = useState(false)
```

**2. Two auto-expand useEffect hooks (added after Sprint 748 scroll effect):**

```tsx
// Sprint 823 — auto-expand Context when DONNA loads a context summary
useEffect(() => {
  if (contextSummary) setShowContextSection(true)
}, [contextSummary])

// Sprint 823 — auto-expand Suggestions when DONNA populates recommendations
useEffect(() => {
  if (suggestions.length > 0 || (recommendationSet && recommendationSet.recommendations.length > 0)) {
    setShowSuggestionsSection(true)
  }
}, [suggestions, recommendationSet])
```

**3. `recommendationSet` and `contextSummary` gated by disclosure state (props to `DonnaWorkflowCards`):**

```tsx
recommendationSet={showSuggestionsSection ? recommendationSet : null}
contextSummary={showContextSection ? contextSummary : null}
```

**4. Old always-visible blocks replaced with compact disclosure bar + 3 collapsible sections:**

Before: Predictive suggestions block, "Ask about this page" chip, Mode buttons div with "More options" toggle, Quick actions — all always visible.

After: Compact teal pill bar (Context · Suggestions · Actions) + sections that expand/collapse:

| Section | Contents |
|---|---|
| **Context** | "Ask about this page" chip → triggers `handleContextSummary()` |
| **Suggestions** | `DonnaSuggestionCard` map from local `suggestions` state |
| **Actions** | Review Queue button + mode list + Quick actions for this page |

**5. Dot badge indicators on pills:**
- Context pill: teal dot when `contextSummary` is loaded but section is collapsed
- Suggestions pill: teal dot when `suggestions.length > 0` or `recommendationSet` populated but section is collapsed
- Actions pill: red dot when `reviewQueueData.totalCount > 0` but section is collapsed

**6. Removed unused imports/state:**
- `ChevronDown` import removed (was used only by the old "More options" toggle)
- `showMoreOptions` / `setShowMoreOptions` state removed (superseded by `showActionsSection`)

---

## What was preserved

- Active workflow drafts (communication draft, attendance exception draft, template draft) — always visible via `DonnaWorkflowCards`, not gated
- Daily brief and attention report cards — user-triggered, always visible when populated
- Conversation thread — always visible
- Safety footer — unchanged
- Voice behavior, routing, persistence, backend — untouched
- `DonnaWorkflowCards` component — not modified (gating is at prop level only)

---

## Default panel view (post-823)

```
┌─────────────────────────────────┐
│  DONNA greeting / thread        │
│  ─────────────────────────────  │
│  [Active draft if present]      │
│  [Daily brief if populated]     │
│  [Attention report if loaded]   │
│  ─────────────────────────────  │
│  [Context] [Suggestions] [Actions] ← teal pills, collapsed by default
│  ─────────────────────────────  │
│  Voice / text input             │
└─────────────────────────────────┘
```

---

## Auto-expand behaviour

| Trigger | What expands |
|---|---|
| DONNA returns a context summary | Context section auto-expands |
| DONNA populates `suggestions` state | Suggestions section auto-expands |
| `recommendationSet` populated with ≥1 recommendation | Suggestions section auto-expands |

Directors can always collapse a section by clicking its pill again.

---

## What was NOT changed

- `useDonnaRealtimeVoice.ts` — untouched
- `DonnaWorkflowCards.tsx` — untouched (gating via props only)
- `DonnaVoiceLayer.tsx` — untouched
- `DonnaDeveloperTools.tsx` — untouched
- `DonnaVoiceDiagnostics.tsx` — untouched
- All DONNA routing, voice paths, persistence, and backend — untouched
- No SQL, migrations, RLS, seed files, or env files touched

---

## TypeScript result

```
npx tsc --noEmit
# exit 0 — no errors
```

---

## Recommended Sprint 824

**Sprint 824 — DONNA Panel Scroll Stability V1**

Target: The panel scroll container can jump when new content appears (recommendations auto-expand, daily brief loads). The conversation thread should anchor to the bottom and new disclosure content should appear below without disrupting the user's scroll position.

Sprint 815 audit section: Part 2D — Scroll and layout stability.
Risk: Low — scroll and layout only, no state or voice changes.
Scope: `DonnaAssistantButton.tsx` scroll container and `useEffect` hooks only.
