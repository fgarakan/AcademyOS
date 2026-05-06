import Link from 'next/link'
import { AlertCircle, BookOpen, ClipboardList, Calendar, Users, ChevronRight, CheckCircle } from 'lucide-react'
import { getSupabaseServer } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader } from '@/components/ui'
import { formatDate } from '@/lib/utils'

interface PlayerSignal {
  player_id: string
  full_name: string | null
  level_label: string | null
  group_name: string | null
}

interface WrapUpSignal {
  id: string
  created_at: string
  payload: Record<string, unknown> | null
}

interface LessonSignal {
  id: string
  player_id: string | null
  goal: string | null
  created_at: string
  player_full_name: string | null
}

export default async function SignalsPage() {
  const supabase = await getSupabaseServer()
  const rawDb = supabase as any

  const { data: { user } } = await supabase.auth.getUser()

  let academyId: string | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('academy_id')
      .eq('id', user.id)
      .single()
    academyId = profile?.academy_id ?? null
  }

  if (!academyId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-secondary text-sm">Academy context unavailable. Please sign in.</p>
      </div>
    )
  }

  // 1. Players missing focus areas
  const { data: missingFocusData } = await rawDb
    .from('v_player_summary')
    .select('player_id, full_name, level_label, group_name')
    .eq('academy_id', academyId)
    .eq('player_status', 'active')
    .order('full_name', { ascending: true })

  const allActive = (missingFocusData ?? []) as PlayerSignal[]
  const missingFocus = allActive.filter(
    (p: PlayerSignal) => !p.group_name
  )

  // 2. Players needing attention (no level label = not yet leveled)
  const needingAttention = allActive.filter(
    (p: PlayerSignal) => !p.level_label
  )

  // 3. Pending coach wrap-ups
  const { data: wrapUpData } = await rawDb
    .from('proposed_actions')
    .select('id, created_at, payload')
    .eq('academy_id', academyId)
    .eq('target_module', 'session_wrap_up_v1')
    .eq('status', 'pending_review')
    .order('created_at', { ascending: false })
    .limit(20)

  const pendingWrapUps = (wrapUpData ?? []) as WrapUpSignal[]

  // 4. New private lesson requests
  const { data: lessonData } = await rawDb
    .from('private_lesson_requests')
    .select('id, player_id, goal, created_at, player:players!player_id(full_name)')
    .eq('academy_id', academyId)
    .eq('status', 'new')
    .order('created_at', { ascending: false })
    .limit(20)

  const newLessons = ((lessonData ?? []) as any[]).map((r: any) => ({
    id: r.id,
    player_id: r.player_id,
    goal: r.goal,
    created_at: r.created_at,
    player_full_name: r.player?.full_name ?? null,
  })) as LessonSignal[]

  const totalSignals = missingFocus.length + needingAttention.length + pendingWrapUps.length + newLessons.length

  return (
    <div className="p-6 animate-fade-in space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="page-eyebrow">Director</p>
          <h1 className="page-title">Signals</h1>
          <p className="page-subtitle">Attention items across players, sessions, and requests.</p>
        </div>
        {totalSignals > 0 && (
          <span className="shrink-0 mt-1 px-3 py-1 rounded-full text-xs font-bold bg-status-orange/10 text-status-orange border border-status-orange/30">
            {totalSignals} open
          </span>
        )}
      </div>

      {totalSignals === 0 && (
        <Card>
          <CardContent className="py-16 flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-status-green/10 border border-status-green/30 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-status-green" />
            </div>
            <p className="font-semibold text-text-primary">All clear</p>
            <p className="text-text-muted text-sm">No open signals right now. Check back after sessions run.</p>
          </CardContent>
        </Card>
      )}

      {/* Players not yet assigned to a group */}
      {missingFocus.length > 0 && (
        <SignalSection
          icon={<Users className="w-4 h-4 text-status-orange" />}
          title="Players without a group"
          count={missingFocus.length}
          accent="orange"
          hint="These active players have no group assignment. Assign them in their profile."
        >
          {missingFocus.map(p => (
            <SignalRow
              key={p.player_id}
              href={`/director/players/${p.player_id}`}
              primary={p.full_name ?? 'Unknown'}
              secondary={p.level_label ?? 'No level'}
            />
          ))}
        </SignalSection>
      )}

      {/* Players without a curriculum level */}
      {needingAttention.length > 0 && (
        <SignalSection
          icon={<BookOpen className="w-4 h-4 text-status-blue" />}
          title="Players without a curriculum level"
          count={needingAttention.length}
          accent="blue"
          hint="These players are active but have no curriculum level assigned."
        >
          {needingAttention.map(p => (
            <SignalRow
              key={p.player_id}
              href={`/director/players/${p.player_id}`}
              primary={p.full_name ?? 'Unknown'}
              secondary={p.group_name ?? 'No group'}
            />
          ))}
        </SignalSection>
      )}

      {/* Pending wrap-ups */}
      {pendingWrapUps.length > 0 && (
        <SignalSection
          icon={<ClipboardList className="w-4 h-4 text-lime" />}
          title="Pending coach wrap-ups"
          count={pendingWrapUps.length}
          accent="lime"
          hint="Coach wrap-up drafts awaiting director review."
        >
          {pendingWrapUps.map(w => (
            <SignalRow
              key={w.id}
              href="/director/review"
              primary="Session wrap-up"
              secondary={`Submitted ${formatDate(w.created_at)}`}
            />
          ))}
        </SignalSection>
      )}

      {/* New lesson requests */}
      {newLessons.length > 0 && (
        <SignalSection
          icon={<Calendar className="w-4 h-4 text-status-green" />}
          title="New private lesson requests"
          count={newLessons.length}
          accent="green"
          hint="Parent requests awaiting review in the private lessons queue."
        >
          {newLessons.map(r => (
            <SignalRow
              key={r.id}
              href="/director/private-lessons"
              primary={r.player_full_name ?? 'Unknown player'}
              secondary={r.goal ? `Focus: ${r.goal}` : `Received ${formatDate(r.created_at)}`}
            />
          ))}
        </SignalSection>
      )}
    </div>
  )
}

