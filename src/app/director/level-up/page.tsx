import Link from 'next/link'
import { ArrowRight, AlertTriangle, Clock, CheckCircle2, Users, TrendingUp, ShieldAlert } from 'lucide-react'
import { getSupabaseServer } from '@/lib/supabase/server'
import { Card, CardContent, EmptyState } from '@/components/ui'
import { formatDate } from '@/lib/utils'
import { DEMO_PIPELINE_ROWS } from '@/lib/demo/demoData'
import { LevelUpDonnaCTA } from './LevelUpDonnaCTA'
import { DonnaOpenChip } from '@/components/assistant/DonnaOpenChip'

// ── Types ─────────────────────────────────────────────────────────────────────

interface PipelineRow {
  player_id: string | null
  full_name: string | null
  coach_name: string | null
  group_name: string | null
  current_track: string | null
  overall_score: number | null
  urgency: string | null
  days_overdue: number | null
  last_assessed_at: string | null
  next_assessment_due: string | null
  academy_id: string | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function urgencyLabel(urgency: string | null): string {
  if (urgency === 'overdue') return 'Overdue'
  if (urgency === 'due_soon') return 'Due Soon'
  if (urgency === 'upcoming') return 'Upcoming'
  return 'Unknown'
}

function urgencyColor(urgency: string | null): string {
  if (urgency === 'overdue') return 'text-status-red'
  if (urgency === 'due_soon') return 'text-status-orange'
  return 'text-status-blue'
}

function urgencyBg(urgency: string | null): string {
  if (urgency === 'overdue') return 'bg-status-red/10 border-status-red/30'
  if (urgency === 'due_soon') return 'bg-status-orange/10 border-status-orange/30'
  return 'bg-status-blue/10 border-status-blue/30'
}

function trackLabel(track: string | null): string {
  if (!track) return 'Unassigned'
  return track.charAt(0).toUpperCase() + track.slice(1)
}

function scoreColor(score: number | null): string {
  if (score === null) return 'text-text-muted'
  if (score >= 75) return 'text-status-green'
  if (score >= 50) return 'text-status-orange'
  return 'text-status-red'
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="bg-surface-raised border border-border rounded-xl px-5 py-4">
      <p className={`text-2xl font-mono font-bold ${color}`}>{value}</p>
      <p className="label-xs mt-0.5">{label}</p>
    </div>
  )
}

