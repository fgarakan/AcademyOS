// Player Evidence Repository — Phase 7A
// Read-only aggregation layer for the Player Evidence Hub.
// All functions are academy-scoped. No mutations. No migrations required.
// Raw coach observation content is NEVER exposed as parent-safe.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'

type DB = SupabaseClient<Database>

// ─── Shared types ────────────────────────────────────────────────────────────

export interface EvidenceResult<T> {
  data: T | null
  error: string | null
  isSchemaMissing: boolean
}

export interface CoachObservationItem {
  id: string
  content: string
  observationType: string
  isPrivate: boolean
  createdAt: string
  coachName: string | null
  sessionName: string | null
  sessionDate: string | null
  tags: string[]
  sourceLabel: 'coach_observation'
  // Raw coach observation content is NEVER parent-safe.
  // This field is always false — included explicitly to prevent accidental exposure.
  isParentSafe: false
}

export interface RequirementEvidenceItem {
  id: string
  requirementId: string
  requirementTitle: string | null
  requirementDomain: string | null
  evidenceType: string
  evidenceSummary: string | null
  confidence: number | null
  weight: number | null
  isParentSafe: boolean
  isParentVisible: boolean
  isPlayerVisible: boolean
  createdAt: string
  createdByName: string | null
  sourceLabel: 'requirement_evidence_link'
  observationContent: string | null
  observationType: string | null
}

export interface GateStatusItem {
  gateId: string
  domain: string
  criterion: string
  status: string
  evidenceCount: number
  lastEvidenceAt: string | null
  sourceLabel: 'gate_status'
}

export interface AssessmentItem {
  id: string
  assessedDate: string
  type: string
  overallScore: number | null
  technicalScore: number | null
  tacticalScore: number | null
  movementScore: number | null
  competitionScore: number | null
  behavioralScore: number | null
  isBaseline: boolean
  promotionReady: boolean
  assessedByName: string | null
  sourceLabel: 'assessment'
  // Assessment notes field is internal — not exposed here.
  isParentSafe: false
}

export interface ActivePriorityItem {
  id: string
  title: string
  description: string | null
  category: string | null
  priorityRank: number | null
  urgency: string | null
  sourceLabel: 'player_priority'
  isParentSafe: boolean
}

export interface DevelopmentSummaryItem {
  currentStrengths: string[]
  thingsToWorkOn: string[]
  developmentFocus: string | null
  showToParent: boolean
  showToStudent: boolean
  updatedAt: string
  sourceLabel: 'development_summary'
}

export interface EvidenceTimelineItem {
  id: string
  type:
    | 'coach_observation'
    | 'requirement_evidence'
    | 'gate_update'
    | 'assessment'
    | 'priority_added'
    | 'dev_summary_updated'
  date: string
  label: string
  sourceLabel: string
  isParentSafe: boolean
  isInternalOnly: boolean
  detail: string | null
}

export interface PlayerEvidenceSummary {
  totalObservations: number
  recentObservationCount: number
  requirementEvidenceCount: number
  parentSafeEvidenceCount: number
  gatesWithEvidence: number
  totalGates: number
  activePriorityCount: number
  latestEvidenceDate: string | null
  latestAssessmentDate: string | null
}

export interface PathwayEvidenceData {
  skillEvidence: CoachObservationItem[]
  competitionEvidence: CoachObservationItem[]
  fitnessEvidence: CoachObservationItem[]
}

export interface ParentSafeSummaryData {
  developmentSummary: DevelopmentSummaryItem | null
  parentSafeEvidenceLinks: RequirementEvidenceItem[]
  parentSafeRequirements: Array<{
    requirementTitle: string
    requirementDomain: string | null
    status: string
    evidenceCount: number
    isParentVisible: boolean
    isPlayerVisible: boolean
  }>
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isMissingSchemaError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const msg = (error as { message?: string }).message ?? ''
  const code = (error as { code?: string }).code ?? ''
  return (
    msg.includes('does not exist') ||
    msg.includes('relation') ||
    msg.includes('column') ||
    code === '42P01' ||
    code === '42703'
  )
}

const SKILL_OBS_TYPES = new Set([
  'technical', 'tactical', 'movement', 'general', 'behavioral', 'injury_concern', 'positive_highlight',
])
const COMPETITION_OBS_TYPES = new Set(['competition'])
const FITNESS_OBS_TYPES = new Set(['fitness', 'load', 'recovery'])

