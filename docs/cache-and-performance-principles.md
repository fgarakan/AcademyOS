# Cache and Performance Principles

> Part of the Trust Stack — see `trust-stack.md` for the root doctrine.

This document defines the caching and performance principles for AcademyOS. It governs how data may be cached, when caches must be invalidated, and the performance boundaries that must not be crossed without a deliberate architectural decision.

---

## Core Principle

Caching is a trust surface. Stale cached data shown to the wrong user is a data integrity failure, not just a UX bug. Every caching decision must answer: "If this cache is stale, what is the worst case for a user seeing the wrong data?"

If the answer involves showing another academy's data, showing unapproved AI content as approved, or showing a player's private summary to an unauthorized viewer — the cache is not acceptable.

---

## Current State (as of Sprint 400)

The only cache invalidation mechanism in the codebase is `revalidatePath()`. There is no:
- `unstable_cache` or `next/cache` TTL caching
- Redis or in-memory cache
- Client-side SWR or React Query cache
- Edge caching on any route

All data fetches are currently server-rendered on every request. This is correct for the current scale. It is the baseline from which caching decisions are made going forward.

---

## Caching Tier Model

When caching is introduced, it must follow this tier model:

### Tier 0 — No Cache (Always Fresh)

Use for: anything that changes on every user action and where staleness causes incorrect behavior.

| Data | Why no cache |
|---|---|
| `proposed_actions` status | Director approvals must be immediately visible |
| `player.is_active` | Activation state gates enrollment |
| Voice session state | Realtime — no cache appropriate |
| Audit logs | Append-only; cache would hide recent entries |
| Guardian contact info | Sensitive; changes must be immediately visible |

### Tier 1 — Short-Lived Cache (30–120 seconds TTL)

Use for: data that changes infrequently within a session but where a short staleness window is acceptable.

| Data | Suggested TTL | Invalidation trigger |
|---|---|---|
| Player profile (coaching view) | 60s | `revalidatePath` on any player update |
| Player priorities list | 60s | `revalidatePath` on priority update |
| Session list for a coach | 60s | `revalidatePath` on session create/update |

### Tier 2 — Medium-Lived Cache (5–30 minutes TTL)

Use for: relatively stable reference data that is expensive to recompute.

| Data | Suggested TTL | Invalidation trigger |
|---|---|---|
| Academy levels list | 15 min | `revalidatePath` on level change |
| Template list | 15 min | `revalidatePath` on template publish/archive |
| Exercise library | 30 min | `revalidatePath` on exercise update |
| KPI summaries (non-player-specific) | 10 min | `revalidatePath` on session finalization |

### Tier 3 — Long-Lived Cache (Hours or Build-time)

Use for: static or near-static data that almost never changes.

| Data | Suggested TTL | Invalidation trigger |
|---|---|---|
| Academy branding config | Build-time ISR | On config change |
| Static curriculum content | Build-time | On content publish |

---

## `revalidatePath` Usage Rules

`revalidatePath` is the current primary invalidation mechanism. Use it consistently:

- Call `revalidatePath` in every Server Action that mutates data shown in the UI.
- Revalidate the most specific path possible — avoid revalidating the entire `/director` tree when only one player changed.
- Revalidate from the server action, not from client code.
- Do not rely on `revalidatePath` alone for correctness — the underlying data must be scoped correctly by `academy_id` and RLS regardless of cache state.

```ts
// Correct — specific path
revalidatePath(`/director/players/${playerId}`)

// Less ideal but acceptable when multiple views change
revalidatePath('/director/players')

// Avoid — too broad
revalidatePath('/director')
```

---

## Multi-Tenancy Cache Safety

No cache may ever serve data from Academy A to a user authenticated as Academy B. This constraint applies to every caching layer.

When implementing any cache:
1. The cache key must include `academy_id`.
2. The cache key must include the user's role if the cached data differs by role.
3. The cache must not be shared across academy contexts.
4. When in doubt, do not cache — serve fresh.

```ts
// Safe cache key pattern
const cacheKey = `player-profile:${academyId}:${playerId}`

// Unsafe — missing academy scope
const cacheKey = `player-profile:${playerId}` // could cross tenants
```

---

## Query Performance Principles

### Avoid `select('*')`

`select('*')` fetches all columns, including large text fields, JSONB blobs, and columns the UI never uses. Always select only the columns needed for the specific view.

Current state: 54 instances of `select('*')` identified in Sprint 400 audit. These are the highest-priority query optimization targets.

```ts
// Preferred
.select('id, full_name, current_level_id, is_active')

// Avoid
.select('*')
```

### Paginate Large Result Sets

Any query that may return more than 20 rows must include `.range()` or `.limit()`. Unbounded queries are both a performance risk and a cost risk when AI services process the results.

```ts
// Required for any potentially large result set
.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
```

### No N+1 Queries in Loops

Never query inside a map or forEach. Fetch all required data in one query with a join, or batch the IDs and do a single `in` query.

```ts
// Bad — N+1
const enriched = await Promise.all(players.map(p =>
  db.from('academy_levels').select('label').eq('id', p.current_level_id).single()
))

// Good — single join
const players = await db
  .from('players')
  .select('id, full_name, academy_levels(label)')
  .eq('academy_id', academyId)
```

### Sequential over Parallel for RLS-sensitive Queries

For queries where one result gates the next (e.g., fetch player, then check academy membership, then fetch priorities), use sequential awaits. Do not use `Promise.all` for RLS-sensitive multi-table reads, as parallel execution can expose race conditions in RLS policy evaluation.

---

## AI Cost and Performance Boundaries

DONNA intelligence requests are the most expensive operations in the system. Performance rules for AI paths:

1. Never call an AI service synchronously on a page render.
2. Always call AI services from Server Actions, not from Server Components.
3. Always validate that the input is non-empty before making an AI call.
4. Always set a timeout on AI API calls. Current suggested timeouts:
   - Anthropic structuring: 30 seconds
   - OpenAI Whisper transcription: 60 seconds (audio files can be large)
   - OpenAI Realtime: session-duration managed separately
5. AI calls must not block the return of a user-visible response — use streaming or background jobs for long operations.

---

## What Comes Next

The following performance improvements are planned but not yet implemented:

| Improvement | Sprint target |
|---|---|
| Replace all `select('*')` with specific column lists | Sprint 402 |
| Add `unstable_cache` for academy levels and template lists | Sprint 403 |
| Add pagination to all player and session list views | Sprint 402 |
| Add per-academy AI call budget enforcement | Sprint 403 |
| Add background job queue for DONNA structuring | Sprint 404 |

Until these are implemented, the system operates on the safe baseline: no cache, fresh data on every render, sequential queries.
