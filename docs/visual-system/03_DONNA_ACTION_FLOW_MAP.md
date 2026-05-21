# DONNA Action Flow Map

**Last updated:** Sprint 402
**Audience:** Engineering, product
**Purpose:** Traces a DONNA action from voice/text input through to a database write — every step, every gate.
**Related code:** `src/lib/donna/`, `src/app/coach/sessions/[sessionId]/structureCoachRecapAction.ts`, `src/app/api/coach/sessions/[sessionId]/transcribe/route.ts`
**Related docs:** `docs/donna-trust-modes.md`, `docs/ai-action-safety.md`, `docs/ai-development-rules.md`
**When to update:** When DONNA's action types change, when a new voice pipeline step is added, or when the approval flow changes.

---

## Full DONNA Action Flow

```mermaid
sequenceDiagram
    actor Coach
    participant UI as Coach UI
    participant API as API Route / Server Action
    participant Whisper as OpenAI Whisper
    participant Claude as Anthropic Claude
    participant DB as Supabase DB (RLS)
    participant Director
    participant ExecFn as execute_approved_action()
    participant Audit as audit_logs

    Coach->>UI: Speaks or types recap/observation
    UI->>API: POST audio or text (authenticated request)
    
    note over API: Auth check<br/>Academy context check<br/>Role check<br/>requestId created

    alt Voice input
        API->>Whisper: Audio bytes (server-side only)
        Whisper-->>API: Transcript text
        API->>DB: INSERT voice_transcripts
    end

    API->>Claude: Transcript + coaching context<br/>(no L3 PII, no raw secrets)
    Claude-->>API: Structured draft JSON
    
    note over API: Validate output schema<br/>Validate action_type registered<br/>Check for duplicates

    API->>DB: INSERT proposed_actions<br/>(status=pending_review, source=donna)
    DB-->>API: proposed_action.id
    API-->>UI: Draft created — awaiting review

    note over Director: Sees pending item in Approval Center
    Director->>UI: Reviews draft + transcript
    Director->>API: POST approve (Server Action)
    
    note over API: requireRole(Director or HC)<br/>actor_id from server session only

    API->>DB: UPDATE proposed_actions SET status=approved,<br/>approved_by=director.profile_id
    API->>ExecFn: CALL execute_approved_action(proposal_id, actor_id)
    
    note over ExecFn: Validates: status=approved<br/>Validates: action_type registered<br/>Validates: academy_id matches<br/>Writes target table<br/>Writes audit_logs<br/>Sets status=executed

    ExecFn->>DB: Mutation (e.g. UPDATE player_priorities)
    ExecFn->>Audit: INSERT audit_logs (actor, before, after, source=donna)
    ExecFn-->>API: OK
    API-->>UI: Applied — player profile updated
```

---

## DONNA Trust Modes

```mermaid
graph TD
    MODE1["Mode 1: Listening\n(Transcription only)\nWrites: voice_sessions, voice_transcripts\nNo approval needed"]
    MODE2["Mode 2: Structuring\n(Note drafting)\nWrites: proposed_actions, voice_notes\nApproval required"]
    MODE3["Mode 3: Intelligence\n(Priority + planning)\nWrites: multiple proposed_actions\nApproval required per action"]

    VOICE["Voice Input"] --> MODE1 --> MODE2 --> MODE3
    MODE1 -->|"Whisper only"| T["Transcript stored"]
    MODE2 -->|"+ Anthropic"| D["Draft proposed_action\nstatus=pending_review"]
    MODE3 -->|"+ Anthropic + KPI context"| M["Multiple proposals\neach independently approvable"]
```

---

## DONNA Write Surface (Hard Limits)

```mermaid
graph LR
    DONNA["DONNA"] -->|"MAY write"| W1["proposed_actions\n(status=pending_review)"]
    DONNA -->|"MAY write"| W2["voice_sessions\nvoice_transcripts\nvoice_notes"]
    DONNA -->|"NEVER writes"| N1["players"]
    DONNA -->|"NEVER writes"| N2["player_priorities"]
    DONNA -->|"NEVER writes"| N3["player_development_summary"]
    DONNA -->|"NEVER writes"| N4["sessions / session_blocks"]
    DONNA -->|"NEVER writes"| N5["guardians / player_guardians"]
    DONNA -->|"NEVER writes"| N6["audit_logs\n(system writes on DONNA's behalf)"]
```

---

## Registered Action Types

| Action type | Effect when executed | Min approver role |
|---|---|---|
| `update_player_note` | Writes to `player_notes` | Head Coach |
| `update_player_priority` | Updates `player_priorities` | Head Coach |
| `create_session_recap` | Creates `session_notes` | Head Coach |
| `propose_session_plan` | Stages session draft | Head Coach |
| `update_development_summary` | Writes to `player_development_summary` | Director |
| `adjust_player_level` | Updates `players.current_level_id` | Director |
| `flag_player_for_review` | Sets a flag on player profile | Head Coach |

Unknown action types at execution time → rejected, logged, not executed.
