# DONNA Low-Latency Context Cache
**Sprint:** 915.1 | **Date:** 2026-05-28

---

## Purpose

Reduce repeated DB queries during DONNA context packet assembly by caching stable,
non-sensitive context data with conservative TTLs. Cache failure always falls back
to DB reads — it is never a hard dependency.

---

## Implementation

### Module
`src/lib/donna/donnaContextCache.ts`

Module-level in-process `Map` — one instance per Next.js server process. Resets on restart.

### Design Rules
- Cache is keyed by `{academyId}:{cacheKey}` — never cross-academy
- Cache failure falls back to DB reads (never throws)
- TTLs are conservative — volatile data cached 1–2 min, stable data 3–5 min
- No parent/player sensitive raw content cached broadly
- No security decisions based on cached data alone
- Invalidation is explicit: write events call cache invalidation helpers

### TTL Table

| Data | TTL | Rationale |
|---|---|---|
| Academy profile | 5 min | Rarely changes mid-session |
| Permission matrix | 5 min | Static within a session |
| Curriculum summaries | 3 min | Can change when draft is created |
| Group summaries | 3 min | Can change with session updates |
| Player summary metadata | 2 min | Can change with session wrap-up |
| Allowed actions | 5 min | Action registry is static |
| Recent recommendations | 1 min | Changes frequently |

---

## Wiring

### Context Packet Builder (Sprint 915.1)
`donnaContextPacketBuilder.ts` wraps `getEntitySummary()` with `cachedFetch()`:
- Cache key: `entity_summary:{entityType}:{entityId}` (academy-scoped via `cachedFetch` prefix)
- TTL: `CACHE_TTL_MS.PLAYER_SUMMARY_METADATA` (2 min)
- Fallback: DB read on cache miss or cache error

### Recommendation Feedback (Sprint 915.1)
`donnaRecommendationFeedback.ts` calls `onRecommendationLogged(academyId)` after
successful recommendation creation — invalidates `recent_recommendations` cache key.

---

## Public API

```typescript
cacheGet<T>(academyId, cacheKey): T | null
cacheSet<T>(academyId, cacheKey, data, ttl): void
cacheInvalidate(academyId, cacheKey?): void
cachedFetch<T>(academyId, cacheKey, ttl, fetchFn): Promise<T | null>
cacheSize(): number

// Invalidation helpers
onCurriculumDraftCreated(academyId): void
onRecommendationLogged(academyId): void
```

---

## Safety Boundaries

| Rule | Status |
|---|---|
| Cache never used for security decisions (RLS, role checks) | ✅ |
| Cross-academy isolation: `{academyId}:` prefix on every key | ✅ |
| Cache failure falls back to DB read | ✅ |
| No sensitive parent/player raw content cached | ✅ |
| Stale cache never used past TTL | ✅ |
| Invalidation called on relevant write events | ✅ |

---

## V2 Scope (not in 915.1)
- Redis / distributed cache for multi-instance deployments
- Client-side sessionStorage adapter
- Cache hit/miss metrics
- Full context packet caching (not just entity summaries)
