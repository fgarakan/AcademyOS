# DONNA First-Open Greeting Simplification — Sprint 1059

**Date:** 2026-05-31
**Status:** Implemented

---

## Problem

After Sprint 1058 reduced sidebar clutter (removed auto-expanded Context/Suggestions, removed duplicate review queue card, removed coach quick-action buttons, collapsed dev tools), the greeting card itself still contained multiple lines that added noise:

1. **Follow-up text** — a second sentence prompting the user ("Would you like me to walk you through what needs attention?"). The chips and text input already guide the user.
2. **Page context line** — "You're on: Players" — exact duplicate of `↳ Players` shown in the panel header since Sprint 800.
3. **Priority hint** — "3 items waiting in your review queue." — exact duplicate of `DonnaReviewQueueBadge` in the header, which Sprint 1058 explicitly preserved as the canonical location for this count.
4. **First-open-of-day primary text** — a long sentence listing 4 categories: "I'm ready to help you review today's priorities, player signals, coach follow-ups, and anything waiting for approval." Too detailed for a greeting.

---

## Changes

### 1. Removed follow-up text rendering (`DonnaAssistantButton.tsx`)

The `dailyGreetingState.followUp` block added a second sentence below the primary greeting. Example: "Would you like me to walk you through what needs attention?" The chips ("What needs my attention?", "Walk me through academy priorities" button) already surface this affordance. Removed.

### 2. Removed page context line (`DonnaAssistantButton.tsx`)

The "You're on: [screen name]" line (Sprint 1030) told the director which screen DONNA was aware of. The panel header already shows this as `↳ [screen name]` (Sprint 800). The greeting card line was redundant. Removed.

### 3. Removed priority hint (`DonnaAssistantButton.tsx`)

The orange text "N items waiting in your review queue." (Sprint 649) inside the greeting card was a duplicate of the `DonnaReviewQueueBadge` shown in the header. Sprint 1058 removed the commandResponse card showing this count, but this inline text inside the greeting was missed. Removed.

### 4. Shortened first-open-of-day primaryText (`donnaGreeting.ts`)

**Before:** `"Good morning, Brian. I'm ready to help you review today's priorities, player signals, coach follow-ups, and anything waiting for approval."`

**After:** `"Good morning, Brian. I'm ready to help you focus on what matters today."`

One concise sentence. Clean and premium. `followUp` set to `''` to align the source with the JSX removal.

This text is also spoken via `speakDonna(content.primaryText)` on first-open-of-day — shorter TTS greeting is better.

---

## Before Greeting Card (all roles, typical director first-open-of-day)

```
DONNA                                        ← lime label
Good morning, Brian. I'm ready to help       ← primary text (long, 4 categories)
you review today's priorities, player
signals, coach follow-ups, and anything
waiting for approval.
Would you like me to walk you through        ← follow-up text
what needs attention?
You're on: Players                           ← page context (duplicate header)
3 items are waiting in your review queue.    ← priority hint (duplicate badge)
[Walk me through academy priorities]         ← CTA button
```

## After Greeting Card (same conditions)

```
DONNA                                        ← lime label
Good morning, Brian. I'm ready to help       ← primary text (1 short line)
you focus on what matters today.
[Walk me through academy priorities]         ← CTA button (still shown, gated)
```

---

## Preserved

| Item | Status |
|---|---|
| DONNA label (lime, uppercase) | ✓ Kept |
| Primary greeting sentence | ✓ Kept, shortened for first-open |
| "Walk me through academy priorities" button | ✓ Kept — gated to first daily open + director |
| Coach session wrap-up CTA | ✓ Kept — gated to session page |
| Onboarding greeting + voice button | ✓ Kept — gated to `isOnboardingActive` |
| One-click voice (Sprint 1057) | ✓ Unchanged |
| Sidebar reduction (Sprint 1058) | ✓ Unchanged |
| Header page label (↳ screen) | ✓ Unchanged — canonical location |
| Header review queue badge | ✓ Unchanged — canonical location |
| Follow-up text field in `DailyGreetingState` type | ✓ Field still exists, just returns `''` |
