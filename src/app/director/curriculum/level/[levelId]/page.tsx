import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Shield } from 'lucide-react'
import { getSupabaseServer } from '@/lib/supabase/server'
import { getCurriculumExplorerData } from '@/lib/backend/curriculumExplorer'
import { CurriculumLevelBuilderShell } from '@/components/curriculum/builder/CurriculumLevelBuilderShell'

interface Props {
  params: { levelId: string }
}

const STAGE_INTENT: Record<string, { goal: string; intent: string; dot: string }> = {
  red_foundation:     { goal: 'Build spatial awareness and foundational movement', intent: 'Players at this stage need repetition, play, and short feedback loops. The goal is enjoyment + fundamentals.', dot: '#ef4444' },
  orange_development: { goal: 'Establish real tennis patterns and stroke consistency', intent: 'Players are learning to direct the ball. The goal is controlled groundstrokes and pattern recognition.', dot: '#f97316' },
  green_performance:  { goal: 'Develop tactical thinking and serve mechanics', intent: 'Players are entering full-court play. The goal is depth, direction, and serve introduction.', dot: '#22c55e' },
  yellow_competitive: { goal: 'Compete effectively and manage match situations', intent: 'Players are tournament-ready. The goal is consistency under pressure, net play, and mental skills.', dot: '#eab308' },
  high_performance:   { goal: 'Refine technique, compete at high level, develop elite habits', intent: 'Players are on a development pathway. The goal is measurable performance improvement and championship mindset.', dot: '#a78bfa' },
}

export default async function CurriculumLevelPage({ params }: Props) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const explorerData = await getCurriculumExplorerData(supabase)
  const level = explorerData.levels.find(l => l.id === params.levelId)

  if (!level) notFound()

  const stageIntent = STAGE_INTENT[level.stage ?? '']

  return (
    <div className="animate-fade-in p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link href="/director/curriculum/map" className="text-text-muted hover:text-lime transition-colors mt-1">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {stageIntent && (
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: stageIntent.dot }} />
            )}
            <p className="page-eyebrow">{level.stage?.replace(/_/g, ' ')}</p>
          </div>
          <h1 className="page-title">{level.display_name}</h1>
          {stageIntent && (
            <p className="text-sm text-text-secondary mt-1 max-w-xl">{stageIntent.goal}</p>
          )}
        </div>
      </div>

      {/* Development intent + advancement */}
      {stageIntent && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-border bg-surface-raised px-5 py-4">
            <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold mb-2">Development Intent</p>
            <p className="text-[12px] text-text-secondary leading-relaxed">{stageIntent.intent}</p>
          </div>
          <div className="rounded-xl border border-border bg-surface-raised px-5 py-4">
            <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold mb-2">Advancement Requirements</p>
            <div className="space-y-1">
              {level.advance_min_outcomes > 0 && (
                <p className="text-[12px] text-text-secondary"><span className="font-mono text-lime">{level.advance_min_outcomes}</span> outcomes required</p>
              )}
              {level.advance_min_domains_complete > 0 && (
                <p className="text-[12px] text-text-secondary"><span className="font-mono text-lime">{level.advance_min_domains_complete}</span> domains must be complete</p>
              )}
              {level.advance_min_assessment_score != null && (
                <p className="text-[12px] text-text-secondary">Min assessment score: <span className="font-mono text-lime">{level.advance_min_assessment_score}</span></p>
              )}
              {level.min_utr != null && (
                <p className="text-[12px] text-text-secondary">Min UTR: <span className="font-mono text-lime">{level.min_utr}</span></p>
              )}
              {level.is_assessment_required && (
                <p className="text-[12px] text-status-orange">Assessment required before advancement</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Draft mode banner */}
      <div className="rounded-xl border border-lime/10 bg-lime/[0.02] flex items-center gap-2.5 px-4 py-3">
        <Shield className="w-3.5 h-3.5 text-lime shrink-0" />
        <p className="text-[11px] text-text-muted">
          <span className="text-lime font-semibold">Draft mode — </span>
          All changes create a draft in the Review Queue. Nothing is applied until you approve it there.
        </p>
      </div>

      <CurriculumLevelBuilderShell level={level} data={explorerData} />
    </div>
  )
}
