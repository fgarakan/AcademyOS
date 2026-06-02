// Sprint 1131-1140 — Readiness Evidence Panel
//
// Answers: "Is this player ready for the next level?"
//
// Shows:
//   Current level → Next target → Readiness state
//   Met requirements (✓) + Missing requirements (□)
//   DONNA summary recommendation
//
// Data sources:
//   - curriculum_gates (level requirements)
//   - player_gate_status (completion state)
//   - player_mission_assignments (active missions linked to gaps)
//   - assessments (latest score)
//
// Constitution: director-only component, never shown to parent/player.

import { getSupabaseServer } from '@/lib/supabase/server'
import { CheckCircle2, Circle, ArrowRight, Sparkles, AlertCircle } from 'lucide-react'

interface ReadinessEvidencePanelProps {
  playerId: string
  academyId: string
  currentLevelId: string | null
  currentLevelName: string | null
  nextLevelName: string | null
  advancementEligible: boolean
}

interface GateStatus {
  id: string
  criterion: string
  domain: string
  threshold: string | null
  status: 'met' | 'unmet' | 'unknown'
}

type ReadinessState = 'ready_for_review' | 'approaching' | 'developing' | 'no_data'

function buildReadinessSummary(
  playerName: string,
  nextLevelName: string | null,
  gatesMet: number,
  gatesTotal: number,
  advancementEligible: boolean,
  activeMissions: string[],
): string {
  if (gatesTotal === 0) {
    return `No level gate requirements are configured for this level. Ask your curriculum administrator to set up gates to enable automated readiness tracking.`
  }

  const pct = Math.round((gatesMet / gatesTotal) * 100)

  if (advancementEligible && nextLevelName) {
    return `${playerName} has met enough requirements to begin a level review for ${nextLevelName}. I recommend initiating a formal level readiness review — no movement happens without your explicit approval.`
  }

  if (pct >= 60 && nextLevelName) {
    const missing = gatesTotal - gatesMet
    const missionNote = activeMissions.length > 0
      ? ` Active mission${activeMissions.length > 1 ? 's' : ''} (${activeMissions.slice(0, 2).join(', ')}) are addressing the remaining areas.`
      : ''
    return `${playerName} has completed ${gatesMet}/${gatesTotal} requirements (${pct}%) toward ${nextLevelName}.${missionNote} A reassessment in 4–6 weeks would help confirm readiness.`
  }

  return `${playerName} has completed ${gatesMet}/${gatesTotal} gate requirements (${pct}%). Continue the active development plan — check back after the next assessment cycle.`
}

