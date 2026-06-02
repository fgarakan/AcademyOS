// DONNA Usage Analytics — Sprint 1156
//
// Internal director view of DONNA command usage.
// Shows: most asked questions, unknown intents, most clicked actions,
//        pages where DONNA is used most.
//
// Purpose: product learning, UX simplification prioritization.
// Access: director/head_coach only. Internal only — not public-facing.

import { getSupabaseServer } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui'
import Link from 'next/link'
import { ArrowLeft, Sparkles, TrendingUp, AlertCircle, MessageSquare, BarChart2 } from 'lucide-react'

interface EventRow {
  intent: string | null
  intent_category: string | null
  route: string | null
  question_hash: string | null
  action_proposed: string | null
  created_at: string
}

export default async function DonnaAnalyticsPage() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-muted text-sm">Please sign in.</p>
      </div>
    )
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) {
    return <p className="text-text-muted text-sm p-6">Academy context unavailable.</p>
  }

  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', profile.academy_id)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()

  if (membership?.role !== 'academy_director' && membership?.role !== 'head_coach') {
    return <p className="text-text-muted text-sm p-6">Director access required.</p>
  }

  const rawDb = supabase as any

  // Fetch recent DONNA events
  let events: EventRow[] = []
  let hasEventsTable = false

  try {
    const { data: eventRows, error } = await rawDb
      .from('donna_events')
      .select('intent, intent_category, route, question_hash, action_proposed, created_at')
      .eq('academy_id', profile.academy_id)
      .eq('event_type', 'global_command')
      .order('created_at', { ascending: false })
      .limit(200)

    if (!error?.message?.includes('does not exist')) {
      events = (eventRows ?? []) as EventRow[]
      hasEventsTable = true
    }
  } catch { /* table may not exist */ }

  // Compute analytics
  const intentCounts: Record<string, number> = {}
  const routeCounts: Record<string, number> = {}
  const unknownIntents: string[] = []

  for (const ev of events) {
    // Intent frequency
    const intent = ev.intent ?? 'unknown'
    intentCounts[intent] = (intentCounts[intent] ?? 0) + 1

    // Route frequency
    const route = ev.route ?? 'unknown'
    routeCounts[route] = (routeCounts[route] ?? 0) + 1

    // Unknown intents
    if (ev.intent === 'freeform_question' && ev.question_hash) {
      unknownIntents.push(ev.question_hash)
    }
  }

  const topIntents = Object.entries(intentCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)

  const topRoutes = Object.entries(routeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)

  const recentUnknown = unknownIntents.slice(0, 10)

  return (
    <div className="p-6 space-y-6 max-w-4xl animate-fade-in">

      {/* Back */}
      <Link href="/director" className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" />
        Today
      </Link>

      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-lime" />
          <p className="page-eyebrow">Internal</p>
        </div>
        <h1 className="page-title">DONNA Usage Analytics</h1>
        <p className="page-subtitle">What directors are asking. What DONNA doesn't know. Where to improve.</p>
      </div>

      {!hasEventsTable && (
        <Card>
          <CardContent className="py-6 text-center">
            <BarChart2 className="w-8 h-8 text-text-muted mx-auto mb-2" />
            <p className="text-sm font-medium text-text-primary">No command logs yet</p>
            <p className="text-xs text-text-muted mt-1">
              Usage data appears after directors start using the DONNA command bar.
              The donna_events table logs every command.
            </p>
          </CardContent>
        </Card>
      )}

      {hasEventsTable && events.length === 0 && (
        <Card>
          <CardContent className="py-6 text-center">
            <MessageSquare className="w-8 h-8 text-text-muted mx-auto mb-2" />
            <p className="text-sm font-medium text-text-primary">No commands logged yet</p>
            <p className="text-xs text-text-muted mt-1">Start using the DONNA command bar on any page to see usage data here.</p>
          </CardContent>
        </Card>
      )}

      {hasEventsTable && events.length > 0 && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total Commands', value: events.length, icon: MessageSquare, color: 'text-lime' },
              { label: 'Unknown Intents', value: recentUnknown.length, icon: AlertCircle, color: 'text-status-orange' },
              { label: 'Pages Used', value: topRoutes.length, icon: TrendingUp, color: 'text-status-blue' },
            ].map(({ label, value, icon: Icon, color }) => (
              <Card key={label}>
                <CardContent className="py-4 flex flex-col items-center gap-1 text-center">
                  <Icon className={`w-5 h-5 ${color}`} />
                  <p className={`text-2xl font-bold font-mono ${color}`}>{value}</p>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider">{label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Top intents */}
          <Card>
            <div className="px-4 py-3 bg-surface-raised border-b border-border rounded-t-xl flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-text-muted" />
              <p className="text-sm font-semibold text-text-primary">Most Asked Intent Types</p>
            </div>
            <CardContent className="py-3">
              <div className="space-y-2">
                {topIntents.map(([intent, count]) => (
                  <div key={intent} className="flex items-center gap-3">
                    <p className="text-xs text-text-secondary flex-1 min-w-0">{intent.replace(/_/g, ' ')}</p>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 rounded-full bg-surface-raised overflow-hidden">
                        <div
                          className="h-full rounded-full bg-lime"
                          style={{ width: `${Math.round((count / (topIntents[0]?.[1] ?? 1)) * 100)}%` }}
                        />
                      </div>
                      <p className="text-[10px] font-mono text-text-muted w-6 text-right">{count}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top routes */}
          <Card>
            <div className="px-4 py-3 bg-surface-raised border-b border-border rounded-t-xl flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-text-muted" />
              <p className="text-sm font-semibold text-text-primary">Pages Where DONNA Is Used Most</p>
            </div>
            <CardContent className="py-3">
              <div className="space-y-2">
                {topRoutes.map(([route, count]) => (
                  <div key={route} className="flex items-center gap-3">
                    <p className="text-xs font-mono text-text-muted flex-1 min-w-0 truncate">{route}</p>
                    <p className="text-[11px] font-mono text-text-secondary">{count}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Unknown intents */}
          {recentUnknown.length > 0 && (
            <Card>
              <div className="px-4 py-3 bg-status-orange/5 border-b border-status-orange/15 rounded-t-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-status-orange" />
                <p className="text-sm font-semibold text-text-primary">Unrecognised Questions</p>
                <p className="text-xs text-text-muted ml-auto">These reveal product gaps</p>
              </div>
              <CardContent className="py-3">
                <div className="space-y-1.5">
                  {recentUnknown.map((q, i) => (
                    <p key={i} className="text-[11px] text-text-muted px-2 py-1 rounded bg-surface-raised">{q}</p>
                  ))}
                </div>
                <p className="text-[10px] text-text-muted mt-3">
                  Use these to improve the intent router or identify missing workflows.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}

    </div>
  )
}
