# Data Model and Evidence Map

**Last updated:** Sprint 402
**Audience:** Engineering, data
**Purpose:** Shows the core data objects, how they relate, and how evidence flows from sessions into player profiles.
**Related code:** `src/lib/supabase/database.types.ts`, `supabase/migrations/`
**Related docs:** `docs/data-classification.md`, `docs/permissions-matrix.md`
**When to update:** When a new core table is added, when evidence graph relationships change.

---

## Core Entity Relationships

```mermaid
erDiagram
    ACADEMIES {
        uuid id PK
        text name
        uuid owner_id
    }

    PROFILES {
        uuid id PK
        uuid academy_id FK
        text display_name
        text role
    }

    ACADEMY_LEVELS {
        uuid id PK
        uuid academy_id FK
        text label
        int sort_order
    }

    PLAYERS {
        uuid id PK
        uuid academy_id FK
        text full_name
        uuid current_level_id FK
        bool is_active
    }

    PLAYER_PRIORITIES {
        uuid id PK
        uuid player_id FK
        uuid academy_id FK
        text title
        text category
        int priority_rank
        text urgency
        text status
    }

    PLAYER_DEVELOPMENT_SUMMARY {
        uuid id PK
        uuid player_id FK
        uuid academy_id FK
        bool show_to_student
        bool show_to_parent
        text source
        text student_friendly_summary
        text parent_summary
        jsonb things_to_work_on
        jsonb current_strengths
    }

    GUARDIANS {
        uuid id PK
        uuid academy_id FK
        uuid profile_id FK
        text first_name
        text last_name
        text email
    }

    PLAYER_GUARDIANS {
        uuid player_id FK
        uuid guardian_id FK
        bool is_primary
    }

    SESSIONS {
        uuid id PK
        uuid academy_id FK
        uuid group_id FK
        uuid coach_id FK
        date session_date
        text status
    }

    VOICE_NOTES {
        uuid id PK
        uuid academy_id FK
        uuid session_id FK
        uuid player_id FK
        text raw_input
        text processing_status
    }

    PROPOSED_ACTIONS {
        uuid id PK
        uuid academy_id FK
        uuid proposed_by_id FK
        uuid voice_command_id FK
        text action_type
        text status
        jsonb proposed_payload
        text risk_level
        uuid approved_by_id FK
    }

    AUDIT_LOGS {
        uuid id PK
        uuid academy_id FK
        uuid actor_id FK
        text entity_type
        uuid entity_id
        text action
        jsonb payload_before
        jsonb payload_after
        text source
    }

    ACADEMIES ||--o{ PLAYERS : "has"
    ACADEMIES ||--o{ ACADEMY_LEVELS : "has"
    ACADEMIES ||--o{ SESSIONS : "runs"
    PLAYERS ||--o{ PLAYER_PRIORITIES : "has"
    PLAYERS ||--o{ PLAYER_DEVELOPMENT_SUMMARY : "has"
    PLAYERS ||--o{ PLAYER_GUARDIANS : "linked via"
    GUARDIANS ||--o{ PLAYER_GUARDIANS : "linked via"
    PLAYERS }o--|| ACADEMY_LEVELS : "placed at"
    SESSIONS ||--o{ VOICE_NOTES : "captures"
    VOICE_NOTES ||--o{ PROPOSED_ACTIONS : "originates"
    PROPOSED_ACTIONS ||--o{ AUDIT_LOGS : "recorded in"
```

---

## Evidence Flow Into Player Profile

```mermaid
graph LR
    subgraph EVIDENCE_SOURCES["Evidence Sources"]
        SN["Session Notes\n(voice_notes)"]
        SA["Session Actuals\n(session_blocks)"]
        AT["Attendance\n(session_attendance)"]
        AS["Assessments\n(assessments)"]
        QC["Quick Captures\n(voice_notes)"]
    end

    subgraph DONNA_LAYER["DONNA Structuring Layer"]
        DS["Structuring Engine\n(rule-based + AI)"]
        DP["proposed_actions\n(pending_review)"]
    end

    subgraph DIRECTOR_APPROVAL["Director Approval"]
        DR["Review + Approve"]
        EX["execute_approved_action()"]
    end

    subgraph PLAYER_PROFILE["Player Profile"]
        PP["player_priorities"]
        PD["player_development_summary"]
        PN["player_notes"]
    end

    SN & SA & AT & AS & QC --> DS
    DS --> DP --> DR --> EX
    EX --> PP & PD & PN
    PP & PD --> DISPLAY["Player Portal\n(if visibility flags set)"]
    PP & PD --> PARENT["Parent Portal\n(if show_to_parent=true)"]
```

---

## Multi-Tenancy Data Model

Every core table includes `academy_id`. This guarantees:
- No query returns cross-academy rows (enforced by RLS)
- DONNA context packs are scoped to one academy
- Evidence cannot flow between academies
- Audit logs are queryable per academy without cross-tenant exposure

The `academy_id` column is `NOT NULL` on all multi-tenant tables.