export async function ReadinessEvidencePanel({
  playerId,
  academyId,
  currentLevelId,
  currentLevelName,
  nextLevelName,
  advancementEligible,
}: ReadinessEvidencePanelProps) {
  if (!currentLevelId) {
    return (
      <div className="rounded-xl border border-border bg-surface px-4 py-4">
        <p className="text-xs text-text-muted">Level not assigned — complete placement to enable readiness tracking.</p>
      </div>
    )
  }

  const supabase = await getSupabaseServer()
  const rawDb = supabase as any

  // Fetch player name for summary
  const { data: playerData } = await supabase
    .from('players')
    .select('first_name')
    .eq('id', playerId)
    .eq('academy_id', academyId)
    .single()
  const playerName = playerData?.first_name ?? 'This player'

  // Fetch curriculum gates for current level
  let gates: Array<{ id: string; criterion: string; domain: string; threshold: string | null }> = []
  try {
    const { data: gateRows } = await rawDb
      .from('curriculum_gates')
      .select('id, criterion, domain, threshold')
      .eq('level_id', currentLevelId)
      .order('domain', { ascending: true })
    gates = (gateRows ?? []) as typeof gates
  } catch { /* table may not exist */ }

  // Fetch gate completion status for this player
  const gateStatusMap = new Map<string, 'met' | 'unmet'>()
  if (gates.length > 0) {
    try {
      const gateIds = gates.map(g => g.id)
      const { data: statusRows } = await rawDb
        .from('player_gate_status')
        .select('gate_id, status')
        .eq('player_id', playerId)
        .eq('academy_id', academyId)
        .in('gate_id', gateIds)
      for (const row of (statusRows ?? []) as Array<{ gate_id: string; status: string }>) {
        const isMet = row.status === 'confirmed' || row.status === 'evidence_threshold_met'
        gateStatusMap.set(row.gate_id, isMet ? 'met' : 'unmet')
      }
    } catch { /* migration not applied */ }
  }

  const gateStatuses: GateStatus[] = gates.map(g => ({
    id: g.id,
    criterion: g.criterion,
    domain: g.domain,
    threshold: g.threshold,
    status: gateStatusMap.get(g.id) ?? 'unknown',
  }))

  const metCount   = gateStatuses.filter(g => g.status === 'met').length
  const unmetCount = gateStatuses.filter(g => g.status !== 'met').length

  // Fetch active missions for summary
  let activeMissionLabels: string[] = []
  try {
    const { data: missionRows } = await rawDb
      .from('player_mission_assignments')
      .select('mission_label')
      .eq('player_id', playerId)
      .eq('academy_id', academyId)
      .eq('status', 'active')
      .limit(3)
    activeMissionLabels = ((missionRows ?? []) as Array<{ mission_label: string }>).map(r => r.mission_label)
  } catch { /* migration not applied */ }

  // Determine readiness state
  let readinessState: ReadinessState = 'no_data'
  let readinessLabel = 'No data'
  let readinessColor = 'text-text-muted'

  if (gates.length === 0) {
    readinessState = 'no_data'
  } else if (advancementEligible) {
    readinessState = 'ready_for_review'
    readinessLabel = 'Ready for review'
    readinessColor = 'text-lime'
  } else {
    const pct = gates.length > 0 ? (metCount / gates.length) : 0
    if (pct >= 0.6) {
      readinessState = 'approaching'
      readinessLabel = 'Approaching readiness'
      readinessColor = 'text-status-blue'
    } else {
      readinessState = 'developing'
      readinessLabel = 'In development'
      readinessColor = 'text-text-secondary'
    }
  }

  const donnaSummary = buildReadinessSummary(
    playerName, nextLevelName, metCount, gates.length, advancementEligible, activeMissionLabels,
  )

  // Split met vs unmet for display
  const metGates   = gateStatuses.filter(g => g.status === 'met').slice(0, 5)
  const unmetGates = gateStatuses.filter(g => g.status !== 'met').slice(0, 5)

  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-surface-raised border-b border-border flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {currentLevelName && (
            <>
              <p className="text-xs font-semibold text-text-primary">{currentLevelName}</p>
              <ArrowRight className="w-3 h-3 text-text-muted" />
            </>
          )}
          <p className="text-xs font-semibold text-text-primary">{nextLevelName ?? 'No next level'}</p>
        </div>
        <span className={`text-[10px] font-bold ${readinessColor}`}>{readinessLabel}</span>
      </div>

      <div className="px-4 py-3 space-y-3">
        {/* Gate progress */}
        {gates.length > 0 && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Level Requirements</p>
              <p className="text-[10px] font-mono text-text-muted">
                <span className={metCount === gates.length ? 'text-lime' : ''}>{metCount}</span>/{gates.length}
              </p>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 rounded-full bg-surface-raised overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${advancementEligible ? 'bg-lime' : readinessState === 'approaching' ? 'bg-status-blue' : 'bg-text-muted/40'}`}
                style={{ width: `${gates.length > 0 ? Math.round((metCount / gates.length) * 100) : 0}%` }}
              />
            </div>

            {/* Met gates */}
            {metGates.length > 0 && (
              <div className="space-y-1">
                {metGates.map(g => (
                  <div key={g.id} className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-status-green shrink-0 mt-0.5" />
                    <p className="text-[11px] text-text-secondary leading-snug">{g.criterion}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Unmet gates */}
            {unmetGates.length > 0 && (
              <div className="space-y-1">
                {unmetGates.map(g => (
                  <div key={g.id} className="flex items-start gap-1.5">
                    <Circle className="w-3 h-3 text-border-strong shrink-0 mt-0.5" />
                    <p className="text-[11px] text-text-muted leading-snug">{g.criterion}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {gates.length === 0 && (
          <div className="flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-text-muted shrink-0" />
            <p className="text-[11px] text-text-muted">No gate requirements configured for this level.</p>
          </div>
        )}

        {/* DONNA summary */}
        <div className="flex items-start gap-2 pt-1 border-t border-border">
          <div className="w-4 h-4 rounded-full bg-lime/10 border border-lime/25 flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="w-2 h-2 text-lime" />
          </div>
          <p className="text-[11px] text-text-secondary leading-relaxed">{donnaSummary}</p>
        </div>

        <p className="text-[9px] text-text-muted">Level movement requires director review. No automatic advancement.</p>
      </div>
    </div>
  )
}
