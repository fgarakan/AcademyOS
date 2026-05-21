# Cache TTL Implementation Notes

> Sprint 405 — Safe Cache Layer + TTL Rules V1
> See also: `docs/cache-and-performance-principles.md`, `docs/CACHE_INVALIDATION_MAP.md`

---

## What Was Created in Sprint 405

Two new utility files:

### `src/lib/cache/cacheKeys.ts`
Provides academy-scoped cache key builders. Every key includes `academy_id` as the first scope component.

**Exports:**
- `buildCacheKey(academyId, ...parts)` — base key builder
- `playerCacheKey.*` — player profile, priorities, development summary, list
- `sessionCacheKey.*` — single session, list, attendance
- `templateCacheKey.*` — single template, list
- `academyCacheKey.*` — levels, groups, curriculum, exercises
- `donnaCacheKey.*` — player context, KPI summary

### `src/lib/cache/ttlPolicy.ts`
Defines TTL constants and a policy table.

**Exports:**
- `TTL_NEVER` (0s), `TTL_SHORT` (60s), `TTL_MEDIUM` (900s), `TTL_LONG` (1800s), `TTL_VERY_LONG` (86400s)
- `TTL_POLICIES` — typed map of data type → TTL duration
- `NO_CACHE_ZONES` — list of data that must never be cached

---

## Cache Key Safety Rule

Every cache key MUST include `academy_id`:

```ts
// ✅ Safe
const key = playerCacheKey.profile(academyId, playerId)
// → "acad:uuid-academy:player:uuid-player:profile"

// ❌ Unsafe — cross-tenant risk
const key = `player:${playerId}:profile`
```

A cache miss is preferable to a cross-tenant cache hit. When in doubt, do not cache.

---

## TTL Matrix

| Data type | TTL | Reason |
|---|---|---|
| `proposed_actions.status` | Never | Approval state must be live |
| `player.is_active` | Never | Activation gates enrollment |
| `voice_sessions` | Never | Realtime state |
| `audit_logs` | Never | Append-only; cache hides recent entries |
| `guardians.email / phone` | Never | L3 PII — never cache |
| `player_development_summary` (visibility flags) | Never | show_to_parent/student must be real-time |
| `player profile` | 60s | Changes on coach action → revalidatePath |
| `player priorities` | 60s | Changes on director approval |
| `player development summary` (content) | 60s | Changes on director approval |
| `session list` | 60s | Changes on coach action |
| `academy levels` | 15 min | Rarely changes |
| `template list` | 15 min | Published state changes infrequently |
| `exercise library` | 15 min | Stable reference data |
| `group list` | 15 min | Enrollment changes infrequently |
| `KPI summary` | 15 min | Expensive to compute; acceptable to be slightly stale |
| `DONNA player context` | 15 min | Recomputed on player profile change |
| `global curriculum` | 30 min | Authoritative data; override layer tracks changes |
| `academy branding` | 30 min | Very rarely changes |
| `static curriculum content` | 24 hr | Build-time ISR candidate |

---

## No-Cache Zones (Non-Negotiable)

These data types must never be cached, regardless of performance pressure:

1. **`proposed_actions.status`** — Director must always see the live approval state
2. **`player.is_active`** — Player activation status gates all enrollment operations
3. **`voice_sessions` (live state)** — Realtime by definition
4. **`audit_logs`** — Append-only; caching hides recent entries
5. **`guardians.email / phone`** — L3 PII; caching risk is too high
6. **`player_development_summary` visibility flags** — `show_to_parent` and `show_to_student` control data exposure; must be real-time
7. **`academy_memberships` (role checks)** — Role verification must never use stale data

---

## What Is Not Yet Wired (as of Sprint 405)

The cache key and TTL utilities are defined but not yet connected to any actual caching layer. The codebase currently uses `revalidatePath()` only.

**Next steps to wire caching:**

1. Use `unstable_cache` from Next.js for server component data fetching:
   ```ts
   import { unstable_cache } from 'next/cache'
   const cachedGetPlayerProfile = unstable_cache(
     async (academyId, playerId) => fetchPlayerProfile(academyId, playerId),
     [playerCacheKey.profile(academyId, playerId)],
     { revalidate: TTL_POLICIES.playerProfile }
   )
   ```

2. Call corresponding revalidation helpers on mutation (from `src/lib/cache/revalidation.ts`).

3. Add `revalidateTag` support for finer-grained invalidation once tag-based caching is tested.

---

## Multi-Tenancy Cache Safety

The key builder enforces academy scoping at the key-construction level. However, the consuming code must also enforce RLS at the DB level — a cache key is not a substitute for RLS.

If a cache is populated with data fetched under one session and served under another, the cache key scoping alone prevents cross-tenant keys, but the underlying data must have been fetched under the correct session context.
