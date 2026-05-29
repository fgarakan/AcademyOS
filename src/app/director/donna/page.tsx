import Link from 'next/link'
import {
  Sparkles, ChevronRight, AlertCircle,
  Users, ShieldCheck, ArrowRight,
  AlertTriangle, CheckCircle2, ClipboardList,
} from 'lucide-react'
import { getSupabaseServer } from '@/lib/supabase/server'
import { loadDirectorDonnaContext } from '@/lib/donna/directorDonnaContext'
import { Card, CardHeader, CardContent } from '@/components/ui'
import { DonnaDirectorShellClient } from './DonnaDirectorShellClient'
import { DonnaContextSummaryCard } from '@/components/donna/DonnaContextSummaryCard'
import type { ContextSummaryItem, ContextSourceLabel } from '@/components/donna/DonnaContextSummaryCard'
import { DONNAAcademyPulseCard } from '@/components/donna/DONNAAcademyPulseCard'
import type { PulseTrend } from '@/components/donna/DONNAAcademyPulseCard'
import { DonnaEntitySummarySection } from './DonnaEntitySummarySection'
import { DonnaInsightSection } from './DonnaInsightSection'
import { generateDonnaInsights } from '@/lib/donna/donnaInsightEngine'

// ── Director DONNA command center — Sprint 1038/1040 wiring + Sprint 777 AIQS
// Full page wiring: loads DirectorDonnaContext, renders attention items, risks,
// recommended actions, context summary card, and the DonnaVoiceReadyShell thread.
// Sprint 777: removed duplicate Daily Glance card (stats live in DonnaContextSummaryCard),
// removed Quick Navigation card (sidebar covers nav), removed full-width Daily Brief
// and Review Queue Surface sections (created fourth zone duplicating left column).
// No DB writes. No approvals on this page.

const URGENCY_COLOR: Record<string, string> = {
  high:   'text-status-red border-status-red/20 bg-status-red/10',
  medium: 'text-status-orange border-status-orange/20 bg-status-orange/10',
  low:    'text-text-muted border-border bg-surface-raised',
}

const RISK_COLOR: Record<string, string> = {
  high:   'bg-status-red/10 text-status-red border-status-red/20',
  medium: 'bg-status-orange/10 text-status-orange border-status-orange/20',
  low:    'bg-surface-raised text-text-muted border-border',
}

const CATEGORY_ICON: Record<string, React.ReactNode> = {
  review:      <ClipboardList className="w-3.5 h-3.5" />,
  approve:     <CheckCircle2 className="w-3.5 h-3.5" />,
  investigate: <AlertCircle className="w-3.5 h-3.5" />,
  communicate: <Users className="w-3.5 h-3.5" />,
}

