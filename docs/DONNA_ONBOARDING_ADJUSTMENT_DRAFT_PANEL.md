# DONNA Onboarding — Adjustment Draft Panel V1

**Date:** 2026-05-19
**Sprint:** O-9

---

## Summary

Created `DonnaAdjustmentDraftPanel` — a collapsible chat-style panel embedded in Step 6 (Academy DNA Review) that allows directors to fine-tune their draft via DONNA quick suggestions or free-text input. No DB writes.

---

## Component

### `DonnaAdjustmentDraftPanel`

Props: `draft`, `updateDraft`

**Chat history:** Scrollable list of DONNA and user messages. Starts with DONNA's welcome message. New messages appended as suggestions are applied or free text is sent.

**Quick Suggestions (6):**
| Suggestion | Category | Action |
|---|---|---|
| Add game-based learning | Coaching | Appends 'game-based' to coachingStyles |
| Prioritize tactical development | Session | Prepends 'tactical-iq' to developmentPriorities |
| Maximize parent privacy protection | Parent | Sets all 5 parentVisibilityRules to true |
| Add point play to every session | Session | Appends 'point-play' to sessionBlocks |
| Frame players as challenge seekers | Player | Sets playerMissionStyle to 'challenge-seeker' |
| Set a calm, precise coaching voice | Coaching | Sets primaryCommunication to 'calm-precise' |

Applied suggestions show "Applied to draft" label and become disabled. Each application:
1. Mutates the onboarding draft via `updateDraft`
2. Appends user + DONNA message pair to chat history

**Free-text input:** Captures director intent. Appended to chat with a holding response ("I've noted that..."). Full NLP interpretation deferred to a future version.

**Collapse toggle:** Header button collapses/expands the panel body.

## Safety Rules

- No DB writes
- No fake confirmations ("Applied to your account", "Saved", "Updated")
- "Applied to draft" label indicates local state change only
- Footer: "Draft adjustments only — nothing applied until Activation Checklist."
- DONNA messages use future tense for downstream effects