// ─── 1. getPlayerEvidenceSummary ─────────────────────────────────────────────

export async function getPlayerEvidenceSummary(
  db: DB,
  playerId: string,
  academyId: string
): Promise<EvidenceResult<PlayerEvidenceSummary>> {
  const rawDb = db as any
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  try {
    const [obsResult, evidenceResult, gatesResult, priorityResult, assessmentResult] = await Promise.all([
      rawDb
        .from('coach_observations')
        .select('id, created_at')
        .eq('player_id', playerId)
        .eq('academy_id', academyId),
      rawDb
        .from('requirement_evidence_links')
        .select('id, is_parent_safe, created_at')
        .eq('player_id', playerId)
        .eq('academy_id', academyId),
      rawDb
        .from('curriculum_gates')
        .select('id, player_gate_status!inner(status, evidence_count)')
        .eq('player_gate_status.player_id', playerId)
        .eq('player_gate_status.academy_id', academyId),
      rawDb
        .from('player_priorities')
        .select('id')
        .eq('player_id', playerId)
        .eq('academy_id', academyId)
        .eq('is_active', true),
      rawDb
        .from('assessments')
        .select('id, assessed_date')
        .eq('player_id', playerId)
        .eq('academy_id', academyId)
        .order('assessed_date', { ascending: false })
        .limit(1),
    ])

    // Graceful handling — if any individual query fails, fall back to 0 counts.
    const observations: Array<{ id: string; created_at: string }> = obsResult.data ?? []
    const evidenceLinks: Array<{ id: string; is_parent_safe: boolean; created_at: string }> =
      isMissingSchemaError(evidenceResult.error) ? [] : (evidenceResult.data ?? [])
    const gates: Array<{ id: string; player_gate_status: Array<{ status: string; evidence_count: number }> }> =
      isMissingSchemaError(gatesResult.error) ? [] : (gatesResult.data ?? [])
    const priorities: Array<{ id: string }> = priorityResult.data ?? []
    const assessments: Array<{ id: string; assessed_date: string }> = assessmentResult.data ?? []

    const recentObs = observations.filter(o => o.created_at >= thirtyDaysAgo)

    const allDates: string[] = [
      ...observations.map(o => o.created_at),
      ...evidenceLinks.map(e => e.created_at),
    ].sort().reverse()

    const gatesWithEvidence = gates.filter(g =>
      (g.player_gate_status ?? []).some((s: any) => s.evidence_count > 0)
    ).length

    return {
      data: {
        totalObservations:       observations.length,
        recentObservationCount:  recentObs.length,
        requirementEvidenceCount: evidenceLinks.length,
        parentSafeEvidenceCount: evidenceLinks.filter(e => e.is_parent_safe).length,
        gatesWithEvidence,
        totalGates:              gates.length,
        activePriorityCount:     priorities.length,
        latestEvidenceDate:      allDates[0] ?? null,
        latestAssessmentDate:    assessments[0]?.assessed_date ?? null,
      },
      error: null,
      isSchemaMissing: false,
    }
  } catch (err) {
    if (isMissingSchemaError(err)) {
      return { data: null, error: 'Schema missing', isSchemaMissing: true }
    }
    return { data: null, error: String(err), isSchemaMissing: false }
  }
}

// ─── 2. getPlayerCoachObservations ───────────────────────────────────────────

export async function getPlayerCoachObservations(
  db: DB,
  playerId: string,
  academyId: string,
  limit = 20
): Promise<EvidenceResult<CoachObservationItem[]>> {
  const rawDb = db as any

  try {
    const { data, error } = await rawDb
      .from('coach_observations')
      .select([
        'id', 'content', 'observation_type', 'is_private', 'tags', 'created_at',
        'profiles!coach_observations_coach_id_fkey(display_name)',
        'sessions!coach_observations_session_id_fkey(name, scheduled_date)',
      ].join(', '))
      .eq('academy_id', academyId)
      .eq('player_id', playerId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      if (isMissingSchemaError(error)) return { data: null, error: 'Schema missing', isSchemaMissing: true }
      return { data: null, error: error.message, isSchemaMissing: false }
    }

    const items: CoachObservationItem[] = (data ?? []).map((row: any) => ({
      id:              row.id,
      content:         row.content ?? '',
      observationType: row.observation_type ?? 'general',
      isPrivate:       row.is_private ?? true,
      createdAt:       row.created_at,
      coachName:       row.profiles?.display_name ?? null,
      sessionName:     row.sessions?.name ?? null,
      sessionDate:     row.sessions?.scheduled_date ?? null,
      tags:            Array.isArray(row.tags) ? row.tags : [],
      sourceLabel:     'coach_observation' as const,
      isParentSafe:    false as const,
    }))

    return { data: items, error: null, isSchemaMissing: false }
  } catch (err) {
    if (isMissingSchemaError(err)) return { data: null, error: 'Schema missing', isSchemaMissing: true }
    return { data: null, error: String(err), isSchemaMissing: false }
  }
}

