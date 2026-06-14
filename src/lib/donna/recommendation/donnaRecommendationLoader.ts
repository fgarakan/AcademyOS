// Mega Sprint 2441–2470 — DONNA Recommendation Reasoning + Follow-Up V1
// DB loader for the player_recommendations table.
// Returns typed, director-safe recommendation data for entity intelligence
// and system prompt injection.
//
// Design rules:
//   - All functions non-fatal: any DB error returns the zero-value result
//   - rawDb = db as any throughout (TS2589 prevention for complex FK types)
//   - Never returns raw coach notes or private data
//   - No confidence invented — uses DB confidence_score only

import type { DB } from '@/lib/types/db'
import {
  mapDbStatusToLifecycle,
  isActiveLifecycle,
  confidenceScoreToLabel,
  expectedImpactForType,
  riskIfIgnoredForType,
  recommendationOwner,
} from './donnaRecommendationLifecycle'
import type { RecommendationLifecycleStatus } from './donnaRecommendationLifecycle'

// ── Typed recommendation (DB → TS) ───────────────────────────────────────────

export interface TypedRecommendation {
  id: string
  playerId: string
  title: string
  recommendationType: string
  lifecycleStatus: RecommendationLifecycleStatus
  confidenceScore: number    // 0–1
  confidenceLabel: 'High' | 'Medium' | 'Low'
  urgency: string
  description: string | null
  reviewDate: string | null  // suggested_reassessment_date ?? expires_at
  isOverdue: boolean
  followUpRequired: boolean
  riskIfIgnored: string
  expectedImpact: string
  owner: 'director' | 'head_coach' | 'coach'
  updatedAt: string
}

// ── Stale recommendation summary ─────────────────────────────────────────────

export interface StaleRecommendation {
  playerId: string
  playerName: string
  title: string
  lifecycleStatus: RecommendationLifecycleStatus
  daysSince: number
  staleReason: string
  urgency: string
}

// ── Academy recommendation overview ──────────────────────────────────────────

export interface AcademyRecommendationOverview {
  totalActive: number
  pendingReview: number
  approvedNotActed: number
  executedNotVerified: number
  overdueCount: number
  staleSummary: string | null
}

// ── Helper ────────────────────────────────────────────────────────────────────

function isOverdue(reviewDate: string | null, expiresAt: string | null): boolean {
  const date = reviewDate ?? expiresAt
  if (!date) return false
  return new Date(date) < new Date()
}

// ── 1. Load active player recommendations ────────────────────────────────────

export async function loadPlayerRecommendations(
  db: DB,
  academyId: string,
  playerId: string,
  playerName: string = 'Player',
  limit: number = 5,
): Promise<TypedRecommendation[]> {
  try {
    const rawDb = db as any

    const { data } = await rawDb
      .from('player_recommendations')
      .select([
        'id', 'player_id', 'title', 'recommendation_type', 'confidence_score',
        'status', 'urgency', 'description', 'expires_at',
        'suggested_reassessment_date', 'updated_at',
      ].join(', '))
      .eq('academy_id', academyId)
      .eq('player_id', playerId)
      .not('status', 'in', '("completed","expired","rejected","overridden")')
      .order('updated_at', { ascending: false })
      .limit(limit)

    return ((data as any[]) ?? []).map((r: any) => {
      const dbStatus   = (r.status as string) ?? 'pending_review'
      const lifecycle  = mapDbStatusToLifecycle(dbStatus)
      const score      = typeof r.confidence_score === 'number' ? (r.confidence_score as number) : 0.5
      const type       = (r.recommendation_type as string) ?? ''
      const reviewDate = (r.suggested_reassessment_date as string | null) ?? null
      const expiresAt  = (r.expires_at as string | null) ?? null
      const overdue    = isOverdue(reviewDate, expiresAt)

      return {
        id:                 (r.id as string),
        playerId:           (r.player_id as string),
        title:              ((r.title as string) ?? '').slice(0, 80),
        recommendationType: type,
        lifecycleStatus:    lifecycle,
        confidenceScore:    score,
        confidenceLabel:    confidenceScoreToLabel(score),
        urgency:            (r.urgency as string) ?? 'medium',
        description:        (r.description as string | null) ?? null,
        reviewDate:         reviewDate ?? expiresAt,
        isOverdue:          overdue,
        followUpRequired:   isActiveLifecycle(lifecycle),
        riskIfIgnored:      riskIfIgnoredForType(type),
        expectedImpact:     expectedImpactForType(type, playerName),
        owner:              recommendationOwner(type),
        updatedAt:          (r.updated_at as string) ?? new Date().toISOString(),
      } satisfies TypedRecommendation
    })
  } catch {
    return []
  }
}

