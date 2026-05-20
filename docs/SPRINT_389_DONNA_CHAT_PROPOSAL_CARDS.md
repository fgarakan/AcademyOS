# Sprint 389 — DonnaChat Proposal Cards V1

**Date:** 2026-05-20
**Sprint:** 389
**Status:** Complete

---

## Context from Sprint 387D audit

The 387D audit scored `DonnaAdjustmentStep` at **5/10** — the lowest score in the flow. The prototype's DonnaChatScreen shows a simulated chat thread with DONNA, proposal cards (title + "Proposed Changes" list + "Affected Areas" chips + Approve/Edit/Cancel buttons), and example prompt chips.

The prior `DonnaAdjustmentDraftPanel` applied suggestion changes immediately on chip click — no proposal review step. There was no way for a director to see what would change before it was applied.

---

## What changed

### `DonnaAdjustmentDraftPanel.tsx` — complete rewrite

**Before:**
- 6 quick-adjust chips that immediately called `updateDraft()` on click
- No proposal card
- No DONNA explanation
- No cancel/edit flow
- Changes were invisible until reflected in DNA

**After:** Proposal-card model matching the prototype pattern.

#### Proposal templates

7 `ProposalTemplate` objects, each with:
- `id` — unique key
- `title` — human-readable label
- `explanation` — DONNA's explanation of the proposed change
- `changes[]` — bullet list of specific what-will-change items
- `affectedAreas[]` — chips showing what parts of the system are affected
- `category` — `coaching | session | parent | player | identity`
- `keywords[]` — for text-input matching
- `apply(draft)` — pure function returning `Partial<OnboardingDraft>` to merge

| ID | Title | Category |
|---|---|---|
| `add-game-based` | Add Game-Based Learning | Coaching |
| `add-tactical` | Prioritize Tactical Development | Session |
| `add-fitness` | Add Fitness Emphasis to Sessions | Session |
| `protect-parents` | Maximize Parent Privacy Protection | Parent |
| `add-competition` | Add Point Play to Every Session | Session |
| `player-challenge` | Frame Players as Challenge Seekers | Player |
| `calm-voice` | Set Calm and Precise Coaching Voice | Coaching |

#### Keyword matching

`matchTemplate(text)` scans `keywords[]` on all 7 templates. Returns the first match or `null`. On no match: `openCustomProposal()` generates a generic proposal card with no-op `apply` and request-noting copy.

#### Proposal lifecycle

```
chip click / text send
    → openProposal(template, requestText)
        → adds user message to chat
        → sets activeProposal state

activeProposal → proposal card rendered in chat area

Approve → approveProposal()
    → calls updateDraft(apply(draft)) [non-custom only]
    → adds DONNA confirmation message
    → clears activeProposal

Edit → editProposal()
    → returns requestText to input field
    → clears activeProposal (no message added)

Cancel → cancelProposal()
    → adds "Proposal cancelled. No changes were made." DONNA message
    → clears activeProposal
```

Only one proposal active at a time. Chips and input disabled while `hasProposalPending`.

#### Proposal card UI

```
┌─ DONNA Proposal ────────────── [Draft only] ─┐
│ Title (text-sm font-semibold)                 │
│ Explanation (text-[11px] text-secondary)      │
├──────────────────────────────────────────────-┤
│ PROPOSED CHANGES                              │
│ • Change 1                                    │
│ • Change 2                                    │
│ • Change 3                                    │
├───────────────────────────────────────────────┤
│ AFFECTED AREAS                                │
│ [Coaching Philosophy] [Session Design]        │
├───────────────────────────────────────────────┤
│ Draft proposal — review before applying.      │
│ Nothing is saved until Final Activation.      │
├───────────────────────────────────────────────┤
│ [✓ Approve Change]  [✎ Edit]  [✕ Cancel]    │
└───────────────────────────────────────────────┘
```

For `templateId === 'custom'`: Approve button label is "Acknowledge" (no draft mutation).

#### Applied state

Chips show "Applied" checkmark (lime/60) once a proposal for that template is approved. Applied chips are not re-clickable.

---

### `DonnaAdjustmentStep.tsx` — intro bubble text update

**Before:**
> "I've reviewed your Academy DNA draft. Use the quick adjustments below or describe what you'd like to change. All changes are applied to the local draft — nothing is saved until you activate."

**After:**
> "I've reviewed your Academy DNA draft. Select an adjustment below — I'll create a draft proposal for your review. Approve, edit, or cancel before anything changes."
> "Nothing is applied until you approve a proposal. You can also go back to any step to edit directly."

---

## Safety copy

No copy implies:
- Published
- Saved to DB
- Applied live
- Players notified
- Coaches invited
- Activated live

Copy used:
- `"Draft only"` — panel header badge
- `"Draft proposal — review before applying. Nothing is saved until Final Activation."` — proposal card safety notice
- `"Draft adjustments only — nothing applied until Activation Checklist."` — input area footer
- `"Done. '[title]' applied to your local draft. Nothing is saved until Final Activation."` — DONNA approve confirmation
- `"Proposal cancelled. No changes were made to your draft."` — DONNA cancel confirmation

---

## What is NOT in this sprint

- No real AI call
- No DB writes
- No schema changes
- No migrations
- No package changes
- No prototype code copied
- No prototype teal color used

All proposals are simulated. `apply()` functions are pure `Partial<OnboardingDraft>` merges on client state only.

---

## TypeScript

Clean. `npx tsc --noEmit` passes with no errors.

---

## Files changed

**Modified:**
- `src/components/onboarding/DonnaAdjustmentDraftPanel.tsx` — complete rewrite as proposal-card model
- `src/components/onboarding/steps/DonnaAdjustmentStep.tsx` — intro bubble text updated
- `docs/CHANGELOG.md` — dated entry added

**Created:**
- `docs/SPRINT_389_DONNA_CHAT_PROPOSAL_CARDS.md` — this document

---

## Parity improvement

| Area | Before | After |
|---|---|---|
| Proposal card with title | Missing | Added |
| Proposed Changes bullet list | Missing | Added |
| Affected Areas chips | Missing | Added |
| Approve / Edit / Cancel buttons | Missing | Added |
| Text input keyword matching | Missing | Added |
| Input locked while proposal pending | Missing | Added |
| DONNA confirmation messages | Missing | Added |
| DonnaAdjustment parity score | 5/10 | ~8/10 |

---

## Recommended next sprint

**Sprint 390 — Final Activation Next-Steps Card Grid V1**

The 387D audit scored `ActivationChecklistStep` at **5/10**. The prototype's Final Activation screen shows a 2×3 grid of next-steps cards (Curriculum Builder / Class Template / Fitness Template / Import Players / Invite Coaches / Portal Preview), each with an icon, description, and CTA link. The current `ActivationChecklistStep` has a DNA summary checklist and a single confirm button — no next-steps grid. Adding the card grid is the next highest-impact parity sprint.
