// Level Readiness Card — Server Component
// Loads player evidence, runs calculateLevelReadiness, renders a compact readiness signal.
// Sits at the top of the Assessments tab to give context before the assessment form.
// No automatic promotion. Director approval required.

import Link from 'next/link'
import { getSupabaseServer } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui'
import { Sparkles, ChevronRight, AlertCircle, TrendingUp } from 'lucide-react'
import { getPlayerEvidenceRecords } from '@/lib/evidence/playerEvidenceAggregator'
import {
  calculateLevelReadiness,
  READINESS_STATUS_LABELS,
  READINESS_STATUS_COLORS,
} from '@/lib/evidence/levelReadinessEngine'

interface LevelReadinessCardProps {
  playerId:         string
  academyId:        string
  playerFirstName:  string | null
  currentLevelName: string | null
  nextLevelName:    string | null
}

export async function LevelReadinessCard({
  playerId,
  academyId,
  playerFirstName,
  currentLevelName,
  nextLevelName,
}: LevelReadinessCardProps) {
  const supabase = await getSupabaseServer()

  const { records } = await getPlayerEvidenceRecords(supabase, playerId, academyId, {
    limit: 60,
    visibleToRole: 'director',
  })

  const result = calculateLevelReadiness({
    evidenceRecords:  records,
    currentLevelName,
    targetLevelName:  nextLevelName,
    playerFirstName,
  })

  const statusColorClass = READINESS_STATUS_COLORS[result.readinessStatus]
  const statusLabel      = READINESS_STATUS_LABELS[result.readinessStatus]

  return (
    <div data-donna-focus-id="player-readiness-card">
      <Card>
      <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-3.5 h-3.5 text-text-muted shrink-0" />
          <p className="label-xs">Level Readiness</p>
        </div>
        <span className={`text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${statusColorClass}`}>
          {statusLabel}
        </span>
      </div>

      <CardContent className="py-4 space-y-3">
        {/* DONNA explanation */}
        <div className="flex items-start gap-2.5">
          <Sparkles className="w-3.5 h-3.5 text-lime shrink-0 mt-0.5" />
          <p className="text-xs text-text-secondary leading-relaxed">
            {result.donnaExplanation}
          </p>
        </div>

        {/* Stale evidence warning */}
        {result.staleEvidence.length > 0 && (
          <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-status-orange/5 border border-status-orange/20">
            <AlertCircle className="w-3.5 h-3.5 text-status-orange shrink-0 mt-0.5" />
            <p className="text-[11px] text-status-orange leading-snug">
              {result.staleEvidence.length} evidence record{result.staleEvidence.length !== 1 ? 's' : ''} expired — run an updated assessment to refresh.
            </p>
          </div>
        )}

        {/* Missing categories */}
        {result.missingCategories.length > 0 && result.readinessStatus !== 'insufficient_evidence' && (
          <div className="flex flex-wrap gap-1.5">
            <span className="text-[10px] text-text-muted">Missing:</span>
            {result.missingCategories.slice(0, 4).map(cat => (
              <span
                key={cat}
                className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-surface-raised border border-border text-text-muted"
              >
                {cat.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        )}

        {/* Recommended action */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="min-w-0">
            <p className="text-[10px] text-text-muted uppercase tracking-widest mb-0.5">Recommended</p>
            <p className="text-xs text-text-secondary leading-snug">{result.recommendedNextAction}</p>
          </div>
          <Link
            href={`/director/players/${playerId}#evidence`}
            className="shrink-0 flex items-center gap-1 text-[10px] text-text-muted hover:text-text-secondary transition-colors"
          >
            View Evidence
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Confidence + evidence count */}
        <div className="flex items-center gap-3 pt-0.5 border-t border-border">
          <span className="text-[10px] text-text-muted">
            Confidence: <span className="font-mono text-text-secondary">{result.confidence}%</span>
          </span>
          <span className="text-[10px] text-text-muted">
            Evidence: <span className="font-mono text-text-secondary">{result.totalEvidenceCount}</span> records
          </span>
          <span className="text-[10px] text-text-muted ml-auto">
            Score: <span className="font-mono text-text-secondary">{result.readinessScore}</span>/100
          </span>
        </div>
      </CardContent>
      </Card>
    </div>
  )
}
