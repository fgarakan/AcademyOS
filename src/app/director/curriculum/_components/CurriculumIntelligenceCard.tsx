// Mega Sprint 1996–2005 — Curriculum Intelligence Card V1
// Surfaces the most critical curriculum signals above the fold on the curriculum page.
// Director sees most blocked level, stall count, completion %, and Improve action
// without clicking into individual levels.

import Link from 'next/link'
import { Sparkles, AlertTriangle } from 'lucide-react'
import type { CurriculumRankingResult, CurriculumAttentionScore } from '@/lib/curriculum/curriculumAttentionRanking'

const SCORE_CHIP: Record<CurriculumAttentionScore, string> = {
  critical:        'text-status-red bg-status-red/10 border-status-red/30',
  needs_attention: 'text-status-orange bg-status-orange/10 border-status-orange/30',
  healthy:         'text-status-green bg-status-green/10 border-status-green/30',
}

const SCORE_LABEL: Record<CurriculumAttentionScore, string> = {
  critical:        'Critical',
  needs_attention: 'Needs Attention',
  healthy:         'Healthy',
}

interface Props {
  ranking: CurriculumRankingResult
}

export function CurriculumIntelligenceCard({ ranking }: Props) {
  if (!ranking.hasData) return null

  const shown = ranking.priorities.filter(p => p.stalledPlayers > 0 || p.avgCompletionPct < 80).slice(0, 3)
  if (shown.length === 0 && !ranking.topConcern) return null

  return (
    <div
      className="rounded-2xl border border-lime/20 bg-lime/[0.03] p-4 space-y-3"
      data-donna-focus-id="curriculum-intelligence"
    >
      {/* Header row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-lime shrink-0" />
          <p className="text-[10px] uppercase tracking-widest text-lime font-semibold">
            DONNA · Curriculum Intelligence
          </p>
        </div>
        <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${SCORE_CHIP[ranking.attentionScore]}`}>
          {SCORE_LABEL[ranking.attentionScore]}
        </span>
      </div>

      {/* Most blocked levels */}
      {shown.length > 0 && (
        <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
          {shown.map(p => (
            <div key={p.levelId} className="flex items-center gap-3 px-4 py-2.5 bg-surface">
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-text-primary truncate">{p.levelName}</p>
                <p className="text-[10px] font-mono text-text-muted mt-0.5">
                  {p.stalledPlayers} stalled · {p.avgCompletionPct}% completion
                  {p.lowestDomain ? ` · weak ${p.lowestDomain}` : ''}
                </p>
              </div>
              {p.levelKey && (
                <Link
                  href={`/director/curriculum?improve=${p.levelKey}`}
                  className="shrink-0 flex items-center gap-1 text-[10px] font-medium text-lime hover:opacity-80 transition-opacity whitespace-nowrap"
                >
                  <Sparkles className="w-3 h-3" />
                  Improve
                </Link>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Top tagged concern */}
      {ranking.topConcern && (
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-surface border border-border">
          <AlertTriangle className="w-3.5 h-3.5 text-status-orange shrink-0" />
          <p className="text-[11px] text-text-secondary min-w-0">
            <span className="font-medium text-text-primary capitalize">{ranking.topConcern}</span>
            {' '}tagged as concern{' '}
            <span className="font-mono text-status-orange">{ranking.topConcernCount}×</span>
            {' '}this month
          </p>
        </div>
      )}
    </div>
  )
}
