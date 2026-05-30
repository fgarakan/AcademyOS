# DONNA Curriculum Builder Guidance — Sprint 973

**Date:** 2026-05-30
**Sprint:** 973
**Status:** Implemented — TypeScript clean

---

## What Was Built

Sprint 973 makes DONNA guide directors through curriculum builder decisions. DONNA can now explain the curriculum structure, levels, gates, draft behavior, and global vs academy content boundaries.

---

## Files Created / Modified

| File | Change |
|---|---|
| `src/lib/donna/curriculumBuilderGuidance.ts` | Created — deterministic curriculum guidance builder |
| `src/lib/donna/donnaPageChipRegistry.ts` | Modified — 4 new chips on `/director/curriculum` |
| `src/components/assistant/DonnaAssistantButton.tsx` | Modified — import + handler in `detectAndHandleCommand` |

---

## Guidance Intent Coverage

| Intent | Trigger Phrases |
|---|---|
| `explain_curriculum` | "what is the curriculum", "explain the curriculum", "explain this page" |
| `explain_levels` | "what are levels", "explain levels", "explain the level tree" |
| `explain_gates` | "what are gates", "explain gates", "how does a player advance" |
| `what_to_edit_first` | "what should I edit first", "where do I start", "curriculum first step" |
| `draft_review_behavior` | "how does the draft work", "do changes apply immediately", "when do changes take effect" |
| `global_vs_academy` | "global vs academy", "what is global curriculum", "can I edit global content" |

---

## Curriculum Chip Set (Post-973)

| ID | Label | Action |
|---|---|---|
| `cur-status` | Highlight curriculum status | highlight |
| `cur-draft` | Highlight review draft | highlight |
| `cur-levels` | Highlight level tree | highlight |
| `cur-next` | What should I do next? | prompt |
| `cur-explain` | Explain this curriculum | prompt (new) |
| `cur-levels-explain` | What are levels? | prompt (new) |
| `cur-gates-explain` | What are gates? | prompt (new) |
| `cur-edit-first` | What should I edit first? | prompt (new) |

---

## Key Guidance Points

- **Levels:** Director-assigned development stages; advancement never automatic
- **Gates:** Completion criteria with evidence-based status progression; director confirms
- **Draft behavior:** All edits are drafts first; applied only after director review and approval
- **Global vs academy:** Directors cannot modify global library; they create academy-specific overrides

---

## No-Mutation / No-Migration Guarantee

- Pure TypeScript guidance helper — no DB, no API, no mutations
- No curriculum records changed
- No level assignments changed
- No gates confirmed
- No schema changes