function SignalSection({
  icon,
  title,
  count,
  accent,
  hint,
  children,
}: {
  icon: React.ReactNode
  title: string
  count: number
  accent: 'orange' | 'blue' | 'lime' | 'green'
  hint: string
  children: React.ReactNode
}) {
  const accentClasses: Record<string, string> = {
    orange: 'bg-status-orange/10 border-status-orange/20',
    blue: 'bg-status-blue/10 border-status-blue/20',
    lime: 'bg-lime/10 border-lime/20',
    green: 'bg-status-green/10 border-status-green/20',
  }
  const countClasses: Record<string, string> = {
    orange: 'text-status-orange',
    blue: 'text-status-blue',
    lime: 'text-lime',
    green: 'text-status-green',
  }
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${accentClasses[accent]}`}>
              {icon}
            </div>
            <div>
              <p className="font-semibold text-text-primary text-sm">{title}</p>
              <p className="text-text-muted text-xs">{hint}</p>
            </div>
          </div>
          <span className={`shrink-0 font-mono text-sm font-bold ${countClasses[accent]}`}>{count}</span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="divide-y divide-border">
          {children}
        </div>
      </CardContent>
    </Card>
  )
}

function SignalRow({ href, primary, secondary }: { href: string; primary: string; secondary: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 py-2.5 group hover:bg-surface-raised -mx-4 px-4 transition-colors"
    >
      <div className="min-w-0">
        <p className="text-sm text-text-primary truncate">{primary}</p>
        <p className="text-xs text-text-muted truncate">{secondary}</p>
      </div>
      <ChevronRight className="w-3.5 h-3.5 text-text-muted shrink-0 group-hover:text-lime transition-colors" />
    </Link>
  )
}
