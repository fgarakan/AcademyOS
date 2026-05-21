# AcademyOS Permissions Matrix

> Part of the Trust Stack — see `trust-stack.md` for the root doctrine.

This document maps every role to the data surfaces and operations they can access. It is the authoritative reference for access control decisions during development. RLS policies, server actions, and middleware route guards must all be consistent with this matrix.

---

## Role Definitions

| Role slug | Auth claim | Description |
|---|---|---|
| `academy_director` | `app_metadata.role = 'academy_director'` | Full administrative access within their academy |
| `head_coach` | `app_metadata.role = 'head_coach'` | Coaching operations + limited approvals |
| `coach` | `app_metadata.role = 'coach'` | Session delivery and player notes |
| `player` | `app_metadata.role = 'player'` | Own profile read, session history |
| `parent` | `app_metadata.role = 'parent'` | Linked player profile read, communications |
| `(service role)` | Supabase service role key | Infrastructure only — never user-facing |

All roles are scoped to a single `academy_id`. Cross-academy access does not exist at the application layer.

---

## Route Access Matrix

| Route prefix | Director | Head Coach | Coach | Player | Parent |
|---|---|---|---|---|---|
| `/director/*` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `/coach/*` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `/player/*` | ✅ (as admin) | ❌ | ❌ | ✅ | ❌ |
| `/parent/*` | ✅ (as admin) | ❌ | ❌ | ❌ | ✅ |
| `/dev/*` | Dev env only | Dev env only | ❌ | ❌ | ❌ |
| `/login`, `/auth/*` | Public | Public | Public | Public | Public |

Route guards are enforced in `src/middleware.ts`. Route-level role checks are a second enforcement layer — they do not replace RLS.

---

## Data Access Matrix

### `players` table

| Operation | Director | Head Coach | Coach | Player | Parent |
|---|---|---|---|---|---|
| SELECT own academy | ✅ | ✅ | ✅ | own row only | linked player only |
| INSERT | ✅ | ✅ | ❌ | ❌ | ❌ |
| UPDATE | ✅ | ✅ | limited (notes only) | ❌ | ❌ |
| DELETE | ✅ | ❌ | ❌ | ❌ | ❌ |

### `academy_levels` table

| Operation | Director | Head Coach | Coach | Player | Parent |
|---|---|---|---|---|---|
| SELECT own academy | ✅ | ✅ | ✅ | ✅ | ✅ |
| INSERT / UPDATE / DELETE | ✅ | ❌ | ❌ | ❌ | ❌ |

### `player_priorities` table

| Operation | Director | Head Coach | Coach | Player | Parent |
|---|---|---|---|---|---|
| SELECT | ✅ | ✅ | ✅ | own only | linked player only |
| INSERT / UPDATE | ✅ | ✅ | ❌ | ❌ | ❌ |
| DELETE | ✅ | ❌ | ❌ | ❌ | ❌ |

### `player_development_summary` table

| Operation | Director | Head Coach | Coach | Player | Parent |
|---|---|---|---|---|---|
| SELECT (show_to_student=true) | ✅ | ✅ | ✅ | ✅ | ❌ |
| SELECT (show_to_parent=true) | ✅ | ✅ | ✅ | ❌ | ✅ |
| SELECT (full record) | ✅ | ✅ | ❌ | ❌ | ❌ |
| INSERT / UPDATE | ✅ | ✅ | ❌ | ❌ | ❌ |

The `show_to_student` and `show_to_parent` flags are enforced in RLS policies. Application-layer filtering is defense-in-depth only.

### `proposed_actions` table

| Operation | Director | Head Coach | Coach | Player | Parent |
|---|---|---|---|---|---|
| SELECT own academy | ✅ | ✅ | own-authored only | ❌ | ❌ |
| INSERT (draft) | ✅ | ✅ | ✅ | ❌ | ❌ |
| UPDATE status → approved | ✅ | ✅ | ❌ | ❌ | ❌ |
| UPDATE status → rejected | ✅ | ✅ | ❌ | ❌ | ❌ |
| DELETE | ✅ | ❌ | ❌ | ❌ | ❌ |

### `audit_logs` table

