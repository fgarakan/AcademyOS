import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getSupabaseServer } from '@/lib/supabase/server'
import { Card, CardHeader, CardContent } from '@/components/ui'
import { Users, ChevronRight } from 'lucide-react'
// Sprint 1166-1185: invite coach form
import { InviteCoachForm } from './_components/InviteCoachForm'

export default async function CoachesPage() {
  const supabase = await getSupabaseServer()
  const rawDb = supabase as any

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return notFound()

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()

  if (!callerProfile?.academy_id) return notFound()
  const academyId = callerProfile.academy_id as string

  // Fetch all active coach/head_coach memberships for this academy
  const { data: membershipsRaw } = await rawDb
    .from('academy_memberships')
    .select('profile_id, role, joined_at')
    .eq('academy_id', academyId)
    .eq('is_active', true)
    .in('role', ['coach', 'head_coach'])
    .order('role', { ascending: false })  // head_coach first

  const memberships = ((membershipsRaw ?? []) as Array<{
    profile_id: string
    role: string
    joined_at: string | null
  }>).map(m => ({
    profileId: String(m.profile_id),
    role: String(m.role ?? 'coach'),
    joinedAt: m.joined_at ? String(m.joined_at) : null,
  }))

  const profileIds = memberships.map(m => m.profileId)

  // Fetch coach profiles
  const profileMap = new Map<string, { name: string; email: string | null }>()
  if (profileIds.length > 0) {
    const { data: profilesRaw } = await rawDb
      .from('profiles')
      .select('id, full_name, first_name, email')
      .in('id', profileIds)

    for (const p of (profilesRaw ?? []) as Array<{
      id: string
      full_name: string | null
      first_name: string | null
      email: string | null
    }>) {
      const name = p.full_name ? String(p.full_name) : p.first_name ? String(p.first_name) : 'Unknown'
      profileMap.set(String(p.id), { name, email: p.email ? String(p.email) : null })
    }
  }

  // Fetch session counts in last 30d per coach
  const sessionCountMap = new Map<string, number>()
  if (profileIds.length > 0) {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString()

    const { data: sessionCountsRaw } = await rawDb
      .from('sessions')
      .select('coach_id')
      .eq('academy_id', academyId)
      .in('coach_id', profileIds)
      .gte('scheduled_date', thirtyDaysAgoStr)

    for (const s of (sessionCountsRaw ?? []) as Array<{ coach_id: string }>) {
      const id = String(s.coach_id)
      sessionCountMap.set(id, (sessionCountMap.get(id) ?? 0) + 1)
    }
  }

  // Merge data for rendering
  const coaches = memberships.map(m => ({
    profileId: m.profileId,
    role: m.role,
    joinedAt: m.joinedAt,
    name: profileMap.get(m.profileId)?.name ?? 'Unknown',
    sessionCount30d: sessionCountMap.get(m.profileId) ?? 0,
  }))

  const headCoaches    = coaches.filter(c => c.role === 'head_coach')
  const regularCoaches = coaches.filter(c => c.role === 'coach')

  const coachesWithSessions = coaches.filter(c => c.sessionCount30d > 0).length
  const coachesInactive     = coaches.filter(c => c.sessionCount30d === 0).length

  const coachesBrief = (() => {
    if (coaches.length === 0) return 'No coaches added yet. Invite your coaching team to start tracking session activity.'
    const sentence1 = coachesWithSessions > 0
      ? `${coachesWithSessions} of ${coaches.length} coach${coaches.length !== 1 ? 'es have' : ' has'} run sessions in the last 30 days.`
      : `No coaches have run sessions in the last 30 days.`
    const sentence2 = coachesInactive > 0
      ? `${coachesInactive} coach${coachesInactive !== 1 ? 'es have' : ' has'} no recent session activity — follow up or check scheduling.`
      : `All coaches are active and running sessions.`
    return `${sentence1} ${sentence2}`
  })()

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Coaches</h1>
          <p className="text-text-secondary text-sm mt-1">
            {coaches.length} active coach{coaches.length !== 1 ? 'es' : ''}
          </p>
        </div>
        <Users className="w-6 h-6 text-text-muted" />
      </div>

      {/* DONNA intelligence summary */}
      {coaches.length > 0 && (
        <div className="rounded-xl border border-border bg-surface-raised px-4 py-3">
          <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold mb-1">DONNA</p>
          <p className="text-[12px] text-text-secondary leading-relaxed">{coachesBrief}</p>
        </div>
      )}

      {/* Invite form — Sprint 1166-1185 */}
      <InviteCoachForm />

      {/* Empty state */}
      {coaches.length === 0 && (
        <Card>
          <CardContent>
            <div className="py-12 text-center space-y-2">
              <Users className="w-8 h-8 text-text-muted mx-auto" />
              <p className="text-text-secondary text-sm">No coaches added yet.</p>
              <p className="text-text-muted text-[11px]">Use the form above to invite a coach. They must have an AcademyOS account first.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Head coaches section */}
      {headCoaches.length > 0 && (
        <div className="space-y-3">
          <p className="text-[11px] uppercase tracking-widest text-text-muted px-1">Head Coaches</p>
          <CoachList coaches={headCoaches} />
        </div>
      )}

      {/* Coaches section */}
      {regularCoaches.length > 0 && (
        <div className="space-y-3">
          <p className="text-[11px] uppercase tracking-widest text-text-muted px-1">Coaches</p>
          <CoachList coaches={regularCoaches} />
        </div>
      )}
    </main>
  )
}

// ---------------------------------------------------------------------------
// CoachList — renders a list of coach rows
// ---------------------------------------------------------------------------

interface CoachRow {
  profileId: string
  role: string
  name: string
  sessionCount30d: number
  joinedAt: string | null
}

function CoachList({ coaches }: { coaches: CoachRow[] }) {
  return (
    <Card>
      <CardContent>
        <div className="divide-y divide-border">
          {coaches.map(coach => (
            <Link
              key={coach.profileId}
              href={`/director/coaches/${coach.profileId}`}
              className="flex items-center justify-between gap-4 py-3 px-1 hover:bg-surface-raised -mx-1 px-4 rounded-lg transition-colors group"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white group-hover:text-lime transition-colors truncate">
                  {coach.name}
                </p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-[10px] uppercase tracking-widest font-semibold text-text-muted">
                    {coach.role === 'head_coach' ? 'Head Coach' : 'Coach'}
                  </span>
                  {coach.sessionCount30d > 0 && (
                    <span className="text-[10px] text-text-muted">
                      {coach.sessionCount30d} session{coach.sessionCount30d !== 1 ? 's' : ''} (30d)
                    </span>
                  )}
                  {coach.sessionCount30d === 0 && (
                    <span className="text-[10px] text-text-muted/60">no sessions in 30d</span>
                  )}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-lime transition-colors shrink-0" />
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
