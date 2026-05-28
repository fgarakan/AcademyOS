# VOICE COMMAND LIFECYCLE

## The Contract

Voice never directly mutates core data.

Every voice command travels through this exact pipeline. No shortcuts. No exceptions.

```
1. VOICE INPUT
   ↓
2. TRANSCRIPT (Whisper V2 / typed V1)
   ↓
3. NORMALIZE INTENT (Claude API)
   ↓
4. CLARIFICATION? (if ambiguous → branch)
   ↓
5. STRUCTURED PAYLOAD (validated JSON)
   ↓
6. PROPOSED ACTION (stored in DB)
   ↓
7. RISK ASSESSMENT (auto-classified)
   ↓
8. REVIEW UI (human sees what will happen)
   ↓
9. APPROVAL / REJECTION / MODIFICATION (human decides)
   ↓
10. EXECUTION (execute_approved_action())
    ↓
11. AUDIT LOG (immutable record)
```

---

## Stage 1: Voice Input

**V1:** Text field labeled "Tell the OS what to build"
**V2:** Browser MediaRecorder API (real audio)

Input is saved to `voice_commands.raw_input`.

---

## Stage 2: Transcript

**V1:** `transcript = raw_input` (same text)
**V2:** Whisper API processes audio → returns text

Saved to `voice_commands.transcript`.

---

## Stage 3: Normalize Intent

Claude API call with the transcript + context snapshot.

**Input prompt includes:**
- Academy state (groups, levels, current week)
- Command transcript
- Intent taxonomy (see VOICE_INTENT_TAXONOMY.md)

**Output (normalized_intent JSONB):**
```json
{
  "intent_type": "create_session",
  "confidence": 0.92,
  "target_module": "sessions",
  "entities": {
    "group": "Orange Development",
    "date": "next Monday",
    "focus": "technical backhand",
    "intensity": "medium"
  },
  "missing_required": [],
  "ambiguous_fields": []
}
```

Low confidence (<0.7) or missing required fields → go to Stage 4.

---

## Stage 4: Clarification

If `requires_clarification = true`, system creates a `clarification_request`:

**Example:**

Command: *"Make Thursday lighter."*

Missing:
- Which group?
- Fitness only or full session?
- One-time or template change?
- How much lighter?
- Is this for matchplay prep?

System presents these as a form. User answers. Clarification responses merged back into the normalized intent. Then continues to Stage 5.

**Clarification rule:** Ask the minimum necessary. Never ask more than 5 questions. If still ambiguous, reject with explanation.

---

## Stage 5: Structured Payload

Once intent is clear and all entities are resolved, build the exact payload for the target module.

**For create_session:**
```json
{
  "group_id": "uuid-here",
  "coach_id": "uuid-here",
  "template_id": "uuid-here",
  "date": "2026-05-04",
  "duration_min": 90,
  "intensity_overrides": {
    "fitness": 2
  },
  "notes": "Lighter session — matchplay Saturday"
}
```

This is stored in `proposed_actions.proposed_payload`.

---

## Stage 6: Proposed Action Record

A `proposed_actions` row is created with:
- `status = 'pending_review'`
- `action_type` (from intent)
- `action_label` (human-readable sentence)
- `proposed_payload` (the structured payload)
- `risk_level` (auto-assigned)
- `affected_count` (how many objects will change)

The action now waits for human review.

---

## Stage 7: Risk Assessment

Risk level is auto-calculated:

| Level | Criteria |
|---|---|
| `low` | Creates new object, no modification to existing |
| `medium` | Modifies 1–5 existing objects |
| `high` | Modifies 6+ objects, touches placement, or mass-changes intensity |

High-risk actions get a warning banner in the review UI.

---

## Stage 8: Review UI

The director or head coach sees:

```
┌─────────────────────────────────┐
│ ◆ PROPOSED ACTION               │
│ Create session for Orange Dev.  │
│ Monday May 4 • 90 min           │
│                                 │
│ Template: Green Technical Block │
│ Coach: Marco Santos             │
│ Intensity: Fitness ↓ (lighter)  │
│                                 │
│ Affects: 8 players              │
│ Risk: LOW                       │
│                                 │
│ [APPROVE] [EDIT] [REJECT]       │
└─────────────────────────────────┘
```

The review UI always shows:
1. Action description (natural language)
2. Affected objects
3. Risk level and notes
4. Any warnings
5. Approve / Edit / Reject buttons

---

## Stage 9: Approval

**Approve:** Status → `approved`. Proceeds to Stage 10.

**Edit:** Director modifies payload. Status → `modified`. Modified payload stored separately. Proceeds to Stage 10.

**Reject:** Status → `rejected`. Rejection reason stored. Pipeline ends. Audit log written.

---

## Stage 10: Execution

`execute_approved_action(action_id, executor_id)` is called.

The function:
1. Validates status (must be approved/modified)
2. Validates expiry (24-hour window)
3. Routes to correct handler by action_type
4. Creates/modifies objects
5. Writes execution log
6. Writes audit log
7. Returns result

---

## Stage 11: Audit Log

Every executed action writes an immutable `audit_logs` record with:
- Actor (who approved)
- Action type
- Target object
- Payload (what changed)
- Source type: `voice`
- Voice command ID (traceable back to original input)

---

## Failure Handling

At any stage, failure writes to:
- `voice_commands.processing_status = 'failed'`
- `action_execution_logs.status = 'failed'`
- `audit_logs` (with error payload)

Users see: "Something went wrong. The action was not executed. No data was changed."
