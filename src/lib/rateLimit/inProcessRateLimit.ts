// Sprint 403 — Rate Limiting V1
// In-process rate limiter using a Map. Server-side only.
//
// ⚠️ RELIABILITY WARNING:
// This implementation is NOT reliable in serverless environments (Vercel functions).
// Each function invocation may have an isolated memory space, so the counter can
// reset between requests. This provides:
//   - same-instance protection (helps with rapid repeated requests in development)
//   - a foundation for the DB-backed implementation (Sprint 412+)
//   - rate limit logging that enables future policy tuning
//
// For reliable production rate limiting, replace the Map store with a Supabase
// rate_limit_events table or a Redis/Upstash store.
// See docs/RATE_LIMITING_IMPLEMENTATION_NOTES.md for the full roadmap.

import type { RateLimitPolicy } from './rateLimitPolicy'
import { logWarn } from '@/lib/observability/logger'

interface RateLimitEntry {
  count: number
  windowStart: number
}

// In-process store — not shared across serverless instances
const store = new Map<string, RateLimitEntry>()

// Periodically evict stale entries to prevent unbounded memory growth.
// Only runs on the same instance that called cleanup.
function evictStale(): void {
  const now = Date.now()
  Array.from(store.keys()).forEach(key => {
    const entry = store.get(key)
    if (entry && now - entry.windowStart > 3_600_000) {
      store.delete(key)
    }
  })
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAtMs: number
  key: string
}

// Check and record a rate limit hit. Returns whether the request is allowed.
// actorKey: user ID, academy ID, or IP address depending on policy scope.
export function checkRateLimit(
  policy: RateLimitPolicy,
  actorKey: string,
  requestId?: string,
): RateLimitResult {
  const now = Date.now()
  const key = `${policy.name}:${actorKey}`

  // Evict stale entries (lightweight — O(n) of store size, run probabilistically)
  if (Math.random() < 0.05) evictStale()

  const entry = store.get(key)

  if (!entry || now - entry.windowStart >= policy.windowMs) {
    // New window
    store.set(key, { count: 1, windowStart: now })
    return {
      allowed: true,
      remaining: policy.limit - 1,
      resetAtMs: now + policy.windowMs,
      key,
    }
  }

  if (entry.count >= policy.limit) {
    logWarn(policy.logTag, {
      event: 'rate_limit_exceeded',
      action: policy.name,
      scope: policy.scope,
      actorKey,
      count: entry.count,
      limit: policy.limit,
      windowMs: policy.windowMs,
      requestId,
    })
    return {
      allowed: false,
      remaining: 0,
      resetAtMs: entry.windowStart + policy.windowMs,
      key,
    }
  }

  entry.count += 1
  store.set(key, entry)
  return {
    allowed: true,
    remaining: policy.limit - entry.count,
    resetAtMs: entry.windowStart + policy.windowMs,
    key,
  }
}

// Convenience: returns the user-facing error message for a denied request.
export function rateLimitErrorMessage(policy: RateLimitPolicy): string {
  return policy.userMessage
}