export default async function DirectorDonnaPage() {
  const db = await getSupabaseServer()
  const { data: { user } } = await db.auth.getUser()

  let academyId: string | null = null

  if (user) {
    const { data: profile } = await db.from('profiles').select('academy_id').eq('id', user.id).single()
    academyId = profile?.academy_id ?? null
  }

  const ctx = academyId
    ? await loadDirectorDonnaContext(db, academyId)
    : null

  // Sprint 920 — generate insights from ctx (deterministic, no DB calls, no mutations)
  const donnaInsights = ctx ? generateDonnaInsights(ctx, 4) : []

  const isLive = ctx?.isLive ?? false
  const pendingReviews    = ctx?.pendingReviews    ?? 3
  const missingWrapUps    = ctx?.missingWrapUps    ?? 2
  const todaySessions     = ctx?.todaySessions     ?? 5
  const attentionItems    = ctx?.attentionItems    ?? []
  const academyRisks      = ctx?.academyRisks      ?? []
  const recommendedActions = ctx?.recommendedActions ?? []

  // Build context summary items for DonnaContextSummaryCard (right column)
  // These are the 4 key stats — previously duplicated in a left-column "Today at a Glance"
  // card that has been removed. DonnaContextSummaryCard is now the single source for them.
  const contextSummaryItems: ContextSummaryItem[] = ctx ? [
    { label: 'Sessions today', value: todaySessions },
    { label: 'Pending reviews', value: pendingReviews },
    { label: 'Missing wrap-ups', value: missingWrapUps },
    { label: 'Attention flags', value: attentionItems.length },
  ] : [
    { label: 'Sessions today', value: 5, note: 'demo' },
    { label: 'Pending reviews', value: 3, note: 'demo' },
  ]

  const contextSourceLabels: ContextSourceLabel[] = (ctx?.sourceLabels ?? []).map(s => ({
    field: s.field,
    status: s.status as ContextSourceLabel['status'],
    label: s.label,
  }))

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-[11px] text-text-muted select-none">
        <Link href="/director" className="hover:text-text-secondary transition-colors">AcademyOS</Link>
        <ChevronRight className="w-3 h-3 text-text-muted/40" />
        <span className="text-text-secondary font-medium">DONNA</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-lime/15 border border-lime/25 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-lime" />
            </div>
            <h1 className="text-2xl font-bold text-text-primary">DONNA</h1>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-status-green/10 text-status-green border border-status-green/20">
              <span className="w-1.5 h-1.5 rounded-full bg-status-green" />
              Director
            </span>
          </div>
          <p className="text-sm text-text-secondary">Academy COO assistant — command center, intelligence, review queue.</p>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] ${
          isLive
            ? 'border-status-green/20 bg-status-green/5 text-status-green'
            : 'border-status-orange/20 bg-status-orange/5 text-status-orange'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-status-green' : 'bg-status-orange'}`} />
          {isLive ? 'Live data' : 'Demo mode'}
        </div>
      </div>

      {/* Main 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_3fr] gap-6">

        {/* ── Left column: focused context panels (max 4, all signal-bearing) ── */}
        {/* Sprint 777: removed "Today at a Glance" (stats live in DonnaContextSummaryCard) */}
        {/* Sprint 777: removed "Quick Navigation" (sidebar covers this; not signal-bearing) */}
        <div className="space-y-4">

          {/* Academy Pulse — always shown; health score + trend + urgent counts */}
          {(() => {
            const highRisk = attentionItems.filter(i => i.risk === 'high').length
            const medRisk  = attentionItems.filter(i => i.risk === 'medium').length
            const rawScore = isLive ? Math.max(0, 100 - highRisk * 15 - medRisk * 5 - missingWrapUps * 3) : null
            const healthScore = rawScore !== null ? Math.round(rawScore) : null
            const hasHighRisk = (academyRisks ?? []).some((r: { urgency: string }) => r.urgency === 'high')
            const pulseTrend: PulseTrend = !isLive ? 'unknown' : hasHighRisk ? 'down' : attentionItems.length === 0 ? 'up' : 'stable'
            const trendNote = (academyRisks?.[0] as { signal?: string } | undefined)?.signal ?? null
            return (
              <DONNAAcademyPulseCard
                healthScore={healthScore}
                trend={pulseTrend}
                trendNote={trendNote}
                urgentItems={pendingReviews}
                atRiskPlayers={highRisk}
                isLive={isLive}
                lastUpdatedLabel={isLive ? 'Just now' : null}
              />
            )
          })()}

          {/* Attention Items — conditional */}
          {attentionItems.length > 0 && (
            <Card>
              <CardHeader>
                <span className="label-xs flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-status-orange" />
                  Attention Needed
                </span>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {attentionItems.slice(0, 4).map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span className={`mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold border shrink-0 ${RISK_COLOR[item.risk] ?? RISK_COLOR.low}`}>
                        {item.risk.toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-text-primary truncate">{item.playerName ?? 'Player'}</p>
                        <p className="text-xs text-text-muted leading-snug">{item.reason}</p>
                      </div>
                    </div>
                  ))}
                  {attentionItems.length > 4 && (
                    <p className="text-xs text-text-muted">+{attentionItems.length - 4} more</p>
                  )}
                </div>
                <Link href="/director/players" className="flex items-center gap-1 mt-3 text-[11px] text-lime hover:text-lime/80">
                  View all players <ArrowRight className="w-3 h-3" />
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Academy Risks — conditional */}
          {academyRisks.length > 0 && (
            <Card>
              <CardHeader>
                <span className="label-xs flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-status-red" />
                  Academy Risks
                </span>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {academyRisks.slice(0, 3).map((risk, i) => (
                    <div key={i} className={`rounded-xl border px-3 py-2 ${URGENCY_COLOR[risk.urgency] ?? URGENCY_COLOR.low}`}>
                      <p className="text-xs font-semibold">{risk.signal}</p>
                      <p className="text-xs opacity-80 leading-snug mt-0.5">{risk.detail}</p>
                      {risk.actionHref && (
                        <Link href={risk.actionHref} className="inline-flex items-center gap-1 text-xs font-medium mt-1 opacity-90 hover:opacity-100">
                          Review <ArrowRight className="w-2.5 h-2.5" />
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sprint 920 — Insight Engine: deterministic pattern detection */}
          {donnaInsights.length > 0 && (
            <DonnaInsightSection insights={donnaInsights} />
          )}

          {/* Next Best Actions — conditional */}
          {recommendedActions.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <span className="label-xs flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-lime" />
                    Next Best Actions
                  </span>
                  <Link href="/director/review" className="text-xs text-lime/70 hover:text-lime transition-colors">
                    Review queue
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {recommendedActions.slice(0, 4).map(action => (
                    <Link
                      key={action.id}
                      href={action.href}
                      className="group flex items-start gap-2.5 px-3 py-2.5 rounded-xl border border-border hover:border-lime/25 hover:bg-lime/4 transition-all"
                    >
                      <span className="text-text-muted group-hover:text-lime transition-colors shrink-0 mt-0.5">
                        {CATEGORY_ICON[action.category] ?? <ArrowRight className="w-3.5 h-3.5" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-text-secondary group-hover:text-text-primary transition-colors">{action.label}</p>
                        <p className="text-xs text-text-muted leading-snug">{action.reason}</p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-text-muted/30 group-hover:text-lime/50 shrink-0 mt-0.5 transition-colors" />
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

        </div>

        {/* ── Right column: DONNA chat shell ──────────────────────── */}
        <div className="flex flex-col gap-4">
          {/* Context summary — what DONNA can see (also carries the 4 key daily stats) */}
          <DonnaContextSummaryCard
            role="director"
            contextItems={contextSummaryItems}
            sourceLabels={contextSourceLabels}
            confidence={ctx?.confidence}
            isLive={isLive}
          />
          {/* Sprint 916 — Entity summary signals from DONNA backend spine */}
          {academyId && (
            <DonnaEntitySummarySection db={db} academyId={academyId} />
          )}
          <div className="rounded-2xl border border-border bg-surface overflow-hidden flex flex-col" style={{ height: '560px' }}>
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-surface-raised">
              <div className="w-7 h-7 rounded-xl bg-lime/15 border border-lime/25 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-lime" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-text-primary">DONNA</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold border bg-lime/10 text-lime border-lime/20">Director</span>
                  {isLive && (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-status-green/10 text-status-green border border-status-green/20">
                      <span className="w-1 h-1 rounded-full bg-status-green" />
                      Live
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-muted">Ask me anything about your academy</p>
              </div>
            </div>
            {ctx ? (
              <DonnaDirectorShellClient directorCtx={ctx} />
            ) : (
              <div className="flex-1 flex items-center justify-center p-6 text-center">
                <div>
                  <Sparkles className="w-8 h-8 text-lime/30 mx-auto mb-3" />
                  <p className="text-sm text-text-secondary">Sign in to activate DONNA</p>
                  <p className="text-[11px] text-text-muted mt-1">DONNA needs your academy context to respond.</p>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Safety notice — Sprint 777: sole below-grid element; Daily Brief and Review Queue Surface removed */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-lime/15 bg-lime/4">
        <ShieldCheck className="w-4 h-4 text-lime shrink-0 mt-0.5" />
        <p className="text-[11px] text-text-secondary leading-relaxed">
          DONNA proposes — you approve. No session note, player observation, attendance record, parent communication, or curriculum change takes effect until you review and approve it in the Review Queue.
        </p>
      </div>

    </div>
  )
}
