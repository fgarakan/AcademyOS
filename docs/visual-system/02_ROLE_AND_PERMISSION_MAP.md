# Role and Permission Map

**Last updated:** Sprint 402
**Audience:** Engineering, security review
**Purpose:** Shows role hierarchy, route access, and where access is enforced.
**Related code:** `src/middleware.ts`, `src/lib/supabase/`, Supabase RLS policies
**Related docs:** `docs/permissions-matrix.md`, `docs/trust-stack.md`
**When to update:** When a new role is added, a new route is created, or RLS policies change.

---

## Role Hierarchy

```mermaid
graph TD
    SR["Service Role\n(scripts / cron only)"]
    AD["academy_director\n/director routes"]
    HC["head_coach\n/coach routes"]
    CO["coach\n/coach routes"]
    PL["player\n/player routes"]
    PA["parent\n/parent routes"]

    SR -->|"bypasses RLS\ndev/cron only"| AD
    AD -->|"can view as"| HC
    AD -->|"can view as"| CO
    AD -->|"can view as"| PL
    AD -->|"can view as"| PA
    HC --> CO
```

---

## Route → Role Access

```mermaid
graph LR
    subgraph ROUTES["Route Prefixes"]
        R1["/director/*"]
        R2["/coach/*"]
        R3["/player/*"]
        R4["/parent/*"]
        R5["/dev/* (NODE_ENV≠production)"]
        R6["/login, /auth/*"]
    end

    subgraph ROLES["Allowed Roles"]
        A1["academy_director only"]
        A2["academy_director\nhead_coach, coach"]
        A3["player (own only)"]
        A4["parent (linked player)"]
        A5["dev env only"]
        A6["Public"]
    end

    R1 --> A1
    R2 --> A2
    R3 --> A3
    R4 --> A4
    R5 --> A5
    R6 --> A6
```

---

## Enforcement Layers (in order)

```mermaid
flowchart TD
    REQ["Incoming Request"] --> MW["Layer 1: Middleware\nsrc/middleware.ts\nRole check → redirect if unauthorized"]
    MW --> SA["Layer 2: Server Action / Route Handler\nrequireRole() check\nbefore any mutation"]
    SA --> RLS["Layer 3: Supabase RLS\nPostgreSQL row-level security\nhard enforcement — cannot be bypassed\nfrom application code"]
    RLS --> DB["Database row returned\nor write allowed"]

    MW -->|"no session → redirect /login"| LOGIN["/login"]
    SA -->|"wrong role → return error"| ERR["Error response\n(no data returned)"]
    RLS -->|"policy violation → empty result"| EMPTY["Empty result\nor permission error"]
```

---

## Data Visibility by Role

```mermaid
graph TB
    subgraph PLAYER_DATA["Player Data Visibility"]
        PD1["players.full_name"] -->|"Director, HC, Coach: YES\nPlayer: own only\nParent: linked only"| V1[" "]
        PD2["player_development_summary\n(staff version)"] -->|"Director, HC: YES\nCoach, Player, Parent: NO"| V2[" "]
        PD3["player_development_summary\n(show_to_student=true)"] -->|"Player: YES\nParent: NO"| V3[" "]
        PD4["player_development_summary\n(show_to_parent=true)"] -->|"Parent: YES\nPlayer: NO"| V4[" "]
        PD5["proposed_actions"] -->|"Director, HC: YES\nCoach: own-authored\nPlayer, Parent: NEVER"| V5[" "]
        PD6["audit_logs"] -->|"Director, HC (filtered): YES\nAll others: NEVER"| V6[" "]
    end
```

---

## Key Access Rules

1. RLS is the hard enforcement layer — application-layer checks are defense-in-depth only.
2. Service role key never appears in Next.js route handlers or server actions.
3. All multi-tenant queries must include `.eq('academy_id', academyId)`.
4. Approval actions (`proposed_actions.status → approved`) require Director or Head Coach role, verified server-side.
5. `execute_approved_action()` validates actor role before executing — the function itself is the final gate.
