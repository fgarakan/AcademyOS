// Sprint 1131-1140 — Development Timeline
//
// Shows the last 5 meaningful development events for a player.
// Full timeline hidden behind a "Show full timeline" toggle.
//
// Event types surfaced:
//   - Assessment completed
//   - Blueprint generated
//   - Mission assigned / completed
//   - Placement recommendation (DONNA)
//   - Director placement decision
//   - Level readiness review
//
// Constitution:
//   - Default: 5 events
//   - Full history: collapsed
//   - Role-safe labels (no raw coach notes in events)

import { getSupabaseServer } from '@/lib/supabase/server'
import { CollapsedDetailSection } from '@/components/donna/CollapsedDetailSection'
import { ClipboardList, Target, Sparkles, CheckCircle2, BookOpen, Star } from 'lucide-react'

interface DevelopmentTimelineProps {
  playerId: string
  academyId: string
}

interface TimelineEvent {
  date: string
  type: string
  label: string
  detail: string | null
  icon: 'assessment' | 'blueprint' | 'mission' | 'placement' | 'level' | 'observation'
}

const ICON_MAP: Record<string, React.ElementType> = {
  assessment:  ClipboardList,
  blueprint:   Sparkles,
  mission:     Target,
  placement:   CheckCircle2,
  level:       BookOpen,
  observation: Star,
}

function formatEventDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export async function DevelopmentTimeline({ playerId, academyId }: DevelopmentTimelineProps) {
  const supabase = await getSupabaseServer()
  const rawDb = supabase as any

  const allEvents: TimelineEvent[] = []

  // Assessments
  const { data: assessments } = await supabase
    .from('assessments')
    .select('id, assessed_date, type, overall_score')
    .eq('player_id', playerId)
    .eq('academy_id', academyId)
    .order('assessed_date', { ascending: false })
    .limit(5)

  for (const a of assessments ?? []) {
    const typeLabel = (a.type as string).replace(/_/g, ' ')
    allEvents.push({
      date: a.assessed_date,
      type: 'Assessment',
      label: `${typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1)} completed`,
      detail: a.overall_score !== null ? `Overall score: ${(a.overall_score as number).toFixed(1)}/10` : null,
      icon: 'assessment',
    })
  }

  // Blueprints
  try {
    const { data: blueprints } = await rawDb
      .from('player_development_blueprints')
      .select('id, generated_at, curriculum_level_name, status')
      .eq('player_id', playerId)
      .eq('academy_id', academyId)
      .order('generated_at', { ascending: false })
      .limit(3)

    for (const b of blueprints ?? []) {
      allEvents.push({
        date: b.generated_at,
        type: 'Blueprint',
        label: 'Development blueprint created',
        detail: b.curriculum_level_name ? `Level: ${b.curriculum_level_name as string}` : null,
        icon: 'blueprint',
      })
    }
  } catch { /* migration 078 not applied */ }

  // Missions
  try {
    const { data: missions } = await rawDb
      .from('player_mission_assignments')
      .select('id, mission_label, status, created_at, completed_at')
      .eq('player_id', playerId)
      .eq('academy_id', academyId)
      .order('created_at', { ascending: false })
      .limit(5)

    for (const m of missions ?? []) {
      allEvents.push({
        date: m.created_at,
        type: 'Mission',
        label: `Mission assigned: ${m.mission_label as string}`,
        detail: null,
        icon: 'mission',
      })
      if (m.completed_at) {
        allEvents.push({
          date: m.completed_at,
          type: 'Mission',
          label: `Mission completed: ${m.mission_label as string}`,
          detail: null,
          icon: 'mission',
        })
      }
    }
  } catch { /* migration 076 not applied */ }

  // DONNA placement recommendations
  try {
    const { data: placements } = await rawDb
      .from('donna_placement_recommendations')
      .select('id, generated_at, recommended_level_name, confidence_score, decision, final_level_name')
      .eq('player_id', playerId)
      .eq('academy_id', academyId)
      .order('generated_at', { ascending: false })
      .limit(3)

    for (const p of placements ?? []) {
      allEvents.push({
        date: p.generated_at,
        type: 'Placement',
        label: `DONNA placement recommendation: ${p.recommended_level_name as string}`,
        detail: p.confidence_score !== null ? `Confidence: ${p.confidence_score as number}%` : null,
        icon: 'placement',
      })
      if (p.decision) {
        const decisionLabel = (p.decision as string).charAt(0).toUpperCase() + (p.decision as string).slice(1)
        allEvents.push({
          date: p.generated_at,
          type: 'Director Decision',
          label: `Placement ${decisionLabel.toLowerCase()}: ${(p.final_level_name ?? p.recommended_level_name) as string}`,
          detail: null,
          icon: 'placement',
        })
      }
    }
  } catch { /* migration 080 not applied */ }

  // Sort all events by date descending
  allEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  if (allEvents.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface px-4 py-4">
        <p className="text-xs text-text-muted">No development events recorded yet. Events appear as assessments, blueprints, and missions are created.</p>
      </div>
    )
  }

  const recentEvents = allEvents.slice(0, 5)
  const olderEvents  = allEvents.slice(5)

  return (
    <div className="space-y-2">
      {/* Recent 5 events */}
      <div className="space-y-1">
        {recentEvents.map((ev, i) => {
          const Icon = ICON_MAP[ev.icon] ?? Star
          return (
            <div key={i} className="flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-raised transition-colors">
              {/* Timeline dot + line */}
              <div className="flex flex-col items-center shrink-0">
                <div className="w-6 h-6 rounded-full bg-surface-raised border border-border flex items-center justify-center">
                  <Icon className="w-3 h-3 text-text-muted" />
                </div>
                {i < recentEvents.length - 1 && (
                  <div className="w-px h-3 bg-border mt-0.5" />
                )}
              </div>
              {/* Event content */}
              <div className="flex-1 min-w-0 pb-1">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <p className="text-[10px] text-text-muted shrink-0">{formatEventDate(ev.date)}</p>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-text-muted">—</p>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-text-muted">{ev.type}</p>
                </div>
                <p className="text-xs font-semibold text-text-primary leading-tight mt-0.5">{ev.label}</p>
                {ev.detail && <p className="text-[10px] text-text-muted mt-0.5">{ev.detail}</p>}
              </div>
            </div>
          )
        })}
      </div>

      {/* Older events collapsed */}
      {olderEvents.length > 0 && (
        <CollapsedDetailSection label="Earlier events" count={olderEvents.length}>
          <div className="space-y-1">
            {olderEvents.map((ev, i) => {
              const Icon = ICON_MAP[ev.icon] ?? Star
              return (
                <div key={i} className="flex items-start gap-3 px-1 py-2">
                  <div className="w-5 h-5 rounded-full bg-surface-raised border border-border flex items-center justify-center shrink-0">
                    <Icon className="w-2.5 h-2.5 text-text-muted" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-text-muted">{formatEventDate(ev.date)}</p>
                    <p className="text-[11px] font-semibold text-text-secondary leading-tight">{ev.label}</p>
                    {ev.detail && <p className="text-[10px] text-text-muted">{ev.detail}</p>}
                  </div>
                </div>
              )
            })}
          </div>
        </CollapsedDetailSection>
      )}
    </div>
  )
}