| Operation | Director | Head Coach | Coach | Player | Parent |
|---|---|---|---|---|---|
| SELECT own academy | ✅ | ✅ (filtered) | ❌ | ❌ | ❌ |
| INSERT | System only | System only | System only | System only | System only |
| UPDATE / DELETE | ❌ | ❌ | ❌ | ❌ | ❌ |

`audit_logs` is append-only. No role — including Director — may update or delete rows.

### `sessions` / `session_blocks` / `session_attendance` tables

| Operation | Director | Head Coach | Coach | Player | Parent |
|---|---|---|---|---|---|
| SELECT | ✅ | ✅ | own sessions | own sessions only | linked player's sessions |
| INSERT | ✅ | ✅ | ✅ | ❌ | ❌ |
| UPDATE | ✅ | ✅ | own sessions | ❌ | ❌ |
| DELETE | ✅ | ❌ | ❌ | ❌ | ❌ |

### `templates` / `template_blocks` tables

| Operation | Director | Head Coach | Coach | Player | Parent |
|---|---|---|---|---|---|
| SELECT | ✅ | ✅ | ✅ | ❌ | ❌ |
| INSERT / UPDATE | ✅ | ✅ | ❌ | ❌ | ❌ |
| Publish (status → active) | ✅ | ✅ | ❌ | ❌ | ❌ |
| DELETE | ✅ | ❌ | ❌ | ❌ | ❌ |

### `guardians` / `player_guardians` tables

| Operation | Director | Head Coach | Coach | Player | Parent |
|---|---|---|---|---|---|
| SELECT | ✅ | ✅ | linked player's guardian | ❌ | own row only |
| INSERT / UPDATE | ✅ | ❌ | ❌ | ❌ | ❌ |

### `voice_sessions` / `voice_transcripts` / `voice_notes` tables

| Operation | Director | Head Coach | Coach | Player | Parent |
|---|---|---|---|---|---|
| SELECT | ✅ | ✅ | own voice sessions | ❌ | ❌ |
| INSERT | ✅ | ✅ | ✅ | ❌ | ❌ |
| DELETE | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## DONNA-Specific Access Rules

DONNA operates as the authenticated coach/director who initiated the voice session. DONNA's writes go exclusively to:
- `proposed_actions` (INSERT only, status = 'pending_review')
- `voice_sessions`, `voice_transcripts`, `voice_notes` (INSERT only during active session)

DONNA never receives or uses service role credentials. DONNA cannot approve its own proposed actions.

See `donna-trust-modes.md` for full DONNA permission surface.

---

## Service Role Usage Rules

The Supabase service role key bypasses all RLS. Its use is restricted to:

| Use case | Location | Justification |
|---|---|---|
| Database seed scripts | `scripts/` directory | Dev/demo data population |
| Dev validation scripts | `scripts/validate-*.ts` | Checking seed data state |
| Supabase Edge Functions | `supabase/functions/` | Background jobs with explicit scope |
| `supabase gen types` | CI/CD only | Type regeneration, no data access |

Service role key must never appear in:
- Next.js route handlers or server actions
- Any file that could be bundled by Next.js
- Client-side code of any kind
- `.env.local.example` without explicit redaction note

---

## Enforcement Layers

1. **RLS policies** (PostgreSQL) — hard enforcement; cannot be bypassed from application code
2. **Middleware** (`src/middleware.ts`) — route-level role check before rendering
3. **Server Action guards** — `requireRole(session, 'academy_director')` pattern before mutation
4. **Client-side UI hiding** — informational only; never a security boundary

If layers 2–4 are absent, layer 1 still protects. If layer 1 is absent, the system is broken regardless of layers 2–4.

---

## Multi-Tenancy Guarantee

Every query in the application layer must include `.eq('academy_id', academyId)`. This is enforced by RLS as a backstop, but application-layer `academy_id` scoping is required to prevent:
- Accidental cross-academy data exposure in aggregation queries
- Timing attacks that exploit RLS caching edge cases
- Log confusion when multiple academies share a deployment

A query that selects from a multi-tenant table without an `academy_id` filter is a bug, not a pattern to imitate.

---

## When This Matrix Changes

This matrix is updated when:
- A new table is added (add all roles × operations rows)
- A new role is added (add a column to all affected tables)
- An access decision changes (update the relevant row and the RLS policy in lockstep)

Never update the matrix without updating the corresponding RLS policies in the migration files. They must stay in sync.