// ─── 3. getPlayerCurriculumEvidence ──────────────────────────────────────────

export async function getPlayerCurriculumEvidence(
  db: DB,
  playerId: string,
  academyId: string
): Promise<EvidenceResult<RequirementEvidenceItem[]>> {
  const rawDb = db as any

  try {
    // Evidence links
    const { data: linkRows, error: linkError } = await rawDb
      .from('requirement_evidence_links')
      .select(
        'id, requirement_id, evidence_type, evidence_id, evidence_summary, confidence, weight, ' +
        'is_parent_safe, created_by, created_at'
      )
      .eq('academy_id', academyId)
      .eq('player_id', playerId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (linkError) {
      if (isMissingSchemaError(linkError)) return { data: null, error: 'Schema missing', isSchemaMissing: true }
      return { data: null, error: linkError.message, isSchemaMissing: false }
    }

    const links: any[] = linkRows ?? []
    if (links.length === 0) return { data: [], error: null, isSchemaMissing: false }

    // Requirement titles from progress view (best effort)
    const requirementIds = Array.from(new Set(links.map((l: any) => l.requirement_id)))
    const { data: progressRows } = await rawDb
      .from('v_player_requirement_progress_detail')
      .select(
        'requirement_id, requirement_title, requirement_domain_key, is_parent_visible, is_player_visible'
      )
      .eq('academy_id', academyId)
      .eq('player_id', playerId)
      .in('requirement_id', requirementIds)

    type ProgressMeta = {
      requirement_title: string
      requirement_domain_key: string | null
      is_parent_visible: boolean
      is_player_visible: boolean
    }
    const progressByReqId = new Map<string, ProgressMeta>()
    for (const r of (progressRows ?? []) as Array<{ requirement_id: string } & ProgressMeta>) {
      progressByReqId.set(r.requirement_id, r)
    }

    // Observation snippets for coach_observation evidence type
    const obsEvidence = links.filter((l: any) => l.evidence_type === 'coach_observation')
    const obsById = new Map<string, { content: string; observation_type: string }>()
    if (obsEvidence.length > 0) {
      const obsIds = obsEvidence.map((l: any) => l.evidence_id)
      const { data: obsRows } = await rawDb
        .from('coach_observations')
        .select('id, content, observation_type')
        .in('id', obsIds)
        .eq('academy_id', academyId)
        .eq('player_id', playerId)
      for (const o of (obsRows ?? []) as Array<{ id: string; content: string; observation_type: string }>) {
        obsById.set(o.id, o)
      }
    }

    // Creator display names
    const creatorIds = Array.from(new Set(links.filter((l: any) => l.created_by).map((l: any) => l.created_by as string)))
    const creatorNameById = new Map<string, string>()
    if (creatorIds.length > 0) {
      const { data: profiles } = await db
        .from('profiles')
        .select('id, display_name')
        .in('id', creatorIds)
      for (const p of (profiles ?? [])) {
        if (p.display_name) creatorNameById.set(p.id, p.display_name)
      }
    }

    const items: RequirementEvidenceItem[] = links.map((l: any) => {
      const meta = progressByReqId.get(l.requirement_id)
      const obs = l.evidence_type === 'coach_observation' ? obsById.get(l.evidence_id) : undefined
      return {
        id:                l.id,
        requirementId:     l.requirement_id,
        requirementTitle:  meta?.requirement_title ?? null,
        requirementDomain: meta?.requirement_domain_key ?? null,
        evidenceType:      l.evidence_type,
        evidenceSummary:   l.evidence_summary ?? null,
        confidence:        l.confidence ?? null,
        weight:            l.weight ?? null,
        isParentSafe:      l.is_parent_safe ?? false,
        isParentVisible:   meta?.is_parent_visible ?? false,
        isPlayerVisible:   meta?.is_player_visible ?? false,
        createdAt:         l.created_at,
        createdByName:     l.created_by ? (creatorNameById.get(l.created_by) ?? null) : null,
        sourceLabel:       'requirement_evidence_link' as const,
        observationContent: obs?.content ?? null,
        observationType:   obs?.observation_type ?? null,
      }
    })

    return { data: items, error: null, isSchemaMissing: false }
  } catch (err) {
    if (isMissingSchemaError(err)) return { data: null, error: 'Schema missing', isSchemaMissing: true }
    return { data: null, error: String(err), isSchemaMissing: false }
  }
}

// ─── 4. getPlayerPathwayEvidence ─────────────────────────────────────────────

export async function getPlayerPathwayEvidence(
  db: DB,
  playerId: string,
  academyId: string
): Promise<EvidenceResult<PathwayEvidenceData>> {
  const obsResult = await getPlayerCoachObservations(db, playerId, academyId, 60)

  if (obsResult.error || obsResult.isSchemaMissing) {
    return {
      data: { skillEvidence: [], competitionEvidence: [], fitnessEvidence: [] },
      error: obsResult.error,
      isSchemaMissing: obsResult.isSchemaMissing,
    }
  }

  const all = obsResult.data ?? []

  return {
    data: {
      skillEvidence:       all.filter(o => SKILL_OBS_TYPES.has(o.observationType)),
      competitionEvidence: all.filter(o => COMPETITION_OBS_TYPES.has(o.observationType)),
      fitnessEvidence:     all.filter(o => FITNESS_OBS_TYPES.has(o.observationType)),
    },
    error: null,
    isSchemaMissing: false,
  }
}

// ─── 5. getPlayerParentSafeSummaries ─────────────────────────────────────────

export async function getPlayerParentSafeSummaries(
  db: DB,
  playerId: string,
  academyId: string
): Promise<EvidenceResult<ParentSafeSummaryData>> {
  const rawDb = db as any

  try {
    // Development summary — only if show_to_parent = true
    const { data: summaryRows } = await rawDb
      .from('player_development_summary')
      .select(
        'current_strengths, things_to_work_on, development_focus, show_to_parent, show_to_student, updated_at'
      )
      .eq('player_id', playerId)
      .eq('academy_id', academyId)
      .order('updated_at', { ascending: false })
      .limit(1)

    const rawSummary = (summaryRows ?? [])[0] ?? null
    const developmentSummary: DevelopmentSummaryItem | null = rawSummary
      ? {
          currentStrengths:  Array.isArray(rawSummary.current_strengths) ? rawSummary.current_strengths : [],
          thingsToWorkOn:    Array.isArray(rawSummary.things_to_work_on) ? rawSummary.things_to_work_on : [],
          developmentFocus:  rawSummary.development_focus ?? null,
          showToParent:      rawSummary.show_to_parent ?? false,
          showToStudent:     rawSummary.show_to_student ?? false,
          updatedAt:         rawSummary.updated_at,
          sourceLabel:       'development_summary' as const,
        }
      : null

    // Requirement evidence links — parent-safe only
    const curriculumResult = await getPlayerCurriculumEvidence(db, playerId, academyId)
    const parentSafeEvidenceLinks = (curriculumResult.data ?? []).filter(e => e.isParentSafe)

    // Requirements visible to parents from progress view
    const { data: progressRows } = await rawDb
      .from('v_player_requirement_progress_detail')
      .select(
        'requirement_title, requirement_domain_key, status, evidence_count, is_parent_visible, is_player_visible'
      )
      .eq('academy_id', academyId)
      .eq('player_id', playerId)
      .eq('is_parent_visible', true)
      .order('domain_display_order', { ascending: true })

    const parentSafeRequirements = ((progressRows ?? []) as any[]).map((r: any) => ({
      requirementTitle:  r.requirement_title ?? '',
      requirementDomain: r.requirement_domain_key ?? null,
      status:            r.status ?? 'not_started',
      evidenceCount:     r.evidence_count ?? 0,
      isParentVisible:   r.is_parent_visible ?? false,
      isPlayerVisible:   r.is_player_visible ?? false,
    }))

    return {
      data: { developmentSummary, parentSafeEvidenceLinks, parentSafeRequirements },
      error: null,
      isSchemaMissing: false,
    }
  } catch (err) {
    if (isMissingSchemaError(err)) return { data: null, error: 'Schema missing', isSchemaMissing: true }
    return { data: null, error: String(err), isSchemaMissing: false }
  }
}

// ─── 6. getPlayerEvidenceTimeline ────────────────────────────────────────────

export async function getPlayerEvidenceTimeline(
  db: DB,
  playerId: string,
  academyId: string,
  limit = 30
): Promise<EvidenceResult<EvidenceTimelineItem[]>> {
  const rawDb = db as any

  try {
    const [obsResult, curriculumResult, gateLogResult, assessmentResult] = await Promise.all([
      getPlayerCoachObservations(db, playerId, academyId, limit),
      getPlayerCurriculumEvidence(db, playerId, academyId),
      rawDb
        .from('audit_logs')
        .select('id, action, created_at, payload')
        .eq('academy_id', academyId)
        .in('action', ['gate_status.evidence_recorded', 'gate_status.director_decision'])
        .eq('target_type', 'player')
        .eq('target_id', playerId)
        .order('created_at', { ascending: false })
        .limit(20),
      rawDb
        .from('assessments')
        .select('id, assessed_date, type, overall_score')
        .eq('player_id', playerId)
        .eq('academy_id', academyId)
        .order('assessed_date', { ascending: false })
        .limit(10),
    ])

    const items: EvidenceTimelineItem[] = []

    // Coach observations
    for (const obs of obsResult.data ?? []) {
      items.push({
        id:             obs.id,
        type:           'coach_observation',
        date:           obs.createdAt,
        label:          `${obs.observationType.replace(/_/g, ' ')} — ${obs.coachName ?? 'Coach'}`,
        sourceLabel:    'Coach Observation',
        isParentSafe:   false,
        isInternalOnly: true,
        detail:         obs.sessionName ? `${obs.sessionName}${obs.sessionDate ? ' · ' + obs.sessionDate : ''}` : null,
      })
    }

    // Requirement evidence links
    for (const ev of curriculumResult.data ?? []) {
      items.push({
        id:             ev.id,
        type:           'requirement_evidence',
        date:           ev.createdAt,
        label:          ev.requirementTitle
          ? `Evidence: ${ev.requirementTitle}`
          : `Requirement evidence (${ev.evidenceType.replace(/_/g, ' ')})`,
        sourceLabel:    'Requirement Evidence',
        isParentSafe:   ev.isParentSafe,
        isInternalOnly: !ev.isParentSafe,
        detail:         ev.evidenceSummary ?? null,
      })
    }

    // Gate audit log entries
    const gateLogRows: any[] = isMissingSchemaError(gateLogResult.error) ? [] : (gateLogResult.data ?? [])
    for (const row of gateLogRows) {
      const action = row.action === 'gate_status.director_decision' ? 'Gate decision' : 'Gate evidence recorded'
      items.push({
        id:             row.id,
        type:           'gate_update',
        date:           row.created_at,
        label:          action,
        sourceLabel:    'Curriculum Gate',
        isParentSafe:   false,
        isInternalOnly: true,
        detail:         null,
      })
    }

    // Assessments
    const assessmentRows: any[] = assessmentResult.data ?? []
    for (const a of assessmentRows) {
      const score = a.overall_score != null ? ` · Score ${a.overall_score}` : ''
      items.push({
        id:             a.id,
        type:           'assessment',
        date:           a.assessed_date,
        label:          `${(a.type ?? 'Assessment').replace(/_/g, ' ')}${score}`,
        sourceLabel:    'Assessment',
        isParentSafe:   false,
        isInternalOnly: true,
        detail:         null,
      })
    }

    // Sort chronologically descending and apply limit
    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return { data: items.slice(0, limit), error: null, isSchemaMissing: false }
  } catch (err) {
    if (isMissingSchemaError(err)) return { data: null, error: 'Schema missing', isSchemaMissing: true }
    return { data: null, error: String(err), isSchemaMissing: false }
  }
}
