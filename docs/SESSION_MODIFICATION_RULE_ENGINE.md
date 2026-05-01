# Session Modification Rule Engine

**Sprint:** 93
**File:** `src/lib/session-planning/sessionModificationRules.ts`

---

## Purpose

Given a session's block list and the aggregated group needs for that class, produce a set of concrete, human-readable modification suggestions a coach or director can review, approve, and apply.

All logic is deterministic. No AI API calls. No database writes.

---

## Function

```typescript
generateSessionModificationSuggestions(input: GenerateSuggestionsInput): GenerateSuggestionsResult
```

### Input

```typescript
{
  session: SessionInput        // id, group_id, template_id, session_notes
  blocks: BlockInput[]         // id, name, type, duration_min, notes
  groupNeeds: GroupNeedsResult // from getGroupNeedsForSession
  curriculumContext: CurriculumContextInput | null
}
```

### Output

```typescript
{
  suggestions: SuggestionDraft[]  // max 8
  warnings: string[]
}
```

---

## Suggestion Shape

```typescript
interface SuggestionDraft {
  suggestion_type: SuggestionType
  suggested_change: string         // plain-English coaching instruction
  reason: string                   // why this suggestion was triggered
  players_supported: string[]      // full names of players this helps
  player_needs_considered: string[]
  curriculum_context: Record<string, string>
  risk_level: 'low' | 'medium' | 'high'
  confidence: 'low' | 'medium' | 'high'
  target_block_hint: string | null // block name where adjustment should land
}
```

---

## Rules

### Rule 1 — Recovery Needs
**Trigger:** ≥ threshold players have recovery/stamina/fatigue keywords in `thingsToWorkOn` or `developmentFocus`  
**Suggestion type:** `add_recovery_requirement`  
**Change:** Add back-fence reset between rallies; cap rally length to 4–6 balls  
**Target:** First non-warm/cool game or competition block

### Rule 2 — Spacing / Footwork Needs
**Trigger:** ≥ threshold players have spacing/contact/positioning keywords  
**Suggestion type:** `add_watch_for_cue`  
**Change:** Watch for court positioning after each shot; cone at T as positioning target  
**Target:** First technical or game block (non-warm/cool)

### Rule 3 — Return / Serve Readiness
**Trigger:** ≥ (threshold − 1) players have return/receive keywords OR academy override mentions return  
**Suggestion type:** `simplify_drill`  
**Change:** Slow high-bouncing feeds before live serve; catch-and-hold after each return; emphasize split step  
**Target:** Serve/return named block, else first drill/game block

### Rule 4 — Directional Control
**Trigger:** ≥ threshold players have direction/target keywords OR academy override mentions direction  
**Suggestion type:** `add_target_zone`  
**Change:** Cones at service box corners + baseline corners; bonus points for target zones  
**Target:** Rally or game block

### Rule 5 — Mixed Curriculum Levels
**Trigger:** ≥ 2 curriculum levels in class AND ≥ 3 active players AND both advanced and developing players identifiable  
**Suggestion type:** `adjust_partner_grouping`  
**Change:** Group by level for main drill; progression partners / regression partners  
**Target:** First game block

### Rule 6 — Small Class
**Trigger:** ≤ 3 active players AND at least one game block exists  
**Suggestion type:** `adjust_scoring`  
**Change:** Canadian doubles or round-robin; play to 7; rotate server each game  
**Target:** First game block

### Rule 7 — Evidence Gap
**Trigger:** ≥ threshold players have zero recorded coach observations (`evidenceCount === 0`)  
**Suggestion type:** `add_assessment_moment`  
**Change:** 2-minute individual observation window; one strength + one area per player  
**Target:** Middle or first non-warm game block

### Rule 8 — Academy Override Constraint
**Trigger:** An academy curriculum override summary exists that hasn't already been addressed by Rules 3–4  
**Suggestion type:** `add_constraint`  
**Change:** Apply the override emphasis as a coaching cue during main drill blocks  
**Target:** null (applies broadly)

---

## Threshold

```typescript
threshold = Math.max(2, Math.floor(activePlayers.length * 0.3))
```

At least 2 players must share a need before a group-level suggestion fires.

---

## Limits

- Max 8 suggestions returned (slice at end)
- Absent players excluded from rule matching; their absence is added to warnings
- Warnings from `groupNeeds` are forwarded to the result

---

## Guardrails

- No mutations
- No AI API calls
- No fake data — all player need keywords come from real DB fields
- academy_id is never an input — caller resolves it from auth

