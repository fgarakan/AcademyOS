# Executive Product Map

**Last updated:** Sprint 402
**Audience:** Product managers, new engineers, stakeholders
**Purpose:** Shows the full AcademyOS product ecosystem in one view — who uses it, what they do, and how DONNA connects them.
**Related code:** `src/app/director/`, `src/app/coach/`, `src/app/player/`, `src/app/parent/`
**Related docs:** `docs/trust-stack.md`, `docs/permissions-matrix.md`
**When to update:** When a new portal, major feature, or role is added to the product.

---

## Full Product Ecosystem

```mermaid
graph TB
    subgraph ACADEMY["🏫 Academy OS — Single Academy Tenant"]
        subgraph DIRECTOR["Director OS"]
            DC["Command Center\n(pending approvals, flags, briefs)"]
            AC["Approval Center\n(DONNA drafts, notes, summaries)"]
            CC["Curriculum Center\n(levels, requirements, overrides)"]
            TB["Template Builder\n(session templates)"]
            SM["Staff Management\n(roles, invites)"]
            GM["Groups / Programs\n(enrollment, scheduling)"]
        end

        subgraph COACH["Coach OS"]
            CW["Coach Workspace\n(today's sessions, plan)"]
            SE["Session Execution\n(live block tracking)"]
            RC["Recap Assistant\n(DONNA-guided wrap-up)"]
            QC["Quick Capture\n(text / voice note)"]
        end

        subgraph PLAYER["Player Portal"]
            PP["Development Profile\n(level, priorities, evidence)"]
            PM["Mission Map\n(level-up requirements)"]
            PH["Session History"]
        end

        subgraph PARENT["Parent Portal"]
            PR["Progress Report\n(parent-safe summaries)"]
            PA["Attendance View"]
            PU["Updates Feed"]
        end

        subgraph DONNA["DONNA AI Layer"]
            DI["Voice / Text Input"]
            DT["Transcription\n(Whisper)"]
            DS["Structuring\n(Anthropic Claude)"]
            DP["Proposed Actions\n(pending_review)"]
            DR["Review Queue"]
        end

        subgraph DB["Supabase Database (RLS-protected)"]
            PLAYERS["players"]
            SESSIONS["sessions"]
            PRIORITIES["player_priorities"]
            SUMMARIES["player_development_summary"]
            PA_TABLE["proposed_actions"]
            AUDIT["audit_logs"]
        end
    end

    DI --> DT --> DS --> DP --> DR
    DR --> AC
    AC -->|"Director approves"| PA_TABLE
    PA_TABLE -->|"execute_approved_action()"| PLAYERS & PRIORITIES & SUMMARIES
    PLAYERS & SESSIONS & PRIORITIES --> AUDIT

    CW --> SE --> RC --> DI
    QC --> DI
    DC --> AC

    PLAYERS --> PP & PR
    PRIORITIES --> PP
    SUMMARIES -->|"show_to_student=true"| PP
    SUMMARIES -->|"show_to_parent=true"| PR

    CC --> TB --> GM --> SE
```

---

## Operating Model Summary

```mermaid
flowchart LR
    A["Coach captures\nobservation"] -->|"voice / text"| B["DONNA structures\ndraft"]
    B -->|"proposed_action\npending_review"| C["Director reviews\nin Approval Center"]
    C -->|"approves"| D["System applies\nexecute_approved_action()"]
    D --> E["Audit log records\nchange + actor"]
    E --> F["Player profile\nupdated"]
    F -->|"if visibility flag set"| G["Parent sees\nparent-safe summary"]
    F -->|"if visibility flag set"| H["Player sees\ndevelopment profile"]
```

---

## Key Invariants

- No AI output reaches a core data table without human approval.
- No parent or player sees data without explicit `show_to_parent` / `show_to_student` flags.
- Every mutation is traceable to an actor via `audit_logs`.
- DONNA never approves its own proposals.
- All academies are isolated by `academy_id`; no cross-tenant data leaks.