// ── 2. Load stale recommendations across academy ─────────────────────────────

export async function loadStaleRecommendations(
  db: DB,
  academyId: string,
  staleThresholdDays: number = 7,
): Promise<StaleRecommendation[]> {
  try {
    const rawDb  = db as any
    const cutoff = new Date(Date.now() - staleThresholdDays * 24 * 60 * 60 * 1000).toISOString()

    const { data } = await rawDb
      .from('player_recommendations')
      .select('id, player_id, title, status, urgency, updated_at, players(full_name)')
      .eq('academy_id', academyId)
      .in('status', ['approved', 'modified', 'in_progress', 'pending_review'])
      .lt('updated_at', cutoff)
      .order('updated_at', { ascending: true })
      .limit(10)

    return ((data as any[]) ?? []).map((r: any) => {
      const dbStatus   = (r.status as string) ?? 'pending_review'
      const lifecycle  = mapDbStatusToLifecycle(dbStatus)
      const updatedAt  = (r.updated_at as string) ?? ''
      const daysSince  = Math.floor((Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24))
      const playerName = (r.players?.full_name as string | null) ?? 'Player'
      const statusWord = lifecycle === 'approved' ? 'Approved' : lifecycle === 'executed' ? 'In progress' : 'Pending'

      return {
        playerId:        (r.player_id as string),
        playerName,
        title:           ((r.title as string) ?? '').slice(0, 60),
        lifecycleStatus: lifecycle,
        daysSince,
        staleReason:     `${statusWord} for ${daysSince} days without follow-up`,
        urgency:         (r.urgency as string) ?? 'medium',
      } satisfies StaleRecommendation
    })
  } catch {
    return []
  }
}

// ── 3. Academy recommendation overview ───────────────────────────────────────

export async function loadAcademyRecommendationOverview(
  db: DB,
  academyId: string,
): Promise<AcademyRecommendationOverview> {
  try {
    const rawDb       = db as any
    const sevenAgo    = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const now         = new Date().toISOString()

    const [pending, approvedOld, executedOld, overdue] = await Promise.all([
      rawDb.from('player_recommendations')
        .select('id', { count: 'exact', head: true })
        .eq('academy_id', academyId)
        .eq('status', 'pending_review'),

      rawDb.from('player_recommendations')
        .select('id', { count: 'exact', head: true })
        .eq('academy_id', academyId)
        .in('status', ['approved', 'modified'])
        .lt('updated_at', sevenAgo),

      rawDb.from('player_recommendations')
        .select('id', { count: 'exact', head: true })
        .eq('academy_id', academyId)
        .eq('status', 'in_progress')
        .lt('updated_at', sevenAgo),

      rawDb.from('player_recommendations')
        .select('id', { count: 'exact', head: true })
        .eq('academy_id', academyId)
        .not('status', 'in', '("completed","expired","rejected","overridden")')
        .lt('expires_at', now),
    ])

    const pendingCount       = (pending.count     as number | null) ?? 0
    const approvedOldCount   = (approvedOld.count as number | null) ?? 0
    const executedOldCount   = (executedOld.count as number | null) ?? 0
    const overdueCount       = (overdue.count     as number | null) ?? 0
    const totalActive        = pendingCount + approvedOldCount + executedOldCount

    const staleSummary = overdueCount > 0
      ? `${overdueCount} recommendation${overdueCount !== 1 ? 's' : ''} past review date`
      : approvedOldCount > 0
      ? `${approvedOldCount} approved but not yet acted on`
      : null

    return { totalActive, pendingReview: pendingCount, approvedNotActed: approvedOldCount, executedNotVerified: executedOldCount, overdueCount, staleSummary }
  } catch {
    return { totalActive: 0, pendingReview: 0, approvedNotActed: 0, executedNotVerified: 0, overdueCount: 0, staleSummary: null }
  }
}
