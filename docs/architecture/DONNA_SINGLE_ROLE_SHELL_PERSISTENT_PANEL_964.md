# DONNA Single Role Shell — Persistent Side Panel V1

**Sprint:** 964  
**Date:** 2026-05-29  
**Status:** Complete

---

## Problem: Scattered DONNA entry points (pre-Sprint 964 audit)

Before Sprint 964, DONNA was architecturally sound but the *purpose* of each surface was not fully documented. The audit confirmed:

- **One floating FAB** in the director layout (`DonnaAssistantButton`) — the correct primary entry point.
- **Pages dispatch `donna:open` CustomEvent** to pre-fill the floating panel — correct, no duplicate buttons.
- **`/director/donna` full-page command center** — a valid, intentional separate surface (dedicated DONNA intelligence page), not a duplicate button.
- **No page-level DONNA buttons** — confirmed clean.

The gap: the side panel had generic conversational chips ("What do I need to do today?") but no chips that triggered highlights of specific page elements or sent page-specific prompts.

---

## Role-Shell DONNA Model

### Principle
One DONNA per role. Each role has a single persistent side-panel entry point in its layout shell:

| Role | Shell | Button location |
|---|---|---|
| `academy_director` | `src/app/director/layout.tsx` | `<DonnaAssistantButton>` — floating FAB, bottom-right |
| `head_coach` / `coach` | Coach layout | V2 — same model |
| `player` | Player layout | V2 — same model |
| `parent` | Parent layout | V2 — same model |

Director is the only role implemented in Sprint 964. Coach / parent / player parity is V2.

### `/director/donna` is NOT a duplicate
`/director/donna` is a dedicated full-page DONNA command center. It embeds a `DonnaVoiceReadyShell` inside the page body — it is a deep-dive DONNA intelligence surface, not an additional floating button. It does not replace or conflict with the role-shell FAB. Both serve different use cases:

| Surface | Use case |
|---|---|
| Floating FAB + side panel | Quick context, chips, highlights, voice input, any page |
| `/director/donna` full page | Deep intelligence, daily brief, attention items, academy pulse |

---

## Button Toggle Behavior

Already implemented (Sprint 686 + Sprint 918):

- **Closed → Open:** `openDonnaPanel()` — slides panel in, activates context auto-load (Sprint 856)
- **Open → Closed:** `closePanel()` — slides panel out, clears conversation state, stops TTS
- **Minimize:** `minimizePanel()` — hides panel without clearing thread; FAB turns lime
- **Expand from minimize:** `expandPanel()` — restores panel with thread intact

Toggle button: `fixed bottom-6 right-6 z-50` floating FAB. Hidden on mobile for directors (replaced by `DONNADirectorMobileCommandBar`). One button. One source of truth.

---

## Side Panel Behavior

On panel open, in sequence:
1. `DonnaSessionContextProvider` emits `panelOpen = true`
2. `DonnaAssistantButton` `useEffect([panelOpen])` fires:
   - Restores draft from sessionStorage if present
   - Sets `showGreeting = true` on first open
   - Builds role+page-aware greeting via `buildDonnaOpeningGreeting(firstName, pathname, isFirstOpenToday)`
   - Fetches pending review queue count (director only)
   - Evaluates rule-based recommendations
3. `useEffect([panelOpen])` in Sprint 856 fires `handleContextSummary()` — auto-loads live page context
4. Panel renders immediately with greeting and chip bar visible

---

## Greeting Behavior

Greeting source: `buildDonnaOpeningGreeting(firstName, pathname, isFirstOpenToday)` in `src/lib/donna/donnaGreeting.ts`.

- **Role-aware:** Director greeting is distinct from coach greeting.
- **Page-aware:** `pathname` is passed in; greeting copy references the current module.
- **Daily-aware:** `isFirstOpenToday` from `shouldShowDailyDonnaGreeting()` — first open of the day gets a richer welcome.
- **Cross-session-aware:** `buildCrossSessionWelcome(lastSessionData, firstName)` shown on subsequent opens when prior session data exists.
- Greeting is shown in the panel body (`showGreeting` state) above the voice/text layer.

---

## Page-Aware Chip Model (Sprint 964 — new)

### Architecture

Two new files:

**`src/lib/donna/donnaPageChipRegistry.ts`**
- Pure TypeScript — no client/server marker needed.
- Defines `DonnaPageChip[]` per route.
- Two action types:
  - `'highlight'` — targets a `data-donna-focus-id` element on the current page
  - `'prompt'` — sends a pre-written prompt into the DONNA conversation via `handleCommandSubmit`
- Route matching: exact match first, then longest-prefix match (for dynamic segments like `[templateId]`).

**`src/components/donna/DonnaPanelPageChips.tsx`**
- `'use client'` component.
- Props: `pathname: string`, `onPrompt: (text: string) => void`
- Reads chips from `getChipsForRoute(pathname)`.
- Returns `null` when no chips are registered for the route — no empty space, no layout shift.
- Mounted inside the DONNA panel scrollable body, after the greeting card, before the voice/text input layer.

### Chip locations covered

