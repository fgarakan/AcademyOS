import { notFound } from 'next/navigation'
import { getSupabaseServer } from '@/lib/supabase/server'
import { ExecuteClient } from './ExecuteClient'

interface PageProps {
  params: { sessionId: string }
}

export default async function CoachExecutePage({ params }: PageProps) {
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

  // Session — verify academy ownership
  const { data: session } = await supabase
    .from('sessions')
    .select('id, name, status, template_id')
    .eq('id', sessionId)
    .eq('academy_id', academyId)
    .single()
  if (!session) notFound()

  // Session blocks
  const { data: blockRows } = await supabase
    .from('session_blocks')
    .select('id, name, type, duration_min, order_index, notes')
    .eq('session_id', sessionId)
    .order('order_index')

  const blocks = (blockRows ?? []).map(b => ({
    id: b.id,
    name: b.name,
    type: b.type,
    durationMin: b.duration_min,
    notes: b.notes,
  }))

  const wrapUpHref = `/coach/sessions/${sessionId}/wrap-up`

  return (
    <ExecuteClient
      sessionId={sessionId}
      sessionName={session.name ?? 'Session'}
      blocks={blocks}
      wrapUpHref={wrapUpHref}
    />
  )
}
