import Link from 'next/link'
import {
  Sparkles, ChevronLeft, ChevronRight, Calendar, ClipboardList, CheckCircle2,
  AlertCircle, ShieldCheck, Users, PlayCircle, FileText, BookOpen,
} from 'lucide-react'
import { getSupabaseServer } from '@/lib/supabase/server'
import { loadCoachDonnaContext } from '@/lib/donna/coachDonnaContext'
import { Card, CardHeader, CardContent } from '@/components/ui'
import { CoachDonnaShellClient } from './CoachDonnaShellClient'
import { DonnaContextSummaryCard } from '@/components/donna/DonnaContextSummaryCard'
import type { ContextSummaryItem, ContextSourceLabel } from '@/components/donna/DonnaContextSummaryCard'

// ── Coach DONNA page — Sprint 1039/1040 wiring ────────────────────────────────
// Wires the existing Coach DONNA infrastructure into a dedicated coach page.
// Loads CoachDonnaContext, shows session status, quick actions, DONNA chat shell.
// No DB writes. No parent sends. Review-first everywhere.

export default async function CoachDonnaPage() {
  const db = await getSupabaseServer()
  const { data: { user } } = await db.auth.getUser()

  let academyId: string | null = null
  let coachUserId: string | null = null

  if (user) {
    coachUserId = user.id
    const { data: profile } = await db.from('profiles').select('academy_id').eq('id', user.id).single()
    academyId = profile?.academy_id ?? null
  }

  const ctx = (academyId && coachUserId)
    ? await loadCoachDonnaContext(db, academyId, coachUserId)
    : null

  const isLive            = ctx?.isLive ?? false
  const todaySessions     = ctx?.todaySessions ?? 0
  const missingWrapUps    = ctx?.missingWrapUps ?? 0
  const pendingSubmissions = ctx?.pendingSubmissions ?? 0
  const activeSessionId   = ctx?.activeSessionId ?? null
  const activeSessionName = ctx?.activeSessionName ?? null
  const sessionSummaries  = ctx?.sessionSummaries ?? []
  const contextItems      = ctx?.contextItems ?? []
  const recommendedActions = ctx?.recommendedActions ?? []

  const contextSummaryItems: ContextSummaryItem[] = ctx ? [
    { label: 'Sessions today', value: ctx.todaySessions },
    { label: 'Players on court', value: ctx.totalPlayersToday },
    { label: 'Wrap-ups due', value: ctx.missingWrapUps },
    { label: 'In review', value: ctx.pendingSubmissions },
  ] : [
    { label: 'Sessions today', value: 2, note: 'demo' },
    { label: 'Wrap-ups due', value: 1, note: 'demo' },
  ]

  const contextSourceLabels: ContextSourceLabel[] = (ctx?.sourceLabels ?? []).map(s => ({
    field: s.field,
    status: s.status as ContextSourceLabel['status'],
    label: s.label,
  }))

  const QUICK_ACTIONS = [
    {
      label: 'My Sessions',
      href: '/coach/sessions',
      icon: <Calendar className="w-4 h-4" />,
      accent: true,
    },
    {
      label: 'My Players',
      href: '/coach/players',
      icon: <Users className="w-4 h-4" />,
    },
    {
      label: 'Capture Note',
      href: '/coach/recap',
      icon: <FileText className="w-4 h-4" />,
    },
    {
      label: 'Review Queue',
      href: '/director/review',
      icon: <ClipboardList className="w-4 h-4" />,
    },
  ]

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <Link
          href="/coach"
          className="flex items-center gap-1 text-[11px] text-text-muted mb-3 hover:text-text-secondary"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Coach Hub
        </Link>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-xl bg-status-blue/15 border border-status-blue/25 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-status-blue" />
              </div>
              <h1 className="text-xl font-bold text-text-primary">DONNA</h1>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-status-blue/10 text-status-blue border border-status-blue/20">
                <span className="w-1.5 h-1.5 rounded-full bg-status-blue" />
                Coach
              </span>
            </div>
            <p className="text-sm text-text-secondary">Your session assistant — brief, wrap-up, player watch-fors.</p>
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
      </div>

      {/* Wrap-up alert */}
      {missingWrapUps > 0 && activeSessionId && (
        <Link
          href={`/coach/sessions/${activeSessionId}/wrap-up`}
          className="flex items-center gap-3 px-4 py-3 rounded-xl border border-status-orange/30 bg-status-orange/5 hover:bg-status-orange/10 transition-colors group"
        >
          <AlertCircle className="w-4 h-4 text-status-orange shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-status-orange">
              {missingWrapUps} wrap-up{missingWrapUps !== 1 ? 's' : ''} pending
            </p>
            <p className="text-[11px] text-text-muted">
              {activeSessionName ?? 'Session'} — tap to submit your wrap-up.
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-status-orange/60 shrink-0 group-hover:text-status-orange transition-colors" />
        </Link>
      )}

      {/* Main grid: context left + chat right */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-5">

        {/* ── Left: context panels ───────────────────────────────── */}
        <div className="space-y-4">

          {/* Session Brief */}
          <Card>
            <CardHeader>
              <h2 className="text-xs font-bold text-text-primary uppercase tracking-widest flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-lime" />
                Session Brief
              </h2>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {[
                  { label: 'Today', value: todaySessions, color: 'text-lime' },
                  { label: 'Wrap-ups Due', value: missingWrapUps, color: missingWrapUps > 0 ? 'text-status-orange' : 'text-text-muted' },
                  { label: 'In Review', value: pendingSubmissions, color: 'text-status-blue' },
                  { label: 'Players', value: ctx?.totalPlayersToday ?? 0, color: 'text-text-secondary' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="px-3 py-2 rounded-xl bg-surface-raised border border-border">
                    <p className={`text-lg font-mono font-bold leading-none ${color}`}>{value}</p>
                    <p className="text-[9px] uppercase tracking-widest text-text-muted mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
              {contextItems.length > 0 && (
                <div className="space-y-1">
                  {contextItems.map((item, i) => (
                    <p key={i} className="text-[11px] text-text-secondary leading-snug">• {item}</p>
                  ))}
                </div>
              )}
              {!isLive && (
                <p className="mt-2 text-[9px] text-status-orange/70">Demo fallback — no live session data available.</p>
              )}
            </CardContent>
          </Card>

          {/* Today's Sessions */}
          {sessionSummaries.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-xs font-bold text-text-primary uppercase tracking-widest flex items-center gap-2">
                  <PlayCircle className="w-3.5 h-3.5 text-lime" />
                  Today's Sessions
                </h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {sessionSummaries.map(s => (
                    <Link
                      key={s.sessionId}
                      href={`/coach/sessions/${s.sessionId}`}
                      className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-border hover:border-lime/25 hover:bg-lime/4 transition-all group"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-text-secondary group-hover:text-text-primary transition-colors truncate">{s.sessionName}</p>
                        <p className="text-[9px] text-text-muted">{s.playerCount} players · {s.blockCount} blocks</p>
                      </div>
                      {s.wrapUpSubmitted ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-status-green shrink-0" />
                      ) : (
                        <span className="text-[9px] text-status-orange font-semibold shrink-0">Wrap-up due</span>
                      )}
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Session prep guidance — shown when no sessions today */}
          {sessionSummaries.length === 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-xs font-bold text-text-primary uppercase tracking-widest flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5 text-lime" />
                  Session Prep
                </h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { label: 'Review players', desc: 'Check your player list before each session' },
                    { label: 'Submit wrap-ups', desc: 'Keep your wrap-up queue clear after each session' },
                    { label: 'Capture observations', desc: 'Quick notes help the director track development' },
                  ].map(tip => (
                    <div key={tip.label} className="flex items-start gap-2.5 px-3 py-2 rounded-xl bg-surface-raised border border-border">
                      <span className="w-1 h-1 rounded-full bg-lime mt-1.5 shrink-0" />
                      <div>
                        <p className="text-[11px] font-medium text-text-secondary">{tip.label}</p>
                        <p className="text-[10px] text-text-muted leading-snug">{tip.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Link
                  href="/coach/sessions"
                  className="mt-3 flex items-center justify-between px-3 py-2 rounded-xl border border-lime/20 bg-lime/5 hover:border-lime/40 transition-colors group"
                >
                  <span className="text-xs font-medium text-lime">View all sessions</span>
                  <ChevronRight className="w-3.5 h-3.5 text-lime/60 group-hover:text-lime transition-colors" />
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Recommended Actions */}
          {recommendedActions.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-xs font-bold text-text-primary uppercase tracking-widest flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-lime" />
                  What To Do Next
                </h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {recommendedActions.map(action => (
                    <Link
                      key={action.id}
                      href={action.href}
                      className="group flex flex-col px-3 py-2.5 rounded-xl border border-border hover:border-lime/25 hover:bg-lime/4 transition-all"
                    >
                      <p className="text-xs font-medium text-text-secondary group-hover:text-text-primary transition-colors">{action.label}</p>
                      <p className="text-[10px] text-text-muted leading-snug">{action.reason}</p>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <h2 className="text-xs font-bold text-text-muted uppercase tracking-widest">Quick Actions</h2>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_ACTIONS.map(action => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all group ${
                      action.accent
                        ? 'border-lime/20 bg-lime/5 hover:border-lime/40'
                        : 'border-border hover:border-lime/20 hover:bg-surface-raised'
                    }`}
                  >
                    <span className={`${action.accent ? 'text-lime' : 'text-text-muted group-hover:text-lime'} transition-colors`}>
                      {action.icon}
                    </span>
                    <span className="text-[11px] font-medium text-text-secondary group-hover:text-text-primary transition-colors text-center leading-tight">
                      {action.label}
                    </span>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>

        {/* ── Right: DONNA chat shell ──────────────────────────── */}
        <div className="flex flex-col gap-4">
          <DonnaContextSummaryCard
            role="coach"
            contextItems={contextSummaryItems}
            sourceLabels={contextSourceLabels}
            confidence={ctx?.confidence}
            isLive={isLive}
          />
          <div className="rounded-2xl border border-border bg-surface overflow-hidden flex flex-col" style={{ height: '540px' }}>
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-surface-raised">
              <div className="w-7 h-7 rounded-xl bg-status-blue/15 border border-status-blue/25 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-status-blue" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-text-primary">DONNA</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold border bg-status-blue/10 text-status-blue border-status-blue/20">Coach</span>
                </div>
                <p className="text-[10px] text-text-muted">Ask me about today's sessions, players, or wrap-ups</p>
              </div>
            </div>
            {ctx ? (
              <CoachDonnaShellClient coachCtx={ctx} />
            ) : (
              <div className="flex-1 flex items-center justify-center p-6 text-center">
                <div>
                  <Sparkles className="w-8 h-8 text-status-blue/30 mx-auto mb-3" />
                  <p className="text-sm text-text-secondary">Sign in to activate DONNA</p>
                  <p className="text-[11px] text-text-muted mt-1">DONNA needs your session context to respond.</p>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Safety notice */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-border bg-surface">
        <ShieldCheck className="w-4 h-4 text-lime shrink-0 mt-0.5" />
        <p className="text-[11px] text-text-secondary leading-relaxed">
          DONNA helps you prepare, capture, and submit. Your wrap-ups, observations, and notes go into the director review queue — nothing is sent to parents or applied to player profiles without director approval.
        </p>
      </div>

    </div>
  )
}
