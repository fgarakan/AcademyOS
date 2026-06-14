// Mega Sprint 2411–2440 — DONNA Entity Intelligence V1
// Unified entity context loader for all entity types beyond players.
// Provides EntityMemoryContext for coaches, parents, curriculum levels,
// groups, templates, and the academy as a whole.
//
// Design rules:
//   - All functions non-fatal: any DB error returns null
//   - rawDb = db as any pattern throughout (TS2589 prevention)
//   - No raw notes, no private data in any output
//   - healthScore: 0–10 computed from available signals
//   - entityRoute: navigation target where available
//   - loadEntityContextFromPhrase() is the orchestrator entry point

import type { DB } from '@/lib/types/db'
import type { EntityMemoryContext } from './donnaMemoryContextTypes'
import {
  loadCoachesSummary,
  loadGroupsSummary,
  loadTemplatesSummary,
  loadCurriculumLevelsSummary,
  loadPlayerCurriculumStates,
} from '@/lib/donna/extendedContextLoaders'

// ── Helpers ───────────────────────────────────────────────────────────────────

function relativeDate(isoDate: string | null): string {
  if (!isoDate) return 'recently'
  const d = new Date(isoDate)
  if (isNaN(d.getTime())) return 'recently'
  const diffMs   = Date.now() - d.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0)  return 'today'
  if (diffDays === 1)  return 'yesterday'
  if (diffDays <= 7)   return `${diffDays} days ago`
  if (diffDays <= 14)  return 'last week'
  if (diffDays <= 30)  return 'this month'
  return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) !== 1 ? 's' : ''} ago`
}

// ── Name match helper ─────────────────────────────────────────────────────────

interface NamedItem { id: string; name: string; firstName?: string; lastName?: string }

function findBestNameMatch(phrase: string, items: NamedItem[]): NamedItem | null {
  const lower = phrase.toLowerCase().trim()
  for (const item of items) {
    if (lower.includes(item.name.toLowerCase())) return item
  }
  for (const item of items) {
    const first = (item.firstName ?? item.name.split(' ')[0] ?? '').toLowerCase()
    if (first.length > 2 && lower.includes(first)) return item
  }
  for (const item of items) {
    const last = (item.lastName ?? item.name.split(' ').pop() ?? '').toLowerCase()
    if (last.length > 2 && lower.includes(last)) return item
  }
  return null
}

// ── Health score helpers ──────────────────────────────────────────────────────

function coachHealthScore(sessionCount: number, pendingRecaps: number): number {
  let score = 7
  if (sessionCount > 10) score += 1
  if (pendingRecaps === 0) score += 1
  else if (pendingRecaps > 3) score -= 2
  else if (pendingRecaps > 1) score -= 1
  return Math.max(0, Math.min(10, score))
}

function playerHealthScore(status: string, advancementEligible: boolean, daysAtLevel: number | null): number {
  if (status === 'active' && advancementEligible) return 9
  if (status === 'on_hold') return 3
  if (status === 'reassessment_due') return 5
  if (status === 'placement_in_progress') return 6
  if (status === 'active' && daysAtLevel !== null && daysAtLevel > 180) return 5
  return 7
}

function levelHealthScore(total: number, stalled: number, eligible: number): number {
  if (total === 0) return 5
  const stallRate = stalled / total
  let score = 7
  if (stallRate > 0.5) score -= 3
  else if (stallRate > 0.25) score -= 1
  if (eligible / total > 0.3) score += 1
  if (total < 3) score -= 1
  return Math.max(0, Math.min(10, score))
}

// ── 0. Player Entity Context ──────────────────────────────────────────────────
// Server-side loader: used when the director asks about a player by name from a
// non-player-profile page (e.g., Today page). On player profile pages, entity
// context is loaded client-side via memory tier 3 and passed in the action input.

export async function loadPlayerEntityContext(
  db: DB,
  academyId: string,
  playerId: string,
): Promise<EntityMemoryContext | null> {
  try {
    const rawDb = db as any

    const { data: player } = await rawDb
      .from('players')
      .select('full_name, player_status')
      .eq('id', playerId)
      .eq('academy_id', academyId)
      .maybeSingle()

    if (!player) return null
    const entityLabel  = (player.full_name as string | null) ?? 'Player'
    const playerStatus = (player.player_status as string | null) ?? 'unknown'

    // Curriculum state — join curriculum_levels for display name
    const { data: state } = await rawDb
      .from('player_curriculum_states')
      .select('advancement_eligible, enrolled_at, curriculum_levels(display_name)')
      .eq('player_id', playerId)
      .eq('academy_id', academyId)
      .maybeSingle()

    const levelName          = (state?.curriculum_levels?.display_name as string | null) ?? null
    const advancementEligible = (state?.advancement_eligible as boolean | null) ?? false
    const enrolledAt          = (state?.enrolled_at as string | null) ?? null

    const daysAtLevel = enrolledAt
      ? Math.floor((Date.now() - new Date(enrolledAt).getTime()) / (1000 * 60 * 60 * 24))
      : null

    // Entity summary (optional — graceful fallback)
    const { data: entitySummary } = await rawDb
      .from('donna_entity_summaries')
      .select('summary_text')
      .eq('academy_id', academyId)
      .eq('entity_type', 'player')
      .eq('entity_id', playerId)
      .eq('summary_kind', 'operating')
      .maybeSingle()

    // Recent proposed_actions for this player
    const { data: decisions } = await rawDb
      .from('proposed_actions')
      .select('action_label, status')
      .eq('academy_id', academyId)
      .eq('target_object_id', playerId)
      .order('updated_at', { ascending: false })
      .limit(3)

    const recentDecisions: string[] = ((decisions as any[]) ?? [])
      .map((d: any) => `${((d.action_label as string) ?? '').slice(0, 60)} (${d.status as string})`)
      .filter(Boolean)

    const recentSignals: string[] = []
    if (playerStatus === 'on_hold') recentSignals.push('Player on hold (high)')
    if (playerStatus === 'reassessment_due') recentSignals.push('Reassessment due (medium)')
    if (advancementEligible) recentSignals.push('Advancement eligible (medium)')
    if (daysAtLevel !== null && daysAtLevel > 180 && !advancementEligible) {
      recentSignals.push(`Stalled ${daysAtLevel} days at current level (high)`)
    }

    const activePriorities: string[] = []
    if (levelName) activePriorities.push(`Current level: ${levelName}`)
    if (advancementEligible) activePriorities.push('Ready to advance')
    if (playerStatus !== 'active') activePriorities.push(`Status: ${playerStatus.replace(/_/g, ' ')}`)

    const operatingSummary = (entitySummary?.summary_text as string | null)
      ?? `${entityLabel}. Status: ${playerStatus.replace(/_/g, ' ')}.${levelName ? ` Current level: ${levelName}.` : ''}${advancementEligible ? ' Advancement eligible.' : ''}`

    return {
      entityType:            'player',
      entityLabel,
      operatingSummary:      operatingSummary.slice(0, 200),
      activePriorities:      activePriorities.slice(0, 3),
      recentSignals,
      activeRecommendations: [
        ...(advancementEligible ? [`Review advancement for ${entityLabel}`] : []),
        ...(playerStatus === 'on_hold' ? [`Investigate on-hold status for ${entityLabel}`] : []),
      ].slice(0, 3),
      recentDecisions,
      lastDiscussedAt: null,
      healthScore:     playerHealthScore(playerStatus, advancementEligible, daysAtLevel),
      entityRoute:     `/director/players/${playerId}`,
    }
  } catch {
    return null
  }
}

// ── 1. Coach Entity Context ────────────────────────────────────────────────────

export async function loadCoachEntityContext(
  db: DB,
  academyId: string,
  coachId: string,
): Promise<EntityMemoryContext | null> {
  try {
    const rawDb = db as any

    // Name + role
    const { data: profile } = await rawDb
      .from('profiles')
      .select('display_name')
      .eq('id', coachId)
      .maybeSingle()

    if (!profile) return null
    const entityLabel = (profile.display_name as string | null) ?? 'Coach'

    const { data: membership } = await rawDb
      .from('academy_memberships')
      .select('role')
      .eq('academy_id', academyId)
      .eq('profile_id', coachId)
      .eq('is_active', true)
      .maybeSingle()

    const role = (membership?.role as string | null) ?? 'coach'

    // Sessions in last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { count: sessionCount } = await rawDb
      .from('sessions')
      .select('id', { count: 'exact', head: true })
      .eq('academy_id', academyId)
      .eq('coach_id', coachId)
      .gte('created_at', thirtyDaysAgo)

    // Completed sessions without session_notes (pending recaps)
    const { count: completedWithoutNotes } = await rawDb
      .from('sessions')
      .select('id', { count: 'exact', head: true })
      .eq('academy_id', academyId)
      .eq('coach_id', coachId)
      .eq('status', 'completed')
      .is('session_notes', null)

    const sessions      = (sessionCount as number | null) ?? 0
    const pendingRecaps = (completedWithoutNotes as number | null) ?? 0

    // Players with this coach as primary
    const { data: coachPlayers } = await rawDb
      .from('players')
      .select('full_name')
      .eq('academy_id', academyId)
      .eq('primary_coach_id', coachId)
      .eq('player_status', 'active')
      .limit(5)

    const playerNames: string[] = ((coachPlayers as any[]) ?? [])
      .map((p: any) => p.full_name as string)
      .filter(Boolean)

    // Entity summary (from donna_entity_summaries if populated)
    const { data: entitySummary } = await rawDb
      .from('donna_entity_summaries')
      .select('summary_text')
      .eq('academy_id', academyId)
      .eq('entity_type', 'coach')
      .eq('entity_id', coachId)
      .eq('summary_kind', 'operating')
      .maybeSingle()

    // Recent decisions about this coach
    const { data: decisions } = await rawDb
      .from('proposed_actions')
      .select('action_label, status')
      .eq('academy_id', academyId)
      .eq('target_object_id', coachId)
      .in('status', ['approved', 'executed', 'rejected'])
      .order('updated_at', { ascending: false })
      .limit(3)

    const recentDecisions: string[] = ((decisions as any[]) ?? [])
      .map((d: any) => `${((d.action_label as string) ?? '').slice(0, 60)} (${d.status as string})`)
      .filter(Boolean)

    const roleLabel = role === 'head_coach' ? 'Head Coach' : 'Coach'

    const activePriorities: string[] = []
    if (sessions > 0) activePriorities.push(`${sessions} sessions in last 30 days`)
    if (pendingRecaps > 0) activePriorities.push(`${pendingRecaps} recap${pendingRecaps !== 1 ? 's' : ''} pending`)
    if (playerNames.length > 0) activePriorities.push(`Primary coach for: ${playerNames.slice(0, 3).join(', ')}`)

    const recentSignals: string[] = []
    if (pendingRecaps > 2) recentSignals.push(`High pending recaps (high)`)
    else if (pendingRecaps === 1) recentSignals.push(`Pending recap (low)`)
    if (sessions === 0) recentSignals.push(`No recent sessions (medium)`)

    const operatingSummary = (entitySummary?.summary_text as string | null)
      ?? `${roleLabel}. ${sessions} sessions in last 30 days. ${pendingRecaps} pending recap${pendingRecaps !== 1 ? 's' : ''}.${playerNames.length > 0 ? ` Primary coach for ${playerNames.slice(0, 2).join(', ')}.` : ''}`

    return {
      entityType:           'coach',
      entityLabel,
      operatingSummary:     operatingSummary.slice(0, 200),
      activePriorities:     activePriorities.slice(0, 3),
      recentSignals,
      activeRecommendations: pendingRecaps > 0 ? [`${pendingRecaps} session recap${pendingRecaps !== 1 ? 's' : ''} need submission`] : [],
      recentDecisions,
      lastDiscussedAt:      null,
      healthScore:          coachHealthScore(sessions, pendingRecaps),
      entityRoute:          null,
    }
  } catch {
    return null
  }
}

// ── 2. Parent Entity Context ───────────────────────────────────────────────────

export async function loadParentEntityContext(
  db: DB,
  academyId: string,
  guardianId: string,
): Promise<EntityMemoryContext | null> {
  try {
    const rawDb = db as any

    // Guardian identity
    const { data: guardian } = await rawDb
      .from('guardians')
      .select('first_name, last_name')
      .eq('id', guardianId)
      .eq('academy_id', academyId)
      .maybeSingle()

    if (!guardian) return null
    const entityLabel = [guardian.first_name, guardian.last_name].filter(Boolean).join(' ') || 'Parent'

    // Linked players
    const { data: playerLinks } = await rawDb
      .from('player_guardians')
      .select('player_id, players(full_name, player_status)')
      .eq('guardian_id', guardianId)
      .eq('academy_id', academyId)

    const linkedPlayers: Array<{ id: string; name: string; status: string }> =
      ((playerLinks as any[]) ?? []).map((l: any) => ({
        id:     l.player_id as string,
        name:   (l.players?.full_name as string | null) ?? 'Player',
        status: (l.players?.player_status as string | null) ?? 'unknown',
      }))

    // Entity summary
    const { data: entitySummary } = await rawDb
      .from('donna_entity_summaries')
      .select('summary_text')
      .eq('academy_id', academyId)
      .eq('entity_type', 'parent')
      .eq('entity_id', guardianId)
      .eq('summary_kind', 'operating')
      .maybeSingle()

    // Recent communication decisions
    const { data: decisions } = await rawDb
      .from('proposed_actions')
      .select('action_label, status')
      .eq('academy_id', academyId)
      .eq('target_object_id', guardianId)
      .order('updated_at', { ascending: false })
      .limit(3)

    const recentDecisions: string[] = ((decisions as any[]) ?? [])
      .map((d: any) => `${((d.action_label as string) ?? '').slice(0, 60)} (${d.status as string})`)
      .filter(Boolean)

    const atRisk = linkedPlayers.filter(p => p.status === 'on_hold' || p.status === 'reassessment_due')

    const activePriorities: string[] = []
    if (linkedPlayers.length > 0) activePriorities.push(`Parent of: ${linkedPlayers.map(p => p.name).join(', ')}`)
    if (atRisk.length > 0) activePriorities.push(`${atRisk.length} player${atRisk.length !== 1 ? 's' : ''} need${atRisk.length === 1 ? 's' : ''} attention — may warrant outreach`)

    const recentSignals: string[] = atRisk.map(p =>
      `${p.name}: ${(p.status as string).replace(/_/g, ' ')} (medium)`,
    )

    const operatingSummary = (entitySummary?.summary_text as string | null)
      ?? `Parent of ${linkedPlayers.length} player${linkedPlayers.length !== 1 ? 's' : ''}: ${linkedPlayers.map(p => p.name).join(', ')}.`

    return {
      entityType:            'parent',
      entityLabel,
      operatingSummary:      operatingSummary.slice(0, 200),
      activePriorities:      activePriorities.slice(0, 3),
      recentSignals,
      activeRecommendations: atRisk.length > 0 ? [`Consider family outreach for ${atRisk.map(p => p.name).join(', ')}`] : [],
      recentDecisions,
      lastDiscussedAt:       null,
      healthScore:           recentSignals.length === 0 ? 8 : 5,
      entityRoute:           null,
    }
  } catch {
    return null
  }
}

// ── 3. Curriculum Level Entity Context ────────────────────────────────────────

export async function loadCurriculumLevelEntityContext(
  db: DB,
  academyId: string,
  levelId: string,
): Promise<EntityMemoryContext | null> {
  try {
    const rawDb = db as any

    const { data: level } = await rawDb
      .from('curriculum_levels')
      .select('display_name, stage, level_number')
      .eq('id', levelId)
      .maybeSingle()

    if (!level) return null
    const entityLabel = (level.display_name as string | null) ?? `Level ${levelId}`

    // Player metrics at this level
    const enrollCutoff = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString()

    const { count: totalPlayers } = await rawDb
      .from('player_curriculum_states')
      .select('player_id', { count: 'exact', head: true })
      .eq('academy_id', academyId)
      .eq('current_level_id', levelId)

    const { count: eligibleCount } = await rawDb
      .from('player_curriculum_states')
      .select('player_id', { count: 'exact', head: true })
      .eq('academy_id', academyId)
      .eq('current_level_id', levelId)
      .eq('advancement_eligible', true)

    const { count: stalledCount } = await rawDb
      .from('player_curriculum_states')
      .select('player_id', { count: 'exact', head: true })
      .eq('academy_id', academyId)
      .eq('current_level_id', levelId)
      .eq('advancement_eligible', false)
      .lt('enrolled_at', enrollCutoff)

    // Template count
    const { count: templateCount } = await rawDb
      .from('templates')
      .select('id', { count: 'exact', head: true })
      .eq('academy_id', academyId)
      .eq('curriculum_level_id', levelId)
      .eq('is_active', true)

    const total     = (totalPlayers as number | null) ?? 0
    const eligible  = (eligibleCount as number | null) ?? 0
    const stalled   = (stalledCount as number | null) ?? 0
    const templates = (templateCount as number | null) ?? 0

    // Entity summary
    const { data: entitySummary } = await rawDb
      .from('donna_entity_summaries')
      .select('summary_text')
      .eq('academy_id', academyId)
      .eq('entity_type', 'curriculum_level')
      .eq('entity_id', levelId)
      .eq('summary_kind', 'operating')
      .maybeSingle()

    const activePriorities: string[] = [`${total} active player${total !== 1 ? 's' : ''}`]
    if (eligible > 0) activePriorities.push(`${eligible} player${eligible !== 1 ? 's' : ''} ready to advance`)
    if (stalled > 0)  activePriorities.push(`${stalled} player${stalled !== 1 ? 's' : ''} stalled > 180 days`)
    if (templates === 0) activePriorities.push('No active templates — curriculum coverage gap')
    else activePriorities.push(`${templates} active template${templates !== 1 ? 's' : ''}`)

    const recentSignals: string[] = []
    if (stalled > 0) recentSignals.push(`Progress stagnation at ${entityLabel} (${stalled > 2 ? 'high' : 'medium'})`)
    if (eligible > 0) recentSignals.push(`Advancement ready (medium)`)
    if (templates === 0) recentSignals.push(`No template coverage (medium)`)

    const operatingSummary = (entitySummary?.summary_text as string | null)
      ?? `${total} active players. ${eligible} advancement eligible. ${stalled} stalled > 180 days. ${templates} active templates.`

    return {
      entityType:            'curriculum_level',
      entityLabel,
      operatingSummary:      operatingSummary.slice(0, 200),
      activePriorities:      activePriorities.slice(0, 4),
      recentSignals,
      activeRecommendations: [
        ...(eligible > 0 ? [`Advance ${eligible} eligible player${eligible !== 1 ? 's' : ''}`] : []),
        ...(stalled > 0  ? [`Investigate ${stalled} stalled player${stalled !== 1 ? 's' : ''} at ${entityLabel}`] : []),
      ].slice(0, 3),
      recentDecisions: [],
      lastDiscussedAt: null,
      healthScore:     levelHealthScore(total, stalled, eligible),
      entityRoute:     `/director/curriculum?level=${levelId}`,
    }
  } catch {
    return null
  }
}

// ── 4. Group Entity Context ────────────────────────────────────────────────────

export async function loadGroupEntityContext(
  db: DB,
  academyId: string,
  groupId: string,
): Promise<EntityMemoryContext | null> {
  try {
    const rawDb = db as any

    const { data: group } = await rawDb
      .from('groups')
      .select('name, level_id, track, max_players')
      .eq('id', groupId)
      .eq('academy_id', academyId)
      .maybeSingle()

    if (!group) return null
    const entityLabel  = (group.name as string | null) ?? `Group ${groupId}`
    const levelId      = group.level_id as string | null
    const maxPlayers   = (group.max_players as number | null) ?? null

    let playerCount  = 0
    let eligibleCount = 0

    if (levelId) {
      const { count: pc } = await rawDb
        .from('player_curriculum_states')
        .select('player_id', { count: 'exact', head: true })
        .eq('academy_id', academyId)
        .eq('current_level_id', levelId)

      const { count: ec } = await rawDb
        .from('player_curriculum_states')
        .select('player_id', { count: 'exact', head: true })
        .eq('academy_id', academyId)
        .eq('current_level_id', levelId)
        .eq('advancement_eligible', true)

      playerCount   = (pc as number | null) ?? 0
      eligibleCount = (ec as number | null) ?? 0
    }

    // Recent sessions for this group
    const { count: sessionCount } = await rawDb
      .from('sessions')
      .select('id', { count: 'exact', head: true })
      .eq('academy_id', academyId)
      .eq('group_id', groupId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

    const sessions = (sessionCount as number | null) ?? 0
    const atCapacity = maxPlayers !== null && playerCount >= maxPlayers

    const activePriorities: string[] = [
      `${playerCount} player${playerCount !== 1 ? 's' : ''}${maxPlayers ? ` / ${maxPlayers} max` : ''}`,
    ]
    if (eligibleCount > 0) activePriorities.push(`${eligibleCount} ready to advance`)
    if (sessions > 0) activePriorities.push(`${sessions} sessions in last 30 days`)

    const recentSignals: string[] = []
    if (atCapacity) recentSignals.push('Group at capacity (medium)')
    if (eligibleCount > 0) recentSignals.push(`${eligibleCount} advancement opportunities (low)`)

    const operatingSummary = `${entityLabel}: ${playerCount} players${maxPlayers ? ` (max ${maxPlayers})` : ''}. ${eligibleCount} advancement eligible. ${sessions} sessions this month.`

    return {
      entityType:            'group',
      entityLabel,
      operatingSummary:      operatingSummary.slice(0, 200),
      activePriorities:      activePriorities.slice(0, 3),
      recentSignals,
      activeRecommendations: eligibleCount > 0 ? [`Review ${eligibleCount} advancement-eligible player${eligibleCount !== 1 ? 's' : ''}`] : [],
      recentDecisions:       [],
      lastDiscussedAt:       null,
      healthScore:           recentSignals.length === 0 ? 8 : 6,
      entityRoute:           `/director/sessions?group=${groupId}`,
    }
  } catch {
    return null
  }
}

// ── 5. Template Entity Context ─────────────────────────────────────────────────

export async function loadTemplateEntityContext(
  db: DB,
  academyId: string,
  templateId: string,
): Promise<EntityMemoryContext | null> {
  try {
    const rawDb = db as any

    const { data: template } = await rawDb
      .from('templates')
      .select('name, template_type, status, curriculum_level_key, total_duration_min')
      .eq('id', templateId)
      .eq('academy_id', academyId)
      .maybeSingle()

    if (!template) return null
    const entityLabel    = (template.name as string | null) ?? `Template ${templateId}`
    const templateType   = (template.template_type as string | null) ?? 'class'
    const levelKey       = (template.curriculum_level_key as string | null) ?? null
    const durationMin    = (template.total_duration_min as number | null) ?? null
    const activeStatus   = (template.status as string | null) ?? 'unknown'

    // Total session usage
    const { count: sessionCount } = await rawDb
      .from('sessions')
      .select('id', { count: 'exact', head: true })
      .eq('academy_id', academyId)
      .eq('template_id', templateId)

    const sessions = (sessionCount as number | null) ?? 0

    // Last session date
    const { data: lastSession } = await rawDb
      .from('sessions')
      .select('scheduled_for')
      .eq('academy_id', academyId)
      .eq('template_id', templateId)
      .order('scheduled_for', { ascending: false })
      .limit(1)
      .maybeSingle()

    const lastUsed = lastSession?.scheduled_for
      ? relativeDate(lastSession.scheduled_for as string)
      : 'never'

    const isUnderused = sessions < 3

    const activePriorities: string[] = [
      `${sessions} session${sessions !== 1 ? 's' : ''} total — last used ${lastUsed}`,
    ]
    if (levelKey)    activePriorities.push(`Curriculum: ${levelKey.replace(/_/g, ' ')}`)
    if (durationMin) activePriorities.push(`Duration: ${durationMin} min`)

    const recentSignals: string[] = []
    if (sessions === 0)  recentSignals.push('Template never used (medium)')
    else if (isUnderused) recentSignals.push(`Low usage — only ${sessions} session${sessions !== 1 ? 's' : ''} (low)`)

    const typeRoute   = templateType === 'fitness' ? 'fitness/templates' : 'class-templates'
    const entityRoute = `/director/${typeRoute}/${templateId}`

    const operatingSummary = `${entityLabel} (${templateType}). Status: ${activeStatus}. Used in ${sessions} session${sessions !== 1 ? 's' : ''}. Last used: ${lastUsed}.`

    return {
      entityType:            'template',
      entityLabel,
      operatingSummary:      operatingSummary.slice(0, 200),
      activePriorities:      activePriorities.slice(0, 3),
      recentSignals,
      activeRecommendations: isUnderused && sessions === 0 ? ['Consider using this template in upcoming sessions'] : [],
      recentDecisions:       [],
      lastDiscussedAt:       null,
      healthScore:           sessions > 5 ? 8 : sessions > 0 ? 6 : 4,
      entityRoute,
    }
  } catch {
    return null
  }
}

// ── 6. Academy Entity Context ──────────────────────────────────────────────────

export async function loadAcademyEntityContext(
  db: DB,
  academyId: string,
): Promise<EntityMemoryContext | null> {
  try {
    const rawDb = db as any

    const { data: academy } = await rawDb
      .from('academies')
      .select('name')
      .eq('id', academyId)
      .maybeSingle()

    const academyName = (academy?.name as string | null) ?? 'Academy'

    const { count: activePlayers } = await rawDb
      .from('players')
      .select('id', { count: 'exact', head: true })
      .eq('academy_id', academyId)
      .eq('player_status', 'active')

    const { count: pendingCount } = await rawDb
      .from('proposed_actions')
      .select('id', { count: 'exact', head: true })
      .eq('academy_id', academyId)
      .eq('status', 'pending_review')

    const weekEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    const { count: weekSessions } = await rawDb
      .from('sessions')
      .select('id', { count: 'exact', head: true })
      .eq('academy_id', academyId)
      .eq('status', 'planned')
      .gte('scheduled_for', new Date().toISOString())
      .lte('scheduled_for', weekEnd)

    const { count: onHoldCount } = await rawDb
      .from('players')
      .select('id', { count: 'exact', head: true })
      .eq('academy_id', academyId)
      .eq('player_status', 'on_hold')

    const { count: placementCount } = await rawDb
      .from('players')
      .select('id', { count: 'exact', head: true })
      .eq('academy_id', academyId)
      .in('player_status', ['pending_placement', 'placement_in_progress'])

    const players   = (activePlayers as number | null) ?? 0
    const pending   = (pendingCount as number | null) ?? 0
    const sessions  = (weekSessions as number | null) ?? 0
    const onHold    = (onHoldCount as number | null) ?? 0
    const placement = (placementCount as number | null) ?? 0

    const activePriorities: string[] = [`${players} active player${players !== 1 ? 's' : ''}`]
    if (pending  > 0) activePriorities.push(`${pending} pending review item${pending !== 1 ? 's' : ''}`)
    if (sessions > 0) activePriorities.push(`${sessions} session${sessions !== 1 ? 's' : ''} scheduled this week`)

    const recentSignals: string[] = []
    if (pending >= 10) recentSignals.push(`Review queue critical — ${pending} pending (critical)`)
    else if (pending >= 3) recentSignals.push(`Review queue building — ${pending} pending (high)`)
    if (onHold > 0) recentSignals.push(`${onHold} player${onHold !== 1 ? 's' : ''} on hold (high)`)
    if (placement > 0) recentSignals.push(`${placement} player${placement !== 1 ? 's' : ''} awaiting placement (medium)`)

    const activeRecommendations: string[] = []
    if (pending > 0) activeRecommendations.push(`Clear ${pending} pending review item${pending !== 1 ? 's' : ''}`)
    if (onHold  > 0) activeRecommendations.push(`Review ${onHold} on-hold player${onHold !== 1 ? 's' : ''}`)

    let healthScore = 8
    if (pending >= 10) healthScore -= 3
    else if (pending >= 5) healthScore -= 2
    else if (pending >= 3) healthScore -= 1
    if (onHold    > 0) healthScore -= 1
    if (placement > 2) healthScore -= 1
    healthScore = Math.max(0, Math.min(10, healthScore))

    const operatingSummary = `${academyName}. ${players} active players. ${pending} pending reviews. ${sessions} sessions this week. ${onHold} on hold.`

    return {
      entityType:            'academy',
      entityLabel:           academyName,
      operatingSummary:      operatingSummary.slice(0, 200),
      activePriorities:      activePriorities.slice(0, 3),
      recentSignals,
      activeRecommendations: activeRecommendations.slice(0, 3),
      recentDecisions:       [],
      lastDiscussedAt:       null,
      healthScore,
      entityRoute:           '/director',
    }
  } catch {
    return null
  }
}

// ── Level alias detector ───────────────────────────────────────────────────────

function detectLevelAlias(lower: string): string | null {
  const aliases: Array<[RegExp, string]> = [
    [/\bred\s*ball\s*1\b|rb1\b/i,                   'red_ball_1'],
    [/\bred\s*ball\s*2\b|rb2\b/i,                   'red_ball_2'],
    [/\bred\s*ball\s*3\b|rb3\b/i,                   'red_ball_3'],
    [/\borange\s*ball\s*1\b|ob1\b/i,                'orange_ball_1'],
    [/\borange\s*ball\s*2\b|ob2\b/i,                'orange_ball_2'],
    [/\borange\s*ball\s*3\b|ob3\b/i,                'orange_ball_3'],
    [/\bgreen\s*(?:dot|ball)\s*1\b|gd1\b/i,         'green_dot_1'],
    [/\bgreen\s*(?:dot|ball)\s*2\b|gd2\b/i,         'green_dot_2'],
    [/\bgreen\s*(?:dot|ball)\s*3\b|gd3\b/i,         'green_dot_3'],
    [/\byellow\s*ball\s*1\b|yb1\b/i,                'yellow_ball_1'],
    [/\byellow\s*ball\s*2\b|yb2\b/i,                'yellow_ball_2'],
    [/\bhigh\s*perf(?:ormance)?\s*1\b|hp1\b/i,      'high_performance_1'],
    [/\bhigh\s*perf(?:ormance)?\s*2\b|hp2\b/i,      'high_performance_2'],
    [/\bhigh\s*perf(?:ormance)?\s*3\b|hp3\b/i,      'high_performance_3'],
    // Stage-only patterns (no level number)
    [/\bred\s*ball\b/i,                              'red_ball'],
    [/\borange\s*ball\b/i,                           'orange_ball'],
    [/\bgreen\s*(?:dot|ball)\b/i,                    'green_dot'],
    [/\byellow\s*ball\b/i,                           'yellow_ball'],
    [/\bhigh\s*performance\b/i,                      'high_performance'],
  ]
  for (const [re, key] of aliases) {
    if (re.test(lower)) return key
  }
  return null
}

// ── 7. Entity Context from Phrase (orchestrator entry point) ──────────────────

/**
 * Detects entity type from a natural-language phrase and loads the relevant
 * EntityMemoryContext. Called from the server action when no route-level entity
 * context is available (i.e., the director is not on a player/session page).
 *
 * Resolution order:
 *   1. Academy-level keywords → loadAcademyEntityContext
 *   2. Curriculum level aliases → loadCurriculumLevelEntityContext
 *   3. "coach [name]" or coach name match → loadCoachEntityContext
 *   4. Template keyword + name match → loadTemplateEntityContext
 *   5. Group keyword + name match → loadGroupEntityContext
 *   6. Bare name match against coach roster (fallback)
 *
 * Non-fatal: any failure returns null.
 */
export async function loadEntityContextFromPhrase(
  db: DB,
  academyId: string,
  entityPhrase: string,
): Promise<EntityMemoryContext | null> {
  try {
    const lower = entityPhrase.toLowerCase().trim()

    // 1. Academy-level
    if (/\bacademy\b|\boverall\b|\bhow\s+are\s+we\b|\bbig(?:gest)?\s+risk\b|\bwhole\s+academy\b/i.test(lower)) {
      return loadAcademyEntityContext(db, academyId)
    }

    // 2. Curriculum level alias
    const levelAlias = detectLevelAlias(lower)
    if (levelAlias) {
      const levelResult = await loadCurriculumLevelsSummary(db)
      const level = levelResult.summaries.find(l => {
        const dn = l.displayName.toLowerCase()
        return (
          dn.replace(/\s+/g, '_') === levelAlias ||
          levelAlias.startsWith(dn.replace(/\s+/g, '_').split('_').slice(0, -1).join('_')) ||
          lower.includes(dn)
        )
      })
      if (level) return loadCurriculumLevelEntityContext(db, academyId, level.id)
    }

    // 3. Coach — keyword or name match
    if (/\bcoach(?:es)?\b/i.test(lower)) {
      const coaches = await loadCoachesSummary(db, academyId)
      const items = coaches.summaries.map(c => ({
        id: c.coachId, name: c.displayName, firstName: c.firstName, lastName: c.lastName,
      }))
      const matched = findBestNameMatch(entityPhrase, items)
      if (matched) return loadCoachEntityContext(db, academyId, matched.id)
      // Aggregate coach query — fall through to academy context
      if (coaches.summaries.length > 0) return loadAcademyEntityContext(db, academyId)
    }

    // 4. Template keyword + name match
    if (/\btemplate\b|\bsession\s+plan\b|\bplan\b/i.test(lower)) {
      const templates = await loadTemplatesSummary(db, academyId)
      const items = templates.summaries.map(t => ({ id: t.templateId, name: t.name }))
      const matched = findBestNameMatch(entityPhrase, items)
      if (matched) return loadTemplateEntityContext(db, academyId, matched.id)
    }

    // 5. Group keyword + name match
    if (/\bgroup\b|\bclass\b|\bteam\b/i.test(lower)) {
      const groups = await loadGroupsSummary(db, academyId)
      const items = groups.summaries.map(g => ({ id: g.groupId, name: g.name }))
      const matched = findBestNameMatch(entityPhrase, items)
      if (matched) return loadGroupEntityContext(db, academyId, matched.id)
    }

    // 6. Bare name — try player roster first (players outnumber coaches; bare name is more likely a player)
    const playerStates = await loadPlayerCurriculumStates(db, academyId)
    const playerItems = playerStates.summaries.map(p => ({ id: p.playerId, name: p.playerName }))
    const playerMatch = findBestNameMatch(entityPhrase, playerItems)
    if (playerMatch) return loadPlayerEntityContext(db, academyId, playerMatch.id)

    // 7. Bare name — try coach roster as final fallback
    const coaches = await loadCoachesSummary(db, academyId)
    const coachItems = coaches.summaries.map(c => ({
      id: c.coachId, name: c.displayName, firstName: c.firstName, lastName: c.lastName,
    }))
    const coachMatch = findBestNameMatch(entityPhrase, coachItems)
    if (coachMatch) return loadCoachEntityContext(db, academyId, coachMatch.id)

    return null
  } catch {
    return null
  }
}
