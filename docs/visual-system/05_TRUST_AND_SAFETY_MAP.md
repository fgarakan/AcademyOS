# Trust and Safety Map

**Last updated:** Sprint 402
**Audience:** Engineering, compliance, security review
**Purpose:** Shows how the Trust Stack enforces safety at every layer — from AI input to database write.
**Related code:** `src/middleware.ts`, `src/lib/idempotency/`, `src/lib/observability/`, Supabase RLS
**Related docs:** `docs/trust-stack.md`, `docs/ai-action-safety.md`, `docs/permissions-matrix.md`
**When to update:** When a new enforcement layer is added, when RLS policies change substantially, when DONNA's surface changes.

---

## The Seven-Layer Trust Stack

```mermaid
graph TB
    L7["Layer 7: Logs Explain\naudit_logs append-only\nAI call metadata\nstructured server-side logs\n(requestId, actor, entity, action)"]
    L6["Layer 6: Safe Defaults\ndeny if role missing\ndeny if academy_id missing\ndeny if action_type unknown\nfail closed, never open"]
    L5["Layer 5: Permissions Constrain\nRLS — hard enforcement\nmiddleware — route guard\nserver action role check — defense-in-depth\nno client-side-only security"]
    L4["Layer 4: Audit Log Records\nappend-only mutations\nactor_id, entity, before/after, source\nsame transaction as mutation"]
    L3["Layer 3: System Applies\nexecute_approved_action() ONLY\nvalidates: status=approved, actor role, academy_id\nidempotent — second call rejected if already executed"]
    L2["Layer 2: Human Approves\nDirector or Head Coach\nserver-side session — actor_id never client-supplied\nno auto-approval code paths"]
    L1["Layer 1: AI Proposes\nDONNA writes proposed_actions only\nnever writes core data tables\noutput validated before INSERT"]

    L1 --> L2 --> L3 --> L4 --> L5 --> L6 --> L7
```

---

## Trust Stack Violation Detection

```mermaid
flowchart TD
    CHECK["Is there a code path that..."] --> V1["Lets DONNA write to players,\npriorities, sessions directly?"]
    CHECK --> V2["Sets proposed_actions.status=approved\nwithout a human actor?"]
    CHECK --> V3["Calls execute_approved_action\nbefore status=approved?"]
    CHECK --> V4["Skips an audit_logs write\nafter a mutation?"]
    CHECK --> V5["Creates a table without RLS?"]
    CHECK --> V6["Omits academy_id on a\nmulti-tenant query?"]
    CHECK --> V7["Returns 200/null on auth failure\ninstead of redirect/error?"]

    V1 & V2 & V3 & V4 & V5 & V6 & V7 --> BUG["🚨 Trust Stack Violation\nFile as CRITICAL bug\nDo not ship workaround"]
```

---

## Request Lifecycle Safety Gates

```mermaid
sequenceDiagram
    participant Browser
    participant Middleware
    participant ServerAction as Server Action
    participant RLS as Supabase RLS
    participant AuditLog as audit_logs

    Browser->>Middleware: Request (with session cookie)
    
    alt No session
        Middleware-->>Browser: Redirect /login
    end

    alt Wrong role for route
        Middleware-->>Browser: Redirect /login
    end

    Middleware->>ServerAction: Request passes
    
    alt Actor role insufficient for mutation
        ServerAction-->>Browser: { error: 'Not authorized' }
    end

    alt academy_id missing or mismatched
        ServerAction-->>Browser: { error: 'Academy context unavailable' }
    end

    ServerAction->>RLS: DB query (scoped to academy_id + role)
    
    alt RLS policy violation
        RLS-->>ServerAction: Empty result or error
        ServerAction-->>Browser: { error: 'Not found or access denied' }
    end

    RLS-->>ServerAction: Data returned / write permitted
    ServerAction->>AuditLog: INSERT audit_logs (same transaction)
    ServerAction-->>Browser: Success response
```

---

## Safe Default Decision Tree

```mermaid
flowchart TD
    Q1{"Can the system\ndetermine the correct\naccess decision?"}
    Q1 -->|"No"| DENY["DENY — safe default\nReturn error or redirect"]
    Q1 -->|"Yes"| Q2{"Does the actor\nhave the required role?"}
    Q2 -->|"No"| DENY
    Q2 -->|"Yes"| Q3{"Is the academy_id\npresent and matched?"}
    Q3 -->|"No"| DENY
    Q3 -->|"Yes"| Q4{"Does the RLS policy\npermit the operation?"}
    Q4 -->|"No"| DENY
    Q4 -->|"Yes"| ALLOW["ALLOW — proceed\nLog the operation"]
```