function PlayerReadinessCard({ row }: { row: PipelineRow }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 px-4 rounded-xl bg-surface-raised border border-border hover:border-lime/30 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-text-primary">{row.full_name ?? 'Unknown player'}</p>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${urgencyBg(row.urgency)} ${urgencyColor(row.urgency)}`}>
            {urgencyLabel(row.urgency)}
          </span>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
          <span className="text-[11px] text-text-muted">{trackLabel(row.current_track)} track</span>
          {row.group_name && <span className="text-[11px] text-text-muted">{row.group_name}</span>}
          {row.coach_name && <span className="text-[11px] text-text-muted">Coach {row.coach_name}</span>}
          {row.last_assessed_at && (
            <span className="text-[11px] text-text-muted">Last assessed {formatDate(row.last_assessed_at)}</span>
          )}
          {row.urgency === 'overdue' && row.days_overdue != null && row.days_overdue > 0 && (
            <span className="text-[11px] text-status-red">{row.days_overdue}d overdue</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4 shrink-0">
        {row.overall_score != null && (
          <div className="text-right">
            <p className={`text-base font-mono font-bold ${scoreColor(row.overall_score)}`}>
              {Math.round(row.overall_score)}
            </p>
            <p className="text-[9px] uppercase tracking-widest text-text-muted">score</p>
          </div>
        )}
        {row.player_id && row.full_name && (
          <LevelUpDonnaCTA
            playerName={row.full_name}
            currentTrack={row.current_track}
            urgency={row.urgency}
          />
        )}
        {row.player_id && (
          <Link
            href={`/director/players/${row.player_id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border text-[11px] text-text-secondary hover:border-lime/40 hover:text-text-primary transition-colors"
          >
            View <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </div>
    </div>
  )
}

function UrgencySection({ title, rows, icon: Icon, color }: {
  title: string
  rows: PipelineRow[]
  icon: React.ElementType
  color: string
}) {
  if (rows.length === 0) return null
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-4 h-4 ${color}`} />
        <p className="label-xs">{title}</p>
        <span className={`text-[10px] font-mono font-bold ${color}`}>{rows.length}</span>
      </div>
      <div className="space-y-2">
        {rows.map(row => (
          <PlayerReadinessCard key={row.player_id ?? row.full_name} row={row} />
        ))}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function LevelUpPage({
  searchParams,
}: {
  searchParams: { demo?: string }
}) {
  const isDemoMode = searchParams.demo === '1'
  const supabase = await getSupabaseServer()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-secondary text-sm">No session. Please sign in.</p>
      </div>
    )
  }

  let academyId: string | null = null
  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  academyId = profile?.academy_id ?? null

  if (!academyId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-secondary text-sm">Academy context unavailable. Please sign in.</p>
      </div>
    )
  }

  // ── Data source ────────────────────────────────────────────────────────────
  // Demo mode: use local static fixtures. Normal mode: query Supabase.

  let rows: PipelineRow[]

  if (isDemoMode) {
    rows = DEMO_PIPELINE_ROWS as PipelineRow[]
  } else {
    const { data: pipeline } = await supabase
      .from('v_reassessment_pipeline')
      .select('player_id, full_name, coach_name, group_name, current_track, overall_score, urgency, days_overdue, last_assessed_at, next_assessment_due')
      .eq('academy_id', academyId)
      .order('days_overdue', { ascending: false })

    rows = (pipeline ?? []).map(r => ({ ...r, academy_id: academyId }))
  }

  const overdue = rows.filter(r => r.urgency === 'overdue')
  const dueSoon = rows.filter(r => r.urgency === 'due_soon')
  const upcoming = rows.filter(r => r.urgency === 'upcoming')
  const other = rows.filter(r => !['overdue', 'due_soon', 'upcoming'].includes(r.urgency ?? ''))

  return (
    <div className="animate-fade-in p-6 space-y-6">

      {/* Header */}
      <div>
        <p className="page-eyebrow">Players</p>
        <h1 className="page-title">Level Up Review</h1>
        <p className="text-sm text-text-secondary mt-1">
          Review evidence-based readiness for each player. Level changes require director approval.
        </p>
      </div>

      {/* Architecture red line badge */}
      <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-status-red/5 border border-status-red/20">
        <ShieldAlert className="w-4 h-4 text-status-red shrink-0" />
        <p className="text-[11px] text-text-secondary">
          <span className="font-semibold text-status-red">Level movement is director-approved only.</span>
          {' '}All changes go through the review queue. DONNA proposes — you decide.
        </p>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard value={rows.length} label="Total in pipeline" color="text-lime" />
        <StatCard value={overdue.length} label="Overdue" color="text-status-red" />
        <StatCard value={dueSoon.length} label="Due Soon" color="text-status-orange" />
        <StatCard value={upcoming.length} label="Upcoming" color="text-status-blue" />
      </div>

      {/* DONNA Intelligence */}
      <div className="px-4 py-3 rounded-xl bg-surface border border-border">
        <p className="text-[9px] uppercase tracking-widest text-text-muted mb-2.5">Ask DONNA</p>
        <div className="flex flex-wrap gap-2">
          {[
            'Who is ready for level review?',
            'What evidence is missing?',
            "Summarize this player's readiness.",
            'Who is overdue for assessment?',
          ].map((prompt) => (
            <DonnaOpenChip key={prompt} prompt={prompt} />
          ))}
        </div>
      </div>

      {/* Pipeline */}
      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={<TrendingUp className="w-8 h-8 text-text-muted" />}
              title="No players in the assessment pipeline"
              description="Players appear here when they are approaching or overdue for reassessment."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          <UrgencySection
            title="Overdue"
            rows={overdue}
            icon={AlertTriangle}
            color="text-status-red"
          />
          <UrgencySection
            title="Due Soon"
            rows={dueSoon}
            icon={Clock}
            color="text-status-orange"
          />
          <UrgencySection
            title="Upcoming"
            rows={upcoming}
            icon={CheckCircle2}
            color="text-status-blue"
          />
          {other.length > 0 && (
            <UrgencySection
              title="Other"
              rows={other}
              icon={Users}
              color="text-text-muted"
            />
          )}
        </div>
      )}

    </div>
  )
}
