# Sprint 816 — DONNA Guided Navigation + Highlight Architecture V1

**Date:** 2026-05-25
**Sprint:** 816
**Type:** Architecture audit — no source code changes
**Files changed:** 2 docs (this document + changelog)
**TypeScript:** Clean (architecture sprint)

---

## Why this sprint

Mega Sprint 816–825: Transform DONNA from a cluttered sidebar with fragmented entry points into one unified, page-aware, guided operating assistant.

Strategic product decision: DONNA is not just a sidebar — DONNA is the guided operating layer of AcademyOS.

Sprint 816 designs the navigation + highlight layer before any code is written. Subsequent sprints implement it incrementally.

---

## Audit: 12 Questions Answered

### Q1. Which DONNA commands should navigate instead of answering only in the sidebar?

Commands that can be fully answered in the sidebar (Answer Mode):
- "What's my review queue count?"
- "How many players need attention?"
- "What does orange level mean?"
- "What are the 3 players needing attention?"
- "Why does this matter?"
- "Explain this screen."
- "What can you do on this page?"

Commands that should navigate + highlight (Navigate + Highlight Mode):
- "Show me the review queue" → `/director/review`
- "What do I need to do today?" → `/director` + highlight `today-command-center`
- "Help me assign levels" → `/director/players` + highlight `players-missing-level`
- "Show sessions" → `/director/sessions` + highlight `sessions-list`
- "Where do I go to do that?" → use last recommendation route
- "Show me what needs attention" → `/director` + highlight `review-queue-card`
- "Create a class template" → `/director/class-templates/new` + highlight `create-template-form`
- "Create a template" → `/director/class-templates` + highlight `create-template-button`
- "Build a class plan" → `/director/class-templates/new` + highlight `create-template-form`
- "Open curriculum builder" → `/director/curriculum/builder` + highlight `curriculum-builder-hero`
- "Show me placement" → `/director/placement` + highlight `placement-section`
- "Help me level up players" → `/director/level-up` + highlight `level-up-candidates`
- "Open template builder" → `/director/class-templates/new`

Commands that should open a workspace and guide step by step (Guided Builder Mode):
- "Create a class template" (if director is already on the template page) → stay, guide in sidebar
- "Help me set up the academy" → `/director/onboarding/interview`
- "Walk me through curriculum" → `/director/curriculum/builder` + guided operator

### Q2. Which commands should open Class Template Builder?

Route: `/director/class-templates/new`

Trigger phrases:
- "Create a class template"
- "Create a template"
- "Build a class plan"
- "Make a template for [level]"
- "New class template"
- "Help me build a session plan"
- "I want to create a template"
- "Build a session template"

Focus target: `create-template-form` (the NewClassTemplateForm root element)

DONNA says after navigation:
> "I brought you to the Class Template Builder. You'll fill in the template name, session blocks, and duration here. I can help you choose the right structure — just tell me the level and session length."

### Q3. Which commands should open Curriculum Builder?

Route: `/director/curriculum/builder`

Trigger phrases:
- "Open curriculum builder"
- "Build curriculum"
- "Customize levels"
- "Help me set up curriculum"
- "Walk me through curriculum builder"
- "Show curriculum setup"
- "Guide me through curriculum"

Focus target: `curriculum-builder-hero` (the CurriculumSetupBuilder root section)

DONNA says after navigation:
> "I brought you to the Curriculum Builder. Here you can review and customize your levels — choose pathways, assign assessment gates, and save your structure. I'll guide each step."

### Q4. Which commands should open Review Queue?

Route: `/director/review`

Trigger phrases:
- "Show me the review queue"
- "Show review queue"
- "What needs my review?"
- "What needs approval?"
- "Show pending items"
- "Open review center"

Focus target: `pending-review-list` (the top-of-page pending items section)

DONNA says after navigation:
> "Here's your Review Center. I can see which items are pending. Start with the most urgent — attendance exceptions and placement reviews usually come first."

### Q5. Which commands should open Daily Command?

Route: `/director`

