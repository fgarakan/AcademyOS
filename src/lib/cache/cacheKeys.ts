// Sprint 405 — Safe Cache Layer + TTL Rules V1
// Cache key builders. Server-side only — never import from client components.
//
// IMPORTANT: Every cache key MUST include academy_id.
// A cache key that omits academy_id risks cross-tenant data exposure.
// See docs/cache-and-performance-principles.md for the full caching contract.
//
// NOTE: These utilities build keys for use with Next.js unstable_cache, future Redis,
// or any key-value store. They do NOT implement the caching layer itself.
// The caching layer is not yet wired (as of Sprint 405).

export type CacheKey = string

// Academy-scoped key builder — the base of all cache keys.
// Never use sub-builders without first calling buildCacheKey or scoping by academyId.
export function buildCacheKey(academyId: string, ...parts: string[]): CacheKey {
  if (!academyId) throw new Error('buildCacheKey requires a non-empty academyId')
  return ['acad', academyId, ...parts].join(':')
}

// Player-level cache keys
export const playerCacheKey = {
  profile: (academyId: string, playerId: string): CacheKey =>
    buildCacheKey(academyId, 'player', playerId, 'profile'),

  priorities: (academyId: string, playerId: string): CacheKey =>
    buildCacheKey(academyId, 'player', playerId, 'priorities'),

  developmentSummary: (academyId: string, playerId: string): CacheKey =>
    buildCacheKey(academyId, 'player', playerId, 'dev-summary'),

  list: (academyId: string): CacheKey =>
    buildCacheKey(academyId, 'players', 'list'),
}

// Session-level cache keys
export const sessionCacheKey = {
  single: (academyId: string, sessionId: string): CacheKey =>
    buildCacheKey(academyId, 'session', sessionId),

  list: (academyId: string): CacheKey =>
    buildCacheKey(academyId, 'sessions', 'list'),

  attendance: (academyId: string, sessionId: string): CacheKey =>
    buildCacheKey(academyId, 'session', sessionId, 'attendance'),
}

// Template-level cache keys
export const templateCacheKey = {
  single: (academyId: string, templateId: string): CacheKey =>
    buildCacheKey(academyId, 'template', templateId),

  list: (academyId: string): CacheKey =>
    buildCacheKey(academyId, 'templates', 'list'),
}

// Academy reference data cache keys (longer TTL — rarely changes)
export const academyCacheKey = {
  levels: (academyId: string): CacheKey =>
    buildCacheKey(academyId, 'levels'),

  groups: (academyId: string): CacheKey =>
    buildCacheKey(academyId, 'groups'),

  curriculum: (academyId: string): CacheKey =>
    buildCacheKey(academyId, 'curriculum'),

  exercises: (academyId: string): CacheKey =>
    buildCacheKey(academyId, 'exercises'),
}

// DONNA-related cache keys (short TTL — context packs change with player data)
export const donnaCacheKey = {
  playerContext: (academyId: string, playerId: string): CacheKey =>
    buildCacheKey(academyId, 'donna', 'player-context', playerId),

  kpiSummary: (academyId: string): CacheKey =>
    buildCacheKey(academyId, 'donna', 'kpi-summary'),
}
