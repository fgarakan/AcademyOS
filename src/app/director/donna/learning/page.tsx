import Link from 'next/link'
import { Brain, CheckCircle2, XCircle, Clock, ChevronRight, ArrowLeft, Sparkles } from 'lucide-react'
import { getSupabaseServer } from '@/lib/supabase/server'
import { Card, CardContent, EmptyState } from '@/components/ui'
import { loadRecommendationFeedbackSummary, formatLearningSignalsForDonna } from '@/lib/donna/donnaRecommendationLearningLoader'

// Sprint 921 — DONNA Recommendation Learning Dashboard V1

const TYPE_LABELS: Record<string, string> = {
  operating_priority: 'Operating Priorities',
  review_queue:       'Review Queue Guidance',
  onboarding_guide:   'Onboarding Steps',
  curriculum_gap:     'Curriculum Gaps',
  player_attention:   'Player Attention',
}

export default async function DonnaLearningPage() {
  const db = await getSupabaseServer()
  const { data: { user } } = await db.auth.getUser()

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-secondary text-sm">Please sign in.</p>
      </div>
    )
  }

  const { data: profile } = await db.from('profiles').select('academy_id').eq('id', user.id).single()
  const academyId = profile?.academy_id ?? null

  const summary = academyId
    ? await loadRecommendationFeedbackSummary(db, academyId)
    : null

  const learningMessage = summary ? formatLearningSignalsForDonna(summary) : null

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto animate-fade-in">

      <Link href="/director/donna" className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" />
        DONNA
      </Link>

      <div>
        <p className="page-eyebrow text-lime">DONNA Intelligence</p>
        <h1 className="page-title">What I'm Learning</h1>
        <p className="page-subtitle">
          Aggregate signals from your interactions with DONNA suggestions.
          No raw content, no individual notes — safe counts only.
        </p>
      </div>

      {!summary || !summary.hasData ? (
        <Card>
          <CardContent className="py-16">
            <EmptyState
              icon={<Brain className="w-6 h-6" />}
              title="No feedback signals yet"
              description="As you interact with DONNA's review queue suggestions and recommendations, I'll track what you find useful and what you dismiss. This helps me improve what I surface."
            />
          </CardContent>
        </Card>
      ) : (
        <>
          {/* DONNA Learning Summary */}
          {learningMessage && (
            <div className="rounded-xl border border-lime/15 bg-lime/4 px-4 py-4 space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-lime shrink-0" />
                <p className="text-[10px] uppercase tracking-widest font-semibold text-lime">DONNA</p>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">{learningMessage}</p>
            </div>
          )}

          {/* Stat grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Accepted" value={summary.acceptedCount} icon={<CheckCircle2 className="w-4 h-4 text-status-green" />} color="green" />
            <StatCard label="Dismissed" value={summary.rejectedCount} icon={<XCircle className="w-4 h-4 text-status-red" />} color="red" />
            <StatCard label="Deferred" value={summary.deferredCount} icon={<Clock className="w-4 h-4 text-text-muted" />} color="default" />
            <StatCard label="Total Logged" value={summary.totalCount} icon={<Brain className="w-4 h-4 text-lime" />} color="lime" />
          </div>

          {/* Acceptance rate */}
          {summary.acceptanceRate !== null && (
            <Card>
              <CardContent className="py-4 space-y-3">
                <p className="label-xs">Acceptance Rate</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-surface-raised rounded-full overflow-hidden">
                    <div
                      className="h-full bg-status-green rounded-full transition-all"
                      style={{ width: `${Math.round(summary.acceptanceRate * 100)}%` }}
                    />
                  </div>
                  <span className="font-mono text-sm font-bold text-status-green shrink-0">
                    {Math.round(summary.acceptanceRate * 100)}%
                  </span>
                </div>
                {summary.recentFeedbackCount > 0 && (
                  <p className="text-xs text-text-muted">
                    {summary.recentFeedbackCount} interactions in the last 30 days.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Top patterns */}
          {(summary.topRecommendationType || summary.topRejectedType) && (
            <Card>
              <CardContent className="py-4 space-y-3">
                <p className="label-xs">Signal Patterns</p>
                {summary.topRecommendationType && (
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-status-green shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-text-primary">
                        Most acted on: {TYPE_LABELS[summary.topRecommendationType] ?? summary.topRecommendationType}
                      </p>
                      <p className="text-[11px] text-text-muted">You find this type of recommendation useful.</p>
                    </div>
                  </div>
                )}
                {summary.topRejectedType && summary.rejectedCount > 2 && (
                  <div className="flex items-start gap-2">
                    <XCircle className="w-3.5 h-3.5 text-status-red shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-text-primary">
                        Most dismissed: {TYPE_LABELS[summary.topRejectedType] ?? summary.topRejectedType}
                      </p>
                      <p className="text-[11px] text-text-muted">
                        I should surface this type less prominently.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      <div className="flex items-center gap-2">
        <Link href="/director/donna" className="inline-flex items-center gap-1 text-xs text-lime hover:opacity-80 transition-opacity">
          Back to DONNA <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  )
}

// ── Sub-component ─────────────────────────────────────────────────────────────

type StatColor = 'lime' | 'green' | 'red' | 'orange' | 'default'

const STAT_COLOR: Record<StatColor, string> = {
  lime:    'text-lime',
  green:   'text-status-green',
  red:     'text-status-red',
  orange:  'text-status-orange',
  default: 'text-text-primary',
}

function StatCard({ label, value, icon, color = 'default' }: {
  label: string
  value: number
  icon?: React.ReactNode
  color?: StatColor
}) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="label-xs">{label}</p>
        {icon && <span className="opacity-60">{icon}</span>}
      </div>
      <p className={`font-mono text-3xl font-bold ${STAT_COLOR[color]}`}>{value}</p>
    </div>
  )
}
