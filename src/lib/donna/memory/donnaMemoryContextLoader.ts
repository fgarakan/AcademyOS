// Sprint 2261–2290 — DONNA Memory Activation V1
// Tiers 2, 3, 4 loaders + full memory context assembly.
//
// Tier 2: Decision Memory   — queries proposed_actions for recent director decisions
// Tier 3: Entity Memory     — queries player signals, blueprint, recommendations
// Tier 4: Academy Memory    — queries academy settings + approval patterns
//
// Design rules:
//   - All functions non-fatal: DB errors return null (never throw)
//   - No raw notes or player names in memory context
//   - All queries use rawDb pattern (tables not in generated types)
//   - All queries are read-only — no mutations

import type { DB } from '@/lib/types/db'
import type {
  DecisionMemoryContext,
  DecisionEntry,
  EntityMemoryContext,
  AcademyMemoryContext,
  MemoryContextPacket,
} from './donnaMemoryContextTypes'
import {
  loadPriorSessionSummaries,
} from './donnaCrossSessionMemory'

// ── Helpers ───────────────────────────────────────────────────────────────────

function relativeDate(isoDate: string | null): string {
  if (!isoDate) return 'recently'
  const d = new Date(isoDate)
  if (isNaN(d.getTime())) return 'recently'
  const diffMs = Date.now() - d.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'today'
  if (diffDays === 1) return 'yesterday'
  if (diffDays <= 7) return `${diffDays} days ago`
  if (diffDays <= 14) return 'last week'
  if (diffDays <= 30) return 'this month'
  return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) !== 1 ? 's' : ''} ago`
}

function targetAreaFromModule(targetModule: string): string {
  const m = (targetModule ?? '').toLowerCase()
  if (m.includes('curriculum')) return 'curriculum'
  if (m.includes('player') || m.includes('placement') || m.includes('promot') || m.includes('advanc')) return 'player'
  if (m.includes('coach')) return 'coach'
  if (m.includes('session') || m.includes('template')) return 'sessions'
  if (m.includes('parent')) return 'parent communications'
  return 'general'
}

// ── Tier 2: Decision Memory ───────────────────────────────────────────────────

export async function loadDecisionMemoryContext(
  db: DB,
  academyId: string,
): Promise<DecisionMemoryContext | null> {
  try {
    const rawDb = db as any
    const { data, error } = await rawDb
      .from('proposed_actions')
      .select('action_label, target_module, status, approved_at, rejected_at, updated_at')
      .eq('academy_id', academyId)
      .in('status', ['approved', 'executed', 'rejected', 'modified', 'expired'])
      .order('updated_at', { ascending: false })
      .limit(10)

    if (error || !data) return null

    const rows = (data as any[])
    if (rows.length === 0) return null

    const entries: DecisionEntry[] = rows.slice(0, 5).map(row => {
      const status: string = row.status
      let outcome: DecisionEntry['outcome'] = 'approved'
      if (status === 'rejected') outcome = 'rejected'
      else if (status === 'modified') outcome = 'modified'
      else if (status === 'expired') outcome = 'expired'

      const dateStr: string | null = row.approved_at ?? row.rejected_at ?? row.updated_at ?? null
      return {
        date:       relativeDate(dateStr),
        action:     ((row.action_label as string) ?? '').slice(0, 80),
        outcome,
        targetArea: targetAreaFromModule(row.target_module as string),
      }
    })

    const approvedCount = rows.filter(r => r.status === 'approved' || r.status === 'executed' || r.status === 'modified').length
    const approvalRate = rows.length > 0 ? approvedCount / rows.length : 0

    // Find dominant area from full result set
    const areaCounts: Record<string, number> = {}
    for (const row of rows) {
      const area = targetAreaFromModule(row.target_module as string)
      areaCounts[area] = (areaCounts[area] ?? 0) + 1
    }
    const dominantArea = Object.entries(areaCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ?? null

    return { recentDecisions: entries, approvalRate, dominantArea }
  } catch {
    return null
  }
}

// ── Tier 3: Entity Memory ─────────────────────────────────────────────────────

export async function loadEntityMemoryContext(
  db: DB,
  academyId: string,
  playerId: string,
): Promise<EntityMemoryContext | null> {
  try {
    const rawDb = db as any

    // 1. Player name + current level
    const { data: player } = await rawDb
      .from('players')
      .select('full_name, current_curriculum_level_name, player_status')
      .eq('id', playerId)
      .eq('academy_id', academyId)
      .single()

    if (!player) return null
    const entityLabel = (player.full_name as string) ?? 'Player'

    // 2. Entity summary (operating kind)
    const { data: entitySummary } = await rawDb
      .from('donna_entity_summaries')
      .select('summary_text')
      .eq('academy_id', academyId)
      .eq('entity_type', 'player')
      .eq('entity_id', playerId)
      .eq('summary_kind', 'operating')
      .maybeSingle()

    // 3. Active blueprint priorities (top 2)
    const { data: blueprint } = await rawDb
      .from('player_development_blueprints')
      .select('skill_priorities, donna_brief')
      .eq('academy_id', academyId)
      .eq('player_id', playerId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    let activePriorities: string[] = []
    if (blueprint?.skill_priorities) {
      const prioArray = Array.isArray(blueprint.skill_priorities)
        ? (blueprint.skill_priorities as any[])
        : []
      activePriorities = prioArray
        .slice(0, 2)
        .map(p => typeof p.label === 'string' ? p.label : '')
        .filter(Boolean)
    }

    // 4. Recent signals (last 3, high/critical severity)
    const { data: signals } = await rawDb
      .from('player_development_signals')
      .select('signal_type, severity')
      .eq('academy_id', academyId)
      .eq('player_id', playerId)
      .in('severity', ['critical', 'high', 'medium'])
      .order('created_at', { ascending: false })
      .limit(3)

    const recentSignals: string[] = ((signals as any[]) ?? []).map(s => {
      const type = ((s.signal_type as string) ?? '').replace(/_/g, ' ')
      const sev = s.severity as string
      return `${type} (${sev})`
    })

    // 5. Active recommendations (immediate/urgent)
    const { data: recs } = await rawDb
      .from('player_recommendations')
      .select('title, urgency')
      .eq('academy_id', academyId)
      .eq('player_id', playerId)
      .in('urgency', ['immediate', 'urgent', 'high'])
      .order('created_at', { ascending: false })
      .limit(3)

    const activeRecommendations: string[] = ((recs as any[]) ?? []).map(r =>
      ((r.title as string) ?? '').slice(0, 60),
    ).filter(Boolean)

    // 6. Recent decisions about this player
    const { data: decisions } = await rawDb
      .from('proposed_actions')
      .select('action_label, status, approved_at')
      .eq('academy_id', academyId)
      .eq('target_object_id', playerId)
      .in('status', ['approved', 'executed', 'modified', 'rejected'])
      .order('updated_at', { ascending: false })
      .limit(3)

    const recentDecisions: string[] = ((decisions as any[]) ?? []).map(d => {
      const label = ((d.action_label as string) ?? '').slice(0, 60)
      const status = d.status as string
      return `${label} (${status})`
    }).filter(Boolean)

    // 7. When was this player last discussed in a DONNA conversation
    const { data: lastMsg } = await rawDb
      .from('donna_conversation_messages')
      .select('created_at')
      .eq('academy_id', academyId)
      .eq('entity_id', playerId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const lastDiscussedAt = lastMsg?.created_at
      ? relativeDate(lastMsg.created_at as string)
      : null

    // 8. Operating summary — prefer entity_summary, fall back to donna_brief
    const operatingSummary: string | null =
      (entitySummary?.summary_text as string | null) ??
      (blueprint?.donna_brief as string | null) ??
      null

    return {
      entityType:          'player',
      entityLabel,
      operatingSummary:    operatingSummary ? operatingSummary.slice(0, 200) : null,
      activePriorities,
      recentSignals,
      activeRecommendations,
      recentDecisions,
      lastDiscussedAt,
    }
  } catch {
    return null
  }
}

// ── Tier 4: Academy Memory ────────────────────────────────────────────────────

export async function loadAcademyMemoryContext(
  db: DB,
  academyId: string,
): Promise<AcademyMemoryContext | null> {
  try {
    const rawDb = db as any

    // Academy name + settings (decision patterns stored in settings JSONB)
    const { data: academy } = await rawDb
      .from('academies')
      .select('name, settings')
      .eq('id', academyId)
      .single()

    if (!academy) return null
    const academyName = (academy.name as string | null) ?? null

    // Count recent decisions (last 90 days)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
    const { data: recentActions } = await rawDb
      .from('proposed_actions')
      .select('status, target_module')
      .eq('academy_id', academyId)
      .gte('created_at', ninetyDaysAgo)
      .in('status', ['approved', 'executed', 'modified', 'rejected', 'expired'])
      .limit(100)

    const actionRows = (recentActions as any[]) ?? []
    const totalApprovedDecisions = actionRows.filter(r =>
      r.status === 'approved' || r.status === 'executed' || r.status === 'modified',
    ).length

    const totalDecisions = actionRows.length
    const approvalRatePercent = totalDecisions > 0
      ? Math.round((totalApprovedDecisions / totalDecisions) * 100)
      : 0

    // Dominant decision area in last 90 days
    const areaCounts: Record<string, number> = {}
    for (const row of actionRows) {
      const area = targetAreaFromModule(row.target_module as string)
      areaCounts[area] = (areaCounts[area] ?? 0) + 1
    }
    const sortedAreas = Object.entries(areaCounts).sort(([, a], [, b]) => b - a)
    const dominantArea = sortedAreas[0]?.[0] ?? null

    // Decision pattern from academy settings (if philosophy layer has run)
    const settings = (academy.settings as Record<string, unknown> | null) ?? {}
    const decisionPatterns = settings.donna_decision_patterns
    let dominantDecisionPattern: string | null = null
    if (Array.isArray(decisionPatterns) && decisionPatterns.length > 0) {
      const topPattern = (decisionPatterns as any[])[0]
      if (typeof topPattern?.decisionArea === 'string' && typeof topPattern?.outcome === 'string') {
        dominantDecisionPattern = `Most common: ${(topPattern.decisionArea as string).replace(/_/g, ' ')} decisions (${topPattern.outcome})`
      }
    } else if (dominantArea && totalDecisions > 0) {
      // Fallback: synthesize from raw data
      dominantDecisionPattern = `Focus area: ${dominantArea} (${approvalRatePercent}% approval rate on ${totalDecisions} decisions)`
    }

    // Evolution summary — count curriculum vs. player decisions
    const curriculumCount = actionRows.filter(r =>
      targetAreaFromModule(r.target_module as string) === 'curriculum',
    ).length
    const playerCount = actionRows.filter(r =>
      targetAreaFromModule(r.target_module as string) === 'player',
    ).length

    let recentEvolutionSummary: string | null = null
    if (totalDecisions > 0) {
      if (curriculumCount > playerCount && curriculumCount >= 3) {
        recentEvolutionSummary = `Curriculum-active phase — ${curriculumCount} curriculum decisions in 90 days`
      } else if (playerCount > curriculumCount && playerCount >= 3) {
        recentEvolutionSummary = `Player-development phase — ${playerCount} player decisions in 90 days`
      } else if (totalDecisions >= 5) {
        recentEvolutionSummary = `Active operations — ${totalDecisions} decisions across ${sortedAreas.slice(0, 2).map(([a]) => a).join(' and ')} in 90 days`
      }
    }

    // Identity narrative: prefer academy DNA if set
    const dnaSettings = settings.academy_dna as Record<string, unknown> | null
    let identityNarrative: string | null = null
    if (typeof dnaSettings?.philosophy_summary === 'string' && dnaSettings.philosophy_summary) {
      identityNarrative = (dnaSettings.philosophy_summary as string).slice(0, 150)
    } else if (dominantArea && totalDecisions >= 3) {
      identityNarrative = `${academyName ?? 'This academy'} has been primarily focused on ${dominantArea} this quarter.`
    }

    return {
      academyName,
      identityNarrative,
      dominantDecisionPattern,
      recentEvolutionSummary,
      totalApprovedDecisions,
      approvalRatePercent,
    }
  } catch {
    return null
  }
}

// ── Full memory context assembly ──────────────────────────────────────────────

export interface LoadMemoryOptions {
  userId: string
  academyId: string
  playerId?: string | null
  isFirstSessionOfDay: boolean
  includeDecisionMemory?: boolean
}

/**
 * Loads all applicable memory tiers for the current director session.
 * Non-fatal: individual tier failures return null for that tier.
 * Tier 1 is always loaded.
 * Tier 2 is loaded when isFirstSessionOfDay or includeDecisionMemory.
 * Tier 3 is loaded when playerId is provided.
 * Tier 4 is loaded when isFirstSessionOfDay.
 */
export async function loadAllMemoryTiers(
  db: DB,
  options: LoadMemoryOptions,
): Promise<MemoryContextPacket> {
  const {
    userId,
    academyId,
    playerId,
    isFirstSessionOfDay,
    includeDecisionMemory = false,
  } = options

  // Run applicable tiers in parallel
  const [tier1, tier2, tier3, tier4] = await Promise.all([
    // Tier 1: always
    loadPriorSessionSummaries(db, userId, academyId).catch(() => ({ sessions: [], mostRecentAt: null })),

    // Tier 2: first session of day or explicit request
    (isFirstSessionOfDay || includeDecisionMemory)
      ? loadDecisionMemoryContext(db, academyId).catch(() => null)
      : Promise.resolve(null),

    // Tier 3: entity-specific — only when playerId provided
    playerId
      ? loadEntityMemoryContext(db, academyId, playerId).catch(() => null)
      : Promise.resolve(null),

    // Tier 4: first session of day only (most expensive, most contextual)
    isFirstSessionOfDay
      ? loadAcademyMemoryContext(db, academyId).catch(() => null)
      : Promise.resolve(null),
  ])

  return {
    priorSessionContext:   tier1.sessions.length > 0 ? tier1 : null,
    decisionMemoryContext: tier2,
    entityMemoryContext:   tier3,
    academyMemoryContext:  tier4,
  }
}
