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

  // Session — verify academy ownership
  const { data: session } = await supabase
    .from('sessions')
    .select('id, name')
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

  return (
    <WrapUpPageClient
      sessionId={sessionId}
      sessionName={session.name ?? 'Session'}
      blockList={blockList}
      returnHref={`/coach/sessions/${sessionId}`}
    />
  )
}
