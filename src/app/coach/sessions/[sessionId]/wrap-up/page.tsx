import { notFound } from 'next/navigation'
import { getSupabaseServer } from '@/lib/supabase/server'
import { WrapUpPageClient } from './WrapUpPageClient'

interface PageProps {
  params: { sessionId: string }
}

export default async function CoachWrapUpPage({ params }: PageProps) {
  const { sessionId } = params
  const supabase = await getSupabaseServer()

  // Auth + academy
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  const academyId = profile?.academy_id
  if (!academyId) notFound()

  // Session — verify academy ownership; include group_id for roster lookup
  const { data: session } = await supabase
    .from('sessions')
    .select('id, name, group_id')
    .eq('id', sessionId)
    .eq('academy_id', academyId)
    .single()
  if (!session) notFound()

  // Session blocks (for block completion draft)
  const { data: blockRows } = await supabase
    .from('session_blocks')
    .select('id, name')
    .eq('session_id', sessionId)
    .order('order_index')

  const blockList = (blockRows ?? []).map(b => ({ id: b.id, name: b.name }))

  // Roster — optional; used for player name chips and observation drafts.
  // Best-effort: failure here does not prevent wrap-up.
  interface RosterPlayer { id: string; fullName: string; firstName: string }
  let roster: RosterPlayer[] = []

  const groupId = (session as { group_id?: string | null }).group_id ?? null
  if (groupId) {
    try {
      const { data: memberships } = await supabase
        .from('group_memberships')
        .select('player_id')
        .eq('group_id', groupId)
        .eq('is_current', true)
        .eq('academy_id', academyId)

      const playerIds = (memberships ?? []).map((m: { player_id: string }) => m.player_id)

      if (playerIds.length > 0) {
        const { data: players } = await supabase
          .from('players')
          .select('id, full_name, first_name')
          .in('id', playerIds)
          .eq('academy_id', academyId)

        roster = (players ?? []).map((p: { id: string; full_name: string | null; first_name: string | null }) => {
          const fullName = p.full_name ?? p.first_name ?? ''
          const firstName = p.first_name ?? p.full_name?.split(' ')[0] ?? ''
          return { id: p.id, fullName, firstName }
        })
      }
    } catch {
      // Roster query failed — wrap-up still works without roster data
    }
  }

  return (
    <WrapUpPageClient
      sessionId={sessionId}
      sessionName={session.name ?? 'Session'}
      blockList={blockList}
      returnHref={`/coach/sessions/${sessionId}`}
      roster={roster}
    />
  )
}
