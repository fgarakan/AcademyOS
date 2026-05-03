# Parent-Safe Response Rules

**Sprint:** 217
**Date:** 2026-05-03
**Status:** V1 — rules and utility module defined. No UI yet.

---

## Purpose

Parents have a limited, carefully scoped view of their child's progress.  
They should receive:
- Encouragement and context
- Session attendance confirmation
- Skill focus information (what they worked on)
- A simple development summary

They should **never** receive:
- Raw assessment scores or percentile rankings
- Coach-internal session notes
- Director notes or strategic flags
- Comparisons to other players
- Harsh or clinical deficit language
- Voice note transcripts (unedited coach text)
- proposed_actions payloads

---

## Field allowlist

Only these field paths are safe to include in parent-facing messages.  
All other fields require explicit approval before being added.

| Field path | Rationale |
|---|---|
| `player.full_name` | Player identity — always safe |
| `player.first_name` | Preferred name in messages |
| `player.curriculum_level_display_name` | Level context (e.g. "Orange 2") |
| `player.curriculum_stage` | Broad stage (foundation / development / performance) |
| `session_attendance.status` | Present / absent / late / excused — attendance confirmation |
| `parent_safe_draft` | Explicitly parent-reviewed coach text |
| `player_development_priorities.parent_message` | Explicitly authored for parents |

Use `canShowParentField(fieldName)` from `src/lib/communications/parentSafeResponseRules.ts` as a runtime gate.

---

## Language sanitization

The following language is replaced automatically by `sanitizeParentFacingText()`:

| Input phrase | Parent-safe replacement |
|---|---|
| "poor performance" | "developing performance" |
| "needs improvement" | "working on" |
| "needs work" | "working on" |
| "must improve" | "continuing to work on" |
| "struggling with" | "working through" |
| "struggling" | "working through challenges" |
| "failing" | "still developing" |
| "deficient" | "developing" |
| "weak" | "building" |
| "poor" | "developing" |
| "bad" | "still learning" |
| `INTERNAL: ...` | *(removed)* |
| `[COACH ...]` | *(removed)* |
| `[INTERNAL ...]` | *(removed)* |
| `[DIRECTOR ...]` | *(removed)* |

Always run `sanitizeParentFacingText()` on any coach-authored text before surfacing to parents.

---

## Tone guidelines

These are returned by `getParentSafeToneGuidelines()` and should be displayed in coach guidance UI:

1. Use the player's first name — never "your child" or "the player".
2. Frame everything as a learning journey, not a deficit or ranking.
3. Reference specific skills (footwork, grip, serve) rather than character traits.
4. One growth area maximum per message — don't list multiple weaknesses.
5. Never compare the player to teammates or to a generic standard.
6. Avoid raw scores, percentile ranks, or internal assessment language.
7. For absences: acknowledge without blame — "we missed [name] today".
8. Keep notifications under 3 sentences where possible.
9. End with encouragement or a forward-looking statement.
10. If an observation is ambiguous or unclear, omit it — send nothing rather than something misleading.

---

## Draft examples

### Present — skill focus only
> "Maria worked on footwork and serve in today's session."

### Present — with observation
> "Lucas worked on grip and preparation in today's session. He showed strong improvement when cued to set the racket earlier."

### Late arrival
> "Alex joined us a little late today. Alex worked on forehand and recovery in today's session."

### Absent
> "We missed Sarah in today's session — we hope all is well and look forward to seeing them next time."

### No keywords (fallback)
> "Jamie worked on their technique in today's session."

---

## Integration points

| Context | Where to apply |
|---|---|
| Coach recap structuring (`structureCoachRecapAction`) | `parent_safe_draft_candidates` already uses `buildParentSafeDraft` — update to use `buildParentSupportGuidanceDraft` in V2 |
| Director session recap review (`/director/review`) | Sanitize any `parent_safe_draft` before displaying in review UI |
| Parent portal (`/parent`) | Gate all field access with `canShowParentField()`; sanitize all text with `sanitizeParentFacingText()` |
| Player portal (`/player`) | Apply same rules — players see their own progress, not coach-internal language |
| Future: automated parent updates | Always run tone check + sanitize before sending |

---

## Implementation file

```
src/lib/communications/parentSafeResponseRules.ts
```

Exports:
- `canShowParentField(fieldName: string): boolean`
- `sanitizeParentFacingText(text: string): string`
- `getParentSafeToneGuidelines(): string[]`
- `buildParentSupportGuidanceDraft(params: ParentGuidanceDraftParams): string`
- `ParentGuidanceDraftParams` (interface)

---

## What this sprint does NOT do

- No UI changes
- No parent portal changes
- No DB schema changes
- Does not send any communications
- Does not generate parent updates automatically — all output requires director/coach review

Human decision is required before any parent-facing message is sent.