Trigger phrases:
- "What do I need to do today?"
- "What should I do first?"
- "Show me my daily command"
- "Take me home"
- "Back to home"
- "Show dashboard"

Focus target: `today-command-center` (DirectorTodayCommandCenter component root)
Secondary: `review-queue-card` (first Today's Pulse tile)

DONNA says after navigation:
> "Here's your daily command view. The pulse tiles show your most urgent actions right now — review queue, player attention, and sessions. Start with whichever has the highest number."

### Q6. Which commands should open Player Directory?

Route: `/director/players`

Trigger phrases:
- "Help me assign levels"
- "Show players without levels"
- "Who needs placement?"
- "Show player flags"
- "Where do I fix player levels?"
- "Show me my players"
- "Player directory"

Focus target: `player-directory-summary` or `players-missing-level`

DONNA says after navigation:
> "Here's your Player Directory. Players without a curriculum level assigned are shown at the top. Use the filter bar to focus on pending placements."

### Q7. Which commands should open Sessions?

Route: `/director/sessions`

Trigger phrases:
- "Show sessions"
- "Show me sessions"
- "What sessions are happening?"
- "Sessions this week"
- "Open sessions"

Focus target: `sessions-list` (the main sessions list section)

DONNA says after navigation:
> "Here are your sessions. I can help you check which ones have missing recaps or need attention."

### Q8. What existing router/navigation helpers does DONNA already use?

From audit of `src/lib/donna/donnaUIActionDispatcher.ts` and `DonnaAssistantButton.tsx`:

| Helper | File | What it does |
|---|---|---|
| `router.push(route)` | DonnaAssistantButton.tsx (~15 call sites) | Direct navigation via Next.js router |
| `dispatchUIIntent(text, role, pathname)` | donnaUIActionDispatcher.ts | Returns `DispatchResult` with `route: string \| null`, `kind: 'navigate' \| ...` |
| `NAV_PATTERNS` | donnaUIActionDispatcher.ts | Regex patterns → route strings (already covers most target routes) |
| `getOperatorForPhrase(phrase)` | donnaUIGuidedOperators.ts | Matches entry phrase to a `GuidedOperator` |
| `getOperatorForRoute(route)` | donnaUIGuidedOperators.ts | Returns operator for current route |
| `router.push(result.route)` | DonnaAssistantButton.tsx line 2713 | Navigation after `dispatchUIIntent` fires |
| `donna:open` CustomEvent | DonnaOpenChip / layout | Lets pages open panel with pre-loaded prompt |

Gap: None of these helpers currently set or read a `DonnaFocusTarget`. Navigation works but nothing is highlighted after arrival.

### Q9. Can DONNA currently route and preserve intent after navigation?

**Routing:** Yes — `router.push()` works. DONNA can navigate.

**Intent preservation after navigation:**
- `cooThread` (conversation): persists across route changes (Sprint 801+)
- `commandResponse` (last answer): persists across route changes
- `sessionIntentContext` (follow-up "the other two"): **CLEARED on every route change** — this is the main gap
- `contextSummary`: persists but becomes stale silently (Sprint 811)
- No focus target is preserved or set on navigation

**Gap for guided navigation:** After `router.push('/director/class-templates/new')`, DONNA does not know she just navigated there or what to highlight. The new `DonnaFocusTarget` must be set immediately before `router.push()` is called, and the target page must read it on mount.

### Q10. Which pages have stable element IDs or data attributes?

**Current state:** No pages have `data-donna-focus-id` attributes. No stable DONNA-targeting IDs exist.

**Pages that need focus target attributes added (Sprints 818–820):**

| Page | Route | Target IDs needed |
|---|---|---|
| Daily Command | `/director` | `today-command-center`, `todays-pulse`, `review-queue-card`, `player-attention-card`, `sessions-this-week-card` |
| Player Directory | `/director/players` | `player-directory-summary`, `players-missing-level`, `player-filter-bar`, `player-list` |
| Class Template Builder | `/director/class-templates/new` | `create-template-form`, `template-name-input`, `session-blocks-section` |
| Class Templates List | `/director/class-templates` | `create-template-button`, `template-list` |
| Curriculum Builder | `/director/curriculum/builder` | `curriculum-builder-hero`, `pathway-selector`, `level-editor` |
| Review Queue | `/director/review` | `pending-review-list`, `review-tabs`, `review-queue-header` |
| Sessions | `/director/sessions` | `sessions-list`, `sessions-this-week` |

### Q11. Which pages need DONNA focus targets?

Priority order for implementation (Sprints 818–820):

1. **Sprint 818:** Daily Command (`/director`) — highest traffic, DONNA's starting point
2. **Sprint 819:** Class Template Builder (`/director/class-templates`, `/director/class-templates/new`) — user explicitly requested
3. **Sprint 820:** Player Directory (`/director/players`) — high-value guided workflow

Lower priority (later sprints):
- Curriculum Builder (`/director/curriculum/builder`)
- Sessions (`/director/sessions`)
- Review Queue (`/director/review`) — already navigable

### Q12. What is the safest no-backend way to implement guided highlighting?

**Recommended approach: sessionStorage + data attributes + CSS**

Architecture:
1. **`DonnaFocusTarget` object** stored in `sessionStorage` (key: `donna_focus_target`)
2. **`data-donna-focus-id` attribute** on target elements in each page
3. **`DonnaHighlightBanner` component** mounted in director layout — reads `sessionStorage` on mount, finds the target element, scrolls to it, applies teal glow CSS
4. **Auto-dismiss** after 8 seconds or on user click
5. **No database mutation** — purely visual guidance
6. **No role permission changes** — read-only UI signal

Why sessionStorage (not React context):
- Focus target must survive the `router.push()` navigation (React state is reset on navigation for Server Components)
- sessionStorage persists across client-side navigation
- sessionStorage is cleared on tab close (right scope — same session)
- Safe: contains only route + element ID + display label, no private data

Safety constraints:
- Focus target never contains: player names, coach notes, private data, role-restricted content
- Focus target only ever contains: route, targetId, label, reason, highlightStyle, expiresAt
- Any targetId that doesn't match a real element on the page is silently ignored (no error)

---

## DONNA Action Mode Definitions

### Mode 1: Answer Mode

**When:** Question can be answered from DONNA's current knowledge + academy context.
**Behavior:** Answer stays in sidebar panel. No navigation.
**Examples:** "How many players need attention?", "What does Orange Ball mean?", "Why does this matter?"

### Mode 2: Navigate + Highlight Mode

**When:** User needs to see a page or section to take action.
**Behavior:**
1. DONNA says what she's doing: "I'm taking you to the [page]."
2. DONNA sets `DonnaFocusTarget` in sessionStorage.
3. `router.push(route)` navigates the user.
4. On arrival, `DonnaHighlightBanner` reads the target, scrolls into view, shows teal glow.
5. DONNA speaks (marin) the arrival message via `speakDonna()`.
6. DONNA remains in panel for follow-up.
7. Highlight auto-dismisses after 8 seconds.

**Examples:** "Show me the review queue", "Help me assign levels", "Where do I go to do that?"

### Mode 3: Guided Builder Mode

**When:** User wants to complete a multi-step workflow in a workspace (not just view it).
**Behavior:**
1. DONNA navigates to the builder route (Navigate + Highlight first step).
2. DONNA stays in panel alongside the builder, guiding step by step.
3. Uses existing `GuidedOperator` framework from `donnaUIGuidedOperators.ts`.
4. Each DONNA turn corresponds to a focus target (spotlight moves with progress).
5. DONNA never auto-fills the form — she guides, director fills.

**Examples:** "Create a class template", "Help me set up curriculum", "Walk me through onboarding"

---

## DonnaFocusTarget Type

```typescript
// src/lib/donna/donnaFocusTarget.ts — Sprint 817

export type DonnaHighlightStyle = 'teal-glow' | 'warning'

export interface DonnaFocusTarget {
  route: string                      // The page route this target belongs to
  targetId: string                   // Matches data-donna-focus-id attribute on the element
  label: string                      // Human-readable label (shown in highlight badge)
  reason?: string                    // Why DONNA is pointing here (shown in badge)
  sourceCommand?: string             // The user prompt that triggered this (logging only)
  highlightStyle?: DonnaHighlightStyle // 'teal-glow' (default) | 'warning'
  expiresAt?: number                 // Unix ms — auto-dismiss if current time > expiresAt
}

// Storage key for sessionStorage
export const DONNA_FOCUS_TARGET_KEY = 'donna_focus_target'

// Set active focus target (call before router.push)
export function setDonnaFocusTarget(target: DonnaFocusTarget): void {
  if (typeof window === 'undefined') return
  const withExpiry = {
    ...target,
    expiresAt: target.expiresAt ?? Date.now() + 8000, // 8 second default
  }
  sessionStorage.setItem(DONNA_FOCUS_TARGET_KEY, JSON.stringify(withExpiry))
}

// Read active focus target (call on page mount)
export function getDonnaFocusTarget(): DonnaFocusTarget | null {
  if (typeof window === 'undefined') return null
  const raw = sessionStorage.getItem(DONNA_FOCUS_TARGET_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as DonnaFocusTarget
    // Expired — clear and return null
    if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
      clearDonnaFocusTarget()
      return null
    }
    return parsed
  } catch {
    return null
  }
}

// Clear focus target (call on dismiss or after highlighting)
export function clearDonnaFocusTarget(): void {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(DONNA_FOCUS_TARGET_KEY)
}
```

---

## Command-to-Route Map

| User Command Pattern | Mode | Route | Focus Target ID | DONNA Arrival Message |
|---|---|---|---|---|
| "Create a class template" | Guided Builder | `/director/class-templates/new` | `create-template-form` | "I brought you to the Class Template Builder. Fill in the details here — I'll help with the structure." |
| "Create a template" | Navigate + Highlight | `/director/class-templates` | `create-template-button` | "Here's the Template Library. Tap 'New Template' to start building." |
| "Build a class plan" | Guided Builder | `/director/class-templates/new` | `create-template-form` | "I brought you to the Class Template Builder. Fill in the details here — I'll help with the structure." |
| "Open curriculum builder" | Navigate + Highlight | `/director/curriculum/builder` | `curriculum-builder-hero` | "Here's the Curriculum Builder. Select a pathway to start reviewing or customizing levels." |
| "What do I need to do today?" | Navigate + Highlight | `/director` | `today-command-center` | "Here's your Daily Command view. Your most urgent actions are in the pulse tiles." |
| "What should I do first?" | Navigate + Highlight | `/director` | `review-queue-card` | "Start with your Review Center — that's where the highest-urgency items are." |
| "Where do I go to do that?" | Navigate + Highlight | (from last recommendation) | (from last focus target) | "I'm taking you back to where we left off." |
| "Show me the review queue" | Navigate + Highlight | `/director/review` | `pending-review-list` | "Here's your Review Center. Your pending items are listed here." |
| "Show me what needs attention" | Navigate + Highlight | `/director` | `review-queue-card` | "The attention tiles here show your most urgent items right now." |
| "Help me assign levels" | Navigate + Highlight | `/director/players` | `players-missing-level` | "Here's your Player Directory. Players without a level assigned are shown at the top." |
| "Show players without levels" | Navigate + Highlight | `/director/players` | `players-missing-level` | "Players without a curriculum level are shown here — assign levels to activate them." |
| "Who needs placement?" | Navigate + Highlight | `/director/players` | `players-missing-level` | "Players pending placement are shown here. Start with the oldest pending status." |
| "Show sessions" | Navigate + Highlight | `/director/sessions` | `sessions-list` | "Here are your sessions. I can help you find ones with missing recaps or upcoming alerts." |
| "Highlight that for me" | Highlight only | (stay on current page) | (from last mentioned target) | "I've highlighted what I was referring to." |
| "Open that" | Navigate + Highlight | (from last recommendation) | (from last focus target) | "Opening it now." |

---

## Teal Highlight Behavior Specification

### CSS class: `donna-focus-ring`

```css
/* src/app/globals.css — Sprint 817 addition */

.donna-focus-ring {
  outline: 2px solid #11d9df;           /* teal-500 */
  outline-offset: 4px;
  border-radius: 8px;
  box-shadow: 0 0 0 4px rgba(17, 217, 223, 0.18),
              0 0 20px rgba(17, 217, 223, 0.12);
  animation: donna-pulse 2s ease-in-out infinite;
}

@keyframes donna-pulse {
  0%   { box-shadow: 0 0 0 4px rgba(17, 217, 223, 0.18), 0 0 20px rgba(17, 217, 223, 0.12); }
  50%  { box-shadow: 0 0 0 6px rgba(17, 217, 223, 0.26), 0 0 28px rgba(17, 217, 223, 0.20); }
  100% { box-shadow: 0 0 0 4px rgba(17, 217, 223, 0.18), 0 0 20px rgba(17, 217, 223, 0.12); }
}
```

### Target element markup

```tsx
// Example: on the "Today's Command Center" section
<div
  data-donna-focus-id="today-command-center"
  className="..."
>
  ...
</div>
```

### DonnaHighlightBanner component (Sprint 817)

```tsx
// src/components/donna/DonnaHighlightBanner.tsx

'use client'

// Mounts in director layout. Reads sessionStorage for active focus target.
// When target exists and current route matches, finds element, scrolls into view,
// applies donna-focus-ring class, shows small badge, auto-dismisses after expiresAt.
// No DB. No mutations. Pure visual guidance only.

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { getDonnaFocusTarget, clearDonnaFocusTarget } from '@/lib/donna/donnaFocusTarget'
import type { DonnaFocusTarget } from '@/lib/donna/donnaFocusTarget'
import { X } from 'lucide-react'

export function DonnaHighlightBanner() {
  const pathname = usePathname()
  const [active, setActive] = useState<DonnaFocusTarget | null>(null)

  useEffect(() => {
    const target = getDonnaFocusTarget()
    if (!target) return
    // Only activate if we are on the correct route
    if (pathname !== target.route) return

    // Find element
    const el = document.querySelector<HTMLElement>(`[data-donna-focus-id="${target.targetId}"]`)
    if (!el) return

    // Scroll into view + apply glow
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el.classList.add('donna-focus-ring')
    setActive(target)

    // Auto-dismiss
    const remaining = (target.expiresAt ?? 0) - Date.now()
    const timer = setTimeout(() => {
      el.classList.remove('donna-focus-ring')
      clearDonnaFocusTarget()
      setActive(null)
    }, Math.max(remaining, 1000))

    return () => {
      clearTimeout(timer)
      el.classList.remove('donna-focus-ring')
    }
  }, [pathname])

  if (!active) return null

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2
                    bg-surface-raised border border-[#11d9df]/40 rounded-lg px-3 py-2
                    text-[#11d9df] text-xs shadow-lg pointer-events-none">
      <span className="w-1.5 h-1.5 rounded-full bg-[#11d9df] animate-pulse" />
      <span>DONNA is pointing here</span>
      <button
        className="ml-1 pointer-events-auto opacity-60 hover:opacity-100"
        onClick={() => {
          const el = document.querySelector<HTMLElement>(`[data-donna-focus-id="${active.targetId}"]`)
          el?.classList.remove('donna-focus-ring')
          clearDonnaFocusTarget()
          setActive(null)
        }}
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  )
}
```

### Behavior spec

| Behavior | Rule |
|---|---|
| Target match | `querySelector('[data-donna-focus-id="<targetId>"]')` |
| No match found | Silently ignored — no error, banner not shown |
| Scroll | `scrollIntoView({ behavior: 'smooth', block: 'center' })` |
| Glow | CSS class `donna-focus-ring` added to element |
| Badge | Fixed-position teal badge: "DONNA is pointing here" |
| Auto-dismiss | After `expiresAt` (default 8 seconds from setDonnaFocusTarget call) |
| Manual dismiss | Badge × button removes glow, clears sessionStorage |
| Route mismatch | Focus target ignored — not on the right page yet |
| Warning highlight | `highlightStyle: 'warning'` uses orange ring instead of teal |
| No database | Nothing persisted to DB. No RLS. No mutations. |
| No private data | `targetId`, `label`, `reason` only — never player/coach data |

---

## Implementation Sequence (Sprints 817–825)

| Sprint | Deliverable | Files |
|---|---|---|
| **817** | `DonnaFocusTarget` type + sessionStorage store + `DonnaHighlightBanner` component + CSS + wire to layout | `src/lib/donna/donnaFocusTarget.ts`, `src/components/donna/DonnaHighlightBanner.tsx`, `src/app/globals.css`, `src/app/director/layout.tsx` |
| **818** | Daily Command focus target attributes + DONNA command mapping for "what do I need to do today" | `src/app/director/page.tsx`, `src/app/director/_components/DirectorTodayCommandCenter.tsx` (if needed), DonnaAssistantButton or UIActionDispatcher |
| **819** | Class Template Builder focus targets + "create a class template" navigate+highlight | `src/app/director/class-templates/new/page.tsx`, `src/app/director/class-templates/page.tsx`, DonnaAssistantButton command mapping |
| **820** | Player Directory focus targets + "help me assign levels" navigate+highlight | `src/app/director/players/page.tsx`, `src/app/director/players/_components/PlayersDirectoryClient.tsx` |
| **821** | DONNA Voice Singleton — stop Realtime from floating panel | `src/components/assistant/DonnaAssistantButton.tsx` |
| **822** | Developer Tools production guard + panel clutter guard | `src/components/assistant/DonnaAssistantButton.tsx`, `src/components/assistant/DonnaDeveloperTools.tsx` |
| **823** | Panel default view simplification | `src/components/assistant/DonnaAssistantButton.tsx` |
| **824** | Teal brand system audit + cleanup | Multiple files |
| **825** | Guided assistant + teal brand certification | Audit doc only |

---

## Integration with Existing DONNA Systems

### Where to call `setDonnaFocusTarget()` + `router.push()`

**Option A — DonnaAssistantButton.tsx `handleTextSubmit`:**
After `dispatchUIIntent()` returns `kind: 'navigate'`, before `router.push()`:
```typescript
if (result.kind === 'navigate' && result.route) {
  const focusTarget = buildFocusTargetForCommand(text, result.route)
  if (focusTarget) setDonnaFocusTarget(focusTarget)
  router.push(result.route)
}
```

**Option B — `donnaUIActionDispatcher.ts` `DispatchResult`:**
Add optional `focusTarget?: DonnaFocusTarget` field to `DispatchResult`.
Sprint 817 populates this alongside `route`.
DonnaAssistantButton reads it and calls `setDonnaFocusTarget()` before `router.push()`.

**Recommended: Option B** — keeps focus target logic close to the navigation intent, not scattered in the 4,525-line component.

### Where NOT to set focus targets

- Never in server components (no browser APIs)
- Never in API routes
- Never from voice transcript handlers directly (voice triggers command → command triggers navigate → navigate sets focus)
- Never with private player/coach data in the target payload

---

## Safety Guardrails Preserved

| Guardrail | Status |
|---|---|
| Voice never mutates data | ✅ Highlight is visual-only, no mutation |
| All mutations through `proposed_actions` | ✅ Unchanged — highlighting is guidance not execution |
| No RLS bypass | ✅ Focus target is pure sessionStorage |
| Role boundaries intact | ✅ Focus targets are direction-only, not data access |
| Parent-safe response rules | ✅ Nothing about highlighting touches parent/player data |
| No audio stored | ✅ Unchanged |
| No mic auto-start | ✅ Unchanged |
| No fake data as real | ✅ Unchanged |
| Developer tools hidden | Sprint 822 |

---

## Files Changed in Sprint 816

- **Created** `docs/DONNA_GUIDED_NAVIGATION_HIGHLIGHT_ARCHITECTURE_816.md` — this document
- **Modified** `docs/CHANGELOG.md` — Sprint 816 entry
- **TypeScript:** Clean (architecture sprint — no source changes)
