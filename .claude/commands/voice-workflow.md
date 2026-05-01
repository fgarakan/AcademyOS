# Voice Workflow

Standard patterns for voice-first features in Academy OS.

---

## Operating model

```
Voice/AI input → Parse intent → Create proposed_actions draft → UI review → Director approves → System executes
```

Voice **never** directly mutates core data. The voice pipeline always produces a draft at `pending_review`. Execution only happens after explicit director approval.

---

## Input handling

### Preserve the raw input
Always store the original, unmodified voice or text input in `proposed_payload.raw_input`. This is the audit trail.

### Structured intent in proposed_payload
Parse the raw input into a structured object and store it alongside the raw input:

```typescript
proposed_payload: {
  draft_type: 'attendance_exception_v1',
  raw_input: "Everyone was here except Sarah. Also Jeremy showed up.",
  parsed_intent: {
    all_present_except: ['Sarah'],
    unrostered_attendees: ['Jeremy'],
    session_id: sessionId,
  }
}
```

---

## Ambiguity handling

### Ambiguous name → review item
If a name in the voice input matches multiple players or is spelled ambiguously:
- Do NOT auto-match
- Flag as `ambiguous_match` in the draft payload
- Show in director review with all possible matches
- Director selects correct match during review

### Unknown name (unrostered)
If a name does not match any rostered player for the session/group:
- Do NOT create a new player
- Do NOT add to roster
- Do NOT create billing or enrollment records
- Flag as `unrostered_attendee` or `unknown_attendee` in the draft payload
- Show as an exception item in the director review card
- Director decides what to do (ignore, manually create player later)

### Unknown/incomplete information
If the voice input is missing required information:
- Flag as `incomplete_input` in the draft
- Set `needs_clarification` hint in the payload
- Show clarification prompt in review card

---

## Attendance exception example

**Voice input:**
> "Everyone was here except Sarah. Also, this new kid Jeremy showed up."

**Expected draft behavior:**

```typescript
proposed_payload: {
  draft_type: 'attendance_exception_v1',
  raw_input: "Everyone was here except Sarah. Also, this new kid Jeremy showed up.",
  parsed_intent: {
    all_present_except: ['sarah_player_id'],    // matched to rostered player
    absent_players: ['sarah_player_id'],
    present_players: ['alice_id', 'bob_id', 'charlie_id'],  // all rostered except Sarah
    unrostered_attendees: [
      { raw_name: 'Jeremy', status: 'unrostered', action: 'director_review_required' }
    ],
  }
}
```

**What DOES NOT happen from this draft:**
- No `session_attendance` rows inserted yet
- No player record created for Jeremy
- No roster addition for Jeremy
- No enrollment or billing
- No parent communication

**What DOES happen:**
- `proposed_actions` row at `pending_review`
- Director review card shows the full parsed breakdown
- Director approves → apply action upserts `session_attendance` for rostered players only
- Jeremy's exception is noted but not acted upon automatically

---

## Never trigger from voice alone

These actions require explicit director approval — voice input alone never initiates them:

| Action | Requires |
|---|---|
| Create new player | Director manually creates player profile |
| Add player to roster | Director approves roster change |
| Create billing/enrollment record | Director approves |
| Send parent communication | Director approves and publishes |
| Apply session attendance | Director approves attendance exception draft |
| Move player to new level | Director approves level change after review |
| Publish fitness homework to parent/player | Director approves parent-safe draft |

---

## Voice pipeline tables

| Table | Purpose |
|---|---|
| `proposed_actions` | All voice/AI-created drafts pending director review |
| `audit_logs` | Record of all executed actions with actor and payload |

---

## Safety rules specific to voice features

- Raw input must always be stored — never discard
- Parsed intent must be human-readable in the review UI
- Confidence scores (if used) must be shown to the director
- Low-confidence matches must be flagged, not silently accepted
- Session, group, and player lookups must all be academy-scoped
- Never route unrecognized input directly to execution
