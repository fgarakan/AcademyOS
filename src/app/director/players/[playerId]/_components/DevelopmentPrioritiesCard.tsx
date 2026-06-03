// Development Priorities Card — Server Component
// Loads player evidence, derives level readiness, runs priorities engine.
// Renders top development priorities + strengths + coach focus.
// Director/coach facing only — no parent/player exposure.

import { getSupabaseServer } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui'
import { Target, Sparkles, TrendingUp } from 'lucide-react'
import { getPlayerEvidenceRecords } from '@/lib/evidence/playerEvidenceAggregator'
import { calculateLevelReadiness } from '@/lib/evidence/levelReadinessEngine'
import {
  calculateDevelopmentPriorities,
  PRIORITY_CATEGORY_LABELS,
  type PriorityCategory,
} from '@/lib/evidence/developmentPrioritiesEngine'

interface DevelopmentPrioritiesCardProps {
  playerId:         string
  academyId:        string
  playerFirstName:  string | null
  currentLevelName: string | null
}

const URGENCY_COLORS: Record<'high' | 'medium' | 'low', string> = {
  high:   'text-status-red bg-status-red/8 border-status-red/25',
  medium: 'text-status-orange bg-status-orange/8 border-status-orange/25',
  low:    'text-text-muted bg-surface-raised border-border',
}

const CATEGORY_ICONS: Record<PriorityCategory, string> = {
  technical:   '⚡',
  tactical:    '🎯',
  competition: '🏆',
  movement:    '🏃',
  mental:      '🧠',
  behavior:    '⭐',
}

export async function DevelopmentPrioritiesCard({
  playerId,
  academyId,
  playerFirstName,
  currentLevelName,
}: DevelopmentPrioritiesCardProps) {
  const supabase = await getSupabaseServer()

  const { records } = await getPlayerEvidenceRecords(supabase, playerId, academyId, {
    limit: 60,
    visibleToRole: 'director',
  })

  const readinessResult = calculateLevelReadiness({
    evidenceRecords:  records,
    currentLevelName,
    targetLevelName:  null,
    playerFirstName,
  })

  const result = calculateDevelopmentPriorities({
    evidenceRecords:  records,
    readinessResult,
    playerFirstName,
    currentLevelName,
  })

  const hasData = result.topPriorities.length > 0 || result.strengths.length > 0

  return (
    <div data-donna-focus-id="player-priorities-card">
      <Card>
      <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Target className="w-3.5 h-3.5 text-text-muted shrink-0" />
          <p className="label-xs">Development Priorities</p>
        </div>
        <span className="text-[9px] text-text-muted font-mono">
          {result.confidence}% confidence · {result.totalEvidenceUsed} records
        </span>
      </div>

      <CardContent className="py-4 space-y-4">
        {!hasData ? (
          <div className="flex items-start gap-2.5">
            <Sparkles className="w-3.5 h-3.5 text-lime shrink-0 mt-0.5" />
            <p className="text-xs text-text-secondary leading-relaxed">
              {result.donnaExplanation}
            </p>
          </div>
        ) : (
          <>
            {/* DONNA summary */}
            <div className="flex items-start gap-2.5">
              <Sparkles className="w-3.5 h-3.5 text-lime shrink-0 mt-0.5" />
              <p className="text-xs text-text-secondary leading-relaxed">
                {result.donnaExplanation}
              </p>
            </div>

            {/* Top priorities */}
            {result.topPriorities.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-widest text-text-muted">Top Priorities</p>
                <div className="space-y-1.5">
                  {result.topPriorities.map(p => (
                    <div
                      key={p.rank}
                      className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-surface border border-border"
                    >
                      <span className="text-sm font-bold font-mono text-text-muted shrink-0 w-4">
                        {p.rank}.
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <p className="text-xs font-semibold text-text-primary">
                            {CATEGORY_ICONS[p.category]} {p.label}
                          </p>
                          {p.isBlockingAdvancement && (
                            <span className="text-[8px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-status-red/10 border border-status-red/25 text-status-red">
                              Blocking
                            </span>
                          )}
                          <span className={`text-[8px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded border ml-auto ${URGENCY_COLORS[p.urgency]}`}>
                            {p.urgency}
                          </span>
                        </div>
                        <p className="text-[10px] text-text-muted leading-snug line-clamp-2">
                          {p.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Strengths */}
            {result.strengths.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] uppercase tracking-widest text-text-muted">Strengths</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.strengths.map(s => (
                    <span
                      key={s.category}
                      className="flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-lg bg-status-green/8 border border-status-green/20 text-status-green"
                    >
                      <TrendingUp className="w-2.5 h-2.5" />
                      {s.label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Coach focus */}
            {result.coachFocusAreas.length > 0 && (
              <div className="pt-1 border-t border-border space-y-1">
                <p className="text-[10px] uppercase tracking-widest text-text-muted">Coach Focus</p>
                {result.coachFocusAreas.slice(0, 2).map((focus, i) => (
                  <p key={i} className="text-[11px] text-text-secondary leading-snug">
                    · {focus}
                  </p>
                ))}
              </div>
            )}

            {/* Recommended next assessment */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-border">
              <p className="text-[10px] text-text-muted leading-snug">
                <span className="text-text-muted">Next: </span>
                {result.recommendedNextAssessment}
              </p>
            </div>
          </>
        )}
      </CardContent>
      </Card>
    </div>
  )
}
