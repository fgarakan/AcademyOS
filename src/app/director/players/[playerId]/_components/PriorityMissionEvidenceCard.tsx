// Sprint 1131-1140 — Priority → Mission → Evidence Connection
//
// Shows the chain from a development priority to its linked mission and evidence.
// Director sees: priority → mission → 1-3 evidence points → DONNA explanation
// Coach sees: same (director-only component, safe to show all)
// Parent/player: never shown (this is a director/coach component)
//
// Server Component — fetches its own evidence data.
// Constitution: 1-3 evidence points default, full evidence behind expand.

import { getSupabaseServer } from '@/lib/supabase/server'
import { ChevronRight, Zap, Target, FileText, MessageSquare, ClipboardList } from 'lucide-react'

interface PriorityMissionEvidenceCardProps {
  playerId: string
  academyId: string
  priorityTitle: string
  priorityDescription?: string | null
  priorityCategory?: string | null
}

interface EvidencePoint {
  type: 'assessment' | 'coach_note' | 'mission' | 'gate'
  label: string
  detail: string
  date: string | null
}

interface LinkedMission {
  id: string
  label: string
  status: string
  description: string | null
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  technical: Zap,
  tactical: Target,
  mental: FileText,
  behavioral: FileText,
  competition: Target,
  fitness: Zap,
}

export async function PriorityMissionEvidenceCard({
  playerId,
  academyId,
  priorityTitle,
  priorityDescription,
  priorityCategory,
}: PriorityMissionEvidenceCardProps) {
  const supabase = await getSupabaseServer()
  const rawDb = supabase as any

  // Fetch linked mission (matches by priority title keyword or curriculum level)
  let linkedMission: LinkedMission | null = null
  try {
    const { data: missionRows } = await rawDb
      .from('player_mission_assignments')
      .select('id, mission_label, mission_description, status')
      .eq('player_id', playerId)
      .eq('academy_id', academyId)
      .in('status', ['active', 'pending_review'])
      .ilike('mission_label', `%${priorityTitle.split(' ')[0]}%`)
      .limit(1)
      .maybeSingle()

    if (missionRows) {
      linkedMission = {
        id: missionRows.id,
        label: missionRows.mission_label,
        status: missionRows.status,
        description: missionRows.mission_description ?? null,
      }
    }
  } catch { /* migrations not applied */ }

  // Collect 1-3 evidence points from assessments + observations
  const evidencePoints: EvidencePoint[] = []

  // 1. Latest assessment score for this category
  const categoryScoreMap: Record<string, string> = {
    technical: 'technical_score',
    tactical: 'tactical_score',
    fitness: 'movement_score',
    competition: 'competition_score',
    mental: 'behavioral_score',
    behavioral: 'behavioral_score',
  }
  const scoreField = categoryScoreMap[priorityCategory ?? '']
  if (scoreField) {
    // Use rawDb to avoid TS issues with dynamic field selection in template literal
    const { data: latestAssessment } = await rawDb
      .from('assessments')
      .select('id, assessed_date, technical_score, tactical_score, movement_score, competition_score, behavioral_score, overall_score')
      .eq('player_id', playerId)
      .eq('academy_id', academyId)
      .order('assessed_date', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (latestAssessment) {
      const record = latestAssessment as Record<string, unknown>
      const score = record[scoreField] as number | null
      const assessedDate = record['assessed_date'] as string | null
      if (score !== null && assessedDate) {
        const tier = score >= 7.5 ? 'strong' : score >= 5 ? 'developing' : 'needs work'
        evidencePoints.push({
          type: 'assessment',
          label: 'Assessment Score',
          detail: `${score.toFixed(1)}/10 — ${tier} (${new Date(assessedDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })})`,
          date: assessedDate,
        })
      }
    }
  }

  // 2. Most recent coach observation mentioning this priority
  if (evidencePoints.length < 3) {
    const { data: obsRows } = await rawDb
      .from('coach_observations')
      .select('id, content, created_at, observation_type')
      .eq('player_id', playerId)
      .eq('academy_id', academyId)
      .ilike('content', `%${priorityTitle.split(' ')[0]}%`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (obsRows) {
      const snippet = (obsRows.content as string).slice(0, 80)
      evidencePoints.push({
        type: 'coach_note',
        label: 'Coach Note',
        detail: `"${snippet}${(obsRows.content as string).length > 80 ? '…' : ''}"`,
        date: obsRows.created_at as string,
      })
    }
  }

  // 3. Mission status as evidence
  if (linkedMission && evidencePoints.length < 3) {
    evidencePoints.push({
      type: 'mission',
      label: 'Active Mission',
      detail: `${linkedMission.label} — ${linkedMission.status.replace(/_/g, ' ')}`,
      date: null,
    })
  }

  const CategoryIcon = CATEGORY_ICONS[priorityCategory ?? ''] ?? Target

  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      {/* Priority header */}
      <div className="px-4 py-3 bg-surface-raised border-b border-border flex items-center gap-2">
        <CategoryIcon className="w-3.5 h-3.5 text-lime shrink-0" />
        <p className="text-xs font-bold text-text-primary">{priorityTitle}</p>
        {priorityCategory && (
          <span className="text-[9px] font-bold uppercase tracking-wide text-text-muted bg-surface border border-border rounded px-1.5 py-0.5 ml-auto">
            {priorityCategory}
          </span>
        )}
      </div>

      <div className="px-4 py-3 space-y-3">
        {/* Description */}
        {priorityDescription && (
          <p className="text-[11px] text-text-muted leading-relaxed">{priorityDescription}</p>
        )}

        {/* Chain: Priority → Mission */}
        {linkedMission && (
          <div className="flex items-start gap-2">
            <ChevronRight className="w-3 h-3 text-lime mt-0.5 shrink-0" />
            <div>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-0.5">Linked Mission</p>
              <p className="text-xs font-semibold text-text-primary">{linkedMission.label}</p>
              {linkedMission.description && (
                <p className="text-[10px] text-text-muted leading-relaxed mt-0.5">{linkedMission.description}</p>
              )}
              <span className={`inline-block text-[8px] font-bold uppercase tracking-wide rounded px-1.5 py-0.5 mt-1 border ${
                linkedMission.status === 'active'
                  ? 'text-lime bg-lime/8 border-lime/20'
                  : 'text-status-orange bg-status-orange/8 border-status-orange/20'
              }`}>
                {linkedMission.status.replace(/_/g, ' ')}
              </span>
            </div>
          </div>
        )}

        {/* Evidence points */}
        {evidencePoints.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Evidence</p>
            {evidencePoints.map((ev, i) => {
              const EvidenceIcon = ev.type === 'assessment' ? ClipboardList : ev.type === 'coach_note' ? MessageSquare : Target
              return (
                <div key={i} className="flex items-start gap-2">
                  <EvidenceIcon className="w-3 h-3 text-text-muted shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold text-text-muted">{ev.label}</p>
                    <p className="text-[11px] text-text-secondary leading-snug">{ev.detail}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {evidencePoints.length === 0 && !linkedMission && (
          <p className="text-[11px] text-text-muted">No linked evidence yet. Assessment scores, coach notes, and missions will appear here as they are added.</p>
        )}
      </div>
    </div>
  )
}
