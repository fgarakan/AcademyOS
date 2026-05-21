# Runtime Request Flow Map

**Last updated:** Sprint 402
**Audience:** Engineering
**Purpose:** Traces a request from browser through Next.js middleware, server components/actions, and into Supabase.
**Related code:** `src/middleware.ts`, `src/lib/supabase/server.ts`, `src/app/`
**Related docs:** `docs/trust-stack.md`, `docs/debuggability-standard.md`
**When to update:** When the auth architecture changes, when new server patterns are introduced.

---

## Standard Page Load (Server Component)

```mermaid
sequenceDiagram
    participant Browser
    participant Edge as Next.js Edge\n(middleware.ts)
    participant SC as Server Component\n(page.tsx)
    participant DB as Supabase\n(RLS enforced)

    Browser->>Edge: GET /director/players/[id]\n(with session cookie)
    Edge->>Edge: Check session — getSupabaseServer()
    
    alt No valid session
        Edge-->>Browser: 302 → /login
    end

    alt Session exists, wrong role
        Edge-->>Browser: 302 → /login
    end

    Edge->>SC: Request passes (session valid + role ok)
    SC->>SC: createRequestId() — for logging
    SC->>DB: SELECT players ... WHERE academy_id = $1\n(session's RLS context)
    DB-->>SC: Row(s) matching RLS policy
    SC-->>Browser: HTML (streamed)
```

---

## Mutation Flow (Server Action)

```mermaid
sequenceDiagram
    participant Browser
    participant SA as Server Action\n('use server')
    participant Auth as getSupabaseServer()
    participant DB as Supabase\n(RLS enforced)
    participant Audit as audit_logs

    Browser->>SA: Form submission / button click
    SA->>SA: createRequestId()\nlog.info('start', { sessionId, userId })
    SA->>Auth: getSupabaseServer() — reads session cookie
    Auth-->>SA: Supabase client (scoped to user session)
    SA->>DB: SELECT profiles WHERE id = user.id\n(get academy_id — never trust client input)
    DB-->>SA: profile.academy_id
    SA->>DB: SELECT academy_memberships WHERE profile_id = user.id\n(verify role)
    DB-->>SA: membership.role
    
    alt Unauthorized role
        SA-->>Browser: { ok: false, error: 'Not authorized' }
    end

    SA->>SA: Duplicate guard check\n(Sprint 401 — 15/30s window)
    
    alt Recent duplicate found
        SA-->>Browser: { ok: false, error: 'Already submitted recently' }
    end

    SA->>DB: Mutation (INSERT / UPDATE)\n(RLS re-enforces at DB level)
    SA->>Audit: INSERT audit_logs (actor, entity, before, after)
    SA->>SA: log.info('success', { draftId })\nrevalidatePath(affectedRoute)
    SA-->>Browser: { ok: true, draftId: '...' }
```

---

## API Route Flow (Voice Transcription)

```mermaid
sequenceDiagram
    participant Browser
    participant Route as API Route\n(route.ts)
    participant Whisper as OpenAI Whisper
    participant DB as Supabase

    Browser->>Route: POST /api/coach/sessions/[id]/transcribe\n(multipart/form-data, audio blob)
    Route->>Route: createRequestId('transcribe')\nlog.info('start', { size, mimeType })
    Route->>DB: Auth + academy_id + role check
    
    alt Validation failure
        Route-->>Browser: 401 / 403 / 400
    end

    Route->>Route: Validate MIME type, file size
    Route->>Whisper: Audio bytes (server-side only)\nKey never exposed to browser
    Whisper-->>Route: { text: '...' }
    Route->>DB: (best-effort) INSERT audit_logs
    Route->>Route: log.info('transcription_success', { latencyMs })
    Route-->>Browser: { ok: true, transcript: '...' }\n(NOT the audio — audio discarded)
```

---

## Supabase Auth Session Model

```mermaid
graph LR
    COOKIE["Session Cookie\n(httpOnly, secure)"] -->|"read by"| SERVER["getSupabaseServer()\n(server.ts)"]
    SERVER -->|"creates"| CLIENT["Scoped Supabase Client\n(user's RLS context)"]
    CLIENT -->|"all queries run as"| USER["Authenticated User\n(RLS policies apply)"]
    USER -->|"academy_id from"| PROFILE["profiles table\n(source of truth for academy context)"]
    PROFILE -->|"never from"| REQ["Request body / query params\n(never trusted for academy_id)"]
```
