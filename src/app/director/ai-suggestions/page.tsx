import Link from 'next/link'
import { Brain, Sparkles, CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react'
import { getSupabaseServer } from '@/lib/supabase/server'
import { Card, CardContent, EmptyState } from '@/components/ui'
import { SuggestionCard } from '@/components/suggestions/SuggestionCard'
import { generateAcademySuggestionsAction, acceptSuggestionAction, denySuggestionAction, deferSuggestionAction } from './suggestionActions'
import type { AcademySuggestionRow, AcademySuggestionStatus } from '@/lib/suggestions/suggestionTypes'

interface PageProps {
  searchParams: { status?: string }
}

const VALID_STATUSES: AcademySuggestionStatus[] = ['pending', 'accepted', 'denied', 'deferred']

async function triggerGenerateSuggestions(): Promise<void> {
  'use server'
  await generateAcademySuggestionsAction()
}

export default async function AISuggestionsPage({ searchParams }: PageProps) {
  const supabase = await getSupabaseServer()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-secondary text-sm">Please sign in to view AI suggestions.</p>
      </div>
    )
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()

  const academyId = profile?.academy_id
  if (!academyId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-secondary text-sm">Academy context unavailable. Please sign in.</p>
      </div>
    )
  }

  const rawStatusParam = searchParams.status
  const activeStatus: AcademySuggestionStatus =
    VALID_STATUSES.includes(rawStatusParam as AcademySuggestionStatus)
      ? (rawStatusParam as AcademySuggestionStatus)
      : 'pending'

  const rawDb = supabase as any

  // Fetch current view's suggestions
  const { data: rawSuggestions } = await rawDb
    .from('academy_suggestions')
    .select('*')
    .eq('academy_id', academyId)
    .eq('status', activeStatus)
    .order('created_at', { ascending: false })
    .limit(50)
  const suggestions: AcademySuggestionRow[] = rawSuggestions ?? []

  // Fetch counts for all statuses (for summary pills)
  const { data: allCountData } = await rawDb
    .from('academy_suggestions')
    .select('status, priority')
    .eq('academy_id', academyId)
  const all = (allCountData ?? []) as Array<{ status: string; priority: string }>

  const pendingCount   = all.filter(s => s.status === 'pending').length
  const highPriCount   = all.filter(s => s.status === 'pending' && s.priority === 'high').length
  const acceptedCount  = all.filter(s => s.status === 'accepted').length
  const deferredCount  = all.filter(s => s.status === 'deferred').length
  const deniedCount    = all.filter(s => s.status === 'denied').length

  const tabItems: { label: string; status: AcademySuggestionStatus; count: number }[] = [
    { label: 'Pending',   status: 'pending',  count: pendingCount },
    { label: 'Accepted',  status: 'accepted', count: acceptedCount },
    { label: 'Deferred',  status: 'deferred', count: deferredCount },
    { label: 'Denied',    status: 'denied',   count: deniedCount },
  ]

  return (
    <div className="p-6 space-y-8 animate-fade-in">

      {/* ── Page header ─────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="page-eyebrow text-lime">ACADEMY INTELLIGENCE</p>
          <h1 className="page-title">AI Suggestions</h1>
          <p className="page-subtitle">
            Review suggested actions before anything changes.
          </p>
        </div>
        <form action={triggerGenerateSuggestions}>
          <button
            type="submit"
            className="btn-lime text-sm flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Generate Suggestions
          </button>
        </form>
      </div>

      {/* ── Summary cards ────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryStatCard
          label="Pending"
          value={pendingCount}
          icon={<Brain className="w-4 h-4 text-lime" />}
          accent={pendingCount > 0 ? 'lime' : 'default'}
        />
        <SummaryStatCard
          label="High Priority"
          value={highPriCount}
          icon={<AlertTriangle className="w-4 h-4 text-status-orange" />}
          accent={highPriCount > 0 ? 'orange' : 'default'}
        />
        <SummaryStatCard
          label="Accepted"
          value={acceptedCount}
          icon={<CheckCircle2 className="w-4 h-4 text-status-green" />}
          accent="green"
        />
        <SummaryStatCard
          label="Deferred"
          value={deferredCount}
          icon={<Clock className="w-4 h-4 text-text-muted" />}
          accent="default"
        />
      </div>

      {/* ── Filter tabs ──────────────────────────────────── */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-raised border border-border w-fit">
        {tabItems.map(tab => (
          <Link
            key={tab.status}
            href={`/director/ai-suggestions?status=${tab.status}`}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              activeStatus === tab.status
                ? 'bg-surface text-text-primary border border-border'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`text-[10px] font-bold tabular-nums ${
                activeStatus === tab.status ? 'text-lime' : 'text-text-muted'
              }`}>
                {tab.count}
              </span>
            )}
          </Link>
        ))}
      </div>

      {/* ── Guardrail note ───────────────────────────────── */}
      <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-surface-raised border border-border text-xs text-text-muted">
        <XCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-text-muted" />
        <span>
          Nothing changes automatically. All suggestions require explicit director review.
          <span className="font-medium text-text-secondary"> Accept</span> to confirm,
          <span className="font-medium text-text-secondary"> Defer</span> to revisit later, or
          <span className="font-medium text-text-secondary"> Deny</span> to dismiss.
        </span>
      </div>

      {/* ── Suggestion cards ─────────────────────────────── */}
      {suggestions.length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <EmptyState
              icon={<Brain className="w-6 h-6" />}
              title={
                activeStatus === 'pending'
                  ? 'No pending suggestions'
                  : `No ${activeStatus} suggestions`
              }
              description={
                activeStatus === 'pending'
                  ? 'Click "Generate Suggestions" to create suggestions from current academy data. No data is changed until you accept a suggestion.'
                  : 'Suggestions reviewed with this status will appear here.'
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {suggestions.map(suggestion => {
            const boundAccept = acceptSuggestionAction.bind(null, suggestion.id)
            const boundDeny   = denySuggestionAction.bind(null, suggestion.id)
            const boundDefer  = deferSuggestionAction.bind(null, suggestion.id)
            return (
              <SuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                onAccept={boundAccept}
                onDeny={boundDeny}
                onDefer={boundDefer}
              />
            )
          })}
        </div>
      )}

      {/* Back link */}
      <div>
        <Link href="/director" className="text-text-muted text-sm hover:text-text-secondary transition-colors">
          ← Back to Dashboard
        </Link>
      </div>

    </div>
  )
}

// ── Local stat card component ────────────────────────────────────────────────

function SummaryStatCard({
  label,
  value,
  icon,
  accent = 'default',
}: {
  label: string
  value: number
  icon?: React.ReactNode
  accent?: 'lime' | 'green' | 'orange' | 'red' | 'default'
}) {
  const numberColor = {
    lime:    'text-lime',
    green:   'text-status-green',
    orange:  'text-status-orange',
    red:     'text-status-red',
    default: 'text-text-primary',
  }[accent]

  return (
    <div className="bg-surface border border-border rounded-xl p-4 flex items-center gap-3">
      {icon && <div className="shrink-0">{icon}</div>}
      <div>
        <p className={`font-mono text-2xl font-bold ${numberColor}`}>{value}</p>
        <p className="text-text-muted text-xs uppercase tracking-widest mt-0.5">{label}</p>
      </div>
    </div>
  )
}