| Route | Chips | Targets |
|---|---|---|
| `/director` | Today's pulse, review queue, academy metrics | `todays-pulse`, `review-queue-card`, `academy-metrics-section` |
| `/director/curriculum` | Curriculum status, review draft, level tree, next step | `curriculum-status`, `curriculum-review-draft`, `curriculum-level-tree` |
| `/director/class-templates` | Create button, template list | `create-template-button`, `template-list` |
| `/director/class-templates/[id]` | Primary action, block list, review draft, next step | `class-template-primary-action`, `class-template-block-list`, `class-template-review-draft` |
| `/director/templates/impact-preview` | Explain, what is safe, open review queue | (prompt only — no targets on page yet) |
| `/director/review` | What needs approval?, explain queue | (prompt only) |
| `/director/onboarding/*` | What next?, explain this step | (prompt only) |
| `/director/players` | Player list | `player-list` |
| `/director/players/[id]` | Priorities, evidence hub, next step | `player-active-priorities`, `player-evidence-hub` |
| `/director/sessions/*` | What needs attention? | (prompt only) |
| `/director/donna` | What can DONNA do? | (prompt only) |

---

## Highlight Escalation Model

First highlight of a `targetId` in a session:
- `highlightStyle: 'teal-glow'`
- Standard `donna-focus-ring` CSS class via `DonnaHighlightBanner`

Repeated highlight of the same `targetId`:
- `highlightStyle: 'warning'`
- `donna-focus-ring-warning` CSS class — orange/warning colour
- Chip button shows an animated teal pulse dot to indicate escalation

Tracking:
- `highlightCountsRef` (`useRef<Record<string, number>>`) — incremented on each chip click
- `escalatedIds` (`useState<Set<string>>`) — drives the visual chip style
- Both reset when the chip component unmounts (i.e., when the panel closes) — correct UX

Graceful degradation:
- `setDonnaFocusTarget` writes to `sessionStorage` — safe even if element is absent
- `DonnaHighlightBanner` checks for `document.querySelector([data-donna-focus-id="..."])` — silently exits when element is not found; no error thrown, no UI crash

---

## Voice-Ready Architecture

Sprint 964 does **not** implement full TTS/voice persona — the existing voice path is preserved.

### Current voice path (unchanged)
```
Director speaks / triggers TTS
  → speakWithServerTts() [src/components/assistant/donnaServerTtsClient.ts]
      → /api/donna/tts (server-side TTS)
      → browser speechSynthesis fallback
  → speakAssistantText() [browser speechSynthesis, onboarding/greeting path]
```

No new voice surface is created in Sprint 964. The FAB controls both text and voice from the same side panel.

### Sprint 965 — DONNA Voice Persona + Spoken Greeting V1

**Goal:** Give DONNA a single, consistent voice identity for all audio output.

**Voice target:**
- Female-sounding, slight British/English accent
- Calm, trustworthy, premium — COO-like
- Consistent across all TTS paths (server TTS + browser fallback)

**Implementation path:**
- Select a voice from OpenAI TTS (or ElevenLabs) with the above profile
- Wire it into `speakWithServerTts` as the default voice
- Update `preferredBrowserVoiceKeywords` in `donnaVoiceConfig.ts` to prefer British-sounding local voices as fallback
- Add spoken greeting on panel open (calling `speakDonna(greetingText)` after `showGreeting = true`)
- No new voice button — same FAB, same panel
- No second DONNA voice widget

Sprint 965 does NOT create a new DONNA assistant identity. It applies a voice profile to the existing DONNA.

---

## Files Changed

| File | Type | Description |
|---|---|---|
| `src/lib/donna/donnaPageChipRegistry.ts` | New | Chip definitions per route — pure TypeScript, no client/server |
| `src/components/donna/DonnaPanelPageChips.tsx` | New | Client component: chip renderer + highlight escalation tracking |
| `src/components/assistant/DonnaAssistantButton.tsx` | Modified | Added import + `<DonnaPanelPageChips>` in panel body |

---

## Safety Boundaries

- No DB reads or writes in `donnaPageChipRegistry.ts` or `DonnaPanelPageChips.tsx`.
- No parent or player data exposed.
- Highlight chips set only a route + element ID in sessionStorage — no user data, no private content.
- Prompt chips route through `handleCommandSubmit` — existing DONNA conversation safety guardrails apply.
- Proposed actions pipeline untouched.
- Sprint 904 approve/reject paths untouched.
- `execute_approved_action()` not called.
- `finalize_player_placement()` not called.
- No audit log writes from chip interactions.
- No RLS changes.
- No migrations.

---

## V2 Parity — Coach / Parent / Player

Coach, parent, and player role shells will follow the same model in V2:
- One DONNA button per role shell
- Same `DonnaPanelPageChips` component — register coach/parent/player routes in `donnaPageChipRegistry.ts`
- Same escalation tracking
- Voice persona from Sprint 965 applies across all roles

No code changes needed in `DonnaPanelPageChips.tsx` for V2 — just add route entries to the registry.

---

## No-Migration Guarantee

Sprint 964 introduces zero schema changes. No migrations. No new tables. No RLS policy changes. Pure TypeScript + React client component.
