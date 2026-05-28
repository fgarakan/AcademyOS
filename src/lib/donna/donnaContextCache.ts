// Sprint 915.1 — DONNA Low-Latency Context Cache V1
// Lightweight in-process cache for stable, non-sensitive DONNA context.
// Reduces repeated DB queries for data that changes infrequently.
//
// Design rules:
//   - Cache is per-academy, per-user — never cross-academy
//   - Cache failure always falls back to DB reads (never throws)
//   - TTLs are conservative (5 minutes default, 1 minute for volatile)
//   - No parent/player-sensitive raw content cached broadly
//   - No security decisions based on cached data alone — only stable metadata
//   - Module-level singleton — resets on server restart
//   - Client-side: sessionStorage via optional adapter (not implemented in V1)

// ── TTL constants ──────────────────────────────────────────────────────────────

export const CACHE_TTL_MS = {
  ACADEMY_PROFILE:         5 * 60 * 1000,   // 5 min — rarely changes
  PERMISSION_MATRIX:       5 * 60 * 1000,   // 5 min
  CURRICULUM_SUMMARIES:    3 * 60 * 1000,   // 3 min — can change with drafts
  GROUP_SUMMARIES:         3 * 60 * 1000,   // 3 min
  PLAYER_SUMMARY_METADATA: 2 * 60 * 1000,   // 2 min — can change with sessions
  ALLOWED_ACTIONS:         5 * 60 * 1000,   // 5 min — action registry is static
  RECENT_RECOMMENDATIONS:  1 * 60 * 1000,   // 1 min — changes frequently
} as const

// ── Cache entry type ───────────────────────────────────────────────────────────

interface CacheEntry<T> {
  data: T
  cachedAt: number
  ttl: number
  academyId: string
  cacheKey: string
}

// ── In-process cache store ────────────────────────────────────────────────────
// Module-level Map — safe for server-side use (one process, one Map).
// Each key: `{academyId}:{cacheKey}`

const CACHE = new Map<string, CacheEntry<unknown>>()

// ── Core helpers ──────────────────────────────────────────────────────────────

function makeKey(academyId: string, cacheKey: string): string {
  return `${academyId}:${cacheKey}`
}

export function cacheGet<T>(academyId: string, cacheKey: string): T | null {
  const key = makeKey(academyId, cacheKey)
  const entry = CACHE.get(key) as CacheEntry<T> | undefined
  if (!entry) return null
  if (Date.now() - entry.cachedAt > entry.ttl) {
    CACHE.delete(key)
    return null
  }
  return entry.data
}

export function cacheSet<T>(
  academyId: string,
  cacheKey: string,
  data: T,
  ttl: number,
): void {
  const key = makeKey(academyId, cacheKey)
  CACHE.set(key, { data, cachedAt: Date.now(), ttl, academyId, cacheKey })
}

export function cacheInvalidate(academyId: string, cacheKey?: string): void {
  if (cacheKey) {
    CACHE.delete(makeKey(academyId, cacheKey))
    return
  }
  // Invalidate all entries for this academy
  const toDelete: string[] = []
  CACHE.forEach((entry, key) => {
    if (entry.academyId === academyId) toDelete.push(key)
  })
  toDelete.forEach(k => CACHE.delete(k))
}

export function cacheSize(): number {
  return CACHE.size
}

// ── Cache keys (stable constants) ─────────────────────────────────────────────

export const CACHE_KEYS = {
  ACADEMY_PROFILE:         'academy_profile',
  PERMISSION_MATRIX:       'permission_matrix',
  CURRICULUM_SUMMARIES:    'curriculum_summaries',
  GROUP_SUMMARIES:         'group_summaries',
  PLAYER_SUMMARY_METADATA: 'player_summary_metadata',
  ALLOWED_ACTIONS:         'allowed_actions',
  RECENT_RECOMMENDATIONS:  'recent_recommendations',
} as const

// ── Cached context builder ────────────────────────────────────────────────────

/**
 * Generic cached fetch: tries cache first, falls back to fetchFn.
 * Never throws — falls back to fetchFn even if cache read fails.
 */
export async function cachedFetch<T>(
  academyId: string,
  cacheKey: string,
  ttl: number,
  fetchFn: () => Promise<T | null>,
): Promise<T | null> {
  const cached = cacheGet<T>(academyId, cacheKey)
  if (cached !== null) return cached

  try {
    const fresh = await fetchFn()
    if (fresh !== null) cacheSet(academyId, cacheKey, fresh, ttl)
    return fresh
  } catch {
    return null  // always falls back gracefully
  }
}

// ── Invalidation on write events ──────────────────────────────────────────────

/**
 * Called when a curriculum draft is created — invalidates curriculum summaries.
 * Never throws.
 */
export function onCurriculumDraftCreated(academyId: string): void {
  cacheInvalidate(academyId, CACHE_KEYS.CURRICULUM_SUMMARIES)
}

/**
 * Called when a recommendation is logged — invalidates recommendations.
 * Never throws.
 */
export function onRecommendationLogged(academyId: string): void {
  cacheInvalidate(academyId, CACHE_KEYS.RECENT_RECOMMENDATIONS)
}
