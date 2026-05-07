import Link from 'next/link'
import { ClipboardList, Inbox, Eye, CheckCircle } from 'lucide-react'
import { getSupabaseServer } from '@/lib/supabase/server'
import { Card, CardHeader, CardContent, EmptyState } from '@/components/ui'
import { PrivateLessonRequestCard } from './PrivateLessonRequestCard'

type PLRStatus = 'new' | 'reviewing' | 'assigned' | 'scheduled' | 'declined' | 'completed'

interface RawRequest {
  id: string
  player_id: string | null
  parent_profile_id: string | null
  requested_coach_id: string | null
  preferred_days: string | null
  preferred_times: string | null
  goal: string | null
  notes: string | null
  status: PLRStatus
  director_notes: string | null
  created_at: string
  player?: { full_name: string | null } | null
  parent?: { full_name: string | null } | null
  coach?: { full_name: string | null } | null
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  accent = 'default',
}: {
  label: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  accent?: 'lime' | 'green' | 'orange' | 'red' | 'default'
}) {
  const accentColor = {
    lime: 'text-lime',
    green: 'text-status-green',
    orange: 'text-status-orange',
    red: 'text-status-red',
    default: 'text-text-primary',
  }[accent]

  return (
    <div className="bg-surface border border-border rounded-lg p-4 flex items-center gap-4">
      <div className="w-10 h-10 rounded-lg bg-surface-raised flex items-center justify-center">
        <Icon className={`w-5 h-5 ${accentColor}`} />
      </div>
      <div>
        <p className={`font-mono text-2xl font-bold ${accentColor}`}>{value}</p>
        <p className="text-text-muted text-xs uppercase tracking-widest mt-0.5">{label}</p>
      </div>
    </div>
  )
}

export default async function PrivateLessonsPage() {
  const supabase = await getSupabaseServer()

  const { data: { user } } = await supabase.auth.getUser()

  let academyId: string | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('academy_id')
      .eq('id', user.id)
      .single()
    academyId = (profile as { academy_id: string | null } | null)?.academy_id ?? null
  }

  if (!academyId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-secondary text-sm">Academy context unavailable. Please sign in.</p>
      </div>
    )
  }

  const rawDb = supabase as any
  const { data: requestsRaw } = await rawDb
    .from('private_lesson_requests')
    .select(`
      id,
      player_id,
      parent_profile_id,
      requested_coach_id,
      preferred_days,
      preferred_times,
      goal,
      notes,
      status,
      director_notes,
      created_at,
      player:players!player_id(full_name),
      parent:profiles!parent_profile_id(full_name),
      coach:profiles!requested_coach_id(full_name)
    `)
    .eq('academy_id', academyId)
    .order('created_at', { ascending: false })

  const requests: RawRequest[] = (requestsRaw ?? []) as RawRequest[]

  const totalRequests = requests.length
  const newRequests = requests.filter(r => r.status === 'new').length
  const reviewing = requests.filter(r => r.status === 'reviewing').length
  const scheduled = requests.filter(r => ['scheduled', 'completed'].includes(r.status)).length

  const requestCards = requests.map(r => ({
    id: r.id,
    playerName: r.player?.full_name ?? null,
    parentName: r.parent?.full_name ?? null,
    coachName: r.coach?.full_name ?? null,
    preferredDays: r.preferred_days,
    preferredTimes: r.preferred_times,
    goal: r.goal,
    notes: r.notes,
    status: r.status,
    directorNotes: r.director_notes,
    createdAt: r.created_at,
  }))

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <p className="label-xs text-lime mb-1">OPERATIONS</p>
        <h1 className="text-2xl font-bold text-text-primary">Private Lesson Requests</h1>
        <p className="text-text-secondary text-sm mt-1">
          Review parent and player requests and route them to the right coach.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="Total Requests" value={totalRequests} icon={ClipboardList} accent="lime" />
        <SummaryCard label="New" value={newRequests} icon={Inbox} accent={newRequests > 0 ? 'orange' : 'default'} />
        <SummaryCard label="Reviewing" value={reviewing} icon={Eye} accent={reviewing > 0 ? 'orange' : 'default'} />
        <SummaryCard label="Scheduled / Done" value={scheduled} icon={CheckCircle} accent="green" />
      </div>

      {/* Request list */}
      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-text-primary">All Requests</h2>
        </CardHeader>
        <CardContent>
          {requestCards.length === 0 ? (
            <EmptyState
              icon={<Inbox className="w-5 h-5" />}
              title="No private lesson requests yet"
              description="Requests will appear here once parents can submit them from the parent portal."
            />
          ) : (
            <div className="space-y-3">
              {requestCards.map(req => (
                <PrivateLessonRequestCard key={req.id} request={req} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div>
        <Link href="/director" className="text-text-muted text-sm hover:text-text-secondary transition-colors">
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
